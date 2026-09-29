"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/utils";

export interface BarChartSeries {
  key: string;
  label: string;
}

export interface BarChartProps {
  data: readonly Record<string, string | number>[];
  /** The key of the category in each row. */
  index: string;
  series: readonly BarChartSeries[];
  /** Stack the series in one bar instead of placing them side by side. */
  stacked?: boolean;
  /** How values read on the axis, in the readout and in the table: Intl number options, e.g. { style: "currency", currency: "EUR" }. Options, not a function, so a Server Component can pass them. */
  format?: Intl.NumberFormatOptions;
  locale?: string;
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
 * Amounts per category, side by side or stacked, in the text colour with a
 * shade per series. Hover or focus a column to read its values; every
 * column is focusable, so keyboard users get the same readout, and screen
 * readers get a table.
 */
export function BarChart({ data, index, series, stacked = false, format, locale = "en-GB", label, height = 220, className }: BarChartProps) {
  const formatter = new Intl.NumberFormat(locale, format);
  const show = (value: number) => formatter.format(value);
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const width = 640;
  const pad = { top: 12, right: 8, bottom: 24, left: 44 };
  const totals = data.map((row) => (stacked ? series.reduce((sum, s) => sum + Number(row[s.key] ?? 0), 0) : Math.max(...series.map((s) => Number(row[s.key] ?? 0)))));
  const { top, steps } = niceScale(Math.max(...totals));
  const band = (width - pad.left - pad.right) / Math.max(1, data.length);
  const barWidth = stacked ? band * 0.56 : (band * 0.7) / series.length;
  const y = (value: number) => pad.top + (1 - value / top) * (height - pad.top - pad.bottom);
  const row = active !== null ? data[active] : undefined;
  return (
    <figure data-slot="bar-chart" className={cn("relative grid gap-3", className)}>
      {series.length > 1 ? (
        <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {series.map((s, i) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-foreground" style={{ opacity: SHADES[i % SHADES.length] }} />
              {s.label}
            </span>
          ))}
        </figcaption>
      ) : null}
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible text-foreground" role="group" aria-labelledby={`${id}-title`} onPointerLeave={() => setActive(null)}>
        <title id={`${id}-title`}>{label}</title>
        {Array.from({ length: steps }, (_, i) => (i + 1) / steps).map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(top * t)} y2={y(top * t)} stroke="currentColor" strokeOpacity={0.08} />
            <text x={pad.left - 8} y={y(top * t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[10px]" suppressHydrationWarning>
              {show(top * t)}
            </text>
          </g>
        ))}
        <line x1={pad.left} x2={width - pad.right} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity={0.25} />
        {data.map((entry, i) => {
          const left = pad.left + i * band;
          let base = 0;
          return (
            <g
              key={String(entry[index])}
              tabIndex={0}
              suppressHydrationWarning
              role="img"
              aria-label={`${entry[index]}: ${series.map((s) => `${s.label} ${show(Number(entry[s.key] ?? 0))}`).join(", ")}`}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="outline-none focus-visible:[&>rect.band]:fill-foreground/10"
            >
              <rect className="band" x={left} y={pad.top} width={band} height={height - pad.top - pad.bottom} fill={active === i ? "currentColor" : "transparent"} fillOpacity={0.05} />
              {series.map((s, si) => {
                const value = Number(entry[s.key] ?? 0);
                const barX = stacked ? left + (band - barWidth) / 2 : left + band * 0.15 + si * barWidth;
                const barTop = stacked ? y(base + value) : y(value);
                const barHeight = (stacked ? y(base) : y(0)) - barTop;
                if (stacked) base += value;
                return <rect key={s.key} x={barX} y={barTop} width={Math.max(1, barWidth - 2)} height={Math.max(0, barHeight)} rx={3} fill="currentColor" fillOpacity={SHADES[si % SHADES.length]} />;
              })}
              <text x={left + band / 2} y={height - 6} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                {String(entry[index])}
              </text>
            </g>
          );
        })}
      </svg>
      {row ? (
        <div aria-hidden="true" className="pointer-events-none absolute top-6 rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg" style={{ left: `clamp(0px, calc(${((pad.left + (active! + 0.5) * band) / width) * 100}% - 4rem), calc(100% - 9rem))` }}>
          <p className="mb-1 font-medium">{String(row[index])}</p>
          {series.map((s) => (
            <p key={s.key} className="flex justify-between gap-4 tabular-nums text-muted-foreground">
              <span>{s.label}</span>
              <span className="text-foreground">{show(Number(row[s.key] ?? 0))}</span>
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
          {data.map((entry) => (
            <tr key={String(entry[index])}>
              <th scope="row">{String(entry[index])}</th>
              {series.map((s) => (
                <td key={s.key} suppressHydrationWarning>{show(Number(entry[s.key] ?? 0))}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
