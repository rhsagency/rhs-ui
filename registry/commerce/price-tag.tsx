import { formatMoney, type Money } from "@rhs-ui/commerce/money";
import { cn } from "@/lib/utils";

export interface PriceTagProps {
  price: Money;
  /** The old price; shows the saving when higher than price. */
  compareAt?: Money;
  /** "per month", "per kg", "incl. VAT". */
  unit?: string;
  size?: "sm" | "md" | "lg";
  locale?: string;
  className?: string;
}

/**
 * A price as shoppers expect to read it: the price, the old one struck
 * through, the saving as a percentage, and a unit. The struck price is
 * announced as "was", not as a second price.
 */
export function PriceTag({ price, compareAt, unit, size = "md", locale = "en-GB", className }: PriceTagProps) {
  const sale = compareAt && compareAt.amount > price.amount;
  const off = sale ? Math.round((1 - price.amount / compareAt.amount) * 100) : 0;
  const big = size === "lg" ? "text-3xl" : size === "sm" ? "text-sm" : "text-xl";
  return (
    <p data-slot="price-tag" className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span className={cn("font-medium tracking-[-0.02em] tabular-nums", big)} suppressHydrationWarning>{formatMoney(price, locale)}</span>
      {sale ? (
        <>
          <s className="text-sm text-muted-foreground tabular-nums" suppressHydrationWarning><span className="sr-only">was </span>{formatMoney(compareAt, locale)}</s>
          <span className="rounded-full bg-foreground px-1.5 py-0.5 text-[11px] font-medium text-background">−{off}%</span>
        </>
      ) : null}
      {unit ? <span className="text-sm text-muted-foreground">{unit}</span> : null}
    </p>
  );
}
