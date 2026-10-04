"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useInView, usePrefersReducedMotion } from "@rhs-ui/motion/use-in-view";
import { cn } from "@/lib/utils";

export interface ScrambleTextProps {
  text: string;
  /** When to decode: once in view, or every time it is hovered or focused. */
  trigger?: "appear" | "hover";
  /** Milliseconds for the whole decode. */
  duration?: number;
  /** Characters used while scrambling. */
  charset?: string;
  className?: string;
}

const DEFAULT_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/";

/**
 * Text that decodes from random characters, left to right, like a terminal.
 * Monospaced figures keep it from wobbling. Screen readers read the real
 * text; reduced motion shows it straight away.
 */
export function ScrambleText({ text, trigger = "appear", duration = 900, charset = DEFAULT_CHARSET, className }: ScrambleTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(text);
  const frame = useRef(0);
  const run = useCallback(() => {
    if (reduced) return;
    cancelAnimationFrame(frame.current);
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const fixed = Math.floor(progress * text.length);
      setShown(
        text
          .split("")
          .map((char, i) => (i < fixed || char === " " ? char : charset[Math.floor(Math.random() * charset.length)] ?? char))
          .join(""),
      );
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  }, [reduced, duration, text, charset]);
  useEffect(() => {
    if (trigger === "appear" && inView) run();
    return () => cancelAnimationFrame(frame.current);
  }, [trigger, inView, run]);
  return (
    <span
      ref={ref}
      data-slot="scramble-text"
      onPointerEnter={trigger === "hover" ? run : undefined}
      onFocus={trigger === "hover" ? run : undefined}
      className={cn("font-mono tabular-nums", className)}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}
