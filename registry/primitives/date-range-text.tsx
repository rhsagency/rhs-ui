import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

type DateInput = Date | string | number;

export interface DateRangeTextProps extends Omit<ComponentProps<"span">, "children"> {
  /** When it starts: a Date, a timestamp or an ISO string. A date-only string such as "2026-03-12" is a calendar date and never shifts with the time zone. Leave it out for an open range that ends: "until 15 March". */
  start?: DateInput | null;
  /** When it ends. Leave it out for an open range that begins: "from 12 March". */
  end?: DateInput | null;
  /** Defaults to "en-US". The range is written the way that language writes it, with the shared month and year said once. */
  locale?: string;
  /** The time zone whose calendar days and clock are used. Defaults to "UTC". */
  timeZone?: string;
  /** Add the clock time to both ends: "12 March 2026, 10:00 to 11:30". Dates without a time of day, such as "2026-03-12", ignore it. */
  includeTime?: boolean;
  /** Append the number of nights for a stay: "12 to 15 March 2026 · 3 nights". Nothing is added when the range is one day. */
  nights?: boolean;
  /** "long" writes "March", "short" writes "Mar". Default "long". */
  month?: "long" | "short";
  /** Write the year. Turn it off for a list of dates in the current year. Default true. */
  year?: boolean;
  /** Write the weekday of both ends: "Thu 12 to Sun 15 March 2026". */
  weekday?: boolean;
  /** What stands between the two ends, spaces included: " – ". The default is " to " in English and the locale's own range mark in every other language. */
  separator?: string;
  /** The words, for another language. `nights` gets the count. */
  labels?: { from?: string; until?: string; nights?: (count: number) => string; empty?: string };
  /** Shown when there is no valid date at all. Defaults to an en dash, and screen readers hear "No dates". */
  placeholder?: ReactNode;
}

interface Moment {
  instant: Date;
  /** A calendar date with no time of day. */
  calendar: boolean;
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY = 86_400_000;

const cache = new Map<string, Intl.DateTimeFormat>();
function dateFormat(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = cache.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, options);
    cache.set(key, format);
  }
  return format;
}

function momentOf(input: DateInput | null | undefined): Moment | null {
  if (input === null || input === undefined) return null;
  const calendar = typeof input === "string" && DATE_ONLY.test(input);
  const instant = new Date(calendar ? `${input}T00:00:00Z` : input);
  return Number.isNaN(instant.getTime()) ? null : { instant, calendar };
}

/** The calendar day of a moment in the zone, as midnight UTC: dates are compared and written as days, never as instants that a zone can move. */
function dayOf(moment: Moment, timeZone: string): Date {
  if (moment.calendar) return moment.instant;
  const parts = dateFormat("en-US", { timeZone, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(moment.instant);
  const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value);
  return new Date(Date.UTC(part("year"), part("month") - 1, part("day")));
}

const isEnglish = (locale: string) => /^en(?:-|$)/i.test(locale);

/**
 * Intl writes some spaces as thin or narrow no-break spaces, and the version of
 * the Unicode data decides which: a server and a browser with different
 * versions then write different text, and React throws the server markup away.
 * A plain space looks the same and every engine agrees on it.
 */
const tidy = (text: string) => text.replace(/[\u00a0\u2009\u202f]/g, " ");

/** The index of the last part that came from the given end of the range, or -1. */
function lastIndexOf(parts: readonly Intl.DateTimeRangeFormatPart[], source: "startRange" | "endRange"): number {
  for (let index = parts.length - 1; index >= 0; index -= 1) if (parts[index]?.source === source) return index;
  return -1;
}

/**
 * A date range written the way people say it: "12 to 15 March 2026", with the
 * month and the year said once when they match, "28 February to 3 March 2026"
 * when only the year does and the whole of both dates when nothing does.
 * Intl works out the order and the shared parts in the reader's language, so a
 * Dutch page gets "12–15 maart 2026" and a Japanese one its own form, without
 * a data file. The output is one span with a `<time>` for each end, so the
 * machine-readable dates survive. Same-day ranges with times read "12 March
 * 2026, 10:00 to 11:30", an open range reads "from 12 March 2026", and nights
 * can be appended for a stay. Days are calendar days in the zone you name. A
 * Server Component.
 */
export function DateRangeText({
  start,
  end,
  locale = "en-US",
  timeZone = "UTC",
  includeTime = false,
  nights = false,
  month = "long",
  year = true,
  weekday = false,
  separator,
  labels,
  placeholder = "–",
  className,
  ...props
}: DateRangeTextProps) {
  const first = momentOf(start);
  const last = momentOf(end);
  if (!first && !last) {
    return (
      <span data-slot="date-range-text" data-empty="true" className={cn("text-muted-foreground", className)} {...props}>
        <span aria-hidden="true">{placeholder}</span>
        <span className="sr-only">{labels?.empty ?? "No dates"}</span>
      </span>
    );
  }

  // A time of day only exists where every date has one; otherwise both ends are plain calendar days.
  const showTime = includeTime && [first, last].every((moment) => moment === null || !moment.calendar);
  const zone = showTime ? timeZone : "UTC";
  const options: Intl.DateTimeFormatOptions = {
    timeZone: zone,
    day: "numeric",
    month,
    ...(year ? { year: "numeric" } : {}),
    ...(weekday ? { weekday: "short" } : {}),
    ...(showTime ? { hour: "numeric", minute: "2-digit" } : {}),
  };
  const format = dateFormat(locale, options);
  const at = (moment: Moment): Date => (showTime ? moment.instant : dayOf(moment, timeZone));
  const iso = (date: Date) => (showTime ? date.toISOString() : date.toISOString().slice(0, 10));

  let body: ReactNode;
  let count = 0;
  if (!first || !last) {
    // Open at one end: "from 12 March 2026" or "until 15 March 2026".
    const only = first ?? last;
    if (!only) return null;
    const date = at(only);
    body = (
      <>
        {first ? (labels?.from ?? "from") : (labels?.until ?? "until")} <time dateTime={iso(date)}>{tidy(format.format(date))}</time>
      </>
    );
  } else {
    let a = at(first);
    let b = at(last);
    if (a.getTime() > b.getTime()) [a, b] = [b, a];
    count = Math.round(Math.abs(dayOf(last, timeZone).getTime() - dayOf(first, timeZone).getTime()) / DAY);

    const parts = format.formatRangeToParts(a, b);
    const firstStart = parts.findIndex((part) => part.source === "startRange");
    const lastStart = lastIndexOf(parts, "startRange");
    const firstEnd = parts.findIndex((part) => part.source === "endRange");
    const lastEnd = lastIndexOf(parts, "endRange");
    const text = (from: number, to: number) =>
      parts
        .slice(Math.max(0, from), to + 1)
        .map((part) => tidy(part.value))
        .join("");

    if (firstStart === -1 || firstEnd === -1) {
      // Both ends fall on the same moment, so Intl wrote it once.
      body = <time dateTime={iso(a)}>{text(0, parts.length - 1)}</time>;
    } else if (lastStart > firstEnd) {
      // Not a shape any language has so far: write the two ends on their own rather than guess.
      body = (
        <>
          <time dateTime={iso(a)}>{tidy(format.format(a))}</time>
          {separator ?? " – "}
          <time dateTime={iso(b)}>{tidy(format.format(b))}</time>
        </>
      );
    } else {
      const between = parts.slice(lastStart + 1, firstEnd);
      const plain = between.every((part) => part.type === "literal");
      const glue = separator ?? (isEnglish(locale) && plain ? " to " : between.map((part) => tidy(part.value)).join(""));
      body = (
        <>
          {text(0, firstStart - 1)}
          <time dateTime={iso(a)}>{text(firstStart, lastStart)}</time>
          {glue}
          <time dateTime={iso(b)}>{text(firstEnd, lastEnd)}</time>
          {text(lastEnd + 1, parts.length - 1)}
        </>
      );
    }
  }

  const stay = nights && count > 0 ? (labels?.nights?.(count) ?? `${count} night${count === 1 ? "" : "s"}`) : "";
  return (
    <span data-slot="date-range-text" className={cn("tabular-nums", className)} {...props}>
      {body}
      {stay ? (
        <span className="whitespace-nowrap text-muted-foreground">
          <span aria-hidden="true"> · </span>
          <span className="sr-only">, </span>
          {stay}
        </span>
      ) : null}
    </span>
  );
}
