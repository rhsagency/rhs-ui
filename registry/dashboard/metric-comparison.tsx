import { cn } from "@/lib/utils";

export interface MetricComparisonRow {
  label: string;
  current: number;
  previous: number;
  /** Is a rise good for this metric? */
  upIsGood?: boolean;
}

export interface MetricComparisonProps {
  title: string;
  currentLabel?: string;
  previousLabel?: string;
  rows: readonly MetricComparisonRow[];
  /** How to print a value. */
  format?: (value: number) => string;
  locale?: string;
  className?: string;
}

/**
 * This period against the last, metric by metric, as a real table: both
 * values and the change with its direction in words, marked when the change
 * is bad news for that metric.
 */
export function MetricComparison({ title, currentLabel = "This month", previousLabel = "Last month", rows, format = String, locale = "en-GB", className }: MetricComparisonProps) {
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" });
  return (
    <div data-slot="metric-comparison" className={cn("relative overflow-x-auto rounded-xl border border-border", className)}>
      <table className="w-full text-sm">
        <caption className="border-b border-border px-4 py-3 text-left font-medium">{title}</caption>
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b border-border">
            <th scope="col" className="px-4 py-2 text-left font-normal">Metric</th>
            <th scope="col" className="px-4 py-2 text-right font-normal">{previousLabel}</th>
            <th scope="col" className="px-4 py-2 text-right font-normal">{currentLabel}</th>
            <th scope="col" className="px-4 py-2 text-right font-normal">Change</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const change = row.previous ? (row.current - row.previous) / row.previous : 0;
            const bad = change !== 0 && change > 0 !== (row.upIsGood ?? true);
            return (
              <tr key={row.label}>
                <th scope="row" className="px-4 py-2.5 text-left font-normal">{row.label}</th>
                <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">{format(row.previous)}</td>
                <td className="px-4 py-2.5 text-right font-medium tabular-nums">{format(row.current)}</td>
                <td className={cn("px-4 py-2.5 text-right tabular-nums", bad ? "text-destructive" : "")}>{percent.format(change)}{bad ? <span className="sr-only"> (worse)</span> : null}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
