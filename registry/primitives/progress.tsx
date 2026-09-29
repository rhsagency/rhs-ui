"use client";

import type { ComponentProps, CSSProperties } from "react";
import { Progress as ProgressPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * How far along something is. With a `value` the bar fills to it; without
 * one it is indeterminate and a segment travels, or holds still under
 * reduced motion. Name it with aria-label or aria-labelledby, and pass
 * getValueLabel when "40%" is not the useful answer ("2 of 5 files").
 */
export function Progress({ className, value, max = 100, ...props }: ComponentProps<typeof ProgressPrimitive.Root>) {
  const known = typeof value === "number";
  const percent = known ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      max={max}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        style={{ "--progress": `${percent}%` } as CSSProperties}
        className={cn(
          "h-full rounded-full bg-primary",
          known
            ? "w-full -translate-x-[calc(100%-var(--progress))] transition-[translate] duration-300 ease-out motion-reduce:transition-none"
            : "w-2/5 animate-rhs-indeterminate motion-reduce:w-full motion-reduce:animate-none motion-reduce:opacity-40",
        )}
      />
    </ProgressPrimitive.Root>
  );
}
