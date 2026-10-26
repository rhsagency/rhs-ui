import { useId, type ComponentProps, type ElementType, type ReactNode } from "react";

import { IconCheck, IconClock } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

/**
 * Where a part stands for this reader. `read` and `current` mark progress; `available` is a published
 * part that comes later; `upcoming` is not published yet and is never a link.
 */
export type SeriesPartState = "read" | "current" | "available" | "upcoming";

export interface SeriesPart {
  /** The part's title, without the number. */
  title: string;
  /** The part's page. Leave it out while the part is unpublished: it is then plain text, never a dead link. */
  href?: string;
  /** How long it takes to read, in minutes. */
  minutes?: number;
  /** Sets the state yourself, for a site that knows what each reader has read. Otherwise it follows from `current` and `href`. */
  state?: SeriesPartState;
  /** When an upcoming part is due, as an ISO date: "2026-11-04". */
  releaseDate?: string;
}

export interface SeriesOutlineLabels {
  /** The small label above the series name. */
  series: string;
  /** Where the reader is. {current} and {total} stand for the two numbers: "Part {current} of {total}". */
  partOf: string;
  /** The state of a part the reader has already read. */
  read: string;
  /** The state of the part this page is. */
  current: string;
  /** The state of a part that is not out yet. A date follows when there is one. */
  soon: string;
  /** The reading time. {minutes} stands for the number: "{minutes} min". */
  minutes: string;
}

export interface ArticleSeriesOutlineProps extends Omit<ComponentProps<"nav">, "children"> {
  /** The series itself: its name, and a link to its landing page when it has one. */
  series: { title: string; href?: string };
  /** Every part, in order. A part is its position in this list. */
  parts: readonly SeriesPart[];
  /** The number of the part this page is, counting from 1. Leave it out on the series' own page, where nothing is current. */
  current?: number;
  /** A card for a sidebar or the end of an article, or a compact strip across the top of the body. */
  layout?: "card" | "strip";
  /** The level of the series name: 3 by default, for a sidebar under an h2. */
  headingLevel?: 2 | 3 | 4;
  /** Renders the series and part links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<SeriesOutlineLabels>;
  /** Locale for the dates and the numbers. */
  locale?: string;
  /** Time zone for a release date that carries a time; a date without one is never shifted. */
  timeZone?: string;
}

const LABELS: SeriesOutlineLabels = {
  series: "Series",
  partOf: "Part {current} of {total}",
  read: "Read",
  current: "You are here",
  soon: "Soon",
  minutes: "{minutes} min",
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Puts values into a sentence: {current} becomes the number. */
const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

const LINK = "rounded-sm underline-offset-4 outline-none transition-colors duration-150 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/** What the reader should see for a part, from the numbers and the links when the site does not say. */
function stateOf(part: SeriesPart, index: number, current: number | undefined): SeriesPartState {
  if (part.state) return part.state;
  const number = index + 1;
  if (current !== undefined) {
    if (number === current) return "current";
    if (number < current) return "read";
  }
  return part.href ? "available" : "upcoming";
}

/**
 * Where you are in a multi-part series: every part in order, each with its
 * number, title and reading time, and a word for where it stands: Read, You
 * are here, or Soon with the date it is due. Status is always spelled out, so
 * it never depends on colour or on an icon. Parts that are not out yet are
 * plain text rather than dead links, and the part you are reading carries
 * aria-current. A card suits an article's sidebar or the end of the piece
 * beside the pager; the strip runs across the top of the body and shows the
 * whole series at a glance. Both follow the width of their own column, not the
 * screen. The outline is a navigation landmark named after the series; when a
 * page carries two of them, give each its own `aria-label` so they can be told
 * apart.
 */
export function ArticleSeriesOutline({
  series,
  parts,
  current,
  layout = "card",
  headingLevel = 3,
  linkAs: Link = "a",
  labels: custom,
  locale = "en-US",
  timeZone = "UTC",
  "aria-label": ariaLabel,
  className,
  ...props
}: ArticleSeriesOutlineProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const numbers = new Intl.NumberFormat(locale);
  const total = parts.length;
  const states = parts.map((part, index) => stateOf(part, index, current));
  const done = states.filter((state) => state === "read" || state === "current").length;

  const formatDate = (value: string) => {
    const time = Date.parse(value);
    return Number.isNaN(time) ? value : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: DATE_ONLY.test(value) ? "UTC" : timeZone }).format(time);
  };

  /** The state in words, as a badge: the word is always there, the icon only helps. */
  const stateWord = (part: SeriesPart, state: SeriesPartState): ReactNode => {
    if (state === "current") return <Badge variant="default">{labels.current}</Badge>;
    if (state === "read") {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <IconCheck aria-hidden="true" />
          {labels.read}
        </Badge>
      );
    }
    if (state === "upcoming") {
      return (
        <Badge variant="muted">
          <IconClock aria-hidden="true" />
          {labels.soon}
          {part.releaseDate ? (
            <>
              <span className="sr-only">, </span>
              <span aria-hidden="true">&middot;</span>
              <time dateTime={part.releaseDate} className="tabular-nums">
                {formatDate(part.releaseDate)}
              </time>
            </>
          ) : null}
        </Badge>
      );
    }
    return null;
  };

  const minutes = (part: SeriesPart, className?: string) =>
    part.minutes !== undefined ? <span className={cn("text-xs whitespace-nowrap text-muted-foreground tabular-nums", className)}>{fill(labels.minutes, { minutes: numbers.format(part.minutes) })}</span> : null;
  // On one line per part, the reading times share a column and the pills end at the same edge in every row, whatever the numbers are.
  const anyMinutes = parts.some((part) => part.minutes !== undefined);

  /** A part's title: a link when it is published and is not the page you are on, plain text otherwise. */
  const title = (part: SeriesPart, state: SeriesPartState, stretched: boolean) => {
    if (state === "current") return <span className="font-semibold">{part.title}</span>;
    if (state === "upcoming" || !part.href) return <span className={state === "upcoming" ? "text-muted-foreground" : undefined}>{part.title}</span>;
    return (
      <Link href={part.href} className={cn(LINK, stretched && "after:absolute after:inset-0 focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40 focus-visible:after:ring-inset focus-visible:ring-0")}>
        {part.title}
      </Link>
    );
  };

  const where = current !== undefined && current >= 1 && current <= total ? fill(labels.partOf, { current: numbers.format(current), total: numbers.format(total) }) : null;

  const seriesName = series.href ? (
    <Link href={series.href} className={LINK}>
      {series.title}
    </Link>
  ) : (
    series.title
  );

  if (layout === "strip") {
    return (
      <nav data-slot="article-series-outline" data-layout="strip" aria-label={ariaLabel} aria-labelledby={ariaLabel ? undefined : id} className={cn("@container w-full break-words", className)} {...props}>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{labels.series}</p>
          <Heading id={id} className="text-base leading-snug font-semibold tracking-[-0.015em]">
            {seriesName}
          </Heading>
          {where ? <p className="text-sm text-muted-foreground tabular-nums">{where}</p> : null}
        </div>
        <ol role="list" className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-x-4 gap-y-6">
          {parts.map((part, index) => {
            const state = states[index] ?? "upcoming";
            return (
              <li key={`${part.title}-${index}`} aria-current={state === "current" ? "page" : undefined} className={cn("relative border-t-2 pt-3", state === "read" || state === "current" ? "border-foreground" : "border-border")}>
                <div className="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1.5">
                  <span aria-hidden="true" className="text-xs font-medium text-muted-foreground tabular-nums">
                    {numbers.format(index + 1)}
                  </span>
                  {stateWord(part, state)}
                </div>
                <p className="mt-2.5 line-clamp-3 text-sm leading-snug font-medium text-pretty">{title(part, state, true)}</p>
                <p className="mt-1.5 min-h-4">{minutes(part)}</p>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  return (
    <nav data-slot="article-series-outline" data-layout="card" aria-label={ariaLabel} aria-labelledby={ariaLabel ? undefined : id} className={cn("@container w-full overflow-hidden rounded-xl border border-border bg-card break-words", className)} {...props}>
      <div className="px-5 pt-5 pb-5 sm:px-6">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{labels.series}</p>
        <Heading id={id} className="mt-1.5 text-lg leading-snug font-semibold tracking-[-0.02em] text-balance">
          {seriesName}
        </Heading>
        {where ? <p className="mt-1 text-sm text-muted-foreground tabular-nums">{where}</p> : null}
        {total > 1 && current !== undefined ? (
          <div aria-hidden="true" className="mt-4 flex gap-1">
            {parts.map((part, index) => (
              <span key={`${part.title}-${index}`} className={cn("h-1 min-w-0 flex-1 rounded-full", index < done ? "bg-foreground" : "bg-border")} />
            ))}
          </div>
        ) : null}
      </div>
      <ol role="list" className="divide-y divide-border border-t border-border">
        {parts.map((part, index) => {
          const state = states[index] ?? "upcoming";
          const marker =
            state === "current"
              ? "bg-foreground text-background forced-colors:border"
              : state === "upcoming"
                ? "border border-dashed border-muted-foreground/60 text-muted-foreground"
                : state === "read"
                  ? "border border-border bg-muted/60 text-muted-foreground"
                  : "border border-border text-foreground";
          return (
            <li
              key={`${part.title}-${index}`}
              aria-current={state === "current" ? "page" : undefined}
              className={cn(
                "relative grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3.5 gap-y-2 px-5 py-4 sm:px-6 @lg:grid-cols-[1.75rem_minmax(0,1fr)_auto] @lg:items-center",
                state === "current" && "bg-muted/60 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-foreground",
                // A row that is a link answers the pointer as a whole, since its link is stretched over it.
                part.href && (state === "read" || state === "available") && "transition-colors duration-150 hover:bg-muted/50 motion-reduce:transition-none",
              )}
            >
              <span aria-hidden="true" className={cn("grid size-7 place-items-center rounded-full text-xs font-medium tabular-nums", marker)}>
                {numbers.format(index + 1)}
              </span>
              <p className="min-w-0 self-center text-[0.9375rem] leading-snug text-pretty">{title(part, state, true)}</p>
              <div className="col-start-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 @lg:col-start-3 @lg:justify-end">
                {stateWord(part, state)}
                {minutes(part, "@lg:min-w-14 @lg:text-right") ?? (anyMinutes ? <span aria-hidden="true" className="hidden @lg:block @lg:min-w-14" /> : null)}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
