"use client";

import { useId, useMemo, useState, type ComponentProps } from "react";

import { IconArrowUpRight, IconChevronDown } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface PressMention {
  /** The publication, as text: "De Volkskrant". There is no logo to license and none to go stale. */
  outlet: string;
  /** The headline of the piece, as it ran. It is the link. */
  headline: string;
  /** When it ran: a Date, a timestamp or an ISO string. A date-only string such as "2026-10-14" is a calendar date and never shifts with the time zone. */
  date: Date | string | number;
  /** The article's address. A full address to another site opens in a new tab and says so. */
  href: string;
  /** One line from the piece or about it, under the headline. */
  excerpt?: string;
}

export interface PressMentionsLabels {
  /** What a screen reader hears after a link that opens in a new tab. Default "opens in a new tab". */
  newTab: string;
  /** The button that shows the rest of the list. Default "Show all coverage". */
  showAll: string;
  /** The same button once the list is open. Default "Show less". */
  showLess: string;
}

export interface PressMentionsListProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The coverage, newest first. The list keeps the order you give it. */
  items: readonly PressMention[];
  /** The heading of the section: "In the news". */
  title?: string;
  /** The locale of the dates. Default "en-US". */
  locale?: string;
  /** The IANA time zone the dates are written in, so the server and the browser print the same day. Default "UTC". */
  timeZone?: string;
  /** Show only this many rows and add a button for the rest. Leave it out to show them all. */
  limit?: number;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<PressMentionsLabels>;
}

const LABELS: PressMentionsLabels = { newTab: "opens in a new tab", showAll: "Show all coverage", showLess: "Show less" };

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const EXTERNAL = /^https?:\/\//i;

/** The date as it is read ("Oct 14, 2026") and as a machine reads it ("2026-10-14"), both in the same time zone. A bad value gives null. */
function whenOf(value: PressMention["date"], locale: string, timeZone: string): { text: string; iso: string } | null {
  const calendar = typeof value === "string" && DATE_ONLY.test(value);
  const instant = new Date(calendar ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(instant.getTime())) return null;
  // A calendar date has no time zone: read it in UTC, where it was made.
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

/** The headline with its last word and the arrow held together, so the arrow never stands alone on a line. */
function Headline({ text, external }: { text: string; external: boolean }) {
  const cut = text.lastIndexOf(" ");
  const head = cut > 0 ? text.slice(0, cut + 1) : "";
  const tail = cut > 0 ? text.slice(cut + 1) : text;
  return (
    <>
      {head}
      <span className="whitespace-nowrap">
        {tail}
        {external ? (
          <IconArrowUpRight
            aria-hidden="true"
            className="ml-1 inline-block size-[0.8em] text-muted-foreground transition-[color,transform] duration-150 group-hover/row:text-foreground motion-safe:group-hover/row:translate-x-0.5 motion-safe:group-hover/row:-translate-y-0.5 motion-reduce:transition-none"
          />
        ) : null}
      </span>
    </>
  );
}

/**
 * In the news as a dated list, for a press page or a quiet band on the home
 * page. Each row has the date (in tabular figures) and the outlet in muted text
 * in a narrow left column, set on the same baseline as the first line of the
 * headline, and on the right the headline as the link, with an arrow when it
 * leaves the site and an optional excerpt under it; the whole row is the click
 * target, but only the headline is the link a screen reader hears.
 * Outlet names are text, so there is nothing to license and nothing to go
 * stale. Dates are `time` elements written in your locale and a time zone you
 * name, so the server and the browser agree. A link to another site says it
 * opens in a new tab. With `limit` the list shows that many rows and a button
 * for the rest.
 */
export function PressMentionsList({ items, title, locale = "en-US", timeZone = "UTC", limit, labels, className, ...props }: PressMentionsListProps) {
  const words = { ...LABELS, ...labels };
  const [open, setOpen] = useState(false);
  const listId = useId();
  const heading = useId();
  const rows = useMemo(() => items.map((item) => ({ item, when: whenOf(item.date, locale, timeZone) })), [items, locale, timeZone]);
  const capped = limit !== undefined && limit > 0 && rows.length > limit;
  const shown = capped && !open ? rows.slice(0, limit) : rows;

  return (
    <section data-slot="press-mentions-list" aria-labelledby={title ? heading : undefined} className={cn("py-12 sm:py-16", className)} {...props}>
      {title ? (
        <h2 id={heading} className="mb-8 text-3xl font-medium tracking-[-0.04em] text-balance sm:mb-10 sm:text-4xl">
          {title}
        </h2>
      ) : null}
      <ul id={listId} className="border-b border-border">
        {shown.map(({ item, when }) => {
          const external = EXTERNAL.test(item.href);
          return (
            <li key={`${item.outlet}-${item.headline}`} className="group/row relative grid gap-x-10 gap-y-2.5 border-t border-border py-6 md:grid-cols-[11rem_minmax(0,1fr)] md:items-baseline md:py-7">
              <p className="flex flex-wrap items-baseline gap-x-2.5 text-sm text-muted-foreground md:grid md:content-start md:gap-y-0.5">
                <span className="font-medium text-foreground md:order-2 md:font-normal md:text-muted-foreground">{item.outlet}</span>
                {when ? (
                  <>
                    <span aria-hidden="true" className="md:hidden">
                      ·
                    </span>
                    <time dateTime={when.iso} className="tabular-nums md:order-1">
                      {when.text}
                    </time>
                  </>
                ) : null}
              </p>
              <div className="grid gap-1.5">
                <p className="text-xl leading-snug font-medium tracking-[-0.025em] text-pretty sm:text-[1.375rem]">
                  <a
                    href={item.href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="rounded-sm underline decoration-transparent decoration-1 underline-offset-[0.2em] transition-[text-decoration-color] duration-150 outline-none group-hover/row:decoration-current after:absolute after:inset-y-0 after:-inset-x-3 after:rounded-lg focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40 motion-reduce:transition-none"
                  >
                    <Headline text={item.headline} external={external} />
                    {external ? <span className="sr-only"> ({words.newTab})</span> : null}
                  </a>
                </p>
                {item.excerpt ? <p className="max-w-2xl text-sm leading-relaxed text-pretty text-muted-foreground">{item.excerpt}</p> : null}
              </div>
            </li>
          );
        })}
      </ul>
      {capped ? (
        <div className="mt-6">
          <Button variant="outline" aria-expanded={open} aria-controls={listId} onClick={() => setOpen((now) => !now)}>
            {open ? words.showLess : words.showAll}
            <IconChevronDown aria-hidden="true" className={cn("transition-transform duration-200 motion-reduce:transition-none", open && "rotate-180")} />
          </Button>
        </div>
      ) : null}
    </section>
  );
}
