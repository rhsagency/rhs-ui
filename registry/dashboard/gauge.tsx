import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export interface GaugeProps extends Omit<ComponentProps<"div">, "children"> {
  value: number;
  min?: number;
  max?: number;
  /** What it measures: "Uptime", "NPS", "Load". */
  label: string;
  /** The value as shown in the middle: "99.98%". */
  valueText?: string;
  /** Thresholds that turn the arc to a warning and then destructive. */
  high?: number;
  critical?: number;
  size?: number;
}

/**
 * A dial for one number against its range: score, load, health. The arc
 * fills from the left and changes tone past the thresholds, and it is a
 * meter with its value in words for screen readers.
 */
export function Gauge({ value, min = 0, max = 100, label, valueText, high, critical, size = 180, className, ...props }: GaugeProps) {
  const fraction = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const radius = 40, length = Math.PI * radius;
  const zone = critical !== undefined && value >= critical ? "critical" : high !== undefined && value >= high ? "high" : "ok";
  const text = valueText ?? String(value);
  const needle = Math.PI * (1 - fraction);
  return (
    <div data-slot="gauge" role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={min} aria-valuemax={max} aria-valuetext={text} className={cn("inline-grid justify-items-center", className)} style={{ width: size }} {...props}>
      <svg viewBox="0 0 100 58" className="w-full overflow-visible" aria-hidden="true">
        <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={9} strokeLinecap="round" />
        <path
          d="M10 50 A40 40 0 0 1 90 50"
          fill="none"
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={`${length * fraction} ${length}`}
          className={cn(zone === "ok" && "stroke-foreground", zone === "high" && "stroke-[var(--color-warning,oklch(0.72_0.16_75))]", zone === "critical" && "stroke-destructive", "motion-safe:transition-[stroke-dasharray] motion-safe:duration-700")}
        />
        <circle cx={50 + Math.cos(needle) * radius} cy={50 - Math.sin(needle) * radius} r={3.2} className="fill-background" stroke="currentColor" strokeWidth={1.5} />
      </svg>
      <span className="-mt-7 text-2xl font-semibold tracking-tight tabular-nums">{text}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
