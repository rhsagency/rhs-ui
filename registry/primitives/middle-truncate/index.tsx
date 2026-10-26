import type { ComponentProps } from "react";

import { TruncateTip } from "@rhs-ui/primitives/middle-truncate/tip";
import { cn } from "@/lib/utils";

export interface MiddleTruncateProps extends Omit<ComponentProps<"span">, "children" | "title"> {
  /** The whole text: a file name, a hash, a URL, a path. */
  text: string;
  /** How many characters at the end stay visible. Left out, a file keeps its extension and about five characters before it, moved to the start of the nearest word ("2026.pdf", "harbour.jpg"), and anything else keeps eight. */
  tail?: number;
  /** What the tooltip says. `true` (the default) shows the whole text, a string shows that instead ("quarterly-report-final-2026.pdf, 4.2 MB"), `false` turns the tooltip off. It opens on hover and on a tap, and only when something is actually cut off. */
  title?: boolean | string;
  /** Make the text a tab stop, so the tooltip opens on keyboard focus too. Off by default: a table of file names would otherwise add a tab stop to every row. Needs the tooltip. */
  focusable?: boolean;
}

/** A file extension with its dot, or two: ".pdf", ".tar.gz". */
const EXTENSION = /(?:\.[A-Za-z0-9]{1,5}){1,2}$/;

/** What parts one word of a name from the next. */
const SEPARATOR = /[-_./\s]/;

/** How far, in characters, the default ending may move to start at a word. */
const REACH = 5;

/**
 * How many characters stay at the end when `tail` is left out: the extension of
 * a file and five characters before it, eight for anything else. Five characters
 * rarely end where a word does ("rbour.jpg"), so the ending moves to the start
 * of the nearest word within reach ("harbour.jpg"); a longer one wins a tie.
 * Without a separator in reach it stays as it was.
 */
function defaultTail(chars: readonly string[], text: string): number {
  const extension = EXTENSION.exec(text)?.[0].length ?? 0;
  const base = extension ? extension + 5 : 8;
  const point = chars.length - base;
  // A word starts after a separator, and the ending keeps at least one character of the name in front of the extension.
  let best = -1;
  for (let at = Math.max(1, point - REACH); at <= Math.min(point + REACH, chars.length - extension - 1); at += 1) {
    const starts = SEPARATOR.test(chars[at - 1] ?? "") && !SEPARATOR.test(chars[at] ?? "");
    if (starts && (best === -1 || Math.abs(at - point) < Math.abs(best - point))) best = at;
  }
  return best === -1 ? base : chars.length - best;
}

/**
 * Text that gives up its middle when the box is too small, so the two parts
 * that identify it stay: "quarterly-report-fin…2026.pdf". It is two spans, a
 * start that truncates with an ellipsis and an end that never shrinks, so there
 * is no measuring and no layout JavaScript: it fits a table cell, a card or a
 * flex row as it is. Screen readers read the whole text from a visually hidden
 * span, and copying the selection gives the whole text too, because only the
 * painting is cut. The tooltip repeats the whole text, on hover and on a tap,
 * and stays quiet when everything fits. Only the tooltip is a client module, so
 * the text stays a Server Component.
 */
export function MiddleTruncate({ text, tail, title = true, focusable = false, className, ...props }: MiddleTruncateProps) {
  // Code points, so an emoji or an accented letter is never cut in half.
  const chars = Array.from(text);
  const keep = Math.max(1, Math.floor(tail ?? defaultTail(chars, text)));
  const cut = Math.max(0, chars.length - keep);
  // Under three characters in front there is nothing worth keeping: cut the end like any other text.
  const split = cut >= 3;

  const root = (
    <span data-slot="middle-truncate" className={cn("inline-flex max-w-full min-w-0", className)} {...props}>
      <span data-part="start" aria-hidden="true" className="min-w-0 overflow-hidden text-ellipsis whitespace-pre">
        {split ? chars.slice(0, cut).join("") : text}
      </span>
      {split ? (
        // It never shrinks for the start; only when the box is narrower than the ending itself does it give way, and then it ends in an ellipsis like any text.
        <span data-part="end" aria-hidden="true" className="max-w-full shrink-0 overflow-hidden text-ellipsis whitespace-pre">
          {chars.slice(cut).join("")}
        </span>
      ) : null}
      <span className="sr-only select-none">{text}</span>
    </span>
  );

  const tip = title === false ? null : title === true ? text : title;
  return tip ? (
    <TruncateTip content={tip} focusable={focusable}>
      {root}
    </TruncateTip>
  ) : (
    root
  );
}
