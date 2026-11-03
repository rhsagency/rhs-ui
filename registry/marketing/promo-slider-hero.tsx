"use client";

import { useLayoutEffect, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";

import { IconArrowRight, IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface PromoSlideImage {
  /** The address of the picture. A data: URI works too. */
  src: string;
  /** What the picture shows. Leave it empty when it only decorates the offer. */
  alt: string;
  /** Intrinsic size, so the browser can reserve the space. */
  width?: number;
  height?: number;
  /** Candidate files for the browser to choose from, as in an <img srcset>. */
  srcSet?: string;
  /** How wide the picture is shown, as in an <img sizes>. Set it with `srcSet`. The default is half the screen from md, the whole width below. */
  sizes?: string;
  /** A tiny picture, as a data: URI of a few hundred bytes, that stands in blurred while the real one loads. */
  blurDataUrl?: string;
}

export interface PromoSlide {
  /** A stable key for the slide, such as the campaign's slug. */
  id: string;
  /** A few words above the headline: "Autumn sale". */
  eyebrow?: string;
  /** The headline of the promotion. */
  title: string;
  /** One or two sentences under it: the offer and its end date. */
  description?: string;
  /** The one action on the slide. */
  cta: { label: string; href: string };
  /** The campaign's picture. It fills its half of the panel and is cropped to fit. */
  image: PromoSlideImage;
  /** The panel's surface: "plain" (the card colour), "muted" (a soft grey) or "inverse" (the opposite of the page: dark on a light page, light on a dark one). Alternate them and each campaign gets its own face without a colour. */
  tone?: "plain" | "muted" | "inverse";
}

export interface PromoSliderLabels {
  /** The previous button's name. */
  previous: string;
  /** The next button's name. */
  next: string;
  /** A dot's name. `{n}` is its number and `{total}` the count. */
  goTo: string;
  /** The counter, and each slide's own name. `{n}` and `{total}`. */
  counter: string;
  /** What a screen reader hears when the slide changes. `{n}`, `{total}` and `{title}`, the new slide's headline. */
  announce: string;
}

const LABELS: PromoSliderLabels = { previous: "Previous slide", next: "Next slide", goTo: "Go to slide {n} of {total}", counter: "{n} of {total}", announce: "Slide {n} of {total}: {title}" };

const fill = (template: string, n: number, total: number, title = "") => template.replace("{n}", String(n)).replace("{total}", String(total)).replace("{title}", title);

const TONES = {
  plain: { panel: "border border-border bg-card text-card-foreground", quiet: "text-muted-foreground", cta: "" },
  muted: { panel: "bg-muted text-foreground", quiet: "text-muted-foreground", cta: "" },
  // The button's own focus ring is the ring colour at 40%, which is the panel's ink here: the halo takes the panel's text colour instead.
  inverse: { panel: "bg-primary text-primary-foreground", quiet: "text-primary-foreground/70", cta: "bg-background text-foreground hover:bg-background/90 focus-visible:ring-primary-foreground/60" },
} as const;

/** How long the track must lie still before the slide it stopped on counts as the visitor's choice. */
const SETTLE_MS = 120;

export interface PromoSliderHeroProps extends Omit<ComponentProps<"section">, "title" | "children" | "onChange"> {
  /** The slide headlines' element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. Only the current slide is exposed to assistive technology, so a page never has more than one. */
  titleAs?: "h1" | "h2" | "h3";
  /** The campaigns, in the order you want them seen. Two to six read best. */
  slides: readonly PromoSlide[];
  /** The region's accessible name: "Current promotions". */
  label: string;
  /** The slide to start on, counting from 0. */
  initial?: number;
  /** Called with the new slide's index once the visitor has come to rest on it, by a button, a dot, a key or a swipe. A jump across several slides reports only the one it lands on. It is optional; a Server Component cannot pass a function, so leave it out there. */
  onSlideChange?: (index: number) => void;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<PromoSliderLabels>;
}

/**
 * A hero that carries several campaigns at once: each slide is a full panel
 * with its own eyebrow, headline, line, button and picture, laid on native
 * scroll snapping, so a swipe or a trackpad works with no script. Previous
 * and Next buttons, numbered dots and a "2 of 4" counter announced politely
 * move the visitor around; the arrow keys, Home and End work anywhere in the
 * region. Nothing ever advances on a timer, slides that are off screen are
 * inert so Tab never lands on a button nobody can see, and the first slide's
 * picture loads with priority. The dots and the counter follow the track as it
 * moves, but the announcement and `onSlideChange` wait until it has come to
 * rest, so a jump from the first slide to the fourth is read out once, for the
 * slide it lands on. The calm answer to the auto-rotating banner: a retailer
 * gets several promotions into one hero and the visitor stays in control.
 */
export function PromoSliderHero({ titleAs: Title = "h2", slides, label, initial = 0, onSlideChange, labels, className, onKeyDown, ...props }: PromoSliderHeroProps) {
  const words = { ...LABELS, ...labels };
  const count = slides.length;
  const first = Math.min(Math.max(Math.trunc(initial) || 0, 0), Math.max(count - 1, 0));
  const region = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const timer = useRef(0);
  /** The slide the track is nearest to right now: the dots and the counter follow it while the track moves. */
  const at = useRef(first);
  /** The slide the visitor last came to rest on: the one that is announced and reported. */
  const rested = useRef(first);
  /** The slide a button, dot or key asked for, until the track gets there. Null while the visitor swipes. */
  const goal = useRef<number | null>(null);
  const notify = useRef(onSlideChange);
  const [current, setCurrent] = useState(first);
  const [announced, setAnnounced] = useState(first);

  /** The slide whose left edge is nearest the track's: the one the visitor is looking at. */
  function nearest(): number {
    const node = track.current;
    if (!node) return at.current;
    const edge = node.getBoundingClientRect().left;
    let best = 0;
    let distance = Number.POSITIVE_INFINITY;
    Array.from(node.children).forEach((child, index) => {
      const gap = Math.abs(child.getBoundingClientRect().left - edge);
      if (gap < distance) {
        distance = gap;
        best = index;
      }
    });
    return best;
  }

  /** The track has stopped. The slide it stopped on is the visitor's choice: it is announced and reported once, and only if it is not the one they were already on. */
  function settle() {
    window.clearTimeout(timer.current);
    goal.current = null;
    const index = nearest();
    at.current = index;
    setCurrent(index);
    if (index === rested.current) return;
    rested.current = index;
    setAnnounced(index);
    notify.current?.(index);
  }

  /** Starts waiting for the track to lie still. Every scroll frame, and every request for a slide, starts the wait again. */
  function wait() {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(settle, SETTLE_MS);
  }

  function sync() {
    const index = nearest();
    // The dots and the counter keep up with the track, slide by slide.
    if (index !== at.current) {
      at.current = index;
      setCurrent(index);
    }
    // The announcement does not: a jump the visitor asked for settles the moment the track gets there, however many slides it passed on the way, and a swipe once it lies still.
    if (goal.current !== null && index === goal.current) settle();
    else wait();
  }

  function goTo(index: number, behavior: "smooth" | "instant" = "smooth") {
    const node = track.current;
    const to = Math.min(Math.max(index, 0), (node?.children.length ?? 1) - 1);
    const slide = node?.children[to];
    if (!node || !slide) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Every slide is as wide as the track, so lining a slide's left edge up with the track's is the same in either text direction.
    const shift = slide.getBoundingClientRect().left - node.getBoundingClientRect().left;
    // Remember where the visitor is headed, and wait: if the track is already there it never scrolls, and the wait ends the request anyway.
    goal.current = to;
    wait();
    node.scrollTo({ left: node.scrollLeft + shift, behavior: reduce ? "instant" : behavior });
  }

  // The latest callback, read when the track settles, which can be a moment after the render that started the wait.
  useLayoutEffect(() => {
    notify.current = onSlideChange;
  });

  // A start slide other than the first is scrolled to before the first paint; a resize keeps the visitor on the same slide.
  useLayoutEffect(() => {
    const node = track.current;
    if (!node) return;
    if (at.current > 0) goTo(at.current, "instant");
    let width = node.clientWidth;
    const observer = new ResizeObserver(() => {
      if (node.clientWidth === width) return;
      width = node.clientWidth;
      goTo(at.current, "instant");
    });
    observer.observe(node);
    // Where the browser has the scrollend event the track settles the instant it stops; elsewhere the wait above does it.
    node.addEventListener("scrollend", settle);
    return () => {
      observer.disconnect();
      node.removeEventListener("scrollend", settle);
      cancelAnimationFrame(frame.current);
      window.clearTimeout(timer.current);
    };
    // The effect reads the live refs only, so it runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if ((event.target as HTMLElement).closest("input, textarea, select, [contenteditable]")) return;
    const rtl = track.current ? getComputedStyle(track.current).direction === "rtl" : false;
    let target: number;
    if (event.key === "Home") target = 0;
    else if (event.key === "End") target = count - 1;
    else if (event.key === "ArrowRight") target = at.current + (rtl ? -1 : 1);
    else if (event.key === "ArrowLeft") target = at.current + (rtl ? 1 : -1);
    else return;
    event.preventDefault();
    // The slide holding focus is about to go inert; keep the visitor's place in the region instead of dropping it on the page.
    if (track.current?.contains(document.activeElement)) region.current?.focus({ preventScroll: true });
    goTo(target);
  }

  if (!count) return null;

  const atStart = current === 0;
  const atEnd = current === count - 1;
  const arrow = "aria-disabled:pointer-events-none aria-disabled:opacity-50";

  return (
    <section
      {...props}
      ref={region}
      tabIndex={-1}
      aria-roledescription="carousel"
      aria-label={label}
      data-slot="promo-slider-hero"
      onKeyDown={handleKeyDown}
      className={cn("group/region py-16 outline-none sm:py-20", className)}
    >
      <div
        ref={track}
        onScroll={() => {
          cancelAnimationFrame(frame.current);
          frame.current = requestAnimationFrame(sync);
        }}
        className="relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain rounded-2xl [scrollbar-width:none] group-focus-visible/region:ring-[3px] group-focus-visible/region:ring-ring/40 [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, index) => {
          const tone = TONES[slide.tone ?? "plain"];
          const { image } = slide;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={fill(words.counter, index + 1, count)}
              inert={index === current ? undefined : true}
              className="min-w-0 shrink-0 basis-full snap-start snap-always"
            >
              <article data-slot="promo-slider-hero-slide" className={cn("grid h-full overflow-hidden rounded-2xl md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]", tone.panel)}>
                <div className="order-2 flex min-w-0 flex-col items-start justify-center gap-4 p-6 sm:p-8 md:order-1 lg:gap-5 lg:p-12">
                  {slide.eyebrow ? <p className={cn("text-sm font-medium", tone.quiet)}>{slide.eyebrow}</p> : null}
                  <Title className="text-3xl leading-[1.05] font-medium tracking-[-0.04em] text-balance sm:text-4xl md:text-3xl lg:text-5xl">{slide.title}</Title>
                  {slide.description ? <p className={cn("max-w-sm text-base leading-relaxed text-pretty", tone.quiet)}>{slide.description}</p> : null}
                  <Button asChild size="lg" className={cn("mt-2", tone.cta)}>
                    <a href={slide.cta.href}>
                      {slide.cta.label}
                      <IconArrowRight />
                    </a>
                  </Button>
                </div>
                <div className="relative order-1 aspect-[16/10] overflow-hidden bg-muted md:order-2 md:aspect-auto md:min-h-[22rem] lg:min-h-[26rem]">
                  {image.blurDataUrl ? <span aria-hidden="true" className="absolute inset-0 scale-110 bg-cover bg-center blur-xl" style={{ backgroundImage: `url("${image.blurDataUrl}")` }} /> : null}
                  {/* eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the picture is any URL or data URI */}
                  <img
                    src={image.src}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    srcSet={image.srcSet}
                    sizes={image.sizes ?? "(min-width: 768px) 50vw, 100vw"}
                    loading={index === first ? "eager" : "lazy"}
                    fetchPriority={index === first ? "high" : undefined}
                    decoding="async"
                    className="absolute inset-0 size-full object-cover"
                  />
                </div>
              </article>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          {/* The dots are 24px targets around a 20px pill, so the first one is pulled left by the 2px of target that lies outside the pill. */}
          <div className="-ml-0.5 flex items-center">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={fill(words.goTo, index + 1, count)}
                aria-current={index === current ? "true" : undefined}
                onClick={() => goTo(index)}
                className="group/dot grid size-6 place-items-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-1.5 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none",
                    index === current ? "w-5 bg-foreground" : "w-1.5 bg-foreground/25 group-hover/dot:bg-foreground/50",
                  )}
                />
              </button>
            ))}
          </div>
          <p aria-hidden="true" className="text-sm text-muted-foreground tabular-nums">
            {fill(words.counter, current + 1, count)}
          </p>
          {/* The counter is for the eye and follows the track; this is what is said when the track comes to rest on a slide, politely, with its headline. */}
          <p aria-live="polite" aria-atomic="true" className="sr-only">
            {fill(words.announce, announced + 1, count, slides[announced]?.title)}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="icon" aria-label={words.previous} aria-disabled={atStart || undefined} onClick={() => !atStart && goTo(current - 1)} className={arrow}>
            <IconChevronLeft />
          </Button>
          <Button type="button" variant="outline" size="icon" aria-label={words.next} aria-disabled={atEnd || undefined} onClick={() => !atEnd && goTo(current + 1)} className={arrow}>
            <IconChevronRight />
          </Button>
        </div>
      </div>
    </section>
  );
}
