"use client";

import { useEffect, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type SyntheticEvent } from "react";

import { IconFileText, IconRefresh } from "@rhs-ui/icons";
import { chapterAt, chapterProgress, formatTime, isoDuration } from "@rhs-ui/marketing/tour-chapters/time";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Button } from "@rhs-ui/primitives/button";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

export interface TourChapter {
  /** Where the chapter begins, in seconds from the start of the video. */
  start: number;
  /** What the chapter is about, in a few words: "Invite your team". */
  title: string;
  /** A sentence under the title. It wraps to two lines at most; anything longer is cut with an ellipsis. */
  description?: string;
}

export interface TourVideoSource {
  /** The address of the file. A data: URI works too. */
  src: string;
  /** Its MIME type, such as "video/webm" or "video/mp4", so the browser can skip a format it cannot play without downloading it. */
  type?: string;
}

export interface TourChaptersLabels {
  /** The heading over the list of chapters. */
  chapters: string;
  /** The count beside it. {count} stands for the number of chapters. */
  count: string;
  /** The same for a list of one chapter. */
  countOne: string;
  /** Said first in every chapter's name. {n} is its place in the list and {total} how many there are. */
  chapterOf: string;
  /** Said politely once a chapter has been chosen. {n}, {total}, {title} and {time} stand for what they say. */
  playing: string;
  /** Shown over the player when the video cannot be loaded. */
  failed: string;
  /** The button that tries to load it again. */
  retry: string;
  /** The text of the link to the transcript. */
  transcript: string;
  /** What a browser that cannot play video is offered instead of the player. */
  download: string;
}

export interface TourChaptersProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "Product tour". */
  eyebrow?: string;
  /** The heading. It also names the video and the section for assistive technology. */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** The level of the heading: 2 by default. The title of the chapter list sits one level below it. */
  headingLevel?: 2 | 3;
  /** The video: one address, or several files of different formats, tried in order. It is not downloaded beyond its first frames and its length until someone presses play or picks a chapter. */
  src: string | readonly TourVideoSource[];
  /** The still shown before the video plays: a URL or a data URI in the video's own proportions. */
  poster?: string;
  /** WebVTT captions for the video, switched on by default. */
  captions?: string;
  /** The captions' language tag. */
  captionsLang?: string;
  /** The captions' name in the player's menu. */
  captionsLabel?: string;
  /** The chapters. Each starts at a time in seconds, has a title and may have a line of description. They are shown in the order they start in, whatever order you pass them in. */
  chapters: readonly TourChapter[];
  /** Where the transcript lives. It is linked under the video, for people who cannot watch it. */
  transcriptHref?: string;
  /** The proportions of the video, width over height: 16 / 9 by default. */
  aspectRatio?: number;
  /** Called when a visitor picks a chapter, with the chapter and its place in the list. Nothing is called while the video moves from one chapter to the next by itself. */
  onChapterSelect?: (chapter: TourChapter, index: number) => void;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<TourChaptersLabels>;
}

const LABELS: TourChaptersLabels = {
  chapters: "Chapters",
  count: "{count} chapters",
  countOne: "{count} chapter",
  chapterOf: "Chapter {n} of {total}",
  playing: "Playing chapter {n} of {total}, {title}, from {time}",
  failed: "The video could not be loaded.",
  retry: "Try again",
  transcript: "Read the transcript",
  download: "Download the video",
};

const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? String(values[key]) : whole));

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A product video with a table of contents beside it. The video is a plain
 * native player, with its poster, its controls and a captions track; next to
 * it, a list of chapters, each a button with its start time, its title and a
 * line about it. Pressing one (a click, a tap, Enter or Space) jumps to that
 * time and plays, and while the video runs the chapter it is in is marked:
 * its time turns solid, the row is filled and a hairline fills along the
 * bottom of it as the chapter goes by. A chapter's accessible name reads
 * "Chapter 3 of 6, 1:42, Invite your team" and the current one carries
 * aria-current. The arrow keys move between chapters, and the list keeps the
 * current chapter in view without ever moving the page. Only the first frames
 * and the length of the video are fetched until someone plays it. On a wide
 * screen the list is as tall as the player and scrolls (its scroll box takes
 * no stop in the tab order of its own: the chapters in it are the stops); on a
 * phone it follows the player at full length, and picking a chapter far down
 * it brings the player back into view so the jump is seen. For a long
 * walkthrough, so that people watch the part they came for.
 */
export function TourChapters({
  eyebrow,
  title,
  description,
  headingLevel = 2,
  src,
  poster,
  captions,
  captionsLang = "en",
  captionsLabel = "English",
  chapters,
  transcriptHref,
  aspectRatio = 16 / 9,
  onChapterSelect,
  labels: custom,
  className,
  ...props
}: TourChaptersProps) {
  const labels = { ...LABELS, ...custom };
  const video = useRef<HTMLVideoElement>(null);
  const player = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);
  // Only set when a visitor chooses a chapter: a chapter that changes on its own, while the video plays, is not news to a screen reader.
  const [said, setSaid] = useState("");

  const sorted = useMemo(() => [...chapters].sort((a, b) => a.start - b.start), [chapters]);
  const starts = useMemo(() => sorted.map((chapter) => chapter.start), [sorted]);
  const active = chapterAt(starts, time);
  const length = Number.isFinite(duration) ? duration : 0;

  const sync = (event: SyntheticEvent<HTMLVideoElement>) => setTime(event.currentTarget.currentTime);

  /**
   * Below lg the list sits under the player, so a chapter picked far down it would play out of sight and the tap would seem to do nothing.
   * Bring the player back by the nearest edge (honouring the page's scroll-padding), and only when it is stacked above the list and not already on screen.
   * Side by side, both are always in view and nothing moves.
   */
  const reveal = () => {
    const box = player.current;
    const side = panel.current;
    if (!box || !side) return;
    const at = box.getBoundingClientRect();
    const stacked = side.getBoundingClientRect().top >= at.bottom - 1;
    if (!stacked || (at.top >= 0 && at.bottom <= window.innerHeight)) return;
    box.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  const choose = (index: number) => {
    const chapter = sorted[index];
    const node = video.current;
    if (!chapter) return;
    onChapterSelect?.(chapter, index);
    setSaid(fill(labels.playing, { n: index + 1, total: sorted.length, title: chapter.title, time: formatTime(chapter.start) }));
    setTime(chapter.start);
    if (!node) return;
    // A player that has not read its length yet ignores a jump, so the jump waits for it.
    const jump = () => {
      node.currentTime = chapter.start;
    };
    if (node.readyState >= 1) jump();
    else node.addEventListener("loadedmetadata", jump, { once: true });
    void node.play().catch(() => {});
    reveal();
  };

  const retry = () => {
    setFailed(false);
    video.current?.load();
  };

  /** The arrow keys, Home and End move between the chapters. Nothing is chosen until Enter or Space. */
  const onKeyDown = (event: KeyboardEvent<HTMLOListElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
    const here = buttons.indexOf((event.target as HTMLElement).closest("button") as HTMLButtonElement);
    if (here < 0) return;
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : Math.min(buttons.length - 1, Math.max(0, here + (event.key === "ArrowDown" ? 1 : -1)));
    buttons[next]?.focus();
    event.preventDefault();
  };

  // The message is for the moment a chapter is chosen. Left in the page it would read as stale text once the video has moved on.
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 6000);
    return () => window.clearTimeout(timer);
  }, [said]);

  // Keep the current chapter in view inside the list, by moving the list and nothing else: scrollIntoView would drag the whole page along.
  useEffect(() => {
    const row = list.current?.children[active];
    const box = scroller.current;
    if (!row || !box) return;
    const rowBox = row.getBoundingClientRect();
    const viewBox = box.getBoundingClientRect();
    const behavior = prefersReducedMotion() ? "auto" : "smooth";
    if (rowBox.top < viewBox.top) box.scrollTo({ top: box.scrollTop - (viewBox.top - rowBox.top) - 8, behavior });
    else if (rowBox.bottom > viewBox.bottom) box.scrollTo({ top: box.scrollTop + (rowBox.bottom - viewBox.bottom) + 8, behavior });
  }, [active]);

  const single = typeof src === "string" ? src : undefined;
  const sources = typeof src === "string" ? undefined : src;
  const ListTitle = `h${headingLevel + 1}` as "h3" | "h4";
  const events = {
    onTimeUpdate: sync,
    onSeeking: sync,
    onSeeked: sync,
    onEnded: sync,
    onLoadedMetadata: (event: SyntheticEvent<HTMLVideoElement>) => {
      setDuration(event.currentTarget.duration);
      setFailed(false);
      sync(event);
    },
    onDurationChange: (event: SyntheticEvent<HTMLVideoElement>) => setDuration(event.currentTarget.duration),
  };

  return (
    <section data-slot="tour-chapters" aria-label={title} className={cn("w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} as={headingLevel === 3 ? "h3" : "h2"} />

      {/* Side by side, the player and its transcript link sit in the first column and the panel in the second, in the first row only: the panel is as tall as the player, and the link hangs below it. */}
      <div className={cn("mt-8 grid grid-cols-1 gap-5 lg:mt-10 lg:gap-x-6 lg:gap-y-0", sorted.length ? "lg:grid-cols-[minmax(0,1fr)_22rem]" : null)}>
        <div className="min-w-0 lg:contents">
          <div ref={player} className="relative min-w-0 scroll-mt-4 overflow-hidden rounded-2xl border border-border bg-black shadow-xs lg:col-start-1 lg:row-start-1 lg:self-start">
            <AspectRatio ratio={aspectRatio}>
              <video
                ref={video}
                src={single}
                poster={poster}
                controls
                playsInline
                preload="metadata"
                aria-label={title}
                onError={single ? () => setFailed(true) : undefined}
                className="size-full object-contain outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:ring-inset"
                {...events}
              >
                {sources?.map((source, index) => (
                  <source key={`${index}-${source.type ?? ""}`} src={source.src} type={source.type} onError={index === sources.length - 1 ? () => setFailed(true) : undefined} />
                ))}
                {captions ? <track kind="captions" src={captions} srcLang={captionsLang} label={captionsLabel} default /> : null}
                {single ? <a href={single}>{labels.download}</a> : null}
              </video>
            </AspectRatio>
            {failed ? (
              <div role="alert" className="dark absolute inset-0 grid content-center justify-items-center gap-3 bg-black px-6 text-center text-sm text-foreground">
                <p>{labels.failed}</p>
                <Button type="button" variant="outline" size="sm" onClick={retry}>
                  <IconRefresh />
                  {labels.retry}
                </Button>
              </div>
            ) : null}
          </div>
          {transcriptHref ? (
            <p className="mt-3.5 flex items-center gap-2 text-sm text-muted-foreground lg:col-start-1 lg:row-start-2">
              <IconFileText aria-hidden="true" className="size-4 shrink-0" />
              <a
                href={transcriptHref}
                className="rounded-sm underline decoration-foreground/30 underline-offset-4 outline-none hover:text-foreground hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                {labels.transcript}
              </a>
            </p>
          ) : null}
        </div>

        {sorted.length ? (
          <div
            ref={panel}
            data-slot="tour-chapters-list"
            className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xs lg:col-start-2 lg:row-start-1 lg:min-h-80"
          >
            <div className="flex items-baseline justify-between gap-4 border-b border-border px-4 py-3">
              <ListTitle className="text-sm font-medium">{labels.chapters}</ListTitle>
              <p className="text-xs text-muted-foreground tabular-nums">
                {fill(sorted.length === 1 ? labels.countOne : labels.count, { count: sorted.length })}
                {length ? (
                  <>
                    <span aria-hidden="true"> &middot; </span>
                    <span className="sr-only">, </span>
                    {formatTime(length)}
                  </>
                ) : null}
              </p>
            </div>
            {/* On a wide screen the list fills what is left of the panel, whose height is the player's: it is taken out of the flow so it can never make the row taller than the video. It is a plain scroll box, not a focusable one: the chapters in it are the tab stops, and a stop for the box itself would have a focus ring that its own clip hides. */}
            <div className="relative min-h-0 flex-1">
              <div ref={scroller} className="relative overflow-y-auto overscroll-contain [scrollbar-color:color-mix(in_oklch,var(--muted-foreground)_45%,transparent)_transparent] [scrollbar-width:thin] lg:absolute lg:inset-0">
                <ol ref={list} role="list" onKeyDown={onKeyDown} className="flex flex-col gap-0.5 p-2">
                  {sorted.map((chapter, index) => {
                    const current = index === active;
                    return (
                      <li key={`${chapter.start}-${chapter.title}`}>
                        <button
                          type="button"
                          aria-current={current ? "true" : undefined}
                          onClick={() => choose(index)}
                          className={cn(
                            "group/chapter relative flex w-full items-start gap-3 rounded-lg px-3 pt-2.5 pb-3.5 text-start outline-none",
                            "transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset motion-reduce:transition-none",
                            current ? "bg-muted" : "hover:bg-muted/60 active:bg-muted",
                          )}
                        >
                          <span className="sr-only">{fill(labels.chapterOf, { n: index + 1, total: sorted.length })}, </span>
                          <time
                            dateTime={isoDuration(chapter.start)}
                            className={cn(
                              "mt-px inline-flex h-5 min-w-11 shrink-0 items-center justify-center rounded-md border px-1.5 text-xs font-medium tabular-nums",
                              "transition-colors duration-150 motion-reduce:transition-none",
                              current ? "border-foreground bg-foreground text-background" : "border-border bg-background text-muted-foreground group-hover/chapter:text-foreground",
                            )}
                          >
                            {formatTime(chapter.start)}
                          </time>
                          <span className="sr-only">, </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm leading-snug font-medium tracking-[-0.01em] text-balance">{chapter.title}</span>
                            {chapter.description ? (
                              <>
                                <span className="sr-only">. </span>
                                {/* No `block` here: line-clamp sets display: -webkit-box itself, and a `block` next to it would turn the clamp off. */}
                                <span className="mt-0.5 line-clamp-2 text-[0.8125rem] leading-snug text-pretty text-muted-foreground">{chapter.description}</span>
                              </>
                            ) : null}
                          </span>
                          {current ? (
                            <span aria-hidden="true" className="absolute inset-x-3 bottom-1.5 h-0.5 overflow-hidden rounded-full bg-foreground/12">
                              <span
                                className="block h-full rounded-full bg-foreground transition-[width] duration-300 ease-linear motion-reduce:transition-none"
                                style={{ width: `${chapterProgress(starts, index, time, length) * 100}%` }}
                              />
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {said}
      </p>
    </section>
  );
}
