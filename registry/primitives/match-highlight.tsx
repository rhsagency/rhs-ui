import { Fragment, type ComponentProps, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface MatchHighlightProps extends Omit<ComponentProps<"span">, "children"> {
  /** The text to show, whole. Only the parts that match `query` are marked. */
  text: string;
  /** What was searched for: one string, or an array of terms that are each marked wherever they occur. It is matched as plain text, so a bracket, a dot or an asterisk is just a character. Blank terms are ignored. */
  query: string | readonly string[];
  /** Match capital letters exactly. Off by default: "cafe" marks "Cafe" too. */
  caseSensitive?: boolean;
  /** Tell accented letters apart. Off by default: "cafe" marks "café" and "creme" marks "crème". */
  accentSensitive?: boolean;
  /** Classes for the `<mark>` elements, to change how a match looks. */
  markClassName?: string;
}

/** What a character counts as when text is compared: without its accents and, unless asked otherwise, in lower case. */
function fold(char: string, caseSensitive: boolean, accentSensitive: boolean): string {
  let folded = char;
  if (!accentSensitive) folded = folded.normalize("NFD").replace(/\p{M}+/gu, "");
  return caseSensitive ? folded : folded.toLowerCase();
}

/** The ranges of `text` (as string offsets) that match any of the terms, sorted and merged. */
function matchRanges(text: string, terms: readonly string[], caseSensitive: boolean, accentSensitive: boolean): [number, number][] {
  const needles = terms.map((term) => [...term.trim()].map((char) => fold(char, caseSensitive, accentSensitive)).join("")).filter(Boolean);
  if (!needles.length) return [];

  // Fold the text one character at a time, remembering where every character starts, so a hit in the folded text maps back to the original.
  const chars = [...text];
  const origin: number[] = [];
  const folds: string[] = [];
  const owner: number[] = [];
  let folded = "";
  let offset = 0;
  chars.forEach((char, index) => {
    origin.push(offset);
    offset += char.length;
    const f = fold(char, caseSensitive, accentSensitive);
    folds.push(f);
    for (let unit = 0; unit < f.length; unit += 1) owner.push(index);
    folded += f;
  });
  origin.push(offset);

  const found: [number, number][] = [];
  for (const needle of needles) {
    for (let at = folded.indexOf(needle); at !== -1; at = folded.indexOf(needle, at + needle.length)) {
      const first = owner[at];
      let last = owner[at + needle.length - 1];
      if (first === undefined || last === undefined) continue;
      // A combining mark folds to nothing; it belongs to the letter before it, so it stays inside the mark.
      while (last + 1 < chars.length && folds[last + 1] === "") last += 1;
      found.push([origin[first] ?? 0, origin[last + 1] ?? text.length]);
    }
  }
  found.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: [number, number][] = [];
  for (const range of found) {
    const previous = merged[merged.length - 1];
    if (previous && range[0] <= previous[1]) previous[1] = Math.max(previous[1], range[1]);
    else merged.push([range[0], range[1]]);
  }
  return merged;
}

/**
 * The part of a string that matches a search, marked with a real `<mark>`
 * element. It ignores case and accents by default, so "cafe" also marks
 * "Café", and it takes several terms, each marked wherever it occurs.
 * Matching is plain text, never a regular expression, so typing a bracket
 * into a search box cannot throw. The mark is a tint of the foreground colour
 * that keeps the text readable in both themes, and it keeps a stable weight, so
 * nothing shifts while someone types. Use it in search results, table cells and
 * command lists. Pure and server-friendly: no state, no effects.
 */
export function MatchHighlight({ text, query, caseSensitive = false, accentSensitive = false, markClassName, className, ...props }: MatchHighlightProps) {
  // A search box can hand over undefined before anything is typed.
  const terms = typeof query === "string" ? [query] : (query ?? []);
  const ranges = matchRanges(text, terms, caseSensitive, accentSensitive);
  const parts: ReactNode[] = [];
  let at = 0;
  for (const [from, to] of ranges) {
    if (from > at) parts.push(<Fragment key={`t${at}`}>{text.slice(at, from)}</Fragment>);
    parts.push(
      <mark
        key={`m${from}`}
        data-slot="match-highlight-mark"
        className={cn("rounded-[0.2em] bg-foreground/[0.18] px-[0.12em] py-px -mx-[0.12em] text-inherit [box-decoration-break:clone]", markClassName)}
      >
        {text.slice(from, to)}
      </mark>,
    );
    at = to;
  }
  if (at < text.length) parts.push(<Fragment key={`t${at}`}>{text.slice(at)}</Fragment>);
  return (
    <span data-slot="match-highlight" data-matches={ranges.length} className={className} {...props}>
      {parts.length ? parts : text}
    </span>
  );
}
