import type { ReactNode } from "react";

import { formatMoney, type Money } from "@rhs-ui/commerce/money";
import { cn } from "@/lib/utils";

export interface OrderSummaryRow {
  label: ReactNode;
  /** A negative amount is a discount and is shown as one. Null reads "Calculated at the next step". */
  value: Money | null;
  /** "Free" instead of zero, for shipping. */
  freeLabel?: string;
}

export interface OrderSummaryProps {
  rows: readonly OrderSummaryRow[];
  total: Money;
  /** "Including €7.12 VAT", under the total. */
  note?: ReactNode;
  title?: string;
  /** A coupon field, a checkout button. */
  children?: ReactNode;
  locale?: string;
  className?: string;
}

/**
 * The money part of a cart or checkout: subtotal, discounts, shipping and
 * tax as a description list, the total set apart, and room underneath for
 * the coupon field and the button. You compute the numbers; it only shows
 * them, so the total always matches what you charge.
 */
export function OrderSummary({ rows, total, note, title = "Order summary", children, locale = "en-GB", className }: OrderSummaryProps) {
  return (
    <section data-slot="order-summary" aria-label={title} className={cn("grid gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground", className)}>
      <h2 className="text-base font-semibold">{title}</h2>
      <dl className="grid gap-2.5 text-sm">
        {rows.map((row, index) => {
          const discount = row.value !== null && row.value.amount < 0;
          return (
            <div key={index} className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className={cn("tabular-nums", discount && "text-[var(--color-success,oklch(0.55_0.15_150))]")} suppressHydrationWarning>
                {row.value === null ? <span className="text-muted-foreground">Calculated at the next step</span> : row.value.amount === 0 && row.freeLabel ? row.freeLabel : discount ? `−${formatMoney({ ...row.value, amount: -row.value.amount }, locale)}` : formatMoney(row.value, locale)}
              </dd>
            </div>
          );
        })}
        <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-border pt-3">
          <dt className="font-medium">Total</dt>
          <dd className="text-lg font-semibold tabular-nums" suppressHydrationWarning>
            {formatMoney(total, locale)}
          </dd>
        </div>
      </dl>
      {note ? <p className="-mt-2 text-right text-xs text-muted-foreground">{note}</p> : null}
      {children ? <div className="grid gap-3">{children}</div> : null}
    </section>
  );
}
