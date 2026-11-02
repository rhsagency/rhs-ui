"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";

import { IconArrowRight, IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

export interface CarouselFeature {
  /** A stable id for the feature. It keys the card, so it must be unique. */
  id: string;
  /** A picture for the top of the card, drawn to fill a 16:10 frame: an <img> (give it an alt) or an inline drawing. A card with an icon and no image gets a tile instead. */
  image?: ReactNode;
  /** A glyph from @rhs-ui/icons for the tile, used when there is no image. It is decoration: the title names the feature. */
  icon?: ReactNode;
  /** What the feature is called, in a few words: "Shared inboxes". */
  title: string;
  /** Two lines on what it does for the reader. */
  description: string;
  /** Where to read more. The whole card becomes a link, named by the title. */
  href?: string;
}

export interface FeatureCarouselLabels {
  /** The name of the button that goes back one card. */
  previous: string;
  /** The name of the button that goes on one card. */
  next: string;
  /** The counter, said politely as the cards move. {current} is the last card fully in view and {total} how many there are. */
  counter: string;
  /** The text of a card's link. */
  learnMore: string;
  /** What a screen reader adds after that text, so each link is named after its card. {title} stands for the card's title. */
  learnMoreAbout: string;
}

export interface FeatureCarouselProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "Product tour". */
  eyebrow?: string;
  /** The heading. It also names the carousel for assistive technology. */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** The cards, in order. Six or more is what a carousel is for; fewer than fit in a row simply sit there. */
  items: readonly CarouselFeature[];
  /** How wide a card is on a wide screen, in px. 320 by default. The cards are resized a little where that is needed for the next one to always show. */
  cardWidth?: number;
  /** How far the row runs on past the right edge of the block: a number of px, or a CSS length such as "1.5rem". Pass your page's side padding and the card that peeks runs off the edge of the screen instead of stopping at the margin, which says "swipe" far better on a phone. A length can be a variable such as "var(--page-gutter)", so it follows your page's padding and is 0 where the page has margin to spare. 0 by default. */
  bleed?: number | string;
  /** The level of the heading: 2 by default. The title of each card sits one level below. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<FeatureCarouselLabels>;
}

const LABELS: FeatureCarouselLabels = {
  previous: "Previous features",
  next: "Next features",
  counter: "{current} of {total}",
  learnMore: "Learn more",
  learnMoreAbout: "about {title}",
};

/** The space between cards, in px. It is gap-4 in the class list. */
const GAP = 16;
/** How much of the next card shows, as a share of a card, when the width has to be fitted. */
const PEEK = 0.24;

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The card width, in px, that makes the next card show by about a quarter of its width, or null when it already
 * shows by between a fifth and two fifths. A row of fixed-width cards can end exactly at the edge, so the next one is
 * hidden, or end just short of it, so the next one is nearly all there but cut: either reads as a mistake, and
 * neither signals that there is more.
 */
function fittedWidth(available: number, preferred: number, count: number): number | null {
  // Not laid out yet, such as inside a closed tab: there is nothing to fit, and the observer fires again once there is.
  if (available <= 0) return null;
  const base = Math.min(preferred, available * 0.82);
  if (count * base + (count - 1) * GAP <= available) return null;
  const whole = Math.max(1, Math.floor((available + GAP) / (base + GAP)));
  const peek = available - whole * (base + GAP);
  if (peek >= base * 0.18 && peek <= base * 0.4) return null;
  let best = base;
  let nearest = Infinity;
  for (const cards of [whole - 1, whole, whole + 1]) {
    if (cards < 1) continue;
    const width = (available - cards * GAP) / (cards + PEEK);
    if (Math.abs(width - base) < nearest) {
      best = width;
      nearest = Math.abs(width - base);
    }
  }
  return Math.round(best);
}

const ARROW = "rounded-full aria-disabled:pointer-events-none aria-disabled:opacity-50";

/**
 * Feature cards on native scroll snapping, for many features in little room: a grid of eight cards is a long
 * scroll on a phone, a row of them is a swipe. The next card always shows by about a quarter of its width, so it
 * is clear there is more; the cards are resized a little where the width would otherwise hide it. The heading and
 * the Previous and Next buttons share one header row, with a counter like "3 of 8" that is said politely as it
 * changes. It counts the last card fully in view and follows the real scroll position, whether the reader used the
 * buttons, a swipe or the keyboard, and it says nothing until the reader has moved the row, so opening the page
 * announces nothing. The buttons dim at the ends but stay focusable, so focus is never lost. While the track has
 * focus the arrow keys move one card, and Home and End go to the ends. Nothing autoplays, and under reduced motion
 * scrolling is instant. The server cannot know the width, so the row waits, hidden, for the moment the page has
 * fitted the cards to it and then fades in: it never visibly changes size. Without scripting it is shown as it is.
 */
export function FeatureCarousel({ eyebrow, title, description, items, cardWidth = 320, bleed = 0, headingLevel = 2, labels: custom, className, ...props }: FeatureCarouselProps) {
  const labels = { ...LABELS, ...custom };
  const track = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const frame = useRef(0);
  const [seen, setSeen] = useState(Math.min(1, items.length));
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  // False on the server and for the first render in the browser; true once the cards are fitted to the width.
  const [ready, setReady] = useState(false);
  // False until the reader moves the row. Only then is the counter a live region: a count that settles after
  // the page loads is not news, and a screen reader would otherwise announce it on every visit.
  const [moved, setMoved] = useState(false);

  const measure = useCallback(() => {
    const element = track.current;
    if (!element) return;
    const right = element.scrollLeft + element.clientWidth + 2;
    let last = 0;
    element.querySelectorAll<HTMLElement>("[data-card]").forEach((card, index) => {
      if (card.offsetLeft + card.offsetWidth <= right) last = index + 1;
    });
    setSeen(Math.max(1, last));
    setAtStart(element.scrollLeft <= 1);
    setAtEnd(element.scrollLeft + element.clientWidth >= element.scrollWidth - 1);
  }, []);

  const fit = useCallback(() => {
    const element = track.current;
    const cards = list.current;
    if (!element || !cards) return;
    const width = fittedWidth(element.clientWidth, cardWidth, items.length);
    if (width === null) cards.style.removeProperty("--rhs-fit");
    else cards.style.setProperty("--rhs-fit", `${width}px`);
  }, [cardWidth, items.length]);

  useLayoutEffect(() => {
    fit();
    measure();
    setReady(true);
    const element = track.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      fit();
      measure();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [fit, measure]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onScroll = () => {
    setMoved(true);
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(measure);
  };

  /** One card at a time: the next whose left edge is ahead of the scroll position, or the last one behind it. */
  const step = (direction: 1 | -1) => {
    const element = track.current;
    if (!element) return;
    const cards = Array.from(element.querySelectorAll<HTMLElement>("[data-card]"));
    const here = element.scrollLeft;
    const target = direction === 1 ? cards.find((card) => card.offsetLeft > here + 4) : cards.reverse().find((card) => card.offsetLeft < here - 4);
    if (!target) return;
    // The counter becomes a live region before the row starts to move, so the first change is the first one said.
    setMoved(true);
    element.scrollTo({ left: target.offsetLeft, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  /** A link focused with Tab can sit on the card that only peeks: bring the whole card into view, not just its edge. */
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const element = track.current;
    const card = (event.target as HTMLElement).closest<HTMLElement>("[data-card]");
    if (!element || !card) return;
    const outside = card.offsetLeft < element.scrollLeft - 1 || card.offsetLeft + card.offsetWidth > element.scrollLeft + element.clientWidth + 1;
    if (outside) card.scrollIntoView({ block: "nearest", inline: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const element = track.current;
    if (!element || event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return;
    const behavior = prefersReducedMotion() ? "auto" : "smooth";
    if (event.key === "ArrowRight") step(1);
    else if (event.key === "ArrowLeft") step(-1);
    else if (event.key === "Home" || event.key === "End") {
      setMoved(true);
      element.scrollTo({ left: event.key === "Home" ? 0 : element.scrollWidth, behavior });
    } else return;
    event.preventDefault();
  };

  const CardTitle = `h${headingLevel + 1}` as "h3" | "h4";
  const counter = labels.counter.replace("{current}", String(seen)).replace("{total}", String(items.length));

  return (
    <section data-slot="feature-carousel" className={cn("@container w-full break-words", className)} {...props}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-6 @lg:gap-x-8">
        {/* Under 512px the heading is as wide as its own text: a short title shares the row with the buttons, and a long one sends them below it. */}
        <SectionHeading className="min-w-0 flex-1 basis-auto @lg:basis-72" eyebrow={eyebrow} title={title} description={description} as={headingLevel === 3 ? "h3" : "h2"} />
        {/* The buttons do nothing until the page is interactive, and the count is only settled once the cards are fitted: both appear together. */}
        <div className={cn("ml-auto flex items-center gap-3 motion-safe:transition-opacity motion-safe:duration-200", !ready && "invisible opacity-0")}>
          <p role="status" aria-live={moved ? "polite" : "off"} aria-atomic="true" className="min-w-12 text-right text-sm text-muted-foreground tabular-nums">
            {counter}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="icon" aria-label={labels.previous} aria-disabled={atStart || undefined} onClick={() => (atStart ? undefined : step(-1))} className={ARROW}>
              <IconChevronLeft aria-hidden="true" />
            </Button>
            <Button type="button" variant="outline" size="icon" aria-label={labels.next} aria-disabled={atEnd || undefined} onClick={() => (atEnd ? undefined : step(1))} className={ARROW}>
              <IconChevronRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      {items.length ? (
        <div
          ref={track}
          role="group"
          aria-roledescription="carousel"
          aria-label={title}
          tabIndex={0}
          onScroll={onScroll}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          style={{ "--rhs-bleed": typeof bleed === "number" ? `${bleed}px` : bleed } as CSSProperties}
          className={cn(
            "relative mt-8 snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth rounded-lg outline-none [scrollbar-width:none] focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:scroll-auto @3xl:mt-10 [&::-webkit-scrollbar]:hidden",
            // The row runs on past the block by the bleed; the padding keeps the last card off the edge when it is scrolled to the end.
            "-mr-(--rhs-bleed) scroll-pr-(--rhs-bleed) pr-(--rhs-bleed)",
            "motion-safe:transition-opacity motion-safe:duration-200",
            // Held back until the cards are fitted to the width, so the server's cards never visibly change size. Without scripting it is shown as it is.
            !ready && "invisible opacity-0 [@media(scripting:none)]:visible [@media(scripting:none)]:opacity-100",
          )}
        >
          <ul ref={list} role="list" style={{ "--rhs-card": `${cardWidth}px` } as CSSProperties} className="flex w-max gap-4">
            {items.map((item) => (
              <li
                key={item.id}
                data-card=""
                className="relative flex w-[var(--rhs-fit,min(var(--rhs-card),82cqw))] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors duration-150 hover:border-foreground/30 motion-reduce:transition-none"
              >
                {item.image ? (
                  <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-border bg-muted [&>img]:size-full [&>img]:object-cover [&>svg]:size-full">
                    {item.image}
                  </div>
                ) : null}
                <div className="flex flex-1 flex-col p-5">
                  {!item.image && item.icon ? (
                    <span aria-hidden="true" className="mb-5 grid size-10 place-items-center rounded-lg border border-border bg-background text-foreground [&_svg]:size-5">
                      {item.icon}
                    </span>
                  ) : null}
                  <CardTitle className="text-base leading-snug font-medium tracking-[-0.01em] text-balance">{item.title}</CardTitle>
                  <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{item.description}</p>
                  {item.href ? (
                    <div className="mt-auto pt-5">
                      <a
                        href={item.href}
                        className="group/link inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 after:absolute after:inset-0 after:rounded-xl after:ring-inset after:ring-ring/50 hover:decoration-current focus-visible:after:ring-[3px] motion-reduce:transition-none"
                      >
                        {labels.learnMore}
                        <span className="sr-only"> {labels.learnMoreAbout.replace("{title}", item.title)}</span>
                        <IconArrowRight aria-hidden="true" className="size-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
                      </a>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
