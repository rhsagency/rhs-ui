"use client";

import { useRef, type ReactNode } from "react";

import { useInView } from "@rhs-ui/motion/use-in-view";
import { cn } from "@/lib/utils";

export interface HighlightTextProps {
  children: ReactNode;
  /** A marker under the text, a full block behind it, or an underline. */
  variant?: "marker" | "block" | "underline";
  /** Milliseconds before the sweep, for a sequence of highlights. */
  delay?: number;
  className?: string;
}

const LOOK: Record<NonNullable<HighlightTextProps["variant"]>, string> = {
  marker: "bg-[linear-gradient(transparent_58%,color-mix(in_oklch,var(--foreground)_16%,transparent)_58%)]",
  block: "bg-[linear-gradient(color-mix(in_oklch,var(--foreground)_12%,transparent),color-mix(in_oklch,var(--foreground)_12%,transparent))] px-1 -mx-1 rounded-sm",
  underline: "bg-[linear-gradient(currentColor,currentColor)] [background-position:0_100%] pb-0.5",
};

/**
 * A phrase that gets marked as it scrolls into view, like a pen sweeping
 * over the words. The sweep is a background-size transition, so it wraps
 * over line breaks and costs nothing; reduced motion shows it marked.
 */
export function HighlightText({ children, variant = "marker", delay = 150, className }: HighlightTextProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);
  return (
    <mark
      ref={ref}
      data-slot="highlight-text"
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "box-decoration-clone bg-transparent bg-no-repeat transition-[background-size] duration-700 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none [color:inherit]",
        LOOK[variant],
        variant === "underline" ? (inView ? "[background-size:100%_2px]" : "[background-size:0%_2px] motion-reduce:[background-size:100%_2px]") : inView ? "[background-size:100%_100%]" : "[background-size:0%_100%] motion-reduce:[background-size:100%_100%]",
        className,
      )}
    >
      {children}
    </mark>
  );
}
