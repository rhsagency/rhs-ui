import { Sparkline } from "@rhs-ui/dashboard/sparkline";
import { cn } from "@/lib/utils";

export interface StatTrendProps {
  label: string;
  /** Already formatted: "€48,200", "2.8%". */
  value: string;
  /** Change against the previous period, as a fraction: 0.12 is +12%. */
  change: number;
  /** Is up good? Revenue yes, churn no. */
  upIsGood?: boolean;
  trend?: readonly number[];
  period?: string;
  locale?: string;
  className?: string;
}

/**
 * A compact number for dense dashboards: label, value, the change with an
 * arrow and a word for whether that is good, and a sparkline. "Good" is
 * your call (upIsGood), because a rising churn is not good news.
 */
export function StatTrend({ label, value, change, upIsGood = true, trend = [], period = "vs last period", locale = "en-GB", className }: StatTrendProps) {
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(Math.abs(change));
  const up = change > 0;
  const good = change === 0 ? null : up === upIsGood;
  return (
    <div data-slot="stat-trend" className={cn("flex items-end justify-between gap-4 rounded-xl border border-border p-4", className)}>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-medium tracking-[-0.04em] tabular-nums">{value}</p>
        <p className={cn("mt-1 text-xs tabular-nums", good === false ? "text-destructive" : "text-foreground")}>
          <span aria-hidden="true">{change === 0 ? "■" : up ? "▲" : "▼"} </span>
          {change === 0 ? "No change" : `${up ? "Up" : "Down"} ${percent}`}
          {good !== null ? <span className="sr-only">{good ? ", good" : ", needs attention"}</span> : null}
          <span className="text-muted-foreground"> {period}</span>
        </p>
      </div>
      {trend.length > 1 ? <Sparkline values={trend} label={`${label} trend`} className="h-10 w-24 shrink-0" /> : null}
    </div>
  );
}
