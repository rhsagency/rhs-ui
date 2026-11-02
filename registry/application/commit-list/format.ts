/**
 * The words and dates behind CommitList, as plain functions: they hold no
 * state and call no hook, so a Server Component can use them too. Every
 * function takes the locale and the time zone, so the same input gives the
 * same text on the server and in the browser.
 */

/** A moment: a Date, an ISO string or a timestamp in ms. */
export type DateInput = Date | string | number;

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

/**
 * A date written in the locale, in the zone. Intl writes some spaces as thin
 * or narrow no-break spaces, and the version of the Unicode data decides
 * which: a plain space looks the same and every engine agrees on it.
 */
export function dateIn(at: number, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  return formatter(locale, timeZone, options).format(at).replace(/[\u00a0\u2009\u202f]/g, " ");
}

/** The calendar day of a moment in the zone, as a count of days: two moments on the same day give the same number. */
export function dayNumber(at: number, timeZone: string): number {
  const parts = formatter("en-US", timeZone, { year: "numeric", month: "numeric", day: "numeric" }).formatToParts(at);
  const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value);
  return Math.floor(Date.UTC(part("year"), part("month") - 1, part("day")) / DAY);
}

const wordsByLocale = new Map<string, Intl.RelativeTimeFormat>();

function relativeWords(locale: string): Intl.RelativeTimeFormat {
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

/**
 * "3 minutes ago", "yesterday", "2 weeks ago": how far a moment is from now,
 * in the locale's own words. Minutes and hours are cut, never rounded up, so
 * 59 minutes never reads "1 hour"; from a day up the count is calendar days
 * in the zone, so "yesterday" is the day before and not 24 hours ago.
 * Under a minute it says `justNow`.
 */
export function ageText(at: number, now: number, locale: string, timeZone: string, justNow: string): string {
  const diff = at - now;
  const age = Math.abs(diff);
  const words = relativeWords(locale);
  if (age < MINUTE) return justNow;
  if (age < HOUR) return words.format(Math.trunc(diff / MINUTE), "minute");
  if (age < DAY) return words.format(Math.trunc(diff / HOUR), "hour");
  const sign = diff < 0 ? -1 : 1;
  const days = Math.abs(dayNumber(at, timeZone) - dayNumber(now, timeZone));
  if (days < 7) return words.format(sign * Math.max(1, days), "day");
  if (days < 30) return words.format(sign * Math.floor(days / 7), "week");
  // At least one: 30 days is "last month" and 365 days "last year", never "this month" or "this year", which is what a count of zero reads as.
  if (days < 365) return words.format(sign * Math.max(1, Math.min(11, Math.floor(days / 30.44))), "month");
  return words.format(sign * Math.max(1, Math.floor(days / 365.25)), "year");
}

/** The first line of a commit message is its subject; what follows is the body, unless a body is given on its own. */
export function splitMessage(message: string, body?: string): { subject: string; body: string } {
  const text = message.replace(/\r\n/g, "\n").trim();
  const newline = text.indexOf("\n");
  const subject = newline === -1 ? text : text.slice(0, newline).trim();
  const rest = newline === -1 ? "" : text.slice(newline + 1).trim();
  return { subject, body: (body ?? rest).trim() };
}

/** "{count}" and friends in a template, filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
