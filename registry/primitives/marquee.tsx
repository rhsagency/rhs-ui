import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface MarqueeProps {
  children: ReactNode;
  /** Seconds for one full pass; lower is faster. */
  duration?: number;
  /** Run right to left (the default) or left to right. */
  direction?: "left" | "right";
  /** Names the row for screen readers: "Customers". */
  label: string;
  className?: string;
}

/**
 * A row that drifts endlessly, for logos and short proof points. It pauses
 * while the pointer or focus is on it, the copy that closes the loop is
 * hidden from assistive technology, and under reduced motion it stands
 * still as a row you can scroll sideways.
 */
export function Marquee({ children, duration = 40, direction = "left", label, className }: MarqueeProps) {
  const style = { "--marquee-duration": `${duration}s`, "--marquee-direction": direction === "left" ? "normal" : "reverse" } as CSSProperties;
  // Duration and direction ride inside the animate-rhs-marquee shorthand as variables: a separate
  // longhand class could land before the shorthand and be reset by it.
  const row = "flex shrink-0 items-center gap-12 pr-12 motion-safe:animate-rhs-marquee group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]";
  return (
    <div
      data-slot="marquee"
      role="region"
      aria-label={label}
      style={style}
      className={cn(
        "group relative flex overflow-hidden motion-reduce:overflow-x-auto motion-safe:[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        className,
      )}
    >
      <div className={row}>{children}</div>
      <div className={cn(row, "motion-reduce:hidden")} aria-hidden="true">
        {children}
      </div>
    </div>
  );
}
