import type { CSSProperties, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface TextRevealProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** The sentence to reveal. Plain text: it is split into words. */
  text: string;
  as?: "p" | "h2" | "h3" | "blockquote";
  /**
   * How dim a word is before its turn, 0 to 1. A word that waits is still read, so it keeps the contrast of large
   * text (3:1, WCAG 1.4.3): the default 0.5 gives 3.6:1 on a light page and 5.2:1 on a dark one. 0.35 holds on a
   * dark page only (3.1:1, 2.3:1 on white); the old default of 0.18 was 1.5:1 on white.
   */
  dim?: number;
}

/**
 * A statement that lights up word by word as it scrolls through the screen,
 * for the one sentence a page is built around. Screen readers get the
 * sentence whole; the words are presentation. Pure CSS on a view timeline;
 * reduced motion and browsers without one show every word at full strength.
 */
export function TextReveal({ text, as: Tag = "p", dim = 0.5, className, style, ...props }: TextRevealProps) {
  const words = text.trim().split(/\s+/);
  const vars = { "--text-reveal-dim": dim } as CSSProperties;
  return (
    <Tag data-slot="text-reveal" className={cn("[view-timeline-name:--rhs-text-reveal]", className)} style={{ ...vars, ...style }} {...props}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, index) => {
          const start = 8 + (index / words.length) * 42;
          const wordVars = { "--word-start": `${start.toFixed(2)}%`, "--word-end": `${(start + 9).toFixed(2)}%` } as CSSProperties;
          return (
            <span key={`${word}-${index}`}>
              <span
                style={wordVars}
                className="inline-block motion-safe:supports-[animation-timeline:view()]:[animation-name:var(--animate-rhs-text-word)] motion-safe:supports-[animation-timeline:view()]:[animation-timeline:--rhs-text-reveal] motion-safe:supports-[animation-timeline:view()]:[animation-range:cover_var(--word-start)_cover_var(--word-end)] motion-safe:supports-[animation-timeline:view()]:[animation-fill-mode:both] motion-safe:supports-[animation-timeline:view()]:[animation-timing-function:linear]"
              >
                {word}
              </span>
              {index < words.length - 1 ? " " : null}
            </span>
          );
        })}
      </span>
    </Tag>
  );
}
