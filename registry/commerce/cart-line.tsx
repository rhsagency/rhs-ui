"use client";

import { IconTrash } from "@rhs-ui/icons";
import { NumberInput } from "@rhs-ui/primitives/number-input";
import { formatMoney, type Money } from "@rhs-ui/commerce/money";
import { cn } from "@/lib/utils";

export interface CartLineProps {
  title: string;
  /** "Stone / M". */
  variant?: string;
  image?: { src: string; alt: string };
  /** The price of one. The line total is computed from it. */
  price: Money;
  /** The old price of one, struck through beside the price. */
  compareAt?: Money;
  quantity: number;
  onQuantityChange?: (quantity: number) => void;
  onRemove?: () => void;
  /** The most that can be ordered, from stock. */
  max?: number;
  href?: string;
  locale?: string;
  className?: string;
}

/**
 * One line in a cart or a checkout: picture, title and variant, a quantity
 * stepper that respects stock, the line total, and a remove button that
 * names the product it removes. Without handlers it is a read-only line.
 */
export function CartLine({ title, variant, image, price, compareAt, quantity, onQuantityChange, onRemove, max = 99, href, locale = "en-GB", className }: CartLineProps) {
  const total = { amount: price.amount * quantity, currency: price.currency };
  const name = href ? (
    <a href={href} className="rounded-sm font-medium outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40">
      {title}
    </a>
  ) : (
    <span className="font-medium">{title}</span>
  );
  return (
    <div data-slot="cart-line" className={cn("flex gap-4 py-4 text-sm", className)}>
      {image ? (
        <img src={image.src} alt={image.alt} width={80} height={96} className="h-24 w-20 shrink-0 rounded-md border border-border bg-muted object-cover" />
      ) : null}
      <div className="grid min-w-0 flex-1 content-between gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="grid min-w-0 gap-0.5">
            {name}
            {variant ? <span className="text-muted-foreground">{variant}</span> : null}
            {quantity > 1 ? (
              <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                {formatMoney(price, locale)} each
              </span>
            ) : null}
          </div>
          <div className="grid shrink-0 justify-items-end gap-0.5 tabular-nums">
            <span className="font-medium" suppressHydrationWarning>
              {formatMoney(total, locale)}
            </span>
            {compareAt ? (
              <s className="text-xs text-muted-foreground" suppressHydrationWarning>
                <span className="sr-only">Was </span>
                {formatMoney({ amount: compareAt.amount * quantity, currency: compareAt.currency }, locale)}
              </s>
            ) : null}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          {onQuantityChange ? (
            <NumberInput aria-label={`Quantity of ${title}`} value={quantity} min={1} max={max} onValueChange={onQuantityChange} className="h-8 w-28" />
          ) : (
            <span className="text-muted-foreground">Qty {quantity}</span>
          )}
          {onRemove ? (
            <button type="button" onClick={onRemove} aria-label={`Remove ${title}`} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
              <IconTrash size={14} />
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
