import { useId, type ComponentProps, type ElementType } from "react";

import { IconVideo } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface LibraryVideo {
  /** The talk's title. */
  title: string;
  /** The video's own page. Without it, and without `onPlay`, the card is not a link. */
  href?: string;
  /** The length as people write it: "12:04", or "1:02:30" for an hour. It is also spoken in full by the link's name. */
  duration: string;
  /** Who gives the talk. */
  speaker?: string;
  /** When it was recorded or published, as an ISO date: "2026-09-12". */
  date?: string;
  /** A 16:9 picture. Without one the card shows a muted tile with the first letter of the title. */
  thumbnail?: string;
}

export interface VideoPlaylist {
  /** "Keynotes", "Getting started". */
  title: string;
  /** One line on what the playlist is for. */
  description?: string;
  videos: readonly LibraryVideo[];
}

export interface VideoLibraryLabels {
  /** The noun after a count of one: "1 video". */
  video: string;
  /** The noun after any other count: "6 videos". */
  videos: string;
  /** Said for a playlist without videos. */
  empty: string;
}

export interface VideoLibraryProps extends Omit<ComponentProps<"section">, "title" | "children" | "onPlay"> {
  /** The playlists, each a section with its own heading and grid. */
  playlists: readonly VideoPlaylist[];
  /** Lets the first video of the first playlist span two columns, and, from 1024px with three or more videos, two rows. */
  featured?: boolean;
  /** Called with the video and its playlist when a card is pressed. Cards then become buttons, so you can open your own player. Without it every card is a link to the video's page. */
  onPlay?: (video: LibraryVideo, playlist: VideoPlaylist) => void;
  /** The page's own heading, when the page has no other: "Talks and demos". */
  title?: string;
  /** One or two sentences under the title. */
  description?: string;
  /** The level of the title. Playlist headings sit one level below it, or take this level when there is no title. */
  headingLevel?: 1 | 2 | 3;
  /** Renders the card links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Words for the counts, for a site that is not in English. */
  labels?: Partial<VideoLibraryLabels>;
  /** Locale for dates, durations and numbers. */
  locale?: string;
  /** Time zone for a date that carries a time; a date without one is never shifted. */
  timeZone?: string;
}

const LABELS: VideoLibraryLabels = { video: "video", videos: "videos", empty: "No videos yet." };

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function formatDate(value: string, locale: string, timeZone: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: DATE_ONLY.test(value) ? "UTC" : timeZone }).format(time);
}

/** "12:04" is 724 seconds and "1:02:30" is 3750. Anything else is NaN, and a NaN adds nothing to a total. */
function secondsOf(duration: string): number {
  const parts = duration.trim().split(":");
  if (parts.length < 2 || parts.length > 3 || !parts.every((part) => /^\d{1,2}$/.test(part))) return Number.NaN;
  return parts.reduce((total, part) => total * 60 + Number(part), 0);
}

/** "12 minutes 4 seconds", in the reader's own words: the unit names come from Intl, not from a list of ours. */
function spoken(seconds: number, locale: string, unitsOf: readonly ("hour" | "minute" | "second")[] = ["hour", "minute", "second"]): string {
  const rest = { hour: Math.floor(seconds / 3600), minute: Math.floor((seconds % 3600) / 60), second: seconds % 60 };
  const parts = unitsOf
    .filter((unit) => rest[unit] > 0)
    .map((unit) => new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "long", maximumFractionDigits: 0 }).format(rest[unit]));
  if (!parts.length) return new Intl.NumberFormat(locale, { style: "unit", unit: "second", unitDisplay: "long" }).format(0);
  return new Intl.ListFormat(locale, { style: "narrow", type: "unit" }).format(parts);
}

/** The whole playlist as people say it: "48 minutes", or "1 hour 12 minutes" past the hour. Seconds only matter under a minute. */
function totalOf(seconds: number, locale: string): string {
  if (seconds < 60) return spoken(seconds, locale);
  return spoken(Math.round(seconds / 60) * 60, locale, ["hour", "minute"]);
}

const FOCUS_RING = "outline-none after:rounded-xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40";

/**
 * Talks, demos and tutorials as a library: each playlist is a section with
 * its heading, a line about it and how much there is to watch ("6 videos, 48
 * minutes"), then a grid of 16:9 cards, each a thumbnail with a drawn play
 * mark and a duration chip, the title, the speaker and the date. The whole
 * card is one link to the video's page, or, with `onPlay`, one button that
 * hands the video to your own player. A card without a thumbnail falls back to
 * a muted tile with the first letter of the title, and the duration is spoken
 * in full ("12 minutes 4 seconds") as part of the link's name. `featured`
 * lets the first video lead the first playlist.
 */
export function VideoLibrary({
  playlists,
  featured = false,
  onPlay,
  title,
  description,
  headingLevel = 2,
  linkAs: Link = "a",
  labels: custom,
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: VideoLibraryProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Title = `h${headingLevel}` as "h1" | "h2" | "h3";
  const Playlist = `h${title ? headingLevel + 1 : headingLevel}` as "h1" | "h2" | "h3" | "h4";
  const numbers = new Intl.NumberFormat(locale);

  return (
    <section data-slot="video-library" className={cn("w-full break-words", className)} {...props}>
      {title || description ? (
        <header className="mb-12 max-w-2xl">
          {title ? <Title className="text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-balance sm:text-5xl">{title}</Title> : null}
          {description ? <p className={cn("text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg", title && "mt-4")}>{description}</p> : null}
        </header>
      ) : null}

      <div className="grid grid-cols-1 gap-16">
        {playlists.map((playlist, playlistIndex) => {
          const count = playlist.videos.length;
          const lengths = playlist.videos.map((video) => secondsOf(video.duration)).filter((value) => !Number.isNaN(value));
          const total = lengths.reduce((sum, value) => sum + value, 0);
          const headingId = `${id}-${playlistIndex}`;
          return (
            <div key={playlist.title}>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
                <div className="max-w-2xl min-w-0">
                  <Playlist id={headingId} className="text-2xl leading-snug font-medium tracking-[-0.03em]">
                    {playlist.title}
                  </Playlist>
                  {playlist.description ? <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground sm:text-base">{playlist.description}</p> : null}
                </div>
                <p className="inline-flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                  <IconVideo aria-hidden="true" className="size-4" />
                  <span>
                    <span className="tabular-nums">{numbers.format(count)}</span> {count === 1 ? labels.video : labels.videos}
                    {lengths.length ? (
                      <>
                        , <span className="tabular-nums">{totalOf(total, locale)}</span>
                      </>
                    ) : null}
                  </span>
                </p>
              </div>

              {count === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{labels.empty}</p>
              ) : (
                <ul role="list" aria-labelledby={headingId} className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                  {playlist.videos.map((video, videoIndex) => {
                    const lead = featured && playlistIndex === 0 && videoIndex === 0;
                    const tall = lead && count >= 3;
                    const length = secondsOf(video.duration);
                    const name = (
                      <>
                        {video.title}
                        <span className="sr-only">, {Number.isNaN(length) ? video.duration : spoken(length, locale)}</span>
                      </>
                    );
                    const titleClass = cn("text-[0.9375rem] leading-snug font-medium tracking-[-0.01em] text-pretty", lead && "lg:text-xl lg:tracking-[-0.02em]");
                    return (
                      <li key={`${video.title}-${video.date ?? videoIndex}`} className={cn("group/video relative flex min-w-0 flex-col", lead && "sm:col-span-2", tall && "lg:row-span-2")}>
                        <div className={cn("relative aspect-video overflow-hidden rounded-xl border border-border bg-muted", tall && "lg:flex-auto")}>
                          {video.thumbnail ? (
                            <img
                              src={video.thumbnail}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="absolute inset-0 size-full object-cover transition-transform duration-500 motion-safe:group-hover/video:scale-[1.03] motion-reduce:transition-none"
                            />
                          ) : (
                            // The play mark sits in the middle, so the letter takes the corner: the tile then reads as a title card, not an empty box.
                            <span aria-hidden="true" className={cn("absolute top-3 left-4 leading-none font-medium tracking-[-0.04em] text-muted-foreground/50 select-none", lead ? "text-8xl" : "text-6xl")}>
                              {Array.from(video.title.trim())[0]?.toUpperCase() ?? ""}
                            </span>
                          )}
                          <span
                            aria-hidden="true"
                            className={cn(
                              // The ring is the disc's own edge, in the opposite tone, so it holds on a thumbnail of its own colour.
                              "absolute top-1/2 left-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-foreground text-background shadow-sm ring-2 ring-background/80 transition-transform duration-200 motion-safe:group-hover/video:scale-110 motion-reduce:transition-none",
                              lead ? "size-14 sm:size-16" : "size-12",
                            )}
                          >
                            <svg viewBox="0 0 24 24" className={cn("translate-x-[1px]", lead ? "size-6 sm:size-7" : "size-5")} fill="currentColor" stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
                              <path d="M8.5 6v12l10-6z" />
                            </svg>
                          </span>
                          <span aria-hidden="true" className="absolute right-2.5 bottom-2.5 rounded-md bg-foreground px-1.5 py-0.5 text-xs leading-4 font-medium text-background tabular-nums">
                            {video.duration}
                          </span>
                        </div>
                        <div className="mt-3.5 min-w-0">
                          <p className={titleClass}>
                            {onPlay ? (
                              <button
                                type="button"
                                onClick={() => onPlay(video, playlist)}
                                className={cn("cursor-pointer text-left decoration-foreground/40 underline-offset-4 group-hover/video:underline after:absolute after:inset-0", FOCUS_RING)}
                              >
                                {name}
                              </button>
                            ) : video.href ? (
                              <Link href={video.href} className={cn("decoration-foreground/40 underline-offset-4 group-hover/video:underline after:absolute after:inset-0", FOCUS_RING)}>
                                {name}
                              </Link>
                            ) : (
                              name
                            )}
                          </p>
                          {video.speaker || video.date ? (
                            <p className="mt-1 text-sm leading-snug text-muted-foreground">
                              {video.speaker}
                              {video.speaker && video.date ? (
                              <>
                                <span aria-hidden="true"> &middot; </span>
                                <span className="sr-only">, </span>
                              </>
                            ) : null}
                              {video.date ? <time dateTime={video.date}>{formatDate(video.date, locale, timeZone)}</time> : null}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
