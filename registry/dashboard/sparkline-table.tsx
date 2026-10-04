import { cn } from "@/lib/utils";

export interface SparklineRow {
  id: string;
  name: string;
  /** The values over time, oldest first. */
  series: readonly number[];
  /** Formatted current value: "€12,400". */
  value: string;
  /** Change as a fraction. */
  change: number;
  upIsGood?: boolean;
}

export interface SparklineTableProps {
  rows: readonly SparklineRow[];
  label: string;
  columns?: [string, string, string, string];
  locale?: string;
  className?: string;
}

function Spark({ series }: { series: readonly number[] }) {
  const w = 96;
  const h = 24;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const points = series.map((v, i) => `${(i / Math.max(1, series.length - 1)) * w},${h - 2 - ((v - min) / (max - min || 1)) * (h - 4)}`).join(" ");
  return <svg viewBox={`0 0 ${w} ${h}`} className="h-6 w-24 text-foreground" aria-hidden="true"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" /></svg>;
}

/**
 * Many metrics side by side, each with a tiny trend line: products by
 * revenue, regions by signups, campaigns by clicks. A real table with the
 * name, the line, the value and the change in words for screen readers,
 * where a bad change is marked whether it went up or down.
 */
export function SparklineTable({ rows, label, columns = ["Name", "Trend", "Now", "Change"], locale = "en-GB", className }: SparklineTableProps) {
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" });
  return (
    <div data-slot="sparkline-table" className={cn("relative overflow-x-auto rounded-xl border border-border", className)}>
      <table className="w-full text-sm">
        <caption className="sr-only">{label}</caption>
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>{columns.map((column, index) => <th key={column} scope="col" className={cn("px-4 py-2.5 font-normal", index === 0 ? "text-left" : index === 1 ? "text-center" : "text-right")}>{column}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const bad = row.change !== 0 && row.change > 0 !== (row.upIsGood ?? true);
            return (
              <tr key={row.id}>
                <th scope="row" className="px-4 py-2.5 text-left font-normal">{row.name}</th>
                <td className="px-4 py-2.5"><span className="flex justify-center"><Spark series={row.series} /></span></td>
                <td className="px-4 py-2.5 text-right font-medium tabular-nums">{row.value}</td>
                <td className={cn("px-4 py-2.5 text-right tabular-nums", bad && "text-destructive")}>{percent.format(row.change)}{bad ? <span className="sr-only"> (worse)</span> : null}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
