"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/utils";

export interface ScatterPoint {
  id: string;
  label: string;
  x: number;
  y: number;
  /** Optional size, drawn as the dot's area. */
  size?: number;
}

export interface ScatterChartProps {
  points: readonly ScatterPoint[];
  xLabel: string;
  yLabel: string;
  label: string;
  /** Intl options for each axis, e.g. { style: "percent" }. */
  xFormat?: Intl.NumberFormatOptions;
  yFormat?: Intl.NumberFormatOptions;
  locale?: string;
  className?: string;
}

function nice(max: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(max, 1e-9)));
  return ([1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((step) => step >= max) ?? max);
}

/**
 * Two measures against each other, one dot per item: price against usage,
 * effort against impact. Dots are focusable and read their label and both
 * values; bigger items can carry a size. A table gives screen readers the
 * same numbers.
 */
export function ScatterChart({ points, xLabel, yLabel, label, xFormat, yFormat, locale = "en-GB", className }: ScatterChartProps) {
  const id = useId();
  const [active, setActive] = useState<string | null>(null);
  const fx = new Intl.NumberFormat(locale, xFormat);
  const fy = new Intl.NumberFormat(locale, yFormat);
  const width = 640;
  const height = 300;
  const pad = { top: 12, right: 12, bottom: 36, left: 48 };
  const xMax = nice(Math.max(...points.map((p) => p.x)));
  const yMax = nice(Math.max(...points.map((p) => p.y)));
  const sMax = Math.max(1, ...points.map((p) => p.size ?? 1));
  const x = (value: number) => pad.left + (value / xMax) * (width - pad.left - pad.right);
  const y = (value: number) => pad.top + (1 - value / yMax) * (height - pad.top - pad.bottom);
  const current = points.find((p) => p.id === active);
  return (
    <figure data-slot="scatter-chart" className={cn("relative", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible text-foreground" role="group" aria-labelledby={`${id}-title`} onPointerLeave={() => setActive(null)}>
        <title id={`${id}-title`}>{label}</title>
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(yMax * t)} y2={y(yMax * t)} stroke="currentColor" strokeOpacity={0.08} />
            <text x={pad.left - 8} y={y(yMax * t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[10px]" suppressHydrationWarning>{fy.format(yMax * t)}</text>
            <text x={x(xMax * t)} y={height - pad.bottom + 16} textAnchor="middle" className="fill-muted-foreground text-[10px]" suppressHydrationWarning>{fx.format(xMax * t)}</text>
          </g>
        ))}
        <line x1={pad.left} x2={width - pad.right} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity={0.25} />
        <text x={(width + pad.left) / 2} y={height - 2} textAnchor="middle" className="fill-muted-foreground text-[11px]">{xLabel}</text>
        <text x={12} y={(height - pad.bottom) / 2} textAnchor="middle" transform={`rotate(-90 12 ${(height - pad.bottom) / 2})`} className="fill-muted-foreground text-[11px]">{yLabel}</text>
        {points.map((p) => {
          const r = 4 + Math.sqrt((p.size ?? 1) / sMax) * 10;
          return (
            <circle
              key={p.id}
              cx={x(p.x)}
              cy={y(p.y)}
              r={r}
              tabIndex={0}
              role="img"
              aria-label={`${p.label}: ${xLabel} ${fx.format(p.x)}, ${yLabel} ${fy.format(p.y)}`}
              onPointerEnter={() => setActive(p.id)}
              onFocus={() => setActive(p.id)}
              onBlur={() => setActive(null)}
              fill="currentColor"
              fillOpacity={active === p.id ? 0.9 : 0.35}
              stroke="currentColor"
              strokeOpacity={0.9}
              className="outline-none transition-[fill-opacity] duration-150 focus-visible:stroke-[3px]"
            />
          );
        })}
      </svg>
      {current ? (
        <p aria-hidden="true" className="pointer-events-none absolute top-2 right-2 rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-sm" suppressHydrationWarning>
          <span className="block font-medium">{current.label}</span>
          {xLabel} {fx.format(current.x)} · {yLabel} {fy.format(current.y)}
        </p>
      ) : null}
      <table className="sr-only">
        <caption>{label}</caption>
        <thead><tr><th scope="col">Item</th><th scope="col">{xLabel}</th><th scope="col">{yLabel}</th></tr></thead>
        <tbody>{points.map((p) => <tr key={p.id}><th scope="row">{p.label}</th><td>{fx.format(p.x)}</td><td>{fy.format(p.y)}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
