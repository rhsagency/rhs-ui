"use client";

import { IconBag, IconClose } from "@rhs-ui/icons";
import { formatMoney, type Money } from "@rhs-ui/commerce/money";
import { Button } from "@rhs-ui/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";

export interface MiniCartLine {
  id: string;
  title: string;
  variant?: string;
  quantity: number;
  price: Money;
  image?: { src: string; alt: string };
}

export interface MiniCartProps {
  lines: readonly MiniCartLine[];
  onRemove?: (id: string) => void;
  checkoutHref: string;
  cartHref?: string;
  locale?: string;
}

/**
 * The bag in the header: a count on the icon, and a small panel with the
 * lines, the subtotal and the way to checkout. For a quick look without
 * leaving the page; the full cart stays one link away.
 */
export function MiniCart({ lines, onRemove, checkoutHref, cartHref, locale = "en-GB" }: MiniCartProps) {
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const currency = lines[0]?.price.currency ?? "EUR";
  const subtotal = { amount: lines.reduce((sum, line) => sum + line.price.amount * line.quantity, 0), currency };
  return (
    <Popover>
      <PopoverTrigger data-slot="mini-cart" aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`} className="relative inline-flex size-10 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-5">
        <IconBag />
        {count ? <span aria-hidden="true" className="absolute top-0.5 right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background tabular-nums">{count}</span> : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        {lines.length ? (
          <>
            <ul className="max-h-72 divide-y divide-border overflow-y-auto relative">
              {lines.map((line) => (
                <li key={line.id} className="flex items-center gap-3 p-3">
                  <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">{line.image ? <img src={line.image.src} alt={line.image.alt} className="size-full object-cover" /> : null}</span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block truncate font-medium">{line.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{line.variant ? `${line.variant} · ` : ""}× {line.quantity}</span>
                  </span>
                  <span className="text-sm tabular-nums" suppressHydrationWarning>{formatMoney({ amount: line.price.amount * line.quantity, currency: line.price.currency }, locale)}</span>
                  {onRemove ? <button type="button" aria-label={`Remove ${line.title}`} onClick={() => onRemove(line.id)} className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted [&_svg]:size-3.5"><IconClose /></button> : null}
                </li>
              ))}
            </ul>
            <div className="border-t border-border p-3">
              <p className="flex justify-between text-sm"><span>Subtotal</span><span className="font-medium tabular-nums" suppressHydrationWarning>{formatMoney(subtotal, locale)}</span></p>
              <p className="mt-0.5 text-xs text-muted-foreground">Shipping and discounts at checkout.</p>
              <Button asChild className="mt-3 w-full"><a href={checkoutHref}>Checkout</a></Button>
              {cartHref ? <a href={cartHref} className="mt-2 block text-center text-xs underline underline-offset-4">View cart</a> : null}
            </div>
          </>
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">Your bag is empty.</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
