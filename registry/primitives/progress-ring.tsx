import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ProgressRingProps extends Omit<ComponentProps<"div">, "children"> {
  /** 0 to max. Leave it out for work without a measurable end. */
  value?: number;
  max?: number;
  size?: number;
  thickness?: number;
  /** What the ring measures, for screen readers: "Storage used". */
  label: string;
  /** Shown in the middle; the percentage by default. */
  children?: ReactNode;
}

/**
 * Progress as a ring, for compact places: a card corner, an upload, a goal.
 * It is a progressbar with its value, so screen readers hear the number, and
 * the fill animates only when motion is welcome.
 */
export function ProgressRing({ value, max = 100, size = 64, thickness = 6, label, children, className, ...props }: ProgressRingProps) {
  const known = typeof value === "number" && Number.isFinite(value);
  const fraction = known ? Math.min(1, Math.max(0, value / max)) : 0.28;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div
      data-slot="progress-ring"
      role="progressbar"
      aria-label={label}
      aria-valuenow={known ? value : undefined}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className={cn("-rotate-90", !known && "motion-safe:animate-rhs-spin-smooth")}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={thickness} className="text-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          className="text-foreground motion-safe:transition-[stroke-dashoffset] motion-safe:duration-500 motion-safe:ease-out"
        />
      </svg>
      {known ? <span className="absolute text-xs font-semibold tabular-nums">{children ?? `${Math.round(fraction * 100)}%`}</span> : null}
    </div>
  );
}
