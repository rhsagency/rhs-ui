"use client";

import { useRef, type CSSProperties } from "react";

import { useInView } from "@rhs-ui/motion/use-in-view";
import { cn } from "@/lib/utils";

export interface SplitTextProps {
  text: string;
  /** Animate per word (calm) or per letter (lively, for short headings). */
  by?: "word" | "letter";
  /** Rise from below, sharpen from a blur, or fade in place. */
  effect?: "rise" | "blur" | "fade";
  /** Milliseconds between pieces. */
  stagger?: number;
  /** The element to render: h1 for a page title, h2 to h4, p or span. */
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  className?: string;
}

const START: Record<NonNullable<SplitTextProps["effect"]>, string> = {
  rise: "translate-y-[0.6em] opacity-0",
  blur: "opacity-0 blur-[10px]",
  fade: "opacity-0",
};

/**
 * A heading that arrives a word (or letter) at a time as it scrolls into
 * view. Screen readers get the sentence once; the pieces are hidden from
 * screen readers, and under reduced motion everything simply stands.
 */
export function SplitText({ text, by = "word", effect = "rise", stagger, as: Tag = "span", className }: SplitTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref);
  const pieces = by === "word" ? text.split(/(\s+)/) : Array.from(text);
  const step = stagger ?? (by === "word" ? 70 : 24);
  let order = 0;
  return (
    <Tag ref={ref as React.RefObject<never>} data-slot="split-text" className={cn(Tag === "span" ? "inline-block" : "block", className)}>
      <span className="sr-only">{text}</span>
      {pieces.map((piece, index) => {
        if (/^\s+$/.test(piece)) return <span key={index} aria-hidden="true">{piece}</span>;
        const delay = order++ * step;
        return (
          <span
            key={index}
            aria-hidden="true"
            style={{ transitionDelay: `${delay}ms` } as CSSProperties}
            className={cn(
              "inline-block whitespace-pre transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:blur-none motion-reduce:transition-none",
              inView ? "translate-y-0 opacity-100 blur-none" : START[effect],
            )}
          >
            {piece}
          </span>
        );
      })}
    </Tag>
  );
}
