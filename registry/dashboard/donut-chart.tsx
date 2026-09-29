"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export interface DonutSlice {
  label: string;
  value: number;
}

export interface DonutChartProps {
  data: readonly DonutSlice[];
  label: string;
  /** How values read on the axis, in the readout and in the table: Intl number options, e.g. { style: "currency", currency: "EUR" }. Options, not a function, so a Server Component can pass them. */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /** The line in the middle; the total by default. */
  centerLabel?: string;
  size?: number;
  className?: string;
}

const SHADES = [1, 0.7, 0.48, 0.32, 0.2, 0.12];

/**
 * Parts of a whole, for five slices or fewer: share of revenue, traffic
 * sources, plan mix. The legend doubles as the readout and is a list with
 * the numbers, so nothing depends on seeing the shades. Hovering a slice or
 * its legend row lifts it.
 */
export function DonutChart({ data, label, format, locale = "en-GB", centerLabel, size = 180, className }: DonutChartProps) {
  const formatter = new Intl.NumberFormat(locale, format);
  const show = (value: number) => formatter.format(value);
  const [active, setActive] = useState<number | null>(null);
  const total = data.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const radius = 42, stroke = 14, circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <figure data-slot="donut-chart" className={cn("flex flex-wrap items-center gap-6", className)}>
      <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={label} className="shrink-0 -rotate-90 text-foreground">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeOpacity={0.06} strokeWidth={stroke} />
        {data.map((slice, i) => {
          const length = (slice.value / total) * circumference;
          const dash = `${Math.max(0, length - 1.2)} ${circumference}`;
          const element = (
            <circle
              key={slice.label}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeOpacity={SHADES[i % SHADES.length]}
              strokeWidth={active === i ? stroke + 4 : stroke}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              className="transition-[stroke-width] duration-150"
            />
          );
          offset += length;
          return element;
        })}
        <g className="rotate-90" style={{ transformOrigin: "50px 50px" }}>
          <text x="50" y="47" textAnchor="middle" className="fill-foreground text-[11px] font-semibold" suppressHydrationWarning>
            {active !== null ? show(data[active]!.value) : centerLabel ?? show(total)}
          </text>
          <text x="50" y="60" textAnchor="middle" className="fill-muted-foreground text-[6px]">
            {active !== null ? data[active]!.label : "Total"}
          </text>
        </g>
      </svg>
      <ul className="grid min-w-40 gap-1.5 text-sm">
        {data.map((slice, i) => (
          <li key={slice.label} onPointerEnter={() => setActive(i)} onPointerLeave={() => setActive(null)} className={cn("flex items-center gap-2 rounded px-1.5 py-0.5", active === i && "bg-muted")}>
            <span className="size-2.5 shrink-0 rounded-sm bg-foreground" style={{ opacity: SHADES[i % SHADES.length] }} />
            <span className="flex-1">{slice.label}</span>
            <span className="tabular-nums text-muted-foreground">{Math.round((slice.value / total) * 100)}%</span>
            <span className="w-16 text-right tabular-nums" suppressHydrationWarning>{show(slice.value)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
