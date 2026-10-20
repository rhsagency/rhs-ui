import type { ComponentProps, ReactNode } from "react";

import { IconCheck, IconClock, IconPackage, IconReceipt, IconReturn, IconTag, IconTruck, IconXCircle } from "@rhs-ui/icons";
import { formatMoney, multiplyMoney } from "@rhs-ui/commerce/money";
import { Badge } from "@rhs-ui/primitives/badge";
import { MediaObject } from "@rhs-ui/primitives/media-object";
import { cn } from "@/lib/utils";

export interface OrderLineImage {
  /** Picture source: a URL or a data URI. */
  src: string;
  /** Leave it out when the name beside the picture already says it (the usual case). */
  alt?: string;
}

export interface OrderLineItem {
  /** Identity of the line, for your list's key. */
  id: string;
  /** The product's name. */
  name: string;
  /** Link to the product page. Omit for a name that is not a link. */
  href?: string;
  /** The chosen options as one line: "Size M, Stone". */
  variant?: string;
  /** The thumbnail. Without one the tile shows a parcel. */
  image?: OrderLineImage;
  /** How many were ordered. */
  quantity: number;
  /** One unit as charged, in minor units: 2400 is 24.00. */
  unitAmount: number;
  /** What one unit cost before a markdown, in minor units. Struck through when it is higher than `unitAmount`. */
  compareAtAmount?: number;
  /** A discount on the whole line, with its name and the amount taken off in minor units: `{ label: "Autumn offer", amount: 480 }`. */
  discount?: { label: string; amount: number };
}

export type OrderLineStatus = "processing" | "shipped" | "delivered" | "returned" | "refunded" | "cancelled";

export interface OrderLineProps extends Omit<ComponentProps<"li">, "children"> {
  /** The line to show: the product, its options, the quantity, the unit price and any markdown or discount. */
  line: OrderLineItem;
  /** ISO 4217 code for every amount on the line. */
  currency?: string;
  /** Locale for the amounts. Always passed, so server and browser agree. */
  locale?: string;
  /** A chip for this line: shipped, returned, refunded. A cancelled line is muted and its total struck through. */
  status?: OrderLineStatus;
  /** Replaces the chip's text, for other languages: "Verzonden". */
  statusLabel?: string;
  /** A tighter line for dense lists and emails: a small picture, the details on one line. */
  compact?: boolean;
  /** `li` inside a list (the default); `div` where the line is not in a list. */
  as?: "li" | "div";
  /** Plug in next/image or any optimiser. Defaults to a plain <img>. */
  renderImage?: (image: OrderLineImage, className: string) => ReactNode;
}

const STATUS = {
  processing: { label: "Processing", icon: IconClock, variant: "outline" },
  shipped: { label: "Shipped", icon: IconTruck, variant: "secondary" },
  delivered: { label: "Delivered", icon: IconCheck, variant: "secondary" },
  returned: { label: "Returned", icon: IconReturn, variant: "outline" },
  refunded: { label: "Refunded", icon: IconReceipt, variant: "outline" },
  cancelled: { label: "Cancelled", icon: IconXCircle, variant: "muted" },
} as const;

function DefaultImage(image: OrderLineImage, className: string) {
  // eslint-disable-next-line @next/next/no-img-element -- framework-neutral default; pass renderImage to use next/image
  return <img src={image.src} alt={image.alt ?? ""} loading="lazy" decoding="async" className={className} />;
}

/**
 * One line of an order, read-only: a picture, the name, the options, the
 * quantity times the unit price and the line total, with an optional status
 * chip. A markdown shows as a struck price, a line discount as its own line.
 * Every part is labelled for a screen reader, so a line is heard as "Linen
 * shirt, Size M, quantity 2, 24.00 euros each, total 48.00 euros". Amounts
 * use tabular figures so a column of lines lines up. Put it in a `<ul>`.
 */
export function OrderLine({ line, currency = "EUR", locale = "en-US", status, statusLabel, compact = false, as = "li", renderImage = DefaultImage, className, ...props }: OrderLineProps) {
  const money = (amount: number) => formatMoney({ amount, currency }, locale);
  const gross = multiplyMoney({ amount: line.unitAmount, currency }, line.quantity).amount;
  const off = line.discount?.amount ?? 0;
  const cancelled = status === "cancelled";
  const marked = line.compareAtAmount !== undefined && line.compareAtAmount > line.unitAmount ? line.compareAtAmount : null;
  const chip = status ? STATUS[status] : null;
  // The two tags take the same props here; typing it as one keeps the spread simple.
  const Root = (as === "li" ? "li" : "div") as "div";

  // What a screen reader hears for the quantity, instead of the drawn "Qty 2 × 24.00".
  const spoken = `quantity ${line.quantity}, ${money(line.unitAmount)} each${marked !== null ? `, reduced from ${money(marked)}` : ""}`;
  const quantity = (
    <>
      Qty {line.quantity} × {marked !== null ? <s className="mr-1 whitespace-nowrap">{money(marked)}</s> : null}
      <span className="whitespace-nowrap">{money(line.unitAmount)}</span>
    </>
  );

  return (
    <Root data-slot="order-line" data-status={status} data-compact={compact || undefined} className={cn(compact ? "py-3" : "py-4", "[overflow-wrap:anywhere]", cancelled && "text-muted-foreground", className)} {...(props as ComponentProps<"div">)}>
      <MediaObject
        className={compact ? "gap-3" : "gap-4"}
        media={
          <div className={cn("grid place-items-center overflow-hidden rounded-lg border border-border bg-muted", compact ? "size-10" : "size-16", cancelled && "grayscale")}>
            {line.image ? renderImage(line.image, "size-full object-cover") : <IconPackage size={compact ? 16 : 22} className="text-muted-foreground" />}
          </div>
        }
        title={
          line.href ? (
            <a href={line.href} className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40">
              {line.name}
            </a>
          ) : (
            line.name
          )
        }
        aside={
          <div className="text-right whitespace-nowrap tabular-nums [overflow-wrap:normal]">
            {off > 0 ? (
              <s className="block text-xs font-normal text-muted-foreground">
                <span className="sr-only">Total before discount </span>
                {money(gross)}
              </s>
            ) : null}
            <p className={cn("text-sm font-medium text-foreground", cancelled && "text-muted-foreground line-through")}>
              <span className="sr-only">Total </span>
              {money(gross - off)}
              {cancelled ? <span className="sr-only"> (cancelled)</span> : null}
            </p>
          </div>
        }
      >
        {compact ? (
          <p className="text-xs tabular-nums">
            <span aria-hidden="true">
              {line.variant ? `${line.variant} · ` : null}
              {quantity}
            </span>
            <span className="sr-only">{line.variant ? `${line.variant}, ` : ""}{spoken}</span>
          </p>
        ) : (
          <>
            {line.variant ? <p className="text-xs">{line.variant}</p> : null}
            <p className="mt-1 text-xs tabular-nums">
              <span aria-hidden="true">{quantity}</span>
              <span className="sr-only">{spoken}</span>
            </p>
          </>
        )}
        {line.discount ? (
          <p className={cn("flex items-start gap-1.5 text-xs", compact ? "mt-0.5" : "mt-1.5")}>
            <IconTag size={14} className="mt-px shrink-0" />
            <span className="min-w-0">
              {line.discount.label}
              <span className="sr-only">, </span>
              <span className="ml-1.5 font-medium whitespace-nowrap text-foreground tabular-nums">{money(-off)}</span>
            </span>
          </p>
        ) : null}
        {chip ? (
          <Badge variant={chip.variant} className={compact ? "mt-1.5" : "mt-2"}>
            <chip.icon />
            {statusLabel ?? chip.label}
          </Badge>
        ) : null}
      </MediaObject>
    </Root>
  );
}
