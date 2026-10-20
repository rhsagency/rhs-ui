import { useId, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { IconCheck, IconImage } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { MediaObject } from "@rhs-ui/primitives/media-object";
import { formatMoney, type Money } from "@rhs-ui/commerce/money";
import { cn } from "@/lib/utils";

export interface MiniProductRowProduct {
  /** The name, on one line. It truncates instead of wrapping. */
  title: string;
  /** The thumbnail. Without one the row keeps its height and shows a quiet placeholder. */
  image?: { src: string; alt?: string };
  /** The second line: a variant ("Sand, 28 cm"), a brand or the stock ("Only 2 left"). */
  subtitle?: string;
  /** In minor units, with its currency: `{ amount: 3900, currency: "EUR" }`. */
  price?: Money;
  /** The regular price, struck through under the price when it is higher. */
  compareAtPrice?: Money;
  /** A short label next to the name: "New", "-20%". */
  badge?: string;
  /** Dims the thumbnail and says "Sold out" before the subtitle. */
  soldOut?: boolean;
}

export interface MiniProductRowLabels {
  /** Said before the subtitle of a sold-out product. */
  soldOut?: string;
  /** Said before the current price of a sale. */
  sale?: string;
  /** Said before the struck-through price. */
  regular?: string;
  /** For a screen reader, when a row that is neither a link nor a button is selected. */
  selected?: string;
}

export interface MiniProductRowProps extends Omit<ComponentProps<"div">, "children" | "onClick"> {
  /** The product to refer to. */
  product: MiniProductRowProduct;
  /** Makes the row a link to the product. */
  href?: string;
  /** Makes the row a button, for a picker. Ignored when `href` is set. */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** A control at the end of the row, such as a button or a checkbox. It stays a separate control above the row's link. */
  trailing?: ReactNode;
  /** Marks the row as chosen: a check on the thumbnail, a firmer border, and aria-pressed (a button) or aria-current (a link). Leave it out when the row is not a choice. */
  selected?: boolean;
  /** "md" has a 48px thumbnail, "sm" a 40px one for tight lists. */
  size?: "sm" | "md";
  /** Always pass your application locale, so the server and the browser print the same text. */
  locale?: string;
  /** The words on the row, for another language. */
  labels?: MiniProductRowLabels;
}

/**
 * The smallest way to refer to a product: a thumbnail, the name on one line, a
 * second line for variant, brand or stock, and a right-aligned price. The
 * height is the same with or without a picture, long names truncate, and the
 * name is the link or the button, stretched over the whole row so a trailing
 * control can sit beside it without nesting one interactive element in another.
 * Search suggestions, bundles, wishlists and pickers can all be built from it.
 */
export function MiniProductRow({ product, href, onClick, trailing, selected, size = "md", locale = "en-US", labels, className, ...props }: MiniProductRowProps) {
  const words = { soldOut: "Sold out", sale: "Sale price", regular: "Regular price", selected: "Selected", ...labels };
  const subtitleId = useId();
  const priceId = useId();
  const interactive = Boolean(href || onClick);
  const compact = size === "sm";
  const onSale = Boolean(product.price && product.compareAtPrice && product.compareAtPrice.amount > product.price.amount);

  // The link or button is named by the title alone; the variant and the price are what a picker is chosen by, so they are its description.
  const describedBy = [product.subtitle || product.soldOut ? subtitleId : null, product.price ? priceId : null].filter(Boolean).join(" ") || undefined;
  const stretch = "after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40";
  const label = (
    // The badge sits beside the name only when both fit; otherwise it wraps onto a second line that the row clips, so the name never gives up room for it.
    <span className="flex h-5 min-w-0 flex-wrap items-center gap-1.5 overflow-hidden">
      <span className="min-w-0 truncate">{product.title}</span>
      {product.badge ? (
        <Badge variant="outline" className="shrink-0">
          {product.badge}
        </Badge>
      ) : null}
    </span>
  );
  const title = href ? (
    <a href={href} aria-current={selected ? "true" : undefined} aria-describedby={describedBy} className={cn("block min-w-0", stretch)}>
      {label}
    </a>
  ) : onClick ? (
    <button type="button" aria-pressed={selected} aria-describedby={describedBy} onClick={onClick} className={cn("block w-full min-w-0 text-left", stretch)}>
      {label}
    </button>
  ) : (
    label
  );

  const thumbnail = (
    <span className={cn("relative grid shrink-0 place-items-center overflow-hidden rounded-md bg-muted text-muted-foreground/60", compact ? "size-10" : "size-12")}>
      {product.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- framework-neutral; a thumbnail this small gains nothing from an optimiser
        <img src={product.image.src} alt={product.image.alt ?? ""} loading="lazy" decoding="async" className={cn("size-full object-cover transition-opacity duration-150 motion-reduce:transition-none", product.soldOut && "opacity-45")} />
      ) : (
        <IconImage size={compact ? 16 : 20} />
      )}
    </span>
  );

  return (
    <div
      data-slot="mini-product-row"
      data-selected={selected || undefined}
      className={cn(
        "group/mini relative min-w-0 rounded-lg border border-transparent p-2 transition-[background-color,border-color] duration-150 motion-reduce:transition-none",
        compact && "p-1.5",
        interactive && "hover:bg-muted/70",
        selected && "border-foreground/40 bg-muted/50",
        className,
      )}
      {...props}
    >
      <MediaObject
        align="center"
        media={
          <span className="relative block">
            {thumbnail}
            {selected ? (
              <span aria-hidden="true" className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-foreground text-background ring-2 ring-background">
                <IconCheck size={10} strokeWidth={3} />
              </span>
            ) : null}
          </span>
        }
        title={<span className={cn("block min-w-0 leading-5", compact && "text-[0.8125rem]")}>{title}</span>}
        aside={
          <span className="flex items-center gap-2 sm:gap-3">
            {product.price ? (
              <span id={priceId} className="grid justify-items-end text-right tabular-nums">
                <span className={cn("text-sm leading-5 font-medium text-foreground", compact && "text-[0.8125rem]")}>
                  {onSale ? <span className="sr-only">{words.sale}: </span> : null}
                  {formatMoney(product.price, locale)}
                </span>
                {onSale && product.compareAtPrice ? (
                  <span className="text-xs leading-4 text-muted-foreground">
                    <span className="sr-only">{words.regular}: </span>
                    <s>{formatMoney(product.compareAtPrice, locale)}</s>
                  </span>
                ) : null}
              </span>
            ) : null}
            {trailing ? <span className="relative z-10 flex items-center">{trailing}</span> : null}
          </span>
        }
      >
        <span id={subtitleId} className="block truncate text-xs leading-4 text-muted-foreground">
          {product.soldOut ? <span className="font-medium text-foreground">
            {words.soldOut}
            {product.subtitle ? " · " : ""}
          </span> : null}
          {product.subtitle}
        </span>
      </MediaObject>
      {selected && !interactive ? <span className="sr-only">{words.selected}</span> : null}
    </div>
  );
}
