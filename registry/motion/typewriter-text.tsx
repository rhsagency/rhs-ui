"use client";

import { useEffect, useRef, useState } from "react";

import { useInView, usePrefersReducedMotion } from "@rhs-ui/motion/use-in-view";
import { cn } from "@/lib/utils";

export interface TypewriterTextProps {
  text: string;
  /** Milliseconds per character. */
  speed?: number;
  /** Delay before typing starts, once the text is in view. */
  delay?: number;
  /** Show a blinking caret while typing and after. */
  caret?: boolean;
  className?: string;
}

/**
 * Text that types itself once it scrolls into view. Screen readers get the
 * whole sentence at once; the typing is decoration on a hidden copy. Under
 * reduced motion the full text simply stands there.
 */
export function TypewriterText({ text, speed = 38, delay = 200, caret = true, className }: TypewriterTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);
  const reduced = usePrefersReducedMotion();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView || reduced) return;
    let index = 0;
    let timer = window.setTimeout(function tick() {
      index += 1;
      setCount(index);
      if (index < text.length) timer = window.setTimeout(tick, speed);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [inView, reduced, text, speed, delay]);
  const shown = reduced ? text.length : count;
  return (
    <span ref={ref} data-slot="typewriter-text" className={cn("relative inline-block", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {/* An invisible full copy reserves the final size, so nothing below jumps while typing. */}
        <span className="invisible">{text}</span>
        <span className="absolute inset-0">
          {text.slice(0, shown)}
          {caret ? <span className="ml-px inline-block h-[1em] w-[2px] translate-y-[.12em] bg-current motion-safe:animate-pulse" /> : null}
        </span>
      </span>
    </span>
  );
}
