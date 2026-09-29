"use client";

import { useId, useState, type PointerEvent } from "react";

import { cn } from "@/lib/utils";

export interface ChartSeries {
  key: string;
  label: string;
}

export interface LineChartProps {
  /** One row per point along the x axis, e.g. { month: "Jan", revenue: 42000, costs: 31000 }. */
  data: readonly Record<string, string | number>[];
  /** The key of the x value in each row. */
  index: string;
  series: readonly ChartSeries[];
  /** Fill the area under each line. */
  area?: boolean;
  /** How values read on the axis, in the readout and in the table: Intl number options, e.g. { style: "currency", currency: "EUR" }. Options, not a function, so a Server Component can pass them. */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /** Names the chart for screen readers and heads the data table they get instead. */
  label: string;
  height?: number;
  className?: string;
}

const SHADES = [1, 0.5, 0.28, 0.16];

/** The axis: three to five steps of a round size (1, 2, 2.5 or 5 times a power of ten), the smallest top that clears the largest value. */
function niceScale(max: number): { top: number; steps: number } {
  let best = { top: Number.POSITIVE_INFINITY, steps: 4 };
  for (const steps of [3, 4, 5]) {
    const raw = Math.max(max, 1) / steps;
    const magnitude = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((candidate) => candidate >= raw) ?? raw;
    if (step * steps < best.top) best = { top: step * steps, steps };
  }
  return best;
}

/**
 * Lines (or areas) over time, in the text colour with fading shades per
 * series. Hovering or touching shows every series at that point; screen
 * readers get the same numbers as a table. Axes are quiet: four gridlines
 * and the first and last label, because the readout carries the detail.
 */
export function LineChart({ data, index, series, area = false, format, locale = "en-GB", label, height = 220, className }: LineChartProps) {
  const formatter = new Intl.NumberFormat(locale, format);
  const show = (value: number) => formatter.format(value);
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const width = 640;
  const pad = { top: 12, right: 12, bottom: 24, left: 44 };
  const values = data.flatMap((row) => series.map((s) => Number(row[s.key] ?? 0)));
  const { top, steps } = niceScale(Math.max(...values));
  const x = (i: number) => pad.left + (data.length < 2 ? 0 : (i / (data.length - 1)) * (width - pad.left - pad.right));
  const y = (value: number) => pad.top + (1 - value / top) * (height - pad.top - pad.bottom);
  const onMove = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * width;
    setHover(Math.max(0, Math.min(data.length - 1, Math.round(((px - pad.left) / (width - pad.left - pad.right)) * (data.length - 1)))));
  };
  const point = hover !== null ? data[hover] : undefined;
  return (
    <figure data-slot="line-chart" className={cn("relative grid gap-3", className)}>
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {series.map((s, i) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 rounded-full bg-foreground" style={{ opacity: SHADES[i % SHADES.length] }} />
            {s.label}
          </span>
        ))}
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full touch-none overflow-visible text-foreground" role="img" aria-labelledby={`${id}-title`} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <title id={`${id}-title`}>{label}</title>
        {Array.from({ length: steps + 1 }, (_, i) => i / steps).map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(top * t)} y2={y(top * t)} stroke="currentColor" strokeOpacity={t === 0 ? 0.25 : 0.08} vectorEffect="non-scaling-stroke" />
            {t > 0 ? (
              <text x={pad.left - 8} y={y(top * t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[10px]" suppressHydrationWarning>
                {show(top * t)}
              </text>
            ) : null}
          </g>
        ))}
        {[0, data.length - 1].map((i) => (
          <text key={i} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : "end"} className="fill-muted-foreground text-[10px]">
            {String(data[i]?.[index] ?? "")}
          </text>
        ))}
        {series.map((s, si) => {
          const points = data.map((row, i) => `${x(i)},${y(Number(row[s.key] ?? 0))}`).join(" ");
          const opacity = SHADES[si % SHADES.length]!;
          return (
            <g key={s.key}>
              {area ? <polygon points={`${x(0)},${y(0)} ${points} ${x(data.length - 1)},${y(0)}`} fill="currentColor" fillOpacity={opacity * 0.12} /> : null}
              <polyline points={points} fill="none" stroke="currentColor" strokeOpacity={opacity} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}
        {hover !== null ? (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={height - pad.bottom} stroke="currentColor" strokeOpacity={0.3} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
            {series.map((s, si) => (
              <circle key={s.key} cx={x(hover)} cy={y(Number(data[hover]?.[s.key] ?? 0))} r={4} className="fill-background" stroke="currentColor" strokeOpacity={SHADES[si % SHADES.length]} strokeWidth={2} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
        ) : null}
      </svg>
      {point ? (
        <div aria-hidden="true" className="pointer-events-none absolute top-8 rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg" style={{ left: `clamp(0px, calc(${(x(hover!) / width) * 100}% - 4rem), calc(100% - 9rem))` }}>
          <p className="mb-1 font-medium">{String(point[index])}</p>
          {series.map((s) => (
            <p key={s.key} className="flex justify-between gap-4 tabular-nums text-muted-foreground">
              <span>{s.label}</span>
              <span className="text-foreground">{show(Number(point[s.key] ?? 0))}</span>
            </p>
          ))}
        </div>
      ) : null}
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">{index}</th>
            {series.map((s) => (
              <th key={s.key} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={String(row[index])}>
              <th scope="row">{String(row[index])}</th>
              {series.map((s) => (
                <td key={s.key} suppressHydrationWarning>{show(Number(row[s.key] ?? 0))}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
