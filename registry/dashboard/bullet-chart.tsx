import { cn } from "@/lib/utils";

export interface BulletChartProps {
  label: string;
  /** The measure. */
  value: number;
  /** The goal, drawn as a vertical mark. */
  target: number;
  /** Qualitative bands as upper bounds: [poor, ok, good]. */
  ranges: readonly [number, number, number];
  /** How to print numbers. */
  format?: (value: number) => string;
  className?: string;
}

/**
 * Stephen Few's bullet chart: one measure against a target on three grey
 * bands (poor, ok, good). Packs a KPI's context into one line, with the
 * whole reading spelled out for screen readers.
 */
export function BulletChart({ label, value, target, ranges, format = String, className }: BulletChartProps) {
  const max = Math.max(ranges[2], value, target) || 1;
  const pct = (n: number) => `${(n / max) * 100}%`;
  const band = value <= ranges[0] ? "poor" : value <= ranges[1] ? "ok" : "good";
  return (
    <figure data-slot="bullet-chart" className={cn("grid gap-1.5", className)}>
      <figcaption className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">{format(value)} <span className="text-xs">of {format(target)}</span></span>
      </figcaption>
      <div role="img" aria-label={`${label}: ${format(value)} against a target of ${format(target)}, in the ${band} range`} className="relative h-5 overflow-hidden rounded-sm">
        <div className="absolute inset-y-0 left-0 bg-muted" style={{ width: "100%" }} />
        <div className="absolute inset-y-0 left-0 bg-foreground/15" style={{ width: pct(ranges[1]) }} />
        <div className="absolute inset-y-0 left-0 bg-foreground/25" style={{ width: pct(ranges[0]) }} />
        <div className="absolute top-1/2 left-0 h-2 -translate-y-1/2 rounded-r-sm bg-foreground" style={{ width: pct(value) }} />
        <div className="absolute inset-y-0.5 w-0.5 bg-foreground" style={{ left: pct(target) }} />
      </div>
    </figure>
  );
}
