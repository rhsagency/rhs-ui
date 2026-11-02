/**
 * The words behind RelativeTime, as plain functions: they hold no state and
 * call no hook, so a Server Component can use them too ("3 minutes ago" in a
 * mail, a log line, an RSS item). Every function takes the moment to measure
 * from, the locale and the time zone, so the same input gives the same text on
 * the server and in the browser.
 */

/** A moment: a Date, an ISO string or a timestamp in ms. */
export type RelativeTimeInput = Date | string | number;

/**
 * How a date reads once a time is too far away for words: "short" is "12 Mar"
 * (with the year when it is not this year), "medium" "12 Mar 2026", "long"
 * "12 March 2026", "datetime" "12 Mar 2026, 14:30". Pass Intl options to write
 * it your own way.
 */
export type RelativeTimeFormat = "short" | "medium" | "long" | "datetime" | Intl.DateTimeFormatOptions;

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

const formatters = new Map<string, Intl.DateTimeFormat>();

/** A formatter for the locale and zone, kept for the next call. An unknown locale or zone falls back to US English and UTC: a typo must not take the page down. */
function formatter(locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${timeZone}|${JSON.stringify(options)}`;
  let found = formatters.get(key);
  if (!found) {
    try {
      found = new Intl.DateTimeFormat(locale, { ...options, timeZone });
    } catch {
      found = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
    }
    formatters.set(key, found);
  }
  return found;
}

const wordsByLocale = new Map<string, Intl.RelativeTimeFormat>();

function words(locale: string): Intl.RelativeTimeFormat {
  let found = wordsByLocale.get(locale);
  if (!found) {
    try {
      found = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    } catch {
      found = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
    }
    wordsByLocale.set(locale, found);
  }
  return found;
}

interface Day {
  year: number;
  month: number;
  day: number;
}

/** The calendar day a moment falls on in the zone. */
function dayOf(at: number, timeZone: string): Day {
  const parts = formatter("en-US", timeZone, { year: "numeric", month: "numeric", day: "numeric" }).formatToParts(at);
  const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value);
  return { year: part("year"), month: part("month"), day: part("day") };
}

const dayNumber = ({ year, month, day }: Day) => Math.floor(Date.UTC(year, month - 1, day) / DAY);

/** A moment as milliseconds, or NaN when it is not a date at all. */
export function toTimestamp(input: RelativeTimeInput): number {
  return new Date(input).getTime();
}

interface RelativeParts {
  value: number;
  unit: Intl.RelativeTimeFormatUnit;
}

/**
 * The size and unit of a distance in time. Minutes under an hour, hours under
 * a day, then calendar days in the zone (so "yesterday" is the day before, not
 * 24 hours ago), weeks, months and years. Counts are cut, never rounded up, so
 * 59 minutes never reads "1 hour" and a future time is never later than it
 * says. Null for anything under a minute in the past, which reads "just now".
 */
function relativeParts(at: number, now: number, timeZone: string): RelativeParts | null {
  const diff = at - now;
  const age = Math.abs(diff);
  if (age < MINUTE) return diff <= 0 ? null : { value: 1, unit: "minute" };
  if (age < HOUR) return { value: Math.trunc(diff / MINUTE), unit: "minute" };
  if (age < DAY) return { value: Math.trunc(diff / HOUR), unit: "hour" };
  const then = dayOf(at, timeZone);
  const today = dayOf(now, timeZone);
  const days = dayNumber(then) - dayNumber(today);
  const sign = diff < 0 ? -1 : 1;
  const distance = Math.max(1, Math.abs(days));
  if (distance < 7) return { value: sign * distance, unit: "day" };
  if (distance < 30) return { value: sign * Math.floor(distance / 7), unit: "week" };
  // Calendar months between the two days, a month only counting once its day of the month has come.
  const [early, late] = days < 0 ? [then, today] : [today, then];
  const months = Math.max(1, (late.year - early.year) * 12 + (late.month - early.month) - (late.day < early.day ? 1 : 0));
  return months < 12 ? { value: sign * months, unit: "month" } : { value: sign * Math.floor(months / 12), unit: "year" };
}

/** "just now", "3 minutes ago", "in 2 hours", "yesterday", "2 weeks ago", "last year": the locale's own words, for any distance. */
export function relativeText(at: number, now: number, locale: string, timeZone: string, justNow = "just now"): string {
  const parts = relativeParts(at, now, timeZone);
  return parts ? words(locale).format(parts.value, parts.unit) : justNow;
}

/** Whether the time is still close enough, in days, to be said in words. Infinity always is, 0 never is. */
export function isRelative(at: number, now: number, thresholdDays: number): boolean {
  return Math.abs(at - now) < thresholdDays * DAY;
}

/**
 * A date written out, for a time that is too far away for words. With a `now`
 * the short format leaves the year out of dates in the current year; without
 * one (the server, the first paint) every year is written, so the text never
 * depends on a clock.
 */
export function dateText(at: number, locale: string, timeZone: string, format: RelativeTimeFormat = "short", now: number | null = null): string {
  if (typeof format === "object") return formatter(locale, timeZone, format).format(at);
  const sameYear = now !== null && dayOf(at, timeZone).year === dayOf(now, timeZone).year;
  const options: Intl.DateTimeFormatOptions =
    format === "long"
      ? { day: "numeric", month: "long", year: "numeric" }
      : format === "datetime"
        ? { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }
        : format === "medium" || !sameYear
          ? { day: "numeric", month: "short", year: "numeric" }
          : { day: "numeric", month: "short" };
  return formatter(locale, timeZone, options).format(at);
}

/** What the server writes and the first browser paint repeats: the date with its year, whatever the format, since the clock is not known yet. */
export function stableText(at: number, locale: string, timeZone: string, format: RelativeTimeFormat = "short"): string {
  return dateText(at, locale, timeZone, format === "short" ? "medium" : format);
}

/** The exact moment, for the tooltip and for screen readers: "Mon, Nov 2, 2026, 2:30 PM UTC". The zone is named, so nobody has to guess whose clock it is. */
export function exactText(at: number, locale: string, timeZone: string): string {
  return formatter(locale, timeZone, { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(at);
}

/**
 * How long until the words can change, in ms: at the next whole minute while
 * they count minutes, at the next hour while they count hours, every ten
 * minutes once they count days or more. Null when they never will: the time is
 * now past the threshold and reads as a date for good. Never under a second,
 * so a timer cannot spin.
 */
export function msUntilChange(at: number, now: number, thresholdDays: number): number | null {
  if (!isRelative(at, now, thresholdDays)) return null;
  const diff = at - now;
  const age = Math.abs(diff);
  const step = age < HOUR ? MINUTE : age < DAY ? HOUR : 10 * MINUTE;
  // In the past the age crosses the next multiple of the step; in the future the time left falls below the last one.
  const wait = diff <= 0 ? step - (age % step) : age % step || step;
  return Math.max(1000, wait + 40);
}
