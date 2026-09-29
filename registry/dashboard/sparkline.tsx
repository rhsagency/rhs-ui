import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export interface SparklineProps extends Omit<ComponentProps<"svg">, "children" | "values"> {
  values: readonly number[];
  /** Says what the line shows, for screen readers: "Revenue, last 12 weeks, up 18%". */
  label: string;
  /** A light area under the line. */
  area?: boolean;
  /** A dot on the last value. */
  showLast?: boolean;
}

/**
 * A trend in a word's space: beside a number, in a table cell, in a card
 * corner. No axes; the label says what the reader should take from it.
 */
export function Sparkline({ values, label, area = true, showLast = true, className, ...props }: SparklineProps) {
  const width = 100, height = 32;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, i) => [values.length < 2 ? 0 : (i / (values.length - 1)) * width, 3 + (1 - (value - min) / span) * (height - 6)] as const);
  const line = points.map(([x, y]) => `${x},${y}`).join(" ");
  const last = points[points.length - 1];
  return (
    <svg data-slot="sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className={cn("h-8 w-24 overflow-visible text-foreground", className)} {...props}>
      {area && points.length ? <polygon points={`0,${height} ${line} ${width},${height}`} fill="currentColor" fillOpacity={0.1} /> : null}
      <polyline points={line} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {showLast && last ? <circle cx={last[0]} cy={last[1]} r={2.5} fill="currentColor" vectorEffect="non-scaling-stroke" /> : null}
    </svg>
  );
}
