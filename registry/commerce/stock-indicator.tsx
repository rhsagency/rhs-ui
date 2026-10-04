import { cn } from "@/lib/utils";

export interface StockIndicatorProps {
  /** Units left; 0 is sold out. */
  stock: number;
  /** At or below this, show "only N left". */
  low?: number;
  /** For sold out: when it is back, already formatted, read after "back": "on 22 April", "next week". */
  restock?: string;
  className?: string;
}

/**
 * How many are left, in words with a small bar: in stock, only a few left,
 * or sold out with the restock date. Honest numbers only; it never invents
 * urgency.
 */
export function StockIndicator({ stock, low = 5, restock, className }: StockIndicatorProps) {
  const state = stock <= 0 ? "out" : stock <= low ? "low" : "in";
  const text = state === "out" ? (restock ? `Sold out, back ${restock}` : "Sold out") : state === "low" ? `Only ${stock} left` : "In stock";
  return (
    <p data-slot="stock-indicator" data-state={state} className={cn("flex items-center gap-2 text-sm", state === "out" ? "text-muted-foreground" : "text-foreground", className)}>
      <span aria-hidden="true" className="flex gap-0.5">
        {[0, 1, 2].map((bar) => (
          <span key={bar} className={cn("h-3 w-1.5 rounded-sm", (state === "in" ? 3 : state === "low" ? 1 : 0) > bar ? "bg-foreground" : "bg-border")} />
        ))}
      </span>
      {text}
    </p>
  );
}
