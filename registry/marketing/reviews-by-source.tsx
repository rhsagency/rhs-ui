"use client";

import { Fragment, useId, useState, type ComponentProps, type ReactNode } from "react";

import { IconArrowUpRight } from "@rhs-ui/icons";
import { Rating } from "@rhs-ui/primitives/rating";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";
import { cn } from "@/lib/utils";

export interface SourcedReview {
  /** Identifies the review in the list. */
  id: string;
  /** Where it was written. It must match the `name` of one of the `sources`, or it shows only under All. */
  source: string;
  /** Out of five, to the half star: 4.5. */
  rating: number;
  /** A short headline for the review. */
  title: string;
  /** What the reviewer wrote. */
  body: string;
  /** Who wrote it, as the site shows them: "Ingrid S., practice manager". */
  author: string;
  /** When it was written: a Date, a timestamp or an ISO string. A date-only string such as "2026-10-14" is a calendar date and never shifts with the time zone. */
  date: Date | string | number;
}

export interface ReviewSource {
  /** The name as text, on the tab: "G2", "App Store". Never a borrowed logo. */
  name: string;
  /** The average out of five across every review on this source, not just the ones shown. */
  average: number;
  /** How many reviews there are on this source in all. */
  count: number;
  /** The page with all of them. It adds a "Read all on {source}" link after that source's reviews. */
  href?: string;
}

export interface ReviewsBySourceLabels {
  /** The first tab. Default "All". */
  all: string;
  /** What a screen reader hears for the stars; `{rating}` and `{max}` are filled in. Default "Rated {rating} out of {max}". */
  rated: string;
  /** The summary under the tabs for All; `{average}`, `{count}` and `{reviews}` are filled in. Default "{average} average from {count} {reviews}". */
  summary: string;
  /** The summary for one source; the same, and `{source}`. Default "{average} average from {count} {reviews} on {source}". */
  summarySource: string;
  /** The word for one review, in `{reviews}`. Default "review". */
  review: string;
  /** The word for several, in `{reviews}`. Default "reviews". */
  reviews: string;
  /** The link to all the reviews on a source; `{source}` is filled in. Default "Read all on {source}". */
  readAll: string;
  /** What a screen reader hears after a link that opens in a new tab. Default "opens in a new tab". */
  newTab: string;
  /** The name of the list of tabs. Default "Review sources". */
  sources: string;
  /** When a source has no reviews to show; `{source}` is filled in. Default "No reviews from {source} yet.". */
  empty: string;
  /** When there are no reviews at all, under All. Default "No reviews yet.". */
  emptyAll: string;
}

export interface ReviewsBySourceProps extends Omit<ComponentProps<"section">, "title" | "children" | "defaultValue" | "onChange"> {
  /** The reviews to show, newest first. The tabs filter them by `source`. */
  reviews: readonly SourcedReview[];
  /** Up to four places the reviews were written, in the order of the tabs, with the average and the count of each. */
  sources: readonly ReviewSource[];
  /** An optional heading above the tabs. */
  title?: string;
  /** The locale of the numbers and the dates. Default "en-US". */
  locale?: string;
  /** The IANA time zone the dates are written in, so the server and the browser print the same day. Default "UTC". */
  timeZone?: string;
  /** The selected tab: "all" or the `name` of a source. Pass it with `onValueChange` to control it. */
  value?: string;
  /** The tab that starts selected when you do not control it. Default "all". */
  defaultValue?: string;
  /** Called with "all" or the name of a source when another tab is chosen. */
  onValueChange?: (value: string) => void;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ReviewsBySourceLabels>;
}

const LABELS: ReviewsBySourceLabels = {
  all: "All",
  rated: "Rated {rating} out of {max}",
  summary: "{average} average from {count} {reviews}",
  summarySource: "{average} average from {count} {reviews} on {source}",
  review: "review",
  reviews: "reviews",
  readAll: "Read all on {source}",
  newTab: "opens in a new tab",
  sources: "Review sources",
  empty: "No reviews from {source} yet.",
  emptyAll: "No reviews yet.",
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const EXTERNAL = /^https?:\/\//i;
const MAX = 5;

/** A template with `{name}` holes, filled with text. */
const fillText = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (hole, name: string) => values[name] ?? hole);

/** A template with `{name}` holes, filled with elements: the average can be set heavier wherever the sentence puts it. */
function fillNodes(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/g).map((part, index) => {
    const name = /^\{(\w+)\}$/.exec(part)?.[1];
    return name !== undefined && name in values ? <Fragment key={index}>{values[name]}</Fragment> : part;
  });
}

/** The date as it is read ("Oct 14, 2026") and as a machine reads it ("2026-10-14"), both in the same time zone. A bad value gives null. */
function whenOf(value: SourcedReview["date"], locale: string, timeZone: string): { text: string; iso: string } | null {
  const calendar = typeof value === "string" && DATE_ONLY.test(value);
  const instant = new Date(calendar ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(instant.getTime())) return null;
  const zone = calendar ? "UTC" : timeZone;
  try {
    return {
      text: new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: zone }).format(instant),
      iso: new Intl.DateTimeFormat("en-CA", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: zone }).format(instant),
    };
  } catch {
    // A locale or a zone the browser does not know must not take the page down: fall back to UTC and US English.
    return {
      text: new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(instant),
      iso: instant.toISOString().slice(0, 10),
    };
  }
}

/** A number formatter that survives a locale the browser does not know. */
function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  try {
    return new Intl.NumberFormat(locale, options);
  } catch {
    return new Intl.NumberFormat("en-US", options);
  }
}

/** The average and the count for All or for one source: the source's own figures when it has them, else worked out from the reviews at hand. */
function summaryFor(source: ReviewSource | null, sources: readonly ReviewSource[], reviews: readonly SourcedReview[]): { average: number; count: number } {
  const own = (list: readonly SourcedReview[]) => ({ average: list.length ? list.reduce((sum, review) => sum + review.rating, 0) / list.length : 0, count: list.length });
  if (source) return source.count > 0 ? { average: source.average, count: source.count } : own(reviews.filter((review) => review.source === source.name));
  const total = sources.reduce((sum, item) => sum + item.count, 0);
  return total > 0 ? { average: sources.reduce((sum, item) => sum + item.average * item.count, 0) / total, count: total } : own(reviews);
}

/** The stars for a rating. With a label they are one image whose name is the sentence; without one they are decoration. */
function Stars({ rating, label, size }: { rating: number; label?: string; size: number }) {
  const stars = (
    <span aria-hidden="true" className="inline-flex">
      <Rating readOnly value={Math.min(MAX, Math.max(0, rating))} max={MAX} size={size} />
    </span>
  );
  return label ? (
    <span role="img" aria-label={label} className="inline-flex">
      {stars}
    </span>
  ) : (
    stars
  );
}

/**
 * Reviews from the places people check, filtered by where they were written.
 * A row of source tabs (All, then up to four names in plain text, never
 * borrowed logos) sits above a grid of review cards; each card has stars to
 * the half star read out as "Rated 4.5 out of 5", a short title, the text, the
 * reviewer and the date. Under the tabs a summary says "4.8 average from 312
 * reviews" for the tab you are on, in a polite live region, so switching tabs
 * is announced. The tabs are a real tablist: arrow keys move between them. A
 * source with a page of its own gets a "Read all on {source}" link after its
 * reviews. Controlled or uncontrolled.
 */
export function ReviewsBySource({
  reviews,
  sources,
  title,
  locale = "en-US",
  timeZone = "UTC",
  value,
  defaultValue = "all",
  onValueChange,
  labels,
  className,
  ...props
}: ReviewsBySourceProps) {
  const words = { ...LABELS, ...labels };
  const heading = useId();
  const [own, setOwn] = useState(defaultValue);
  const selected = value ?? own;
  // Tab values are safe ids (a source's name may hold spaces, and an id may not).
  const index = sources.findIndex((source) => source.name === selected);
  const current = selected === "all" || index < 0 ? "all" : `s${index}`;

  const average = numberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const whole = numberFormat(locale, { maximumFractionDigits: 0 });
  const ratingFormat = numberFormat(locale, { maximumFractionDigits: 1 });

  const choose = (key: string) => {
    const next = key === "all" ? "all" : (sources[Number(key.slice(1))]?.name ?? "all");
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };

  const ratedLabel = (rating: number) => fillText(words.rated, { rating: ratingFormat.format(rating), max: String(MAX) });
  const link = (source: ReviewSource) => {
    if (!source.href) return null;
    const external = EXTERNAL.test(source.href);
    return (
      <a
        href={source.href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-foreground underline-offset-4 transition-colors duration-150 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
      >
        {fillText(words.readAll, { source: source.name })}
        {external ? (
          <>
            <IconArrowUpRight aria-hidden="true" className="size-4" />
            <span className="sr-only"> ({words.newTab})</span>
          </>
        ) : null}
      </a>
    );
  };

  const cards = (list: readonly SourcedReview[], showSource: boolean) =>
    list.map((review) => {
      const when = whenOf(review.date, locale, timeZone);
      return (
        <li key={review.id} className="flex">
          <article className="flex w-full flex-col gap-3.5 rounded-xl border border-border bg-card p-6 text-card-foreground">
            <Stars rating={review.rating} label={ratedLabel(review.rating)} size={16} />
            <p className="text-base leading-snug font-medium tracking-[-0.015em] text-pretty">{review.title}</p>
            <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{review.body}</p>
            <p className="mt-auto flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{review.author}</span>
              <span>
                {when ? (
                  <time dateTime={when.iso} className="tabular-nums">
                    {when.text}
                  </time>
                ) : null}
                {when && showSource ? " · " : null}
                {showSource ? review.source : null}
              </span>
            </p>
          </article>
        </li>
      );
    });

  const active = current === "all" ? null : (sources[Number(current.slice(1))] ?? null);
  const figures = summaryFor(active, sources, reviews);
  const sentence = fillNodes(active ? words.summarySource : words.summary, {
    average: <strong className="font-medium text-foreground tabular-nums">{average.format(figures.average)}</strong>,
    count: whole.format(figures.count),
    reviews: figures.count === 1 ? words.review : words.reviews,
    source: active?.name ?? "",
  });

  return (
    <section data-slot="reviews-by-source" aria-labelledby={title ? heading : undefined} className={cn("py-12 sm:py-16", className)} {...props}>
      {title ? (
        <h2 id={heading} className="mb-8 text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">
          {title}
        </h2>
      ) : null}
      <Tabs value={current} onValueChange={choose} className="gap-6">
        <div className="relative -m-1 overflow-x-auto p-1">
          <TabsList variant="line" aria-label={words.sources} className="w-max min-w-full gap-6">
            <TabsTrigger value="all">{words.all}</TabsTrigger>
            {sources.map((source, position) => (
              <TabsTrigger key={source.name} value={`s${position}`}>
                {source.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <p role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
          <Stars rating={figures.average} size={18} />
          <span>{sentence}</span>
        </p>

        <TabsContent value="all" className="grid gap-6 rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/40">
          {reviews.length ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards(reviews, true)}</ul> : <p className="text-sm text-muted-foreground">{words.emptyAll}</p>}
          {sources.some((source) => source.href) ? <div className="flex flex-wrap gap-x-6 gap-y-2">{sources.map((source) => <Fragment key={source.name}>{link(source)}</Fragment>)}</div> : null}
        </TabsContent>
        {sources.map((source, position) => {
          const mine = reviews.filter((review) => review.source === source.name);
          return (
            <TabsContent key={source.name} value={`s${position}`} className="grid gap-6 rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/40">
              {mine.length ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards(mine, false)}</ul> : <p className="text-sm text-muted-foreground">{fillText(words.empty, { source: source.name })}</p>}
              {link(source)}
            </TabsContent>
          );
        })}
      </Tabs>
    </section>
  );
}
