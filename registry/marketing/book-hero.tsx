"use client";

import { Fragment, useId, useState, type ComponentProps, type ReactNode } from "react";

import { IconArrowUpRight, IconBookOpen, IconChevronDown, IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { PullQuote } from "@rhs-ui/primitives/pull-quote";
import { cn } from "@/lib/utils";

export interface BookCover {
  /** The address of the cover. A data: URI works too. Two by three is the design. */
  src: string;
  /** What the cover shows. Left out, it is "Cover of Title by Author", which is what a reader of the page needs to know. */
  alt?: string;
  /** Intrinsic size, so the browser can reserve the space. */
  width?: number;
  height?: number;
  /** Candidate files for the browser to choose from, as in an <img srcset>. */
  srcSet?: string;
  /** How wide the cover is shown, as in an <img sizes>. Set it with `srcSet`. */
  sizes?: string;
}

export interface BookPraise {
  /** One line from a review or a writer, without quotation marks. */
  quote: string;
  /** Who said it, or where: "The Halcyon Review", "Dara Whitfield, author of Low Tide". */
  source: string;
}

export interface BookRetailer {
  /** The shop, in words: "Northwind Books". Names, not logos. */
  label: string;
  /** Where the book is sold. */
  href: string;
}

/** The words the hero says. `{author}`, `{title}`, `{retailer}`, `{date}`, `{current}` and `{total}` are filled in. */
export interface BookHeroLabels {
  /** The line under the subtitle. */
  by: string;
  /** Names the praise for assistive technology. */
  praise: string;
  previous: string;
  next: string;
  /** Which praise is showing, for assistive technology. */
  position: string;
  /** The Buy button when there are several shops. */
  buy: string;
  /** The heading of the list of shops. */
  buyFrom: string;
  /** The Buy button when there is one shop. */
  buyAt: string;
  extract: string;
  /** The publication day. `{date}` is the day, in a time element. Pass "Out {date}" or "Publishes {date}" for a book that is not out yet. */
  published: string;
  /** The alt text of a cover that has none of its own. */
  cover: string;
}

export interface BookHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** The cover, shown as a book that is slightly turned. */
  cover: BookCover;
  /** The title of the book. It is the heading. */
  title: string;
  /** The line under the title: "A novel", or the longer promise. */
  subtitle?: string;
  /** The author's name. */
  author: string;
  /** Lines of praise. With two or three, Previous and Next step between them; nothing ever advances them by itself. */
  praise?: readonly BookPraise[];
  /** Where to buy it. Several are a menu, one is a link, none leaves the Buy button out. */
  retailers?: readonly BookRetailer[];
  /** A link to the first chapter, as a page or a PDF. Leave it out for no Read an extract button. */
  extractHref?: string;
  /** The day it was or will be published: an ISO day ("2027-03-04"), a timestamp or a Date. */
  publishedAt?: string | Date;
  /** What it is, in a few words: "Hardcover, 336 pages". */
  format?: string;
  /** The language of the date. Default "en-US". */
  locale?: string;
  /** The time zone a full timestamp is read in. A plain ISO day is that calendar day everywhere. Default "UTC". */
  timeZone?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<BookHeroLabels>;
}

const LABELS: BookHeroLabels = {
  by: "by {author}",
  praise: "Praise for the book",
  previous: "Previous praise",
  next: "Next praise",
  position: "{current} of {total}",
  buy: "Buy",
  buyFrom: "Buy from",
  buyAt: "Buy from {retailer}",
  extract: "Read an extract",
  published: "Published {date}",
  cover: "Cover of {title} by {author}",
};

/** "{name}" and friends in a template, filled in. */
function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

/** A template with one `{date}` in it, with the day as a time element. */
function withDay(template: string, day: ReactNode): ReactNode[] {
  return template.split(/(\{date\})/).map((part, index) => (part === "{date}" ? <Fragment key={index}>{day}</Fragment> : part));
}

/** The day as the locale writes it, with the value for the time element. A plain ISO day is that calendar day wherever the reader is. */
function dayOf(value: string | Date, locale: string, timeZone: string): { text: string; iso: string } | null {
  const moment = new Date(value);
  if (Number.isNaN(moment.getTime())) return null;
  const calendarDay = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  let zone = "UTC";
  if (!calendarDay) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone });
      zone = timeZone;
    } catch {
      zone = "UTC";
    }
  }
  const text = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: zone }).format(moment).replace(/\s/g, " ");
  return { text, iso: calendarDay ? value : moment.toISOString() };
}

/**
 * The cover as an object: a box turned a little, drawn with CSS transforms
 * alone. The front is your picture with a hinge groove near the spine, the
 * right side is the page block between its two boards, and a soft shadow
 * sits under it. Under reduced motion it is flat, front on, and the pages
 * disappear edge-on.
 */
function BookObject({ cover, alt }: { cover: BookCover; alt: string }) {
  return (
    <div data-slot="book-hero-object" className="@container relative w-[min(100%,16rem)] [perspective:1800px] sm:w-[min(100%,19rem)]">
      <span aria-hidden="true" className="absolute right-[-3cqi] bottom-[-3.5cqi] left-[7cqi] h-[7cqi] rounded-[50%] bg-black/35 blur-[14px] dark:bg-black/70" />
      <div className="relative aspect-[2/3] w-full transition-transform duration-700 ease-out [transform-style:preserve-3d] [transform:rotateY(-26deg)] hover:[transform:rotateY(-15deg)] motion-reduce:transition-none motion-reduce:[transform:none] motion-reduce:hover:[transform:none]">
        <div className="absolute inset-0 overflow-hidden rounded-[1px_5px_5px_1px] bg-muted [backface-visibility:hidden] [transform:translateZ(4.5cqi)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the cover is any URL or data URI */}
          <img
            src={cover.src}
            alt={alt}
            width={cover.width}
            height={cover.height}
            srcSet={cover.srcSet}
            sizes={cover.sizes ?? "(min-width: 640px) 19rem, 16rem"}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="size-full object-cover"
          />
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[2.4%] bg-black/12" />
          <span aria-hidden="true" className="absolute inset-y-0 left-[4.2%] w-px bg-black/25" />
          <span aria-hidden="true" className="absolute inset-y-0 left-[calc(4.2%+1px)] w-px bg-white/30" />
          <span aria-hidden="true" className="absolute inset-0 rounded-[inherit] ring-1 ring-black/10 ring-inset" />
        </div>
        {/* The right side: front board, pages, back board. It is flat on the plane the front and back boards stand apart in. */}
        <div aria-hidden="true" className="absolute inset-y-0 left-[calc(100%-4.5cqi)] flex w-[9cqi] [backface-visibility:hidden] [transform:rotateY(90deg)]">
          <span className="w-[1.1cqi] bg-neutral-800" />
          <span className="flex flex-1 bg-[#efe9dc] dark:bg-[#cdc7b8]">
            {Array.from({ length: 7 }, (_, index) => (
              <span key={index} className="flex-1 border-l border-black/10 first:border-l-0" />
            ))}
          </span>
          <span className="w-[1.1cqi] bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}

/**
 * The opening for a book launch: the cover as a turned object with a hinge, a
 * page-block side and a soft shadow, and beside it the title, subtitle and
 * author, a line of praise, and the two actions that matter: where to buy it
 * and a way to read the first pages. The object is drawn with CSS transforms
 * alone, no 3D library, and lies flat under reduced motion. Two or three
 * lines of praise can be stepped through with Previous and Next, and nothing
 * ever advances them by itself; the room for the longest is reserved, so the
 * page never jumps. The buy button is a menu of shops named in text, or a
 * plain link when there is one. For novels, non-fiction, cookbooks and
 * self-publishers.
 */
export function BookHero({
  titleAs: Title = "h2",
  cover,
  title,
  subtitle,
  author,
  praise = [],
  retailers = [],
  extractHref,
  publishedAt,
  format,
  locale = "en-US",
  timeZone = "UTC",
  labels: custom,
  className,
  ...props
}: BookHeroProps) {
  const words = { ...LABELS, ...custom };
  const id = useId();
  const [shown, setShown] = useState(0);
  const count = praise.length;
  const index = count ? Math.min(shown, count - 1) : 0;
  const current = praise[index];
  const published = publishedAt === undefined ? null : dayOf(publishedAt, locale, timeZone);
  const step = (by: number) => setShown((index + by + count) % count);
  const quote = (line: BookPraise) => <PullQuote quote={line.quote} cite={line.source} align="left" className="my-0 [&_blockquote]:text-xl sm:[&_blockquote]:text-2xl" />;
  const only = retailers.length === 1 ? retailers[0] : undefined;

  return (
    <section
      data-slot="book-hero"
      aria-labelledby={`${id}-title`}
      className={cn("grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-16", className)}
      {...props}
    >
      <div className="min-w-0">
        <Title id={`${id}-title`} className="text-4xl leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl [overflow-wrap:anywhere]">
          {title}
        </Title>
        {subtitle ? <p className="mt-3 max-w-xl text-lg leading-snug text-pretty text-muted-foreground sm:text-xl [overflow-wrap:anywhere]">{subtitle}</p> : null}
        <p className="mt-4 text-base font-medium">{fill(words.by, { author })}</p>

        {current ? (
          <div data-slot="book-hero-praise" role="group" aria-label={words.praise} className="mt-9 max-w-xl">
            <div aria-live="polite" aria-atomic="true" className="grid">
              {praise.map((line, position) =>
                position === index ? null : (
                  <div key={`${position}-${line.source}`} aria-hidden="true" inert className="invisible col-start-1 row-start-1">
                    {quote(line)}
                  </div>
                ),
              )}
              <div key={index} className="col-start-1 row-start-1 motion-safe:animate-rhs-book-quote-in">
                {count > 1 ? <span className="sr-only">{fill(words.position, { current: index + 1, total: count })}. </span> : null}
                {quote(current)}
              </div>
            </div>
            {count > 1 ? (
              <div className="mt-5 flex items-center gap-3">
                <Button type="button" variant="outline" size="icon-sm" aria-label={words.previous} onClick={() => step(-1)}>
                  <IconChevronLeft />
                </Button>
                <span aria-hidden="true" className="min-w-10 text-center text-sm text-muted-foreground tabular-nums">
                  {index + 1} / {count}
                </span>
                <Button type="button" variant="outline" size="icon-sm" aria-label={words.next} onClick={() => step(1)}>
                  <IconChevronRight />
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {retailers.length || extractHref ? (
          <div className="mt-9 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
            {only ? (
              <Button asChild size="lg">
                <a href={only.href}>
                  {fill(words.buyAt, { retailer: only.label })}
                  <IconArrowUpRight />
                </a>
              </Button>
            ) : retailers.length ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="lg" className="min-w-28">
                    {words.buy}
                    <IconChevronDown className="transition-transform duration-150 group-aria-expanded/button:rotate-180 motion-reduce:transition-none" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-w-[min(24rem,calc(100vw-2rem))] min-w-60">
                  <DropdownMenuLabel>{words.buyFrom}</DropdownMenuLabel>
                  {retailers.map((retailer) => (
                    <DropdownMenuItem key={`${retailer.label}-${retailer.href}`} asChild className="py-2">
                      <a href={retailer.href}>
                        {retailer.label}
                        <IconArrowUpRight className="ml-auto" />
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            {extractHref ? (
              <Button asChild size="lg" variant="outline">
                <a href={extractHref}>
                  <IconBookOpen />
                  {words.extract}
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}

        {format || published ? (
          <p className="mt-6 flex flex-col items-start gap-y-0.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
            {/* On a phone the two parts sit on two lines and the dot is left out; from sm up the dot trails the first part, so when the line wraps it ends a line and never starts one. */}
            {format ? (
              <span>
                {format}
                {published ? (
                  <span aria-hidden="true" className="ml-2 max-sm:hidden">
                    &middot;
                  </span>
                ) : null}
              </span>
            ) : null}
            {published ? <span>{withDay(words.published, <time dateTime={published.iso}>{published.text}</time>)}</span> : null}
          </p>
        ) : null}
      </div>

      <figure data-slot="book-hero-cover" className="grid place-items-center rounded-3xl bg-muted px-6 py-12 max-lg:order-first sm:px-12 sm:py-16">
        <BookObject cover={cover} alt={cover.alt ?? fill(words.cover, { title, author })} />
      </figure>
    </section>
  );
}
