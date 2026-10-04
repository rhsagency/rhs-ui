import { IconArrowDownRight, IconArrowUpRight, IconMinus } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface MetricDeltaProps {
  /** The change as a fraction: 0.124 is +12.4%. */
  change: number;
  /** Is a rise good for this metric? Revenue yes, churn and load time no. */
  upIsGood?: boolean;
  /** "vs last week", read after the number. */
  period?: string;
  locale?: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * The little change chip next to a number: arrow, signed percentage and a
 * calm or warning tone decided by whether the change is good for this
 * metric, not by its sign. The sentence for screen readers says up or down
 * and better or worse, so the colour is never the only signal.
 */
export function MetricDelta({ change, upIsGood = true, period, locale = "en-GB", size = "sm", className }: MetricDeltaProps) {
  const flat = Math.abs(change) < 0.0005;
  const good = flat ? null : change > 0 === upIsGood;
  const Icon = flat ? IconMinus : change > 0 ? IconArrowUpRight : IconArrowDownRight;
  const text = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" }).format(change);
  return (
    <span data-slot="metric-delta" className={cn("relative inline-flex items-center gap-1 rounded-full font-medium tabular-nums", size === "sm" ? "px-1.5 py-0.5 text-xs [&_svg]:size-3" : "px-2 py-1 text-sm [&_svg]:size-3.5", good === false ? "bg-destructive/10 text-destructive" : good ? "bg-foreground/[0.07] text-foreground" : "bg-muted text-muted-foreground", className)}>
      <Icon aria-hidden="true" />
      <span aria-hidden="true">{text}</span>
      <span className="sr-only">{flat ? "No change" : `${change > 0 ? "Up" : "Down"} ${text.replace(/^[+−-]/, "")}, ${good ? "better" : "worse"}`}{period ? ` ${period}` : ""}</span>
      {period ? <span aria-hidden="true" className="font-normal text-muted-foreground">{period}</span> : null}
    </span>
  );
}
