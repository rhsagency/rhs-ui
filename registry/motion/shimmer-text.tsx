"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ShimmerTextProps {
  children: ReactNode;
  /** Seconds for one sweep. */
  duration?: number;
  /** Run while true; stop to settle on plain text (when loading ends). */
  active?: boolean;
  className?: string;
}

/**
 * A soft light sweeping across text, for "Thinking", "Generating" or a
 * loading label. Neutral: the foreground sweeping over the muted text
 * colour (theme tokens, because currentColor turns transparent with the
 * clipped text). Uses Web Animations, so there is no
 * keyframe to install, and it never runs under reduced motion.
 */
export function ShimmerText({ children, duration = 1.8, active = true, className }: ShimmerTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || !active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = node.animate([{ backgroundPosition: "100% 0" }, { backgroundPosition: "-100% 0" }], { duration: duration * 1000, iterations: Infinity, easing: "linear" });
    return () => animation.cancel();
  }, [active, duration]);
  return (
    <span
      ref={ref}
      data-slot="shimmer-text"
      data-active={active || undefined}
      className={cn(
        "data-[active]:bg-[linear-gradient(90deg,var(--muted-foreground)_35%,var(--foreground)_50%,var(--muted-foreground)_65%)] data-[active]:bg-[length:200%_100%] data-[active]:bg-clip-text data-[active]:text-transparent data-[active]:[-webkit-text-fill-color:transparent]",
        className,
      )}
    >
      {children}
    </span>
  );
}
