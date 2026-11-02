/**
 * The words and numbers behind BookCard, as plain functions: they hold no
 * state and call no hook, so a Server Component can use them too. Every
 * function takes the locale (and the time zone for dates), so the same input
 * gives the same text on the server and in the browser.
 */

/** A moment: a Date, an ISO string or a timestamp in ms. */
export type DateInput = Date | string | number;

const numbers = new Map<string, Intl.NumberFormat>();
const dates = new Map<string, Intl.DateTimeFormat>();
const lists = new Map<string, Intl.ListFormat>();

/** A number formatter for the locale, kept for the next call. An unknown locale or currency falls back to US English: a typo must not take the page down. */
function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let found = numbers.get(key);
  if (!found) {
    try {
      found = new Intl.NumberFormat(locale, options);
    } catch {
      found = new Intl.NumberFormat("en-US", options.style === "currency" ? { ...options, style: "decimal", currency: undefined } : options);
    }
    numbers.set(key, found);
  }
  return found;
}

/** "{count}" and friends in a template, filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

/**
 * A price in the locale's own way: a whole amount drops its cents ("€18"), one
 * with cents keeps both ("€18.50"). Intl writes some spaces as no-break
 * spaces, and the version of the Unicode data decides which: a plain space
 * looks the same and every engine agrees on it.
 */
export function priceText(value: number, currency: string, locale: string): string {
  const fraction = Number.isInteger(value) ? 0 : 2;
  try {
    return numberFormat(locale, { style: "currency", currency, minimumFractionDigits: fraction, maximumFractionDigits: fraction }).format(value).replace(/\s/g, " ");
  } catch {
    return `${currency} ${numberFormat(locale, { minimumFractionDigits: fraction, maximumFractionDigits: fraction }).format(value)}`;
  }
}

/** A count with the locale's separators: "12,400" or "12.400". */
export function countText(value: number, locale: string): string {
  return numberFormat(locale, { maximumFractionDigits: 1 }).format(value);
}

/** A rating with one decimal: "4.3". */
export function scoreText(value: number, locale: string): string {
  return numberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

/** "Ilse Verbeek, Tom Calder and Ana Ruiz" in the reader's language. */
export function listOf(items: readonly string[], locale: string): string {
  let found = lists.get(locale);
  if (!found) {
    try {
      found = new Intl.ListFormat(locale, { style: "long", type: "conjunction" });
    } catch {
      found = new Intl.ListFormat("en-US", { style: "long", type: "conjunction" });
    }
    lists.set(locale, found);
  }
  return found.format(items);
}

/** A date-only string such as "2026-11-12": a calendar day, which belongs to no time zone. */
const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A date written in the locale, with the value for its `datetime` attribute. A
 * calendar day is written as the day it says: `new Date("2026-11-12")` is
 * midnight UTC, which in a zone west of UTC is still the day before, so a
 * date-only string is written in UTC whatever zone is asked for and stays a
 * date-only string in `datetime`. Null when the input is not a date.
 */
export function dateText(input: DateInput, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): { text: string; iso: string } | null {
  const at = new Date(input);
  if (Number.isNaN(at.getTime())) return null;
  const day = typeof input === "string" && CALENDAR_DAY.test(input);
  const zone = day ? "UTC" : timeZone;
  const key = `${locale}|${zone}|${JSON.stringify(options)}`;
  let found = dates.get(key);
  if (!found) {
    try {
      found = new Intl.DateTimeFormat(locale, { ...options, timeZone: zone });
    } catch {
      found = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
    }
    dates.set(key, found);
  }
  return { text: found.format(at).replace(/\s/g, " "), iso: day ? (input as string) : at.toISOString() };
}

/** A small stable number from a text, so a book without a cover always gets the same jacket. */
export function hashOf(text: string): number {
  let hash = 7;
  for (let index = 0; index < text.length; index += 1) hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  return hash;
}
