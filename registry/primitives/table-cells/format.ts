/**
 * How the table cells write money and dates, as plain functions with no state and no hook, so a Server Component can
 * call them and a cell renders the same text on the server and in the browser.
 */

const numbers = new Map<string, Intl.NumberFormat>();
const dates = new Map<string, Intl.DateTimeFormat>();
const relatives = new Map<string, Intl.RelativeTimeFormat>();

function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let found = numbers.get(key);
  if (!found) {
    try {
      found = new Intl.NumberFormat(locale, options);
    } catch {
      // An unknown locale falls back to US English rather than breaking the whole table.
      found = new Intl.NumberFormat("en-US", options);
    }
    numbers.set(key, found);
  }
  return found;
}

function dateFormat(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let found = dates.get(key);
  if (!found) {
    try {
      found = new Intl.DateTimeFormat(locale, options);
    } catch {
      found = new Intl.DateTimeFormat("en-US", options);
    }
    dates.set(key, found);
  }
  return found;
}

function relativeFormat(locale: string): Intl.RelativeTimeFormat {
  let found = relatives.get(locale);
  if (!found) {
    try {
      found = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    } catch {
      found = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
    }
    relatives.set(locale, found);
  }
  return found;
}

/** The sign of a negative amount, as a true minus rather than a hyphen. */
const MINUS = "\u2212";

export interface AmountOptions {
  /** An ISO 4217 code: "EUR", "USD". */
  currency: string;
  /** The locale that writes the number. */
  locale: string;
  /** Put a plus in front of a positive amount. A negative one always has its minus. */
  signed?: boolean;
}

/** An amount in major units as text: 1240.5 becomes "$1,240.50", and with `signed` "+$1,240.50", while a negative amount gets a true minus sign. */
export function formatAmount(value: number, { currency, locale, signed = false }: AmountOptions): string {
  try {
    return numberFormat(locale, { style: "currency", currency, signDisplay: signed ? "exceptZero" : "auto" })
      .formatToParts(value)
      .map((part) => (part.type === "minusSign" ? MINUS : part.value))
      .join("");
  } catch {
    // A currency code that is not one: write the number and the code as given.
    return `${numberFormat(locale, { maximumFractionDigits: 2 }).format(value)} ${currency}`;
  }
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** A value that is a calendar date and nothing more, such as "2026-11-07": it has no time and no time zone. */
export function isDateOnly(value: unknown): boolean {
  return typeof value === "string" && DATE_ONLY.test(value);
}

/** A date, a timestamp or an ISO string as a Date, or null when it is none of them. */
export function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** The calendar day a moment falls on in a time zone, as a number of days since 1970, so two moments can be compared by day. */
function dayNumber(date: Date, timeZone: string): number {
  const parts = dateFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return Math.floor(Date.UTC(read("year"), read("month") - 1, read("day")) / 86_400_000);
}

export interface DateTextOptions {
  locale: string;
  timeZone: string;
  /** The value has no time of day: it is written in UTC, whatever the time zone. */
  dateOnly?: boolean;
}

/** "Nov 7, 2026": the short, fixed way to write a date. */
export function shortDate(date: Date, { locale, timeZone, dateOnly = false }: DateTextOptions): string {
  return dateFormat(locale, { dateStyle: "medium", timeZone: dateOnly ? "UTC" : timeZone }).format(date);
}

/** "Saturday, November 7, 2026 at 2:12 PM UTC": everything, for a tooltip or a screen reader. A date-only value has no time. */
export function fullDate(date: Date, { locale, timeZone, dateOnly = false }: DateTextOptions): string {
  return dateOnly
    ? dateFormat(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(date)
    : dateFormat(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone }).format(date);
}

/**
 * "3 days ago", "yesterday", "in 2 hours": how far a date is from now in words. Under a minute is "now", under an hour
 * counts minutes, under a day counts hours, and after that it counts calendar days in the time zone, so "yesterday" means
 * the day before today there. A date-only value always counts days. Further than `within` days away there is no
 * relative form: it returns null, and the caller writes the date.
 */
export function relativeDate(date: Date, now: Date, { locale, timeZone, dateOnly = false, within = 30 }: DateTextOptions & { within?: number }): string | null {
  const format = relativeFormat(locale);
  const difference = date.getTime() - now.getTime();
  const distance = Math.abs(difference);
  if (!dateOnly) {
    if (distance < 60_000) return format.format(0, "second");
    if (distance < 3_600_000) return format.format(Math.trunc(difference / 60_000), "minute");
    if (distance < 86_400_000) return format.format(Math.trunc(difference / 3_600_000), "hour");
  }
  const zone = dateOnly ? "UTC" : timeZone;
  const days = dayNumber(date, zone) - dayNumber(now, zone);
  return Math.abs(days) > within ? null : format.format(days, "day");
}
