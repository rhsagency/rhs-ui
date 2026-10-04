"use client";

import { useEffect, useState } from "react";

import { usePrefersReducedMotion } from "@rhs-ui/motion/use-in-view";
import { cn } from "@/lib/utils";

export interface WordRotateProps {
  /** The words that take turns, shortest to longest reads best. */
  words: readonly string[];
  /** Milliseconds each word stays. */
  interval?: number;
  className?: string;
}

/**
 * One slot in a sentence that changes word on a timer: "Built for
 * designers / founders / studios". The slot keeps the width of the longest
 * word so the line never reflows. Screen readers hear all words once; under
 * reduced motion the first word stays.
 */
export function WordRotate({ words, interval = 2200, className }: WordRotateProps) {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (reduced || words.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % words.length), interval);
    return () => window.clearInterval(timer);
  }, [reduced, words.length, interval]);
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), "");
  return (
    <span data-slot="word-rotate" className={cn("relative inline-grid overflow-hidden align-bottom", className)}>
      <span className="sr-only">{words.join(", ")}</span>
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">{longest}</span>
      {words.map((word, i) => (
        <span
          key={word}
          aria-hidden="true"
          className={cn(
            "col-start-1 row-start-1 transition-[transform,opacity] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none",
            i === index ? "translate-y-0 opacity-100" : i === (index - 1 + words.length) % words.length ? "-translate-y-full opacity-0" : "translate-y-full opacity-0",
          )}
        >
          {word}
        </span>
      ))}
    </span>
  );
}
