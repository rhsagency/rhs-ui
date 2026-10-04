"use client";

import type { ReactNode } from "react";

import { CartLine } from "@rhs-ui/commerce/cart-line";
import { formatMoney, type Money } from "@rhs-ui/commerce/money";
import { ShippingProgress } from "@rhs-ui/commerce/shipping-progress";
import { Button } from "@rhs-ui/primitives/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@rhs-ui/primitives/sheet";

export interface CartDrawerLine {
  id: string;
  title: string;
  variant?: string;
  quantity: number;
  price: Money;
  image?: { src: string; alt: string };
  href?: string;
}

export interface CartDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The bag button in the header. */
  trigger?: ReactNode;
  lines: readonly CartDrawerLine[];
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  /** Free shipping from this subtotal, in cents. */
  freeShippingFrom?: number;
  checkoutHref: string;
  locale?: string;
}

/**
 * The bag that slides in from the side after "add to bag": the lines with
 * quantity and remove (the house cart line), progress to free shipping, the
 * subtotal and checkout pinned to the bottom. Totals are summed in cents,
 * and an empty bag says so with a way back to shopping.
 */
export function CartDrawer({ open, onOpenChange, trigger, lines, onQuantityChange, onRemove, freeShippingFrom, checkoutHref, locale = "en-GB" }: CartDrawerProps) {
  const currency = lines[0]?.price.currency ?? "EUR";
  const subtotal = { amount: lines.reduce((sum, line) => sum + line.price.amount * line.quantity, 0), currency };
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger ? <SheetTrigger asChild>{trigger}</SheetTrigger> : null}
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your bag</SheetTitle>
          <SheetDescription>{count ? `${count} ${count === 1 ? "item" : "items"}` : "Nothing in here yet."}</SheetDescription>
        </SheetHeader>
        {lines.length ? (
          <>
            {freeShippingFrom !== undefined ? <div className="px-5"><ShippingProgress subtotal={subtotal} threshold={{ amount: freeShippingFrom, currency }} locale={locale} /></div> : null}
            <ul className="relative min-h-0 flex-1 divide-y divide-border overflow-y-auto px-5">
              {lines.map((line) => (
                <li key={line.id} className="py-4">
                  <CartLine title={line.title} variant={line.variant} image={line.image} price={line.price} quantity={line.quantity} href={line.href} locale={locale} onQuantityChange={(quantity) => onQuantityChange(line.id, quantity)} onRemove={() => onRemove(line.id)} />
                </li>
              ))}
            </ul>
            <SheetFooter className="border-t border-border">
              <p className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium tabular-nums" suppressHydrationWarning>{formatMoney(subtotal, locale)}</span></p>
              <p className="text-xs text-muted-foreground">Shipping and tax are worked out at checkout.</p>
              <Button asChild size="lg" className="w-full"><a href={checkoutHref}>Checkout</a></Button>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-sm text-muted-foreground">
            Your bag is empty.
            <Button variant="outline" onClick={() => onOpenChange?.(false)}>Keep shopping</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
