import { formatMoney, type Money } from "@rhs-ui/commerce/money";
import { cn } from "@/lib/utils";

export interface ShippingProgressProps {
  /** What is in the cart now. */
  subtotal: Money;
  /** From this amount shipping is free. */
  threshold: Money;
  locale?: string;
  className?: string;
}

/**
 * The nudge above a cart: how much more until shipping is free, and a bar
 * that fills towards it. Once reached it says so and the bar is full. The
 * sentence carries the meaning; the bar is decoration.
 */
export function ShippingProgress({ subtotal, threshold, locale = "en-GB", className }: ShippingProgressProps) {
  const left = Math.max(0, threshold.amount - subtotal.amount);
  const share = threshold.amount ? Math.min(100, (subtotal.amount / threshold.amount) * 100) : 100;
  return (
    <div data-slot="shipping-progress" className={cn("grid gap-2 text-sm", className)}>
      <p aria-live="polite" suppressHydrationWarning>
        {left === 0 ? (
          <span className="font-medium">Your order ships free.</span>
        ) : (
          <>
            Add <span className="font-medium tabular-nums">{formatMoney({ amount: left, currency: threshold.currency }, locale)}</span> for free shipping.
          </>
        )}
      </p>
      <span className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <span className={cn("block h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none", left === 0 ? "bg-[var(--color-success,oklch(0.62_0.15_150))]" : "bg-foreground")} style={{ width: `${share}%` }} />
      </span>
    </div>
  );
}
