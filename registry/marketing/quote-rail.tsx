"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps } from "react";

import { IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { Rating } from "@rhs-ui/primitives/rating";
import { cn } from "@/lib/utils";

export interface RailQuote {
  /** Identifies the quote in the rail. */
  id: string;
  /** What they said, without quotation marks: the rail adds them. */
  quote: string;
  /** Who said it. Also the source of the initials when there is no portrait. */
  name: string;
  /** Their job and company: "Head of operations, Northwind". */
  role: string;
  /** A portrait. Initials stand in until it loads, and when there is none. */
  avatar?: string;
  /** Out of five, to the half star. Leave it out for a quote without stars. */
  rating?: number;
}

export interface QuoteRailLabels {
  /** The name of the button that moves back. Default "Previous quotes". */
  previous: string;
  /** The name of the button that moves on. Default "Next quotes". */
  next: string;
  /** What a screen reader hears for the stars; `{rating}` and `{max}` are filled in. Default "Rated {rating} out of {max}". */
  rated: string;
  /** Announced after a button press when one quote is in view; `{current}` and `{total}` are filled in. Default "Quote {current} of {total}". */
  position: string;
  /** The same when several are in view; `{from}`, `{to}` and `{total}` are filled in. Default "Quotes {from} to {to} of {total}". */
  range: string;
}

export interface QuoteRailProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** Six to twelve quotes, in the order they are read. Every card is as wide as a readable line and as tall as the tallest. */
  items: readonly RailQuote[];
  /** The heading of the section. It also names the rail for screen readers. */
  title: string;
  /** One or two sentences under the title. */
  description?: string;
  /** The locale of the counter's numbers. Default "en-US". */
  locale?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<QuoteRailLabels>;
}

const LABELS: QuoteRailLabels = {
  previous: "Previous quotes",
  next: "Next quotes",
  rated: "Rated {rating} out of {max}",
  position: "Quote {current} of {total}",
  range: "Quotes {from} to {to} of {total}",
};

const MAX_STARS = 5;
/** A card counts as in view once this much of it is. */
const IN_VIEW = 0.6;

interface RailState {
  canPrevious: boolean;
  canNext: boolean;
  /** Index of the first card in view, and of the last. */
  first: number;
  last: number;
  /** The scroll position as a share of the rail, for the thin progress line. */
  thumbLeft: number;
  thumbWidth: number;
}

const START: RailState = { canPrevious: false, canNext: false, first: 0, last: 0, thumbLeft: 0, thumbWidth: 100 };

/** A template with `{name}` holes, filled in. */
const fill = (template: string, values: Record<string, string | number>): string => template.replace(/\{(\w+)\}/g, (hole, name: string) => String(values[name] ?? hole));

/** A number formatter that survives a locale the browser does not know. */
function numberFormat(locale: string): Intl.NumberFormat {
  try {
    return new Intl.NumberFormat(locale);
  } catch {
    return new Intl.NumberFormat("en-US");
  }
}

const sameState = (a: RailState, b: RailState): boolean =>
  a.canPrevious === b.canPrevious && a.canNext === b.canNext && a.first === b.first && a.last === b.last && a.thumbLeft === b.thumbLeft && a.thumbWidth === b.thumbWidth;

/** The stars for a rating, as one image whose name is the sentence. */
function Stars({ rating, label }: { rating: number; label: string }) {
  return (
    <span role="img" aria-label={label} className="inline-flex">
      <span aria-hidden="true" className="inline-flex">
        <Rating readOnly value={Math.min(MAX_STARS, Math.max(0, rating))} max={MAX_STARS} size={16} />
      </span>
    </span>
  );
}

/** The two round buttons share this: a button that cannot move says so with aria-disabled and keeps its place in the tab order. */
const ARROW = "rounded-full aria-disabled:pointer-events-none aria-disabled:opacity-50";

/**
 * Many quotes, little height: one row of cards, each as wide as a readable
 * line, that scrolls sideways and snaps card by card. It is the browser's own
 * scrolling underneath, so a swipe, a trackpad and the arrow keys work with no
 * script, and nothing ever moves by itself. Two round buttons step one card
 * back or on and rest at the ends; after a press a polite live region says
 * where you are ("Quote 3 of 9", or "Quotes 3 to 5 of 9" when several are in
 * view), and a thin line and a count under the rail show it to everyone else.
 * On a phone the rail runs to the screen edge and the next card peeks in, which
 * is the only hint that there is more; set `--rail-gutter` on the section to
 * your page's side padding (default 1.5rem) so the first card still lines up
 * with your text.
 */
export function QuoteRail({ items, title, description, locale = "en-US", labels, className, ...props }: QuoteRailProps) {
  const words = { ...LABELS, ...labels };
  const heading = useId();
  const railId = useId();
  const rail = useRef<HTMLUListElement>(null);
  const frame = useRef(0);
  const settle = useRef(0);
  const pressed = useRef(false);
  const [state, setState] = useState<RailState>(START);
  const [announced, setAnnounced] = useState<{ first: number; last: number } | null>(null);
  const total = items.length;
  const numbers = numberFormat(locale);

  /** Where the rail is: which cards are in view and whether there is more on either side. */
  const measure = useCallback((): RailState | null => {
    const element = rail.current;
    if (!element) return null;
    const { scrollLeft, scrollWidth, clientWidth } = element;
    const cards = Array.from(element.children) as HTMLElement[];
    let first = -1;
    let last = -1;
    cards.forEach((card, index) => {
      const overlap = Math.min(card.offsetLeft + card.offsetWidth, scrollLeft + clientWidth) - Math.max(card.offsetLeft, scrollLeft);
      if (overlap >= card.offsetWidth * IN_VIEW) {
        if (first < 0) first = index;
        last = index;
      }
    });
    if (first < 0) {
      // No card is mostly in view (a card wider than the rail): take the one the scroll is nearest to.
      const step = Math.max(1, (cards[1]?.offsetLeft ?? 1) - (cards[0]?.offsetLeft ?? 0));
      first = last = Math.min(Math.max(0, cards.length - 1), Math.max(0, Math.round(scrollLeft / step)));
    }
    const round = (value: number): number => Math.round(value * 10) / 10;
    return {
      canPrevious: scrollLeft > 1,
      canNext: scrollLeft + clientWidth < scrollWidth - 1,
      first,
      last,
      thumbLeft: scrollWidth > 0 ? round((scrollLeft / scrollWidth) * 100) : 0,
      thumbWidth: scrollWidth > 0 ? round(Math.min(100, (clientWidth / scrollWidth) * 100)) : 100,
    };
  }, []);

  const sync = useCallback(() => {
    const next = measure();
    if (next) setState((previous) => (sameState(previous, next) ? previous : next));
  }, [measure]);

  /** After a button press, say where the rail came to rest once it has stopped moving. */
  const announceWhenStill = useCallback(() => {
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      pressed.current = false;
      const now = measure();
      if (now) setAnnounced({ first: now.first, last: now.last });
    }, 200);
  }, [measure]);

  useLayoutEffect(() => {
    const element = rail.current;
    if (!element) return;
    sync();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => sync());
    observer.observe(element);
    return () => observer.disconnect();
  }, [sync, total]);

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      window.clearTimeout(settle.current);
    },
    [],
  );

  const onScroll = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      sync();
      if (pressed.current) announceWhenStill();
    });
  };

  const go = (direction: 1 | -1) => {
    const element = rail.current;
    const now = measure();
    if (!element || !now) return;
    const cards = Array.from(element.children) as HTMLElement[];
    const target = cards[Math.min(cards.length - 1, Math.max(0, now.first + direction))];
    if (!target) return;
    // Snapping aligns a card to the scroll padding, so the target position leaves the same room.
    const padding = Number.parseFloat(getComputedStyle(element).scrollPaddingLeft) || 0;
    const left = Math.min(element.scrollWidth - element.clientWidth, Math.max(0, target.offsetLeft - padding));
    pressed.current = true;
    element.scrollTo({ left, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    announceWhenStill();
  };

  const counter = total === 0 ? "" : `${numbers.format(state.first + 1)}${state.last > state.first ? `\u2013${numbers.format(state.last + 1)}` : ""} / ${numbers.format(total)}`;
  const message = announced
    ? announced.last > announced.first
      ? fill(words.range, { from: numbers.format(announced.first + 1), to: numbers.format(announced.last + 1), total: numbers.format(total) })
      : fill(words.position, { current: numbers.format(announced.first + 1), total: numbers.format(total) })
    : "";

  return (
    <section data-slot="quote-rail" className={cn("min-w-0 py-16 [--rail-gutter:1.5rem] sm:py-24", className)} {...props}>
      {/* On a phone the buttons go under the text, so the title keeps the whole width; from 640px they sit at the end of the row. */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="max-w-2xl min-w-0">
          <h2 id={heading} className="text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">
            {title}
          </h2>
          {description ? <p className="mt-3 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="outline" size="icon" aria-label={words.previous} aria-controls={railId} aria-disabled={!state.canPrevious || undefined} onClick={() => state.canPrevious && go(-1)} className={ARROW}>
            <IconChevronLeft />
          </Button>
          <Button type="button" variant="outline" size="icon" aria-label={words.next} aria-controls={railId} aria-disabled={!state.canNext || undefined} onClick={() => state.canNext && go(1)} className={ARROW}>
            <IconChevronRight />
          </Button>
        </div>
      </header>

      {/* A focusable list: with no focusable card inside, the keyboard could not scroll it otherwise. */}
      <ul
        id={railId}
        ref={rail}
        role="list"
        tabIndex={0}
        aria-labelledby={heading}
        onScroll={onScroll}
        className="relative mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth rounded-xl outline-none [scrollbar-width:none] focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:scroll-auto max-sm:[margin-inline:calc(var(--rail-gutter)*-1)] max-sm:[padding-inline:var(--rail-gutter)] max-sm:[scroll-padding-inline:var(--rail-gutter)] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <li key={item.id} className="flex w-[min(85%,20rem)] shrink-0 snap-start">
            <figure className="flex w-full flex-col justify-between gap-8 rounded-xl border border-border bg-card p-6 text-card-foreground">
              <div className="grid content-start gap-4">
                {item.rating !== undefined ? (
                  <Stars rating={item.rating} label={fill(words.rated, { rating: item.rating, max: MAX_STARS })} />
                ) : null}
                <blockquote>
                  <p className="text-base leading-relaxed text-pretty">&ldquo;{item.quote}&rdquo;</p>
                </blockquote>
              </div>
              <figcaption className="flex min-h-[3.75rem] items-start gap-3">
                <Avatar>
                  {item.avatar ? <AvatarImage src={item.avatar} alt="" /> : null}
                  <AvatarFallback>{initialsOf(item.name)}</AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 text-sm leading-snug">
                  <cite className="font-medium not-italic">{item.name}</cite>
                  <span className="text-muted-foreground">{item.role}</span>
                </div>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <div aria-hidden="true" className="mt-6 flex items-center gap-5">
        <span className="relative h-0.5 flex-1 rounded-full bg-border">
          <span className="absolute inset-y-0 rounded-full bg-foreground" style={{ left: `${state.thumbLeft}%`, width: `${state.thumbWidth}%` }} />
        </span>
        <span className="text-sm text-muted-foreground tabular-nums">{counter}</span>
      </div>
      <p role="status" className="sr-only">
        {message}
      </p>
    </section>
  );
}
