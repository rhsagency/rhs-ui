import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export interface SpinnerProps extends ComponentProps<"span"> {
  /** Size in pixels. */
  size?: number;
  /** What is loading, for screen readers. Leave it out when a visible label beside the spinner already says it. */
  label?: string;
}

/**
 * Work in progress that has no measurable end. Twelve ticks fading in turn,
 * in the current colour; under reduced motion it pulses slowly instead of
 * turning. Prefer a skeleton when you know the shape of what is coming.
 */
export function Spinner({ size = 18, label = "Loading", className, ...props }: SpinnerProps) {
  return (
    <span data-slot="spinner" role="status" className={cn("inline-flex shrink-0", className)} {...props}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="motion-safe:animate-rhs-spin motion-reduce:animate-pulse">
        {Array.from({ length: 12 }, (_, index) => (
          <line
            key={index}
            x1="12"
            y1="2.5"
            x2="12"
            y2="6.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity={0.15 + (index / 11) * 0.85}
            transform={`rotate(${index * 30} 12 12)`}
          />
        ))}
      </svg>
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
