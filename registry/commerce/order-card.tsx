import { useId, type ComponentProps, type ReactNode } from "react";

import { IconCheck, IconClock, IconPackage, IconRepeat, IconReturn, IconTruck, IconXCircle } from "@rhs-ui/icons";
import { formatMoney } from "@rhs-ui/commerce/money";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Card } from "@rhs-ui/primitives/card";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { cn } from "@/lib/utils";

export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

export type OrderAction = "track" | "return" | "reorder";

export interface OrderCardItem {
  /** Identity of the item, for your list's key. */
  id: string;
  /** Names the picture for a screen reader. */
  name: string;
  /** Picture source. Without one the tile shows a parcel. */
  image?: string;
}

export interface OrderCardOrder {
  /** Identity of the order, for your list's key. */
  id: string;
  /** The number the customer knows: "NW-20418". */
  number: string;
  /** When it was placed, as an ISO date-time: "2026-10-12T09:41:00Z". */
  placedAt: string;
  /** Where the order is: it picks the badge, the sentence and the button. */
  status: OrderStatus;
  /** The products in it. Four thumbnails are drawn, the rest become "+2". */
  items: readonly OrderCardItem[];
  /** How many products the order holds when `items` carries only the first few. Defaults to `items.length`. */
  itemCount?: number;
  /** The order total in minor units: 18450 is 184.50. */
  total: number;
  /** ISO date: when it was delivered, or when it is expected. Written out in words on the card. */
  deliveryDate?: string;
  /** The buttons to show, the first one as the main action. Defaults to what fits the status: track, reorder. */
  actions?: readonly OrderAction[];
}

export interface OrderCardProps extends Omit<ComponentProps<"div">, "children"> {
  /** The order to show: its number, date, status, items, total and delivery date. */
  order: OrderCardOrder;
  /** The order page. The whole card links there, while the action buttons stay separate controls. */
  href?: string;
  /** Called when an action button is pressed. Pass it from a client component. */
  onAction?: (action: OrderAction, order: OrderCardOrder) => void;
  /** Where an action goes, for actions that are pages: `{ track: "https://carrier.example/NW-20431" }`. That action then renders as a link, which needs no JavaScript. */
  actionHrefs?: Partial<Record<OrderAction, string>>;
  /** ISO 4217 code for the total. */
  currency?: string;
  /** Locale for the amount and the dates. Always passed, so server and browser agree. */
  locale?: string;
  /** IANA time zone the date-times are read in. A bare date like "2026-10-14" is a calendar day and ignores it. Always passed, so server and browser agree. */
  timeZone?: string;
  /** One row for dense lists: overlapping thumbnails, the total and the action on the same line. */
  compact?: boolean;
  /** Plug in next/image or any optimiser. Defaults to a plain <img>. */
  renderImage?: (image: { src: string; alt: string }, className: string) => ReactNode;
}

const STATUS = {
  processing: { label: "Processing", icon: IconClock, variant: "outline" },
  shipped: { label: "Shipped", icon: IconTruck, variant: "default" },
  delivered: { label: "Delivered", icon: IconCheck, variant: "secondary" },
  cancelled: { label: "Cancelled", icon: IconXCircle, variant: "muted" },
} as const;

const ACTIONS = {
  track: { label: "Track", icon: IconTruck },
  return: { label: "Return", icon: IconReturn },
  reorder: { label: "Reorder", icon: IconRepeat },
} as const;

const DEFAULT_ACTIONS: Record<OrderStatus, readonly OrderAction[]> = {
  processing: [],
  shipped: ["track"],
  delivered: ["reorder"],
  cancelled: ["reorder"],
};

/**
 * A date or date-time in words. A bare date ("2026-10-14") is a calendar day, so it is read as that day in
 * every time zone; a date-time is read in `timeZone`. Something that is not a date comes back as written.
 */
function writeDate(value: string, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: /^\d{4}-\d{2}-\d{2}$/.test(value) ? "UTC" : timeZone }).format(date);
}

function DefaultImage(image: { src: string; alt: string }, className: string) {
  // eslint-disable-next-line @next/next/no-img-element -- framework-neutral default; pass renderImage to use next/image
  return <img src={image.src} alt={image.alt} loading="lazy" decoding="async" className={className} />;
}

function Thumbnails({ order, compact, muted, renderImage }: { order: OrderCardOrder; compact: boolean; muted: boolean; renderImage: NonNullable<OrderCardProps["renderImage"]> }) {
  const shown = order.items.slice(0, 4);
  const more = Math.max(0, (order.itemCount ?? order.items.length) - shown.length);
  const tile = cn("grid shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted", compact ? "size-9 ring-2 ring-card" : "size-12");
  return (
    <ul role="list" aria-label="Items in this order" className={cn("flex items-center", compact ? "-space-x-2" : "flex-wrap gap-2")}>
      {shown.map((item) => (
        <li key={item.id} className={cn(tile, muted && "opacity-60 grayscale")}>
          {item.image ? (
            renderImage({ src: item.image, alt: item.name }, "size-full object-cover")
          ) : (
            <>
              <IconPackage size={compact ? 14 : 18} className="text-muted-foreground" />
              <span className="sr-only">{item.name}</span>
            </>
          )}
        </li>
      ))}
      {more > 0 ? (
        <li className={cn(tile, "text-xs font-medium text-muted-foreground tabular-nums", compact && "text-[0.6875rem]")}>
          <span aria-hidden="true">+{more}</span>
          <span className="sr-only">and {more} more {more === 1 ? "item" : "items"}</span>
        </li>
      ) : null}
    </ul>
  );
}

/**
 * An order in someone's history, for a "My orders" page: the number, the
 * date, a status, up to four thumbnails with the rest as "+2", the total and
 * the next step as a button (track, return, reorder). The whole card links to
 * the order through a stretched link on the order number, and the buttons sit
 * above that link as separate controls. A delivered order says when it
 * arrived, in words; a cancelled one is muted but stays readable. A compact
 * layout fits a dashboard, and `OrderCardSkeleton` holds the place while the
 * list loads.
 */
export function OrderCard({ order, href, onAction, actionHrefs, currency = "EUR", locale = "en-US", timeZone = "UTC", compact = false, renderImage = DefaultImage, className, ...props }: OrderCardProps) {
  const status = STATUS[order.status];
  const cancelled = order.status === "cancelled";
  const actions = order.actions ?? DEFAULT_ACTIONS[order.status];
  const count = order.itemCount ?? order.items.length;
  const titleId = useId();
  const placed = writeDate(order.placedAt, locale, timeZone, { day: "numeric", month: "long", year: "numeric" });
  const day = order.deliveryDate ? <time dateTime={order.deliveryDate}>{writeDate(order.deliveryDate, locale, timeZone, { weekday: "long", day: "numeric", month: "long" })}</time> : null;
  const delivery =
    order.status === "delivered" ? (
      <>Delivered {day}</>
    ) : order.status === "shipped" ? (
      <>{day ? <>Arriving {day}</> : "On its way"}</>
    ) : order.status === "processing" ? (
      <>{day ? <>Expected {day}</> : "We are getting it ready"}</>
    ) : (
      <>This order was cancelled</>
    );

  // The number is one block, so a narrow card breaks after "Order" and never inside "NW-20431".
  const label = (
    <>
      Order <span className="inline-block max-w-full">{order.number}</span>
    </>
  );
  const heading = (
    <h3 id={titleId} className={cn("font-semibold tracking-[-0.01em] tabular-nums", compact ? "text-sm" : "text-[0.9375rem]", cancelled && "text-muted-foreground")}>
      {href ? (
        <a href={href} className="rounded-xl outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40">
          {label}
        </a>
      ) : (
        label
      )}
    </h3>
  );
  const badge = (
    <Badge variant={status.variant} className="shrink-0">
      <status.icon />
      {status.label}
    </Badge>
  );
  const total = (
    <p className={cn("font-semibold whitespace-nowrap tabular-nums [overflow-wrap:normal]", compact ? "text-sm" : "text-base", cancelled && "text-muted-foreground")}>
      <span className="sr-only">Total </span>
      {formatMoney({ amount: order.total, currency }, locale)}
    </p>
  );
  const buttons = actions.map((action, index) => {
    const spec = ACTIONS[action];
    const target = actionHrefs?.[action];
    const variant = index === 0 && !cancelled ? "default" : "outline";
    const name = `${spec.label} order ${order.number}`;
    // The handler is only attached when there is one, so a card with links alone renders in a Server Component.
    return target ? (
      <Button key={action} asChild size="sm" variant={variant} className="relative z-10">
        <a href={target} aria-label={name}>
          <spec.icon />
          {spec.label}
        </a>
      </Button>
    ) : (
      <Button key={action} type="button" size="sm" variant={variant} aria-label={name} onClick={onAction ? () => onAction(action, order) : undefined} className="relative z-10">
        <spec.icon />
        {spec.label}
      </Button>
    );
  });

  const surface = cn("relative min-w-0 gap-0 p-0 [overflow-wrap:anywhere] transition-[border-color,background-color] duration-150 motion-reduce:transition-none", href && "hover:border-foreground/25", cancelled && "bg-muted/40", className);

  if (compact) {
    return (
      <Card role="article" aria-labelledby={titleId} data-slot="order-card" data-status={order.status} data-compact="" className={surface} {...props}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
          <div className="flex min-w-0 flex-1 basis-60 items-center gap-3">
            {/* The words come first in the code, so a screen reader meets the order before its pictures; the pictures are first on screen. */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {heading}
                {badge}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Placed <time dateTime={order.placedAt}>{placed}</time> · {delivery}
              </p>
            </div>
            <div className="order-first">
              <Thumbnails order={order} compact muted={cancelled} renderImage={renderImage} />
            </div>
          </div>
          {/* Up to three actions plus the total: on a narrow row the last button drops to a second line, right-aligned, instead of leaving the card. */}
          <div className="ml-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
            {total}
            {buttons}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card role="article" aria-labelledby={titleId} data-slot="order-card" data-status={order.status} className={surface} {...props}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 pt-5">
        <div className="min-w-0 flex-[1_1_9rem]">
          {heading}
          <p className="mt-1 text-xs text-muted-foreground">
            Placed <time dateTime={order.placedAt}>{placed}</time> · {count} {count === 1 ? "item" : "items"}
          </p>
        </div>
        {badge}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-5 pt-4 pb-5">
        <Thumbnails order={order} compact={false} muted={cancelled} renderImage={renderImage} />
        <div className="ml-auto text-right">
          <p className="text-xs text-muted-foreground" aria-hidden="true">
            Total
          </p>
          {total}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-border px-5 py-3">
        <p className={cn("text-sm", cancelled && "text-muted-foreground")}>{delivery}</p>
        {buttons.length ? <div className="flex flex-wrap items-center gap-2">{buttons}</div> : null}
      </div>
    </Card>
  );
}

/** The same footprint as `OrderCard`, drawn in placeholders while the list loads. */
export function OrderCardSkeleton({ compact = false, className, ...props }: Omit<ComponentProps<"div">, "children"> & { compact?: boolean }) {
  return (
    <Card data-slot="order-card-skeleton" aria-busy="true" className={cn("gap-0 p-0", className)} {...props}>
      <span role="status" className="sr-only">
        Loading order
      </span>
      {compact ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
          <div className="flex flex-1 basis-60 items-center gap-3">
            <div className="flex -space-x-2">
              {[0, 1, 2].map((tile) => (
                <Skeleton key={tile} className="size-9 rounded-lg ring-2 ring-card" delay={tile * 80} />
              ))}
            </div>
            <div className="grid gap-2">
              <Skeleton className="h-3.5 w-36" delay={120} />
              <Skeleton className="h-3 w-44 max-w-full" delay={180} />
            </div>
          </div>
          <Skeleton className="ml-auto h-8 w-24" delay={240} />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4 px-5 pt-5">
            <div className="grid gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-48 max-w-full" delay={60} />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" delay={120} />
          </div>
          <div className="flex items-end justify-between gap-6 px-5 pt-4 pb-5">
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((tile) => (
                <Skeleton key={tile} className="size-12 rounded-lg" delay={tile * 80} />
              ))}
            </div>
            <Skeleton className="h-5 w-20" delay={200} />
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-border px-5 py-3">
            <Skeleton className="h-4 w-44" delay={240} />
            <Skeleton className="h-8 w-24" delay={300} />
          </div>
        </>
      )}
    </Card>
  );
}
