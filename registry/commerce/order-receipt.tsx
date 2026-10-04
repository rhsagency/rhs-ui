import type { ReactNode } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { formatMoney, type Money } from "@rhs-ui/commerce/money";
import { cn } from "@/lib/utils";

export interface ReceiptLine {
  id: string;
  title: string;
  variant?: string;
  quantity: number;
  /** The price of one. */
  price: Money;
}

export interface OrderReceiptProps {
  /** Your order number, the one the customer will quote. */
  orderNumber: string;
  /** Formatted: "14 April 2026, 10:42". */
  placedAt: string;
  placedAtDateTime: string;
  email: string;
  lines: readonly ReceiptLine[];
  shipping: Money;
  /** VAT included in the total, shown as a line under it. */
  vatIncluded?: Money;
  /** "Visa ending 4242". */
  paidWith: string;
  shipTo: readonly string[];
  /** Track order, download invoice. */
  actions?: ReactNode;
  locale?: string;
  className?: string;
}

/**
 * The order confirmation page: a clear "thank you" with the order number,
 * the lines with their totals, shipping and VAT, how it was paid and where
 * it goes, and the next actions. Totals are summed in cents from the lines,
 * so the receipt can never disagree with itself.
 */
export function OrderReceipt({ orderNumber, placedAt, placedAtDateTime, email, lines, shipping, vatIncluded, paidWith, shipTo, actions, locale = "en-GB", className }: OrderReceiptProps) {
  const currency = lines[0]?.price.currency ?? shipping.currency;
  const subtotal = lines.reduce((sum, line) => sum + line.price.amount * line.quantity, 0);
  const total = { amount: subtotal + shipping.amount, currency };
  const money = (amount: number) => formatMoney({ amount, currency }, locale);
  return (
    <article data-slot="order-receipt" className={cn("mx-auto w-full max-w-xl rounded-3xl border border-border p-6 sm:p-8", className)}>
      <header className="text-center">
        <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-foreground text-background"><IconCheck className="size-5" /></span>
        <h2 className="mt-4 text-2xl font-medium tracking-tight">Thank you, your order is in</h2>
        <p className="mt-2 text-sm text-muted-foreground">Order <span className="font-medium text-foreground">{orderNumber}</span>, placed <time dateTime={placedAtDateTime}>{placedAt}</time>. A confirmation is on its way to {email}.</p>
      </header>
      <ul className="mt-8 divide-y divide-border border-y border-border">
        {lines.map((line) => (
          <li key={line.id} className="flex justify-between gap-4 py-3 text-sm">
            <span>
              <span className="block font-medium">{line.title}</span>
              <span className="block text-muted-foreground">{[line.variant, `${line.quantity} × ${money(line.price.amount)}`].filter(Boolean).join(" · ")}</span>
            </span>
            <span className="shrink-0 tabular-nums" suppressHydrationWarning>{money(line.price.amount * line.quantity)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums" suppressHydrationWarning>{money(subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd className="tabular-nums" suppressHydrationWarning>{shipping.amount ? money(shipping.amount) : "Free"}</dd></div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-medium"><dt>Total</dt><dd className="tabular-nums" suppressHydrationWarning>{formatMoney(total, locale)}</dd></div>
        {vatIncluded ? <div className="flex justify-between text-xs text-muted-foreground"><dt>Including VAT</dt><dd className="tabular-nums" suppressHydrationWarning>{formatMoney(vatIncluded, locale)}</dd></div> : null}
      </dl>
      <div className="mt-6 grid gap-4 rounded-2xl bg-muted/60 p-4 text-sm sm:grid-cols-2">
        <div><p className="text-xs text-muted-foreground">Paid with</p><p className="mt-1">{paidWith}</p></div>
        <div><p className="text-xs text-muted-foreground">Shipping to</p><address className="mt-1 not-italic">{shipTo.map((line) => <span key={line} className="block">{line}</span>)}</address></div>
      </div>
      {actions ? <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div> : null}
    </article>
  );
}
