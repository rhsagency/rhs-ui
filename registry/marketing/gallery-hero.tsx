"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from "react";

import { IconArrowRight, IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface GalleryPhoto {
  /** The address of the photograph. A data: URI works too. */
  src: string;
  /** What the photograph shows. It is the work, so it needs a real alt. */
  alt: string;
  /** The title of this photograph: "Concrete at dawn". */
  title: string;
  /** Where it was taken: "Rotterdam". */
  place?: string;
  /** The year, as the series dates it. */
  year?: string | number;
  /** Who made it: "Eva Lind". The words before it, "Photo:", come from the labels. */
  credit?: string;
  /** Intrinsic size, so the browser can reserve the space. */
  width?: number;
  height?: number;
  /** Candidate files for the browser to choose from, as in an <img srcset>. */
  srcSet?: string;
  /** How wide the photograph is shown, as in an <img sizes>. Set it with `srcSet`; it is the full width of the page up to 72rem by default. */
  sizes?: string;
  /** A small file for the thumbnail strip. Left out, the thumbnail is the photograph itself, which is fine for a few light files and wasteful for a series of large ones. */
  thumb?: string;
}

/** The words the hero says. `{n}`, `{total}`, `{title}` and `{credit}` are filled in. */
export interface GalleryHeroLabels {
  previous: string;
  next: string;
  /** The accessible name of a thumbnail. */
  showPhoto: string;
  /** Names the strip of thumbnails. */
  thumbnails: string;
  /** The words before the credit. */
  photoBy: string;
  /** Which photograph is showing, for assistive technology; it opens what the live region says when the photograph changes. */
  position: string;
}

export interface GalleryHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** The name of the series. It is the heading, and it stays small in a corner so the photograph carries the page. */
  title: string;
  /** The photographs, in order. Two or more, for the arrows and the thumbnails to mean something. */
  photos: readonly GalleryPhoto[];
  /** The photograph shown first, counted from 0. Default 0. */
  initial?: number;
  /** One link over the corner of the photograph: "View the series". */
  cta?: { label: string; href: string };
  /** Called with the new index when the photograph changes. */
  onIndexChange?: (index: number) => void;
  /** The language of the counter. Default "en-US". */
  locale?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<GalleryHeroLabels>;
}

const LABELS: GalleryHeroLabels = {
  previous: "Previous photo",
  next: "Next photo",
  showPhoto: "Show photo {n}: {title}",
  thumbnails: "Photos",
  photoBy: "Photo: {credit}",
  position: "Photo {n} of {total}",
};

/** What the browser is told about the width of the photograph when you give none: the page, up to 72rem. */
const PHOTO_SIZES = "(min-width: 1152px) 72rem, 100vw";

/** "{name}" and friends in a template, filled in. */
function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

/**
 * A full-bleed photograph as the opening of a series. One picture fills the
 * frame, the series title stays small in one corner and a link sits in the
 * other, and a quiet caption bar underneath gives the title and place on the
 * left, the year and credit on the right, and a "03 / 08" counter with
 * Previous and Next. A strip of thumbnails switches the picture, and so do the
 * arrow keys, Home and End while focus is inside the gallery, and a swipe on
 * a touch screen. Changing the picture fades the new one in over the old and
 * fetches the pictures either side of it; the caption is announced through a
 * polite live region; and no timer ever advances it. For photographers,
 * architects and studios whose work is a picture.
 */
export function GalleryHero({ titleAs: Title = "h2", title, photos, initial = 0, cta, onIndexChange, locale = "en-US", labels: custom, className, onKeyDown, ...props }: GalleryHeroProps) {
  const words = { ...LABELS, ...custom };
  const id = useId();
  const count = photos.length;
  const [index, setIndex] = useState(() => Math.min(Math.max(0, Math.floor(initial) || 0), Math.max(0, count - 1)));
  // The picture that is fading out under the new one, until the new one is in.
  const [leaving, setLeaving] = useState<number | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  const changed = useRef(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const first = useRef(index);
  const shown = count ? Math.min(index, count - 1) : 0;
  const photo = photos[shown];

  const go = (next: number) => {
    if (!count) return;
    const target = ((next % count) + count) % count;
    if (target === shown) return;
    changed.current = true;
    setLeaving(shown);
    setIndex(target);
    onIndexChange?.(target);
  };

  useEffect(() => {
    if (leaving === null) return;
    const timer = window.setTimeout(() => setLeaving(null), 650);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  // The pictures either side are fetched ahead, so an arrow never waits. The effect runs when those two pictures change, not on every render of a page that passes its photos inline.
  const nearby = count > 1 ? [shown + 1, shown - 1].map((near) => photos[((near % count) + count) % count]) : [];
  const nearbyKey = nearby.map((target) => `${target?.src ?? ""} ${target?.srcSet ?? ""}`).join("|");
  useEffect(() => {
    for (const target of nearby) {
      if (!target) continue;
      const image = new window.Image();
      // The same candidates and the same width as the picture will be shown with, so the browser fetches the file it will use.
      if (target.srcSet) {
        image.sizes = target.sizes ?? PHOTO_SIZES;
        image.srcset = target.srcSet;
      }
      image.src = target.src;
    }
  }, [nearbyKey]);

  // After a change, the strip brings the thumbnail to the middle: sideways only, the page itself never scrolls.
  useEffect(() => {
    const row = strip.current;
    if (!changed.current || !row || row.scrollWidth <= row.clientWidth) return;
    const thumb = row.querySelector<HTMLElement>('[aria-current="true"]');
    if (!thumb) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollTo({ left: thumb.offsetLeft - (row.clientWidth - thumb.offsetWidth) / 2, behavior: smooth ? "smooth" : "auto" });
  }, [shown]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || count < 2) return;
    const target = event.key === "ArrowRight" ? shown + 1 : event.key === "ArrowLeft" ? shown - 1 : event.key === "Home" ? 0 : event.key === "End" ? count - 1 : null;
    if (target === null) return;
    event.preventDefault();
    go(target);
  };

  // A finger swipes across the photograph: sideways and far enough, and more sideways than up or down, or it is the page being scrolled.
  const swipeStart = (event: PointerEvent<HTMLElement>) => {
    swipe.current = event.pointerType === "mouse" ? null : { x: event.clientX, y: event.clientY };
  };
  const swipeEnd = (event: PointerEvent<HTMLElement>) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start || count < 2) return;
    const across = event.clientX - start.x;
    const down = event.clientY - start.y;
    if (Math.abs(across) >= 48 && Math.abs(across) > Math.abs(down) * 1.5) go(shown + (across < 0 ? 1 : -1));
  };

  if (!photo) return null;

  const pad = new Intl.NumberFormat(locale, { minimumIntegerDigits: Math.max(2, String(count).length), useGrouping: false });
  const credit = photo.credit ? fill(words.photoBy, { credit: photo.credit }) : null;
  const meta = [photo.year === undefined ? null : String(photo.year), credit].filter(Boolean);
  const where = fill(words.position, { n: shown + 1, total: count });
  const layers = [leaving, shown].filter((value): value is number => value !== null && photos[value] !== undefined);

  return (
    <section data-slot="gallery-hero" aria-labelledby={`${id}-title`} className={cn("py-14 sm:py-20", className)} onKeyDown={handleKeyDown} {...props}>
      <div className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-xs">
        <div
          data-slot="gallery-hero-photo"
          onPointerDown={swipeStart}
          onPointerUp={swipeEnd}
          onPointerCancel={() => (swipe.current = null)}
          className="relative aspect-[4/5] touch-pan-y bg-muted sm:aspect-[3/2] lg:aspect-[16/9]"
        >
          {layers.map((position) => {
            const entry = photos[position];
            if (!entry) return null;
            const current = position === shown;
            return (
              // eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the photograph is any URL or data URI
              <img
                key={position}
                src={entry.src}
                srcSet={entry.srcSet}
                sizes={entry.srcSet ? (entry.sizes ?? PHOTO_SIZES) : undefined}
                alt={current ? entry.alt : ""}
                aria-hidden={current ? undefined : true}
                width={entry.width}
                height={entry.height}
                loading="eager"
                fetchPriority={position === first.current ? "high" : "auto"}
                decoding="async"
                draggable={false}
                className={cn("absolute inset-0 size-full object-cover", current && leaving !== null && "motion-safe:animate-rhs-gallery-photo")}
                style={{ zIndex: current ? 1 : 0 }}
              />
            );
          })}
          <div className="absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-3 sm:inset-x-5 sm:top-5">
            <Title id={`${id}-title`} className="min-w-0 rounded-lg bg-background px-3 py-1.5 text-sm leading-snug font-medium tracking-[-0.01em] text-foreground shadow-xs sm:px-3.5 sm:py-2 [overflow-wrap:anywhere]">
              {title}
            </Title>
            {cta ? (
              <Button asChild size="sm" variant="outline" className="shrink-0 shadow-xs">
                <a href={cta.href}>
                  {cta.label}
                  <IconArrowRight className="transition-transform duration-150 group-hover/button:translate-x-0.5 motion-reduce:transition-none" />
                </a>
              </Button>
            ) : null}
          </div>
        </div>

        <div data-slot="gallery-hero-caption" className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-border px-4 py-3.5 sm:px-6 sm:py-4">
          <div key={shown} className="min-w-0 flex-1 basis-56 motion-safe:animate-rhs-gallery-caption">
            <p className="text-base leading-snug font-medium tracking-[-0.01em] text-pretty [overflow-wrap:anywhere]">{photo.title}</p>
            {photo.place ? <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{photo.place}</p> : null}
          </div>
          <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:gap-8">
            {meta.length ? (
              <p key={shown} className="min-w-0 text-sm text-muted-foreground tabular-nums sm:text-right motion-safe:animate-rhs-gallery-caption">
                {meta.join("\u00a0\u00b7 ")}
              </p>
            ) : null}
            <div className="ml-auto flex shrink-0 items-center gap-2 sm:ml-0">
              <p className="mr-1 text-sm font-medium whitespace-nowrap tabular-nums">
                <span aria-hidden="true">
                  {pad.format(shown + 1)}
                  <span className="text-muted-foreground"> / {pad.format(count)}</span>
                </span>
                <span className="sr-only">{where}</span>
              </p>
              <Button type="button" variant="outline" size="icon" aria-label={words.previous} onClick={() => go(shown - 1)} disabled={count < 2} className="size-9 sm:size-10">
                <IconChevronLeft />
              </Button>
              <Button type="button" variant="outline" size="icon" aria-label={words.next} onClick={() => go(shown + 1)} disabled={count < 2} className="size-9 sm:size-10">
                <IconChevronRight />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {count > 1 ? (
        <div ref={strip} role="group" aria-label={words.thumbnails} className="relative -mx-1 mt-3 flex snap-x gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] sm:mt-4 sm:gap-2.5 [&::-webkit-scrollbar]:hidden">
          {photos.map((entry, position) => (
            <button
              key={`${position}-${entry.title}`}
              type="button"
              aria-label={fill(words.showPhoto, { n: position + 1, title: entry.title })}
              aria-current={position === shown ? "true" : undefined}
              onClick={() => go(position)}
              className="relative h-12 w-[4.5rem] shrink-0 snap-start overflow-hidden rounded-lg border border-border bg-muted opacity-60 outline-none transition-[opacity,box-shadow] duration-200 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=true]:opacity-100 aria-[current=true]:ring-2 aria-[current=true]:ring-foreground aria-[current=true]:ring-offset-2 aria-[current=true]:ring-offset-background sm:h-14 sm:w-[5.25rem] motion-reduce:transition-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the thumbnail is any URL or data URI */}
              <img src={entry.thumb ?? entry.src} alt="" loading="lazy" decoding="async" draggable={false} className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <p role="status" className="sr-only">
        {[where, [photo.title, photo.place, photo.year === undefined ? null : String(photo.year), credit].filter(Boolean).join(", ")].join(": ")}
      </p>
    </section>
  );
}
