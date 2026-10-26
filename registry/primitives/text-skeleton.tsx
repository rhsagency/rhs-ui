import type { ComponentProps } from "react";

import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { cn } from "@/lib/utils";

export type TextSkeletonSize = "sm" | "base" | "lg" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export interface TextSkeletonProps extends Omit<ComponentProps<"div">, "children"> {
  /** How many lines of text it stands in for. Default 3. */
  lines?: number;
  /** The text it replaces: body sizes `sm`, `base` and `lg`, or a heading level from `h1` to `h6`. It sets the font size and line height of every bar, so the real text takes the same room. Default `base`. */
  size?: TextSkeletonSize;
  /** The width of the whole block: a number in px or any CSS length. The lines are shares of it. Default `100%`. */
  width?: number | string;
  /** Decides how long each line is. The same seed gives the same lines on the server and in the browser, so there is nothing to hydrate wrongly. Give blocks that sit next to each other different seeds. Default `0`. */
  seed?: string | number;
}

/** The text size classes, written out in full so Tailwind finds them. Each sets a font size and a line height. */
const TEXT: Record<TextSkeletonSize, string> = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  h1: "text-4xl",
  h2: "text-3xl",
  h3: "text-2xl",
  h4: "text-xl",
  h5: "text-lg",
  h6: "text-base",
};

/** A string or a number as an unsigned 32-bit integer (FNV-1a). */
function hash(seed: string | number): number {
  let value = 2166136261;
  for (const char of String(seed)) {
    value ^= char.codePointAt(0) ?? 0;
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

/** A small seeded generator (mulberry32): the same seed always gives the same numbers between 0 and 1. */
function generator(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The width of every line, in percent. Text is ragged, not a column of equal
 * bars: most lines run nearly to the edge, some stop a little short, no two
 * neighbours are alike, and the last line is always the shortest.
 */
function widths(lines: number, seed: string | number): number[] {
  const next = generator(hash(seed));
  const out: number[] = [];
  for (let index = 0; index < lines; index++) {
    const last = index === lines - 1;
    const roll = next();
    let width: number;
    if (last) width = lines === 1 ? 52 + next() * 24 : 34 + next() * 28;
    else if (roll < 0.45) width = 93 + next() * 7;
    else if (roll < 0.8) width = 83 + next() * 10;
    else width = 72 + next() * 11;
    const before = out[index - 1];
    // Two bars of nearly the same length in a row look like a mistake: nudge this one.
    if (before !== undefined && Math.abs(width - before) < 5) width = width > 88 ? width - 9 : width + 7;
    out.push(Math.round(Math.min(100, width)));
  }
  return out;
}

/**
 * Lines of loading text in the shape of real text: uneven lengths, a short
 * last line, and a bar per line that sits in the line height of the text it
 * stands in for, so swapping in the real content moves nothing. Pick the
 * `size` of that text (a body size or a heading level). The lengths come from
 * a seeded pattern, which makes the same block look the same on the server and
 * in the browser. It is hidden from assistive technology like every skeleton;
 * wrap a screen in SkeletonGroup, or in AsyncView, to announce "Loading" once.
 * Use it alone for a caption or a description, or as the leaf of a larger
 * skeleton layout.
 */
export function TextSkeleton({ lines = 3, size = "base", width = "100%", seed = 0, className, style, ...props }: TextSkeletonProps) {
  const count = Math.min(20, Math.max(1, Math.round(lines)));
  return (
    <div data-slot="text-skeleton" aria-hidden="true" className={cn("max-w-full", TEXT[size], className)} style={{ width, ...style }} {...props}>
      {widths(count, seed).map((share, index) => (
        // The line box is exactly one line high; the bar inside is a little shorter than the letters are, so lines do not merge.
        <div key={index} className="flex h-[1lh] items-center">
          <Skeleton delay={index * 120} className="h-[0.7em] max-w-full rounded-[0.2em]" style={{ width: `${share}%` }} />
        </div>
      ))}
    </div>
  );
}
