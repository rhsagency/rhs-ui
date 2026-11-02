/**
 * The dates and numbers behind SpecialistCard, as plain functions: they hold
 * no state and call no hook, so a Server Component can use them too. Every
 * function takes the locale and the time zone, so the same input gives the
 * same text on the server and in the browser.
 */

/** A moment: a Date, an ISO string or a timestamp in ms. */
export type DateInput = Date | string | number;

const formatters = new Map<string, Intl.DateTimeFormat>();
const numbers = new Map<string, Intl.NumberFormat>();

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

function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let found = numbers.get(key);
  if (!found) {
    try {
      found = new Intl.NumberFormat(locale, options);
    } catch {
      found = new Intl.NumberFormat("en-US", options);
    }
    numbers.set(key, found);
  }
  return found;
}

/**
 * A date written in the locale, in the zone. Intl writes some spaces as thin
 * or narrow no-break spaces, and the version of the Unicode data decides
 * which: a plain space looks the same and every engine agrees on it.
 */
export function dateIn(at: number, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  return formatter(locale, timeZone, options).format(at).replace(/\s/g, " ");
}

/** The calendar day of a moment in the zone, as a count of days. */
export function dayNumber(at: number, timeZone: string): number {
  const parts = formatter("en-US", timeZone, { year: "numeric", month: "numeric", day: "numeric" }).formatToParts(at);
  const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value);
  return Math.floor(Date.UTC(part("year"), part("month") - 1, part("day")) / 86_400_000);
}

/** "{count}" and friends in a template, filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

/** The titles that lead a name without being part of who the person is, with or without a full stop: "Dr." and "Prof" are not initials. */
const TITLES = /^(?:dr|drs|prof|mr|mrs|ms|mx|mw|mevr|dhr|ir)\.?$/i;

/**
 * A name without the titles in front of it: "Prof. Dr. Ines Kowalski" is
 * "Ines Kowalski", so the avatar says IK and not PK. A name that is nothing but
 * a title is left alone, and so is everything after the first word that is not
 * one.
 */
export function withoutTitles(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  let start = 0;
  while (start < words.length - 1 && TITLES.test(words[start] ?? "")) start += 1;
  return words.slice(start).join(" ");
}

/** A count with the locale's separators: "128" or "1,284". */
export function countText(value: number, locale: string): string {
  return numberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

/** A rating with one decimal: "4.9". */
export function scoreText(value: number, locale: string): string {
  return numberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

/** The words that turn a moment into "Tomorrow, 10:30". `{day}` and `{time}` are filled in. */
export interface SlotWords {
  today: string;
  tomorrow: string;
  /** How the day and the time are put together. Default "{day}, {time}". */
  pattern: string;
}

/**
 * When the next slot is, the way a person says it: "Today, 16:45", "Tomorrow,
 * 10:30", "Thursday, 14:15", and from a week away the date, "12 Nov, 09:00"
 * (with the year when it is not this one). Before the clock is known (the
 * server HTML, the first paint) there is no "tomorrow" to say, so it writes the
 * date: "Thu 5 Nov, 14:15".
 */
export function slotText(at: number, now: number | null, locale: string, timeZone: string, words: SlotWords): string {
  const time = dateIn(at, locale, timeZone, { hour: "numeric", minute: "2-digit" });
  let day: string;
  if (now === null) {
    day = dateIn(at, locale, timeZone, { weekday: "short", day: "numeric", month: "short" });
  } else {
    const ahead = dayNumber(at, timeZone) - dayNumber(now, timeZone);
    if (ahead === 0) day = words.today;
    else if (ahead === 1) day = words.tomorrow;
    else if (ahead > 1 && ahead < 7) day = dateIn(at, locale, timeZone, { weekday: "long" });
    else {
      const sameYear = dateIn(at, "en-US", timeZone, { year: "numeric" }) === dateIn(now, "en-US", timeZone, { year: "numeric" });
      day = dateIn(at, locale, timeZone, sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
    }
  }
  return fill(words.pattern, { day, time });
}
