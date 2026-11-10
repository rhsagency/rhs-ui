"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";

import { IconArrowDown, IconArrowUp } from "@rhs-ui/icons";
import { DEFAULT_LABELS, activeCue, clock, fill, matchRanges, splitMatches, type Cue, type TranscriptListLabels } from "@rhs-ui/application/transcript-list/transcript";
import { Button } from "@rhs-ui/primitives/button";
import { ScrollBar } from "@rhs-ui/primitives/scroll-area";
import { SearchInput } from "@rhs-ui/primitives/search-input";
import { cn } from "@/lib/utils";

export type { Cue, TranscriptListLabels } from "@rhs-ui/application/transcript-list/transcript";

export interface TranscriptListProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** The lines of the transcript, as your own WebVTT parser gives them: start and end in seconds, an optional speaker and the text. They are shown in the order they start in. */
  cues: readonly Cue[];
  /** Where the player is now, in seconds. The line being spoken is highlighted. */
  currentTime: number;
  /** A timestamp or a line was chosen: with its start, in seconds, for you to hand to your player. */
  onSeek: (seconds: number) => void;
  /** Show the search box, which filters the lines and marks the words it finds. Default true. */
  searchable?: boolean;
  /** Keep the line being spoken in view as the media plays, until the reader scrolls away from it. Default true. */
  autoScroll?: boolean;
  /** What the search box holds to begin with. */
  defaultQuery?: string;
  /** Called as the search text changes. */
  onQueryChange?: (query: string) => void;
  /** How tall the transcript grows before it scrolls: a number of px or any CSS length. Default "24rem". */
  maxHeight?: number | string;
  /** The language the count of matching lines is written in. Default "en-US". */
  locale?: string;
  /** The words the transcript says, for translation. */
  labels?: TranscriptListLabels;
}

function reducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** A text with the words a search found marked. */
function Marked({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  return (
    <>
      {splitMatches(text, query).map((piece, index) =>
        piece.match ? (
          <mark key={index} className="-mx-px rounded-[3px] bg-foreground/20 px-px text-foreground">
            {piece.text}
          </mark>
        ) : (
          <Fragment key={index}>{piece.text}</Fragment>
        ),
      )}
    </>
  );
}

/**
 * A synced transcript that reads like a page: every line with its timestamp, the line being spoken highlighted and kept in view, and a search that finds
 * words. The timestamps are the buttons (a click, Enter or Space hands the start to `onSeek`); the text is plain, selectable text, and clicking it seeks
 * too, unless the click ended a selection. The playing line carries aria-current. While the media plays the transcript keeps that line in a comfortable
 * place, until the reader scrolls it out of view: it then stops following and offers "Jump to current", and follows again once the line is back in view
 * or the button is pressed. The search ignores case and accents, hides the lines that do not match, marks the words that do and says how many are left
 * in a polite status. A name is shown above each turn when lines have speakers. It does not own the media.
 */
export function TranscriptList({
  cues,
  currentTime,
  onSeek,
  searchable = true,
  autoScroll = true,
  defaultQuery = "",
  onQueryChange,
  maxHeight = "24rem",
  locale = "en-US",
  labels,
  className,
  ...props
}: TranscriptListProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const viewport = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  // Scroll events that this component started itself are not the reader leaving; they are told apart by the time until which they are ours.
  // A wheel, a touch, a key or a grab of the scrollbar is the reader, and wins over that for a moment.
  const ours = useRef(0);
  const intent = useRef(0);
  const placed = useRef(false);
  const [query, setQuery] = useState(defaultQuery);
  const [follow, setFollow] = useState(true);
  const [away, setAway] = useState<"above" | "below" | null>(null);

  const rows = useMemo(() => [...cues].sort((a, b) => a.start - b.start), [cues]);
  const active = activeCue(rows, currentTime);
  const needle = searchable ? query.trim() : "";
  const shown = useMemo(() => rows.map((cue, index) => ({ cue, index })).filter(({ cue }) => !needle || matchRanges(cue.text, needle).length > 0), [rows, needle]);
  const hours = Math.max(0, ...rows.map((cue) => cue.end)) >= 3600;

  const rowOf = (index: number) => list.current?.querySelector<HTMLElement>(`[data-cue="${index}"]`) ?? null;

  /** Where the playing line stands in the box: above it, below it, or in it. */
  function measure() {
    const box = viewport.current;
    const row = active < 0 || needle ? null : rowOf(active);
    if (!box || !row) {
      setAway(null);
      return null;
    }
    const rowBox = row.getBoundingClientRect();
    const viewBox = box.getBoundingClientRect();
    const where = rowBox.bottom < viewBox.top + 4 ? "above" : rowBox.top > viewBox.bottom - 4 ? "below" : null;
    setAway(where);
    return where;
  }

  /**
   * Bring the playing line to a comfortable place, about a third of the way down the box, by moving the box and nothing else. The box comes to rest on the
   * top of a whole line, the first one at or above that place, so the line above the playing one is never cut across by the edge with its timestamp
   * scrolled out of sight.
   */
  function bring(behavior: ScrollBehavior) {
    const box = viewport.current;
    const row = active < 0 ? null : rowOf(active);
    if (!box || !row) return;
    const rowBox = row.getBoundingClientRect();
    const viewBox = box.getBoundingClientRect();
    // Where the top of the box would land on the page, and the top of the whole line that holds that point: found by walking up from the playing line.
    const goal = rowBox.top - viewBox.height * 0.3;
    let edge: number | null = null;
    for (let above = row.previousElementSibling; above; above = above.previousElementSibling) {
      edge = above.getBoundingClientRect().top;
      if (edge <= goal) break;
    }
    const top = edge === null || edge > goal ? 0 : box.scrollTop + (edge - viewBox.top);
    ours.current = performance.now() + (behavior === "smooth" ? 800 : 150);
    box.scrollTo({ top: Math.max(0, top), behavior: reducedMotion() ? "auto" : behavior });
  }

  // A new line starts: if it has left the comfortable band of the box, carry it back. A line that is already well in view is left alone, so the text moves in steps and not continuously.
  useEffect(() => {
    const box = viewport.current;
    const row = active < 0 || needle ? null : rowOf(active);
    if (box && row && autoScroll && follow && performance.now() > intent.current) {
      const rowBox = row.getBoundingClientRect();
      const viewBox = box.getBoundingClientRect();
      const comfortable = rowBox.top >= viewBox.top + viewBox.height * 0.12 && rowBox.bottom <= viewBox.bottom - viewBox.height * 0.25;
      if (!comfortable) bring(placed.current ? "smooth" : "auto");
      placed.current = true;
    }
    measure();
  }, [active, needle]);

  // A new search starts at the top; clearing it brings the reader back to the playing line.
  const searching = needle !== "";
  const wasSearching = useRef(searching);
  useEffect(() => {
    if (searching) viewport.current?.scrollTo({ top: 0 });
    else if (wasSearching.current) {
      setFollow(true);
      requestAnimationFrame(() => bring("auto"));
    }
    wasSearching.current = searching;
  }, [needle]);

  /** The reader is working the box: for the next half second a scroll is theirs, whatever this component started a moment ago. */
  function reading() {
    intent.current = performance.now() + 500;
  }

  function onScroll() {
    const where = measure();
    if (performance.now() >= intent.current && performance.now() < ours.current) return;
    // The reader moved the box: the transcript follows again only while the playing line is in view.
    setFollow(where === null);
  }

  function setSearch(next: string) {
    setQuery(next);
    onQueryChange?.(next);
  }

  function pick(start: number) {
    // A click that ends a selection is the reader copying a sentence, not asking to jump.
    if (typeof window.getSelection === "function" && !window.getSelection()?.isCollapsed) return;
    onSeek(start);
  }

  const count = shown.length;
  const showJump = away !== null && !searching && (!follow || !autoScroll);
  let previous: string | undefined;

  return (
    <section data-slot="transcript-list" aria-label={text.transcript} className={cn("w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs", className)} {...props}>
      {searchable ? (
        <div className="grid gap-2 border-b border-border p-3">
          <SearchInput value={query} onValueChange={setSearch} placeholder={text.search} aria-label={text.search} className="h-8 [&_input]:text-[0.8125rem]" />
          {/* Kept in the page when empty, and in the accessibility tree: a live region that appears together with its message is often never read, and display: none leaves the tree. Empty it is visually hidden and takes no room, so no gap opens under the box. */}
          <p role="status" aria-live="polite" className={cn("text-xs leading-4 text-muted-foreground tabular-nums empty:sr-only", searching && count === 0 && "sr-only")}>
            {searching ? (count === 0 ? fill(text.noMatches, { query: query.trim() }) : count === 1 ? text.matchesOne : fill(text.matches, { count: new Intl.NumberFormat(locale).format(count) })) : null}
          </p>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">{text.empty}</p>
      ) : (
        <div className="relative">
          <ScrollAreaPrimitive.Root type="auto" className="relative overflow-hidden">
            {/* The viewport is built from the Radix parts, not taken from the ScrollArea primitive: that one is a Tab stop of its own in front of the first timestamp, while the timestamps take the focus themselves. Its inner box is a block, not the table Radix makes of it, so lines wrap at the width of the card. */}
            <ScrollAreaPrimitive.Viewport ref={viewport} onScroll={onScroll} onWheel={reading} onTouchStart={reading} onTouchMove={reading} onPointerDown={reading} onKeyDown={reading} style={{ maxHeight }} className="w-full rounded-[inherit] [&>div]:block!">
              <ol ref={list} role="list" className="p-2">
                {shown.map(({ cue, index }) => {
                  const current = index === active;
                  const turn = cue.speaker !== undefined && cue.speaker !== previous;
                  previous = cue.speaker ?? previous;
                  const time = clock(cue.start, hours);
                  return (
                    <li
                      key={`${cue.start}-${index}`}
                      data-cue={index}
                      aria-current={current ? "true" : undefined}
                      className={cn("grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-2 rounded-lg px-1.5 py-1.5 transition-colors duration-150 motion-reduce:transition-none", turn && "mt-2 first:mt-0", current ? "bg-muted" : "hover:bg-muted/40")}
                    >
                      <button
                        type="button"
                        aria-label={fill(text.seek, { time })}
                        onClick={() => onSeek(cue.start)}
                        className={cn(
                          "h-6 self-start rounded-md px-1 text-start text-xs tabular-nums outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
                          current ? "font-medium text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {time}
                      </button>
                      <div className="min-w-0">
                        {turn ? <p className="mb-0.5 text-xs leading-6 font-medium [overflow-wrap:anywhere] text-foreground">{cue.speaker}</p> : null}
                        <p onClick={() => pick(cue.start)} className={cn("cursor-pointer text-[0.9375rem] leading-relaxed [overflow-wrap:anywhere] text-pretty", current ? "text-foreground" : "text-foreground/85")}>
                          <Marked text={cue.text} query={needle} />
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {searching && count === 0 ? <p className="px-4 pb-6 text-center text-sm text-muted-foreground">{fill(text.noMatches, { query: query.trim() })}</p> : null}
            </ScrollAreaPrimitive.Viewport>
            <ScrollBar className="[&>[data-slot=scroll-area-thumb]]:bg-muted-foreground/35 [&>[data-slot=scroll-area-thumb]]:hover:bg-muted-foreground/55" />
          </ScrollAreaPrimitive.Root>

          {showJump ? (
            <div className={cn("pointer-events-none absolute inset-x-0 flex justify-center px-4", away === "above" ? "top-3" : "bottom-3")}>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setFollow(true);
                  bring("smooth");
                }}
                className="pointer-events-auto rounded-full pr-3.5 shadow-sm"
              >
                {away === "above" ? <IconArrowUp aria-hidden="true" /> : <IconArrowDown aria-hidden="true" />}
                {text.jump}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
