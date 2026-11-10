"use client";

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";

import { DEFAULT_LABELS, activeIndex, clock, deriveChapters, fill, isoDuration, lengthWords, progressIn, type Chapter, type ChapterListLabels } from "@rhs-ui/application/chapter-list/chapters";
import { ScrollBar } from "@rhs-ui/primitives/scroll-area";
import { cn } from "@/lib/utils";

export type { Chapter, ChapterListLabels } from "@rhs-ui/application/chapter-list/chapters";

export interface ChapterListProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** The chapters: where each begins, in seconds, and its title. They are shown in the order they start in, whatever order you pass them in. */
  chapters: readonly Chapter[];
  /** Where the player is now, in seconds. The chapter it falls in is marked. */
  currentTime: number;
  /** The length of the media, in seconds. It gives the last chapter an end and a length; without it the last chapter shows none. */
  duration?: number;
  /** A chapter was chosen: with its start, in seconds, for you to hand to your player. */
  onSeek: (seconds: number) => void;
  /** How tall the list grows before it scrolls: a number of px or any CSS length. Default "20rem". */
  maxHeight?: number | string;
  /** The language of the lengths ("3 minutes"). Default "en-US". */
  locale?: string;
  /** The level of the heading over the list. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The words the list says, for translation. */
  labels?: ChapterListLabels;
}

function reducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The chapters of a video or a podcast as a list of timestamps: when each
 * starts, what it is called and how long it runs, with the one that is playing
 * marked by a thin rail, a heavier title and a line that fills as the chapter
 * goes by. A row is a button that hands its start time to `onSeek`, and its
 * name reads as one phrase ("04:12, Pricing, 3 minutes"); the playing one
 * carries aria-current and says "Now playing" to a screen reader. The list
 * does not own the media: pass the player's time in and take the time out, and
 * it works with a video element, an audio element or an embed. Tab enters the
 * list once, on the playing chapter, and the arrow keys, Home and End walk
 * it; the list keeps the playing chapter in view by moving itself and never
 * the page. For a talk, a lesson or an episode, so people watch the part they
 * came for.
 */
export function ChapterList({ chapters, currentTime, duration, onSeek, maxHeight = "20rem", locale = "en-US", headingLevel = 3, labels, className, ...props }: ChapterListProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const headingId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const list = useRef<HTMLOListElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const placed = useRef(false);
  // The row the keyboard walked to; while it is null the one tab stop sits on the playing chapter.
  const [walked, setWalked] = useState<number | null>(null);

  const rows = useMemo(() => deriveChapters(chapters, duration), [chapters, duration]);
  const active = activeIndex(rows, currentTime);
  const hours = Math.max(duration ?? 0, rows[rows.length - 1]?.start ?? 0) >= 3600;
  const stop = walked ?? Math.max(active, 0);
  const total = duration !== undefined && Number.isFinite(duration) && duration > 0 ? duration : null;

  // Keep the playing chapter in view by moving the list and nothing else: scrollIntoView would drag the whole page along.
  useEffect(() => {
    const box = viewport.current;
    const row = list.current?.children[active];
    if (!box || !row || active < 0) return;
    const behavior = !placed.current || reducedMotion() ? "auto" : "smooth";
    placed.current = true;
    const rowBox = row.getBoundingClientRect();
    const viewBox = box.getBoundingClientRect();
    if (rowBox.top < viewBox.top) box.scrollTo({ top: box.scrollTop - (viewBox.top - rowBox.top) - 8, behavior });
    else if (rowBox.bottom > viewBox.bottom) box.scrollTo({ top: box.scrollTop + (rowBox.bottom - viewBox.bottom) + 8, behavior });
  }, [active]);

  /** The arrow keys, Home and End walk the chapters. Nothing is chosen until Enter or Space. */
  function onKeyDown(event: KeyboardEvent<HTMLOListElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
    const here = buttons.indexOf((event.target as HTMLElement).closest("button") as HTMLButtonElement);
    if (here < 0) return;
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : Math.min(buttons.length - 1, Math.max(0, here + (event.key === "ArrowDown" ? 1 : -1)));
    buttons[next]?.focus();
    event.preventDefault();
  }

  return (
    <section data-slot="chapter-list" aria-labelledby={headingId} className={cn("@container w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs", className)} {...props}>
      <div className="flex items-baseline justify-between gap-4 border-b border-border px-4 py-3">
        <Heading id={headingId} className="min-w-0 text-sm leading-5 font-medium tracking-[-0.01em] text-balance">
          {text.chapters}
        </Heading>
        <p className="shrink-0 text-xs leading-5 whitespace-nowrap text-muted-foreground tabular-nums">
          {fill(rows.length === 1 ? text.countOne : text.count, { count: rows.length })}
          {/* The total length is dropped from sight in a card narrower than 20rem, so the header keeps to one line; a screen reader still gets it. */}
          {total !== null ? (
            <span className="@max-xs:sr-only">
              <span aria-hidden="true"> &middot; </span>
              <span className="sr-only">, </span>
              {clock(total, hours)}
            </span>
          ) : null}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">{text.empty}</p>
      ) : (
        <ScrollAreaPrimitive.Root type="auto" className="relative overflow-hidden">
          {/* The viewport is built from the Radix parts, not taken from the ScrollArea primitive: that one is a Tab stop of its own in front of the first row, while the rows take the focus themselves. Its inner box is a block, not the table Radix makes of it, so long titles wrap at the width of the card. */}
          <ScrollAreaPrimitive.Viewport ref={viewport} style={{ maxHeight }} className="w-full rounded-[inherit] [&>div]:block!">
            <ol
              ref={list}
              role="list"
              onKeyDown={onKeyDown}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setWalked(null);
              }}
              className="relative py-1.5"
            >
              {rows.map((row) => {
                const current = row.index === active;
                const time = clock(row.start, hours);
                return (
                  <li key={`${row.start}-${row.title}`}>
                    <button
                      type="button"
                      aria-current={current ? "true" : undefined}
                      tabIndex={row.index === stop ? 0 : -1}
                      onFocus={() => setWalked(row.index)}
                      onClick={() => onSeek(row.start)}
                      className={cn(
                        "group/chapter relative grid w-full gap-x-3.5 py-2.5 pr-4 pl-4 text-start outline-none",
                        hours ? "grid-cols-[3.75rem_minmax(0,1fr)]" : "grid-cols-[2.75rem_minmax(0,1fr)]",
                        "transition-colors duration-150 motion-reduce:transition-none",
                        // The rail: a thin bar down the edge of the playing row.
                        "before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-transparent",
                        "focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset",
                        current ? "bg-muted/70 before:bg-foreground" : "hover:bg-muted/50 active:bg-muted/70",
                      )}
                    >
                      <time dateTime={isoDuration(row.start)} className={cn("pt-px text-xs leading-5 tabular-nums transition-colors duration-150 motion-reduce:transition-none", current ? "font-medium text-foreground" : "text-muted-foreground")}>
                        {time}
                      </time>
                      {/* The name of the row is its own text, read in order: "04:12, Pricing, 3 minutes". */}
                      <span className="grid min-w-0 gap-0.5">
                        <span className="sr-only">, </span>
                        <span className={cn("text-sm leading-5 [overflow-wrap:anywhere] text-pretty", current ? "font-medium text-foreground" : "text-foreground/90")}>{row.title}</span>
                        {row.length !== null ? (
                          <span className="text-xs leading-4 text-muted-foreground tabular-nums">
                            <span className="sr-only">, </span>
                            {lengthWords(row.length, locale)}
                          </span>
                        ) : null}
                        {current ? <span className="sr-only">, {text.nowPlaying}</span> : null}
                        {current ? (
                          <span aria-hidden="true" className="mt-2 h-0.5 overflow-hidden rounded-full bg-foreground/12">
                            <span
                              className="block h-full rounded-full bg-foreground transition-[width] duration-300 ease-linear motion-reduce:transition-none"
                              style={{ width: `${Math.round(progressIn(row, currentTime) * 1000) / 10}%` }}
                            />
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </ScrollAreaPrimitive.Viewport>
          <ScrollBar className="[&>[data-slot=scroll-area-thumb]]:bg-muted-foreground/35 [&>[data-slot=scroll-area-thumb]]:hover:bg-muted-foreground/55" />
        </ScrollAreaPrimitive.Root>
      )}
    </section>
  );
}
