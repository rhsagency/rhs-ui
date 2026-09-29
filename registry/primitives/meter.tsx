import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export interface MeterProps extends Omit<ComponentProps<"div">, "children"> {
  value: number;
  min?: number;
  max?: number;
  /** From here the value is getting high: the bar turns to a warning. */
  high?: number;
  /** From here the value is too high: the bar turns destructive. */
  critical?: number;
  label: string;
  /** The value in words next to the label: "7.2 of 10 GB". */
  valueText?: string;
}

/**
 * A measurement within a known range that is not progress: storage used,
 * seats taken, API quota. It is a meter for screen readers, with the value
 * in words, and it warns in words and colour as it fills.
 */
export function Meter({ value, min = 0, max = 100, high, critical, label, valueText, className, ...props }: MeterProps) {
  const fraction = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const zone = critical !== undefined && value >= critical ? "critical" : high !== undefined && value >= high ? "high" : "ok";
  const text = valueText ?? `${value} of ${max}`;
  return (
    <div data-slot="meter" data-zone={zone} className={cn("grid gap-2", className)} {...props}>
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="font-medium">{label}</span>
        <span className={cn("tabular-nums text-muted-foreground", zone === "critical" && "text-destructive")}>
          {text}
          {zone !== "ok" ? <span className="sr-only">{zone === "critical" ? ", almost full" : ", getting high"}</span> : null}
        </span>
      </div>
      <div role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={min} aria-valuemax={max} aria-valuetext={text} className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-[width,background-color] duration-300",
            zone === "ok" && "bg-foreground",
            zone === "high" && "bg-[var(--color-warning,oklch(0.72_0.16_75))]",
            zone === "critical" && "bg-destructive",
          )}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}
