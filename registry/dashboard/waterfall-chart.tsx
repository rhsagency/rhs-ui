import { cn } from "@/lib/utils";

export interface WaterfallStep {
  id: string;
  label: string;
  /** A change (positive or negative); the first step is the starting value. */
  value: number;
  /** Draw this bar as a subtotal from zero instead of a change. */
  total?: boolean;
}

export interface WaterfallChartProps {
  steps: readonly WaterfallStep[];
  label: string;
  format?: Intl.NumberFormatOptions;
  locale?: string;
  height?: number;
  /** "auto" starts the axis just under the lowest value so small changes stay visible (the totals are then cut, like most MRR charts); "zero" draws from zero. */
  baseline?: "auto" | "zero";
  className?: string;
}

/**
 * How you got from one number to another: start, each rise and fall as a
 * floating bar, subtotals from the baseline. Rises are solid, falls are
 * hatched so the difference does not depend on colour, and each bar is
 * labelled with its change. A table carries the same steps.
 */
export function WaterfallChart({ steps, label, format, locale = "en-GB", height = 260, baseline = "auto", className }: WaterfallChartProps) {
  const number = new Intl.NumberFormat(locale, format);
  const signed = new Intl.NumberFormat(locale, { ...format, signDisplay: "exceptZero" });
  let running = 0;
  const bars = steps.map((step, index) => {
    if (index === 0 || step.total) {
      running = index === 0 ? step.value : running;
      return { ...step, from: 0, to: running, kind: "total" as const };
    }
    const from = running;
    running += step.value;
    return { ...step, from, to: running, kind: step.value >= 0 ? ("up" as const) : ("down" as const) };
  });
  const width = 640;
  const pad = { top: 22, right: 8, bottom: 28, left: 8 };
  const max = Math.max(...bars.map((bar) => Math.max(bar.from, bar.to)));
  const changes = bars.filter((bar) => bar.kind !== "total").flatMap((bar) => [bar.from, bar.to]);
  const low = Math.min(...(changes.length ? changes : [0]), ...bars.map((bar) => bar.to));
  // "auto" starts the axis just under the lowest running value, so small changes next to a large total stay visible.
  const min = baseline === "zero" || low <= 0 ? Math.min(0, low) : Math.max(0, low - (max - low) * 0.8);
  const y = (value: number) => pad.top + ((max - value) / (max - min || 1)) * (height - pad.top - pad.bottom);
  const band = (width - pad.left - pad.right) / bars.length;
  return (
    <figure data-slot="waterfall-chart" className={cn("relative", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible text-foreground" aria-hidden="true">
        <defs>
          <pattern id="rhs-waterfall-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.55" />
          </pattern>
        </defs>
        <line x1={pad.left} x2={width - pad.right} y1={y(Math.max(0, min))} y2={y(Math.max(0, min))} stroke="currentColor" strokeOpacity={0.25} />
        {bars.map((bar, index) => {
          const x = pad.left + index * band + band * 0.18;
          const w = band * 0.64;
          const from = Math.max(bar.from, min);
          const top = y(Math.max(from, bar.to));
          const h = Math.max(1, Math.abs(y(from) - y(bar.to)));
          const next = bars[index + 1];
          return (
            <g key={bar.id}>
              <rect x={x} y={top} width={w} height={h} rx={3} fill={bar.kind === "down" ? "url(#rhs-waterfall-hatch)" : "currentColor"} fillOpacity={bar.kind === "total" ? 0.85 : bar.kind === "up" ? 0.45 : 1} stroke={bar.kind === "down" ? "currentColor" : "none"} strokeOpacity={0.55} />
              {next ? <line x1={x + w} x2={x + band} y1={y(bar.to)} y2={y(bar.to)} stroke="currentColor" strokeOpacity={0.3} strokeDasharray="3 3" /> : null}
              <text x={x + w / 2} y={top - 6} textAnchor="middle" className="fill-foreground text-[10px] font-medium" suppressHydrationWarning>{bar.kind === "total" ? number.format(bar.to) : signed.format(bar.value)}</text>
              <text x={x + w / 2} y={height - 8} textAnchor="middle" className="fill-muted-foreground text-[10px]">{bar.label}</text>
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead><tr><th scope="col">Step</th><th scope="col">Change</th><th scope="col">Running total</th></tr></thead>
        <tbody>{bars.map((bar) => <tr key={bar.id}><th scope="row">{bar.label}</th><td>{bar.kind === "total" ? "" : signed.format(bar.value)}</td><td>{number.format(bar.to)}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
