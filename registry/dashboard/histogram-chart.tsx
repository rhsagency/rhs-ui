import { cn } from "@/lib/utils";

export interface HistogramChartProps {
  /** The raw values; the chart bins them. */
  values: readonly number[];
  /** Number of bins. */
  bins?: number;
  /** Draw a marker at this value: a target, a median, your own score. */
  marker?: { value: number; label: string };
  label: string;
  /** What one value is: "ms", "days". */
  unit?: string;
  locale?: string;
  height?: number;
  className?: string;
}

/**
 * How values spread out: response times, order sizes, days to close. The
 * chart bins the raw numbers itself, draws the count per bin, and can mark
 * a target or the median with a labelled line. Screen readers get the bins
 * and counts as a table.
 */
export function HistogramChart({ values, bins = 12, marker, label, unit = "", locale = "en-GB", height = 220, className }: HistogramChartProps) {
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const min = Math.min(...values);
  const max = Math.max(...values);
  const size = (max - min) / bins || 1;
  const counts = Array.from({ length: bins }, () => 0);
  for (const value of values) counts[Math.min(bins - 1, Math.floor((value - min) / size))]! += 1;
  const top = Math.max(...counts, 1);
  const width = 640;
  const pad = { top: 16, right: 8, bottom: 26, left: 8 };
  const bar = (width - pad.left - pad.right) / bins;
  const x = (value: number) => pad.left + ((value - min) / (max - min || 1)) * (width - pad.left - pad.right);
  const y = (count: number) => pad.top + (1 - count / top) * (height - pad.top - pad.bottom);
  const suffix = unit ? ` ${unit}` : "";
  return (
    <figure data-slot="histogram-chart" className={cn("relative", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible text-foreground" aria-hidden="true">
        {counts.map((count, index) => (
          <rect key={index} x={pad.left + index * bar + 1} y={y(count)} width={Math.max(0, bar - 2)} height={height - pad.bottom - y(count)} rx={2} fill="currentColor" fillOpacity={0.7} />
        ))}
        <line x1={pad.left} x2={width - pad.right} y1={height - pad.bottom} y2={height - pad.bottom} stroke="currentColor" strokeOpacity={0.25} />
        {[0, 0.5, 1].map((t) => (
          <text key={t} x={pad.left + t * (width - pad.left - pad.right)} y={height - 8} textAnchor={t === 0 ? "start" : t === 1 ? "end" : "middle"} className="fill-muted-foreground text-[10px]" suppressHydrationWarning>{number.format(min + t * (max - min))}{suffix}</text>
        ))}
        {marker ? (
          <g>
            <line x1={x(marker.value)} x2={x(marker.value)} y1={pad.top - 6} y2={height - pad.bottom} stroke="currentColor" strokeWidth={1.5} strokeDasharray="4 3" />
            <text x={x(marker.value) + 6} y={pad.top} className="fill-foreground text-[10px] font-medium" suppressHydrationWarning>{marker.label} {number.format(marker.value)}{suffix}</text>
          </g>
        ) : null}
      </svg>
      <table className="sr-only">
        <caption>{label}{marker ? `, ${marker.label} ${number.format(marker.value)}${suffix}` : ""}</caption>
        <thead><tr><th scope="col">Range</th><th scope="col">Count</th></tr></thead>
        <tbody>{counts.map((count, index) => <tr key={index}><th scope="row">{`${number.format(min + index * size)} to ${number.format(min + (index + 1) * size)}${suffix}`}</th><td>{count}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
