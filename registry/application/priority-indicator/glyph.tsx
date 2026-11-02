import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** The five levels, from most to least pressing. */
export type Priority = "urgent" | "high" | "medium" | "low" | "none";

/** The levels in order, for a menu or a legend. */
export const PRIORITIES: readonly Priority[] = ["urgent", "high", "medium", "low", "none"];

/** The word for each level. */
export const PRIORITY_WORDS: Record<Priority, string> = { urgent: "Urgent", high: "High", medium: "Medium", low: "Low", none: "No priority" };

/** How many of the three bars are filled. */
const FILLED = { low: 1, medium: 2, high: 3 } as const;

/**
 * An urgent mark: a filled rounded square with an exclamation mark cut out of
 * it, so whatever is behind shows through the cut and the mark works on any
 * background, and in hover and selected states, without a second colour.
 */
const URGENT =
  "M5 1.5h6A3.5 3.5 0 0 1 14.5 5v6a3.5 3.5 0 0 1-3.5 3.5H5A3.5 3.5 0 0 1 1.5 11V5A3.5 3.5 0 0 1 5 1.5ZM7.15 5.45a.85.85 0 0 1 1.7 0v2.9a.85.85 0 0 1-1.7 0ZM8 10.45a.95.95 0 1 1 0 1.9.95.95 0 0 1 0-1.9Z";

export interface PriorityGlyphProps extends Omit<ComponentProps<"svg">, "children"> {
  /** The level to draw. */
  priority: Priority;
  /** Width and height in px. Default 16. It is drawn on a 16 unit grid, so 14, 16 and 20 are the sizes it was checked at. */
  size?: number;
}

/**
 * The mark alone, for a place that writes the word itself: three ascending
 * bars with as many filled as the level, a filled square with an exclamation
 * mark for urgent, three flat dashes for none. Every level has its own shape,
 * so it reads in one colour and for people who do not see colour; the bars
 * that are off are only a lighter ink, never the only difference. It draws in
 * `currentColor` and is hidden from assistive technology: put the word next
 * to it.
 */
export function PriorityGlyph({ priority, size = 16, className, ...props }: PriorityGlyphProps) {
  return (
    <svg data-slot="priority-glyph" data-priority={priority} viewBox="0 0 16 16" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" className={cn("shrink-0", className)} {...props}>
      {priority === "urgent" ? (
        <path fillRule="evenodd" clipRule="evenodd" d={URGENT} />
      ) : priority === "none" ? (
        // Level with the middle of the mark, not on its baseline: dashes on the baseline read as an ellipsis beside the word.
        // Quieter than the other levels, but not fainter than 3:1 against the page: with the label off, this is all there is to see.
        [0, 1, 2].map((index) => <rect key={index} x={2 + index * 4.5} y="7.25" width="3" height="1.5" rx="0.75" opacity="0.7" />)
      ) : (
        // The bars stand on the baseline of the word beside them, as signal bars do.
        [0, 1, 2].map((index) => <rect key={index} x={2 + index * 4.5} y={9 - index * 3} width="3" height={5 + index * 3} rx="0.8" opacity={index < FILLED[priority] ? 1 : 0.28} />)
      )}
    </svg>
  );
}
