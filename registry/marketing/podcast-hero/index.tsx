"use client";

import { useId, type ComponentProps } from "react";

import { IconArrowUpRight, IconPause, IconPlay } from "@rhs-ui/icons";
import { coverLines, coverSize, dayText, durationIso, durationText, fill, LABELS, listText, type PodcastHeroLabels } from "@rhs-ui/marketing/podcast-hero/format";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export type { PodcastHeroLabels } from "@rhs-ui/marketing/podcast-hero/format";

export interface PodcastCover {
  /** The address of the picture. A data: URI works too. Square is the design. */
  src: string;
  /** What the cover shows, as it reads on the cover: "Slow Signal, a podcast about quiet technology". It is the show's picture, so it needs a real alt. */
  alt: string;
  /** Intrinsic size, so the browser can reserve the space. */
  width?: number;
  height?: number;
  /** Candidate files for the browser to choose from, as in an <img srcset>. */
  srcSet?: string;
  /** How wide the cover is shown, as in an <img sizes>. Set it with `srcSet`. */
  sizes?: string;
}

export interface PodcastShow {
  /** The name of the show. It is the heading. */
  title: string;
  /** The people who host it, one name each. They are written as a list: "Maya Okafor and Luis Brandt". */
  hosts: readonly string[];
  /** One sentence on what the show is and who it is for. */
  description: string;
  /** The cover art. Leave it out and the hero draws a typographic cover from the show name. */
  cover?: PodcastCover;
}

export interface PodcastEpisode {
  /** The episode number as the show writes it: 48, or "S3 E12". */
  number: number | string;
  /** The episode's title. */
  title: string;
  /** The length in seconds. It is written as "48 min" and spoken as "48 minutes". */
  duration: number;
  /** The day it came out: an ISO day ("2026-10-12"), a timestamp or a Date. */
  publishedAt: string | Date;
  /** A sentence or two on what it is about. */
  description?: string;
}

export interface PodcastListenLink {
  /** The service, in words: "Apple Podcasts", "Spotify", "RSS". Names, not logos. */
  label: string;
  /** Where the show lives on that service. */
  href: string;
}

export interface PodcastHeroProps extends Omit<ComponentProps<"section">, "title" | "children" | "onPlay" | "onPause"> {
  /** The show name's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. The episode's title sits one level below it. */
  titleAs?: "h1" | "h2";
  /** The show: its name, hosts, pitch and cover. */
  show: PodcastShow;
  /** The latest episode, as a card with a Play button. Leave it out for a show that has no episodes yet. */
  latest?: PodcastEpisode;
  /** Where to listen, as text links: Apple Podcasts, Spotify, RSS. */
  listenLinks?: readonly PodcastListenLink[];
  /** Called with the latest episode when Play is pressed. The player lives elsewhere: this only tells it what to play. Without it the card has no button. */
  onPlay?: (episode: PodcastEpisode) => void;
  /** Called with the latest episode when Pause is pressed while `playing`. Leave it out and `onPlay` is called for both, so one handler can toggle. */
  onPause?: (episode: PodcastEpisode) => void;
  /** Whether the latest episode is playing, as your player reports it. The button then says Pause and the card says Now playing. */
  playing?: boolean;
  /** The language of the dates, the lengths and the list of hosts. Default "en-US". */
  locale?: string;
  /** The time zone a full timestamp is read in. A plain ISO day is that calendar day everywhere. Default "UTC". */
  timeZone?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<PodcastHeroLabels>;
}

/** Three bars that rise and fall while an episode plays, and stand still for a reader who asked for less motion. */
function Equalizer() {
  return (
    <span aria-hidden="true" className="flex h-3.5 items-end gap-[2px]">
      <span className="h-full w-[2.5px] origin-bottom rounded-full bg-current motion-safe:animate-rhs-podcast-eq motion-reduce:scale-y-[0.45]" />
      <span className="h-full w-[2.5px] origin-bottom rounded-full bg-current [animation-delay:-0.35s] motion-safe:animate-rhs-podcast-eq" />
      <span className="h-full w-[2.5px] origin-bottom rounded-full bg-current [animation-delay:-0.7s] motion-safe:animate-rhs-podcast-eq motion-reduce:scale-y-[0.7]" />
    </span>
  );
}

/** A cover set from the show name: black or white by theme, the name stacked and large, and rings like a signal in the corner. */
function DrawnCover({ title, hosts, label, alt }: { title: string; hosts: string | null; label: string; alt: string }) {
  const lines = coverLines(title);
  return (
    <div role="img" aria-label={alt} className="@container absolute inset-0 overflow-hidden bg-foreground text-background">
      {[78, 54, 30].map((size) => (
        <span key={size} aria-hidden="true" className="absolute top-[24%] left-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-background/25" style={{ width: `${size}cqi`, height: `${size}cqi` }} />
      ))}
      <span aria-hidden="true" className="absolute top-[24%] left-[80%] size-[4.5cqi] -translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
      <p aria-hidden="true" className="absolute top-[7cqi] left-[7cqi] text-[3.4cqi] font-medium tracking-[0.18em] text-background/70 uppercase">
        {label}
      </p>
      <div aria-hidden="true" className="absolute inset-x-[7cqi] bottom-[7cqi]">
        <p className="leading-[0.9] font-semibold tracking-[-0.055em]" style={{ fontSize: `${coverSize(lines)}cqi` }}>
          {lines.map((line, index) => (
            <span key={`${index}-${line}`} className="block">
              {line}
            </span>
          ))}
        </p>
        {hosts ? <p className="mt-[4cqi] text-[3.8cqi] leading-tight text-background/70">{hosts}</p> : null}
      </div>
    </div>
  );
}

/**
 * The opening for a podcast: a square cover on the left, and on the right the
 * show name, who hosts it, one sentence of pitch, the latest episode as a card
 * and the places to listen. The card holds the number, the title, the length
 * and the day, and a Play button that calls `onPlay`; the player itself is
 * yours and lives elsewhere, which keeps the hero a hero. Hand `playing` back
 * and the button says Pause and the card says Now playing. The length is
 * written "48 min" and spoken "48 minutes", both are time elements, and the
 * listen links are services named in text rather than logos. A show with no
 * cover art gets one set in type from its name, black on white or the reverse.
 */
export function PodcastHero({ titleAs: Title = "h2", show, latest, listenLinks = [], onPlay, onPause, playing = false, locale = "en-US", timeZone = "UTC", labels: custom, className, ...props }: PodcastHeroProps) {
  const words = { ...LABELS, ...custom };
  const id = useId();
  // The episode's title is one level under the show's, whichever level the show's is.
  const Sub = Title === "h1" ? "h2" : "h3";
  const hosts = show.hosts.length ? listText(show.hosts, locale) : null;
  const published = latest ? dayText(latest.publishedAt, locale, timeZone) : null;
  const hasLength = latest !== undefined && Number.isFinite(latest.duration) && latest.duration > 0;
  const press = latest ? () => (playing && onPause ? onPause(latest) : onPlay?.(latest)) : undefined;

  return (
    <section
      data-slot="podcast-hero"
      aria-labelledby={`${id}-title`}
      className={cn("grid items-center gap-9 py-14 sm:py-20 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16", className)}
      {...props}
    >
      <figure data-slot="podcast-hero-cover" className="relative w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-xs sm:max-w-xs md:max-w-none">
        <AspectRatio ratio={1}>
          {show.cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the cover is any URL or data URI
            <img
              src={show.cover.src}
              alt={show.cover.alt}
              width={show.cover.width}
              height={show.cover.height}
              srcSet={show.cover.srcSet}
              sizes={show.cover.sizes ?? "(min-width: 1024px) 26rem, (min-width: 768px) 15rem, 20rem"}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="size-full object-cover"
            />
          ) : (
            <DrawnCover title={show.title} hosts={hosts} label={words.podcast} alt={fill(words.coverAlt, { show: show.title })} />
          )}
        </AspectRatio>
      </figure>

      <div className="min-w-0">
        <Title id={`${id}-title`} className="text-4xl leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl [overflow-wrap:anywhere]">
          {show.title}
        </Title>
        {hosts ? <p className="mt-3 text-base text-pretty text-muted-foreground sm:text-lg">{fill(words.hostedBy, { hosts })}</p> : null}
        <p className="mt-5 max-w-xl text-lg leading-snug font-medium tracking-[-0.015em] text-pretty sm:text-xl">{show.description}</p>

        {latest ? (
          <div data-slot="podcast-hero-episode" data-playing={playing || undefined} className="mt-8 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xs transition-colors duration-200 data-[playing]:border-foreground/40 sm:p-6 motion-reduce:transition-none">
            <p className="flex min-h-5 flex-wrap items-center gap-x-2 text-sm font-medium text-muted-foreground">
              {playing ? <Equalizer /> : null}
              <span>{playing ? words.nowPlaying : words.latest}</span>
              <span aria-hidden="true">&middot;</span>
              <span className="tabular-nums">{fill(words.episode, { number: latest.number })}</span>
            </p>
            <Sub className="mt-2.5 text-xl leading-snug font-medium tracking-[-0.02em] text-balance sm:text-2xl [overflow-wrap:anywhere]">{latest.title}</Sub>
            {latest.description ? <p className="mt-2 text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground">{latest.description}</p> : null}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              {onPlay ? (
                <Button type="button" size="lg" onClick={press} aria-label={fill(playing ? words.pauseEpisode : words.playEpisode, { number: latest.number, title: latest.title })} className="min-w-28 max-sm:w-full">
                  {/* The bars are stroked, so they are drawn as heavy as the filled triangle the button shows before a play. */}
                  {playing ? <IconPause strokeWidth={3.5} /> : <IconPlay fill="currentColor" />}
                  {playing ? words.pause : words.play}
                </Button>
              ) : null}
              {hasLength || published ? (
                <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground tabular-nums max-sm:w-full max-sm:justify-center">
                  {/* The dot trails the length, so when the line wraps it ends a line and never starts one. */}
                  {hasLength ? (
                    <span>
                      <time dateTime={durationIso(latest.duration)}>
                        <span aria-hidden="true">{durationText(latest.duration, locale, "short")}</span>
                        <span className="sr-only">{durationText(latest.duration, locale, "long")}</span>
                      </time>
                      {published ? (
                        <span aria-hidden="true" className="ml-2">
                          &middot;
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                  {published ? <time dateTime={published.iso}>{published.text}</time> : null}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {listenLinks.length ? (
          <nav aria-label={fill(words.listenNav, { show: show.title })} className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-2 text-sm">
            <span aria-hidden="true" className="text-muted-foreground">
              {words.listenOn}
            </span>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {listenLinks.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  <a
                    href={link.href}
                    className="group/link inline-flex items-center gap-1 rounded-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                  >
                    {link.label}
                    <IconArrowUpRight className="size-3.5 text-muted-foreground transition-transform duration-150 group-hover/link:translate-x-px group-hover/link:-translate-y-px motion-reduce:transition-none" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </section>
  );
}
