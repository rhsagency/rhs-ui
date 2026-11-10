"use client";

import { Fragment, useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";

import { IconFilm, IconMusic, IconPlay } from "@rhs-ui/icons";
import { clock, defaultLabels, fill, lengthWords, type MediaPlaylistLabels, type PlaylistItem } from "@rhs-ui/application/media-playlist/playlist";
import { ScrollBar } from "@rhs-ui/primitives/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export type { MediaPlaylistLabels, PlaylistItem } from "@rhs-ui/application/media-playlist/playlist";

export interface MediaPlaylistProps extends Omit<ComponentProps<"section">, "children" | "title" | "onSelect"> {
  /** The tracks or videos, in play order. */
  items: readonly PlaylistItem[];
  /** The `id` of the item that is current: the one playing, or the one that was playing when it was paused. */
  currentId?: string;
  /** Whether the current item is playing. Its bars move only while this is true. */
  playing?: boolean;
  /** An item was chosen, by click, tap, Enter or Space. Choosing the current one is yours to read as play or pause. */
  onSelect: (id: string) => void;
  /** Put a heading, "Up next", between the current item and the ones after it. Default false. */
  showUpNext?: boolean;
  /** Tracks (a square picture) or videos (a 16:9 thumbnail). Default "audio". */
  kind?: "audio" | "video";
  /** A heading over the list, with the count and the total length on its right. Without one the list has no header. */
  title?: string;
  /** How tall the list grows before it scrolls: a number of px or any CSS length. Default "24rem". */
  maxHeight?: number | string;
  /** The language of the lengths ("3 minutes, 42 seconds"). Default "en-US". */
  locale?: string;
  /** The level of the `title` heading, and one level below it for "Up next". Default 3. */
  headingLevel?: 2 | 3;
  /** The words the list says, for translation. */
  labels?: MediaPlaylistLabels;
}

/** Four bars on a 16px field: they dance while the item plays, rest at different heights when it is paused and stay put under reduced motion. The same shape in all three, so nothing jumps. */
const BARS = [
  { rest: 0.45, delay: 0, duration: 880 },
  { rest: 0.85, delay: -310, duration: 720 },
  { rest: 0.6, delay: -150, duration: 1040 },
  { rest: 0.3, delay: -520, duration: 800 },
] as const;

/** `compact` is the small one that sits on a picture, `inverted` the one for a dark chip: the bars are the colour of the page. */
function Equalizer({ playing, compact = false, inverted = false }: { playing: boolean; compact?: boolean; inverted?: boolean }) {
  return (
    <span aria-hidden="true" data-slot="media-playlist-bars" data-playing={playing || undefined} className={cn("flex items-end justify-center", compact ? "h-2.5 gap-px" : "h-4 gap-[2px]")}>
      {BARS.map((bar, index) => (
        <span
          key={index}
          // The resting height is the plain style; the animation, when it runs, takes over from it.
          style={{ height: "100%", transform: `scaleY(${bar.rest})`, animationDelay: `${bar.delay}ms`, animationDuration: `${bar.duration}ms` }}
          className={cn("origin-bottom rounded-full", compact ? "w-[2px]" : "w-[3px]", inverted ? "bg-background" : "bg-foreground", playing && "motion-safe:animate-rhs-equalizer")}
        />
      ))}
    </span>
  );
}

/** Whether a text is cut by its box, on one line or after two: measured now and again whenever the box changes size. */
function useTruncated(ref: RefObject<HTMLElement | null>, text: string): boolean {
  const [cut, setCut] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setCut(element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, text]);
  return cut;
}

/** The picture of a row, a little smaller on a narrow list. `children` is drawn on top of it: the bars of the current row, once the number is gone. */
function Artwork({ src, kind, children }: { src?: string; kind: "audio" | "video"; children?: ReactNode }) {
  const shape = kind === "video" ? "h-9 w-16 @max-sm:h-8 @max-sm:w-14" : "size-10";
  return (
    <span className="relative block shrink-0">
      {src ? (
        // The title is written out beside it, so the picture is decoration.
        <img src={src} alt="" loading="lazy" decoding="async" width={kind === "video" ? 64 : 40} height={kind === "video" ? 36 : 40} className={cn(shape, "block rounded-md border border-border bg-muted object-cover")} />
      ) : (
        <span aria-hidden="true" className={cn(shape, "grid place-items-center rounded-md border border-border bg-muted text-muted-foreground")}>
          {kind === "video" ? <IconFilm className="size-4" /> : <IconMusic className="size-4" />}
        </span>
      )}
      {children}
    </span>
  );
}

interface RowProps {
  item: PlaylistItem;
  position: number;
  current: boolean;
  playing: boolean;
  kind: "audio" | "video";
  stop: boolean;
  locale: string;
  words: Required<MediaPlaylistLabels>;
  onFocusRow: () => void;
  onSelect: (id: string) => void;
}

function Row({ item, position, current, playing, kind, stop, locale, words, onFocusRow, onSelect }: RowProps) {
  const title = useRef<HTMLSpanElement>(null);
  const cut = useTruncated(title, item.title);
  const [hover, setHover] = useState(false);
  const status = current ? (playing ? words.nowPlaying : words.paused) : undefined;
  return (
    <li>
      {/* The tooltip belongs to titles that are cut; for any other it never opens, and its state is controlled so it never switches kind. */}
      <Tooltip open={hover && cut} onOpenChange={setHover}>
        <TooltipTrigger asChild>
          <button
            type="button"
            data-row=""
            data-id={item.id}
            aria-current={current ? "true" : undefined}
            tabIndex={stop ? 0 : -1}
            onFocus={onFocusRow}
            onClick={() => onSelect(item.id)}
            className={cn(
              "group/row relative grid w-full grid-cols-[1.5rem_auto_minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-2 text-start outline-none @max-sm:grid-cols-[auto_minmax(0,1fr)_auto] @max-sm:gap-2.5",
              "transition-colors duration-150 motion-reduce:transition-none",
              "focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset",
              current ? "bg-muted/70" : "hover:bg-muted/50 active:bg-muted/70",
            )}
          >
            {/* The name of the row is its own text, read in order: "3, Halcyon Drift, Kestrel Quartet, 5:21, Now playing". The bars and the play mark are drawings. In a narrow list the number leaves the row (it stays for a screen reader) and the current row shows its bars on the picture. */}
            <span className="grid h-6 place-items-center text-xs text-muted-foreground tabular-nums @max-sm:sr-only">
              {current ? (
                <Equalizer playing={playing} />
              ) : (
                <>
                  <span className="group-hover/row:hidden group-focus-visible/row:hidden">{position}</span>
                  <IconPlay aria-hidden="true" fill="currentColor" className="hidden size-3.5 text-foreground group-hover/row:block group-focus-visible/row:block" />
                  <span className="sr-only">, </span>
                </>
              )}
            </span>
            <Artwork src={item.artwork} kind={kind}>
              {current ? (
                <span aria-hidden="true" className="absolute start-1 bottom-1 hidden rounded-[3px] bg-foreground p-[3px] ring-1 ring-background @max-sm:flex">
                  <Equalizer playing={playing} compact inverted />
                </span>
              ) : null}
            </Artwork>
            <span className="grid min-w-0 gap-0.5">
              {/* A title wraps to two lines in a video list and in a narrow one, where a single line shows a handful of words, and to three in a very narrow one; a track in a wide list keeps one line. */}
              <span ref={title} className={cn("text-sm leading-5 font-medium text-pretty", kind === "video" ? "line-clamp-2 @max-xs:line-clamp-3" : "truncate @max-sm:line-clamp-2 @max-sm:whitespace-normal @max-xs:line-clamp-3", current ? "text-foreground" : "text-foreground/90")}>
                {item.title}
                <span className="sr-only">, </span>
              </span>
              {item.subtitle ? (
                <span className="truncate text-xs leading-4 text-muted-foreground">
                  {item.subtitle}
                  <span className="sr-only">, </span>
                </span>
              ) : null}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {clock(item.duration)}
              {status ? <span className="sr-only">, {status}</span> : null}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" align="start" className="max-w-72 leading-snug">
          <span className="font-medium">{item.title}</span>
          {item.subtitle ? <span className="block text-background/70">{item.subtitle}</span> : null}
        </TooltipContent>
      </Tooltip>
    </li>
  );
}

function reducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * A list of tracks or videos for your own player: a number, a picture, the title with a line under it and the length, and the current item marked by a
 * tinted row and four bars in place of its number. The bars move while `playing` is true, rest when paused and stay still under reduced motion. It is
 * presentation only: you own the player, it owns the list; pass the current id and whether it plays, and take the chosen id out. The current row carries
 * aria-current and says "Now playing" or "Paused" to a screen reader. Tab enters the list once, on the current item; the arrow keys, Home and End walk
 * it; Enter plays. A cut title shows whole in a tooltip on hover and focus. With `showUpNext` a heading splits off the items after the current one, and
 * the list keeps the current row in view by moving itself, never the page. It answers to its own width, not the screen's: in a list narrower than 24rem the
 * numbers leave the rows (the current row shows its bars on its picture), the pictures shrink and titles wrap to two lines, so a phone can read them.
 */
export function MediaPlaylist({
  items,
  currentId,
  playing = false,
  onSelect,
  showUpNext = false,
  kind = "audio",
  title,
  maxHeight = "24rem",
  locale = "en-US",
  headingLevel = 3,
  labels,
  className,
  ...props
}: MediaPlaylistProps) {
  const words = { ...defaultLabels(kind), ...labels };
  const headingId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const SubHeading = `h${title ? headingLevel + 1 : headingLevel}` as "h2" | "h3" | "h4";
  const viewport = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const placed = useRef(false);
  // The row the keyboard walked to; while it is null the one tab stop sits on the current item.
  const [walked, setWalked] = useState<string | null>(null);

  const found = items.findIndex((item) => item.id === currentId);
  const stopId = walked ?? items[Math.max(found, 0)]?.id;
  const split = showUpNext && found >= 0 && found < items.length - 1 ? found + 1 : items.length;
  const before = items.slice(0, split);
  const after = items.slice(split);
  const total = items.reduce((sum, item) => sum + (Number.isFinite(item.duration) ? item.duration : 0), 0);

  // Keep the current row in view by moving the list and nothing else: scrollIntoView would drag the whole page along.
  useEffect(() => {
    const box = viewport.current;
    const row = currentId === undefined ? null : body.current?.querySelector<HTMLElement>(`[data-row][data-id="${CSS.escape(currentId)}"]`);
    if (!box || !row) return;
    const behavior = !placed.current || reducedMotion() ? "auto" : "smooth";
    placed.current = true;
    const rowBox = row.getBoundingClientRect();
    const viewBox = box.getBoundingClientRect();
    if (rowBox.top < viewBox.top) box.scrollTo({ top: box.scrollTop - (viewBox.top - rowBox.top) - 8, behavior });
    else if (rowBox.bottom > viewBox.bottom) box.scrollTo({ top: box.scrollTop + (rowBox.bottom - viewBox.bottom) + 8, behavior });
  }, [currentId]);

  /** The arrow keys, Home and End walk the rows, over the heading too. Nothing is played until Enter or Space. */
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-row]"));
    const here = buttons.indexOf((event.target as HTMLElement).closest("button") as HTMLButtonElement);
    if (here < 0) return;
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : Math.min(buttons.length - 1, Math.max(0, here + (event.key === "ArrowDown" ? 1 : -1)));
    buttons[next]?.focus();
    event.preventDefault();
  }

  function renderRows(list: readonly PlaylistItem[], offset: number) {
    return list.map((item, index) => (
      <Row
        key={item.id}
        item={item}
        position={offset + index + 1}
        current={item.id === currentId}
        playing={playing}
        kind={kind}
        stop={item.id === stopId}
        locale={locale}
        words={words}
        onFocusRow={() => setWalked(item.id)}
        onSelect={onSelect}
      />
    ));
  }

  return (
    <section
      data-slot="media-playlist"
      aria-label={title ? undefined : words.playlist}
      aria-labelledby={title ? headingId : undefined}
      className={cn("@container w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs", className)}
      {...props}
    >
      {title ? (
        <div className="flex items-baseline justify-between gap-4 border-b border-border px-4 py-3">
          <Heading id={headingId} className="min-w-0 text-sm leading-5 font-medium tracking-[-0.01em] text-balance">
            {title}
          </Heading>
          <p className="shrink-0 text-xs leading-5 text-muted-foreground tabular-nums">
            {fill(items.length === 1 ? words.countOne : words.count, { count: items.length })}
            {items.length > 0 ? (
              <>
                <span aria-hidden="true"> &middot; </span>
                <span className="sr-only">, </span>
                {lengthWords(total, locale, "short", false)}
              </>
            ) : null}
          </p>
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">{words.empty}</p>
      ) : (
        <TooltipProvider delayDuration={350}>
          <ScrollAreaPrimitive.Root type="auto" className="relative overflow-hidden">
            {/* The viewport is built from the Radix parts, not taken from the ScrollArea primitive: that one is a Tab stop of its own in front of the first row, while the rows take the focus themselves. Its inner box is a block, not the table Radix makes of it, so long titles are cut at the width of the card. */}
            <ScrollAreaPrimitive.Viewport ref={viewport} style={{ maxHeight }} className="w-full rounded-[inherit] [&>div]:block!">
              <div
                ref={body}
                onKeyDown={onKeyDown}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setWalked(null);
                }}
                className="py-1.5"
              >
                <ol role="list" aria-label={words.playlist}>
                  {renderRows(before, 0)}
                </ol>
                {after.length > 0 ? (
                  <Fragment>
                    <SubHeading className="mt-1.5 border-t border-border px-4 pt-3 pb-1 text-xs leading-5 font-medium text-muted-foreground">{words.upNext}</SubHeading>
                    <ol role="list" aria-label={words.upNext}>
                      {renderRows(after, before.length)}
                    </ol>
                  </Fragment>
                ) : null}
              </div>
            </ScrollAreaPrimitive.Viewport>
            <ScrollBar className="[&>[data-slot=scroll-area-thumb]]:bg-muted-foreground/35 [&>[data-slot=scroll-area-thumb]]:hover:bg-muted-foreground/55" />
          </ScrollAreaPrimitive.Root>
        </TooltipProvider>
      )}
    </section>
  );
}
