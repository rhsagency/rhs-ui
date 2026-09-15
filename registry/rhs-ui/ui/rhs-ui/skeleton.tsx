import type { ComponentProps, CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * A loading placeholder in the shape of the content it stands in for. A
 * shimmer sweeps across it instead of the whole block pulsing: pulsing every
 * block in time reads as a fault. Give siblings a `delay` (in ms) so the sweep
 * runs across the layout as one wave. Reduced motion shows a still block.
 */
export interface SkeletonProps extends ComponentProps<"div"> {
  /** Offset of the shimmer for this block, in ms. */
  delay?: number;
}

export function Skeleton({ className, delay = 0, style, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[rhs-shimmer_1.6s_ease-in-out_infinite] after:bg-gradient-to-r after:from-transparent after:via-foreground/6 after:to-transparent motion-reduce:after:hidden",
        className,
      )}
      style={{ ...style, "--shimmer-delay": `${delay}ms` } as CSSProperties}
      {...props}
    />
  );
}
