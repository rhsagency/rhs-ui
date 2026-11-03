/** The numbers in a calendar date. */
export interface DateNumbers {
  year: number;
  month: number;
  day: number;
}

/** The first day of the week: 0 is Sunday, 1 is Monday, up to 6 for Saturday. */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** The words the picker says, for another language or your own voice. */
export interface MultiDateLabels {
  /** The name of the button that shows the month before. */
  previousMonth: string;
  /** The name of the button that shows the month after. */
  nextMonth: string;
  /** The line that counts the picks: "3 dates selected, up to 5". `limit` is undefined when there is none. */
  count: (selected: number, limit: number | undefined) => string;
  /** Said once the limit is reached, and given as the reason to every day that can no longer be picked. */
  limitReached: (limit: number) => string;
  /** Said when a run of days did not fit: "Added 2 of 6 days. The limit is 5 dates." */
  truncated: (added: number, asked: number, limit: number) => string;
  /** The button that removes every pick. */
  clear: string;
  /** The name of the list of chips. */
  listLabel: string;
  /** The name of a chip's remove button, given the day in full: "Remove Tuesday 27 October 2026". */
  remove: (day: string) => string;
  /** What stands where the chips will be while nothing is picked. */
  empty: string;
}

export const DEFAULT_LABELS: MultiDateLabels = {
  previousMonth: "Previous month",
  nextMonth: "Next month",
  count: (selected, limit) => `${selected === 0 ? "No dates" : `${selected} ${selected === 1 ? "date" : "dates"}`} selected${limit === undefined ? "" : `, up to ${limit}`}`,
  limitReached: (limit) => `That is the most you can pick (${limit}). Remove a date to choose another day.`,
  truncated: (added, asked, limit) => `Added ${added} of ${asked} days. The limit is ${limit} dates.`,
  clear: "Clear",
  listLabel: "Selected dates",
  remove: (day) => `Remove ${day}`,
  empty: "Click a day to add it. Shift-click adds every day in between.",
};

const DAY = 86_400_000;
const pad = (value: number, width = 2) => String(value).padStart(width, "0");

/** The numbers in an ISO date, or null when it is not one or the day does not exist ("2026-02-31"). */
export function parseIso(iso: string | null | undefined): DateNumbers | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso ?? "").trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // Date.UTC reads the years 0 to 99 as 1900 to 1999, so only four-digit years from 1000 are taken.
  if (year < 1000) return null;
  const check = new Date(Date.UTC(year, month - 1, day));
  return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day ? { year, month, day } : null;
}

export const toIso = (year: number, month: number, day: number): string => `${pad(year, 4)}-${pad(month)}-${pad(day)}`;

/** Whole days since 1970-01-01. A calendar date has no time zone, so this is UTC arithmetic and a daylight saving change never gets in. */
export function dayNumber(iso: string): number {
  const parts = parseIso(iso);
  return parts ? Date.UTC(parts.year, parts.month - 1, parts.day) / DAY : Number.NaN;
}

/** The date `days` after (or before, when negative) the one given. */
export function addDays(iso: string, days: number): string {
  const parts = parseIso(iso);
  if (!parts) return iso;
  const moved = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return toIso(moved.getUTCFullYear(), moved.getUTCMonth() + 1, moved.getUTCDate());
}

/** The date `months` later, on the same day of the month or the last day of a shorter one. */
export function addMonths(iso: string, months: number): string {
  const parts = parseIso(iso);
  if (!parts) return iso;
  const target = new Date(Date.UTC(parts.year, parts.month - 1 + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return toIso(target.getUTCFullYear(), target.getUTCMonth() + 1, Math.min(parts.day, last));
}

/** 0 for a Sunday up to 6 for a Saturday. */
export function weekday(iso: string): number {
  const parts = parseIso(iso);
  return parts ? new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay() : 0;
}

/** The first day of the week the date is in. */
export const startOfWeek = (iso: string, weekStartsOn: WeekStart): string => addDays(iso, -((weekday(iso) - weekStartsOn + 7) % 7));

/** The date, kept inside `min` and `max` when they are given. */
export function clampDay(iso: string, min: string | undefined, max: string | undefined): string {
  if (min !== undefined && iso < min) return min;
  if (max !== undefined && iso > max) return max;
  return iso;
}

/** The calendar date a moment falls on in a time zone, as "YYYY-MM-DD". An unknown zone reads as UTC. */
export function isoInZone(moment: Date | string | number, timeZone: string): string | null {
  if (typeof moment === "string" && /^\d{4}-\d{2}-\d{2}$/.test(moment.trim())) return parseIso(moment) ? moment.trim() : null;
  const instant = new Date(moment);
  if (Number.isNaN(instant.getTime())) return null;
  const read = (zone: string) => new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = read(timeZone);
  } catch {
    parts = read("UTC");
  }
  const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value);
  return toIso(part("year"), part("month"), part("day"));
}

/** Six weeks of seven days that hold the month of `anchor`, so the grid is as tall for February as for any other month. */
export function monthGrid(anchor: string, weekStartsOn: WeekStart): string[][] {
  const parts = parseIso(anchor);
  const first = parts ? toIso(parts.year, parts.month, 1) : anchor;
  const from = startOfWeek(first, weekStartsOn);
  return Array.from({ length: 6 }, (_, row) => Array.from({ length: 7 }, (_, column) => addDays(from, row * 7 + column)));
}

/** Every day from one date to the other, both included, in the order they come: the run Shift-click adds. */
export function runBetween(from: string, to: string): string[] {
  const [first, last] = from <= to ? [from, to] : [to, from];
  const days: string[] = [];
  // A run is never longer than the calendar can show in practice; the cap keeps a mistaken pair of years from freezing the page.
  for (let day = first, count = 0; day <= last && count < 3660; day = addDays(day, 1), count += 1) days.push(day);
  return days;
}

/** Valid ISO dates only, each once, in date order. */
export function sortedUnique(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).map((value) => value.trim()).filter((value) => parseIso(value)))].sort();
}

const noon = (iso: string) => {
  const parts = parseIso(iso);
  return parts ? Date.UTC(parts.year, parts.month - 1, parts.day, 12) : Number.NaN;
};

const formats = new Map<string, Intl.DateTimeFormat>();

/** A date format, kept: building one is far slower than using it, and a month grid asks for dozens. An unknown locale reads as English. */
function dateFormat(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = formats.get(key);
  if (!format) {
    try {
      format = new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" });
    } catch {
      format = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
    }
    formats.set(key, format);
  }
  return format;
}

/** A day in the locale, as the Intl options say. A calendar date has no time zone, so it is written in UTC. */
export const formatDay = (iso: string, locale: string, options: Intl.DateTimeFormatOptions): string => dateFormat(locale, options).format(noon(iso));

/** Seven weekday names starting at `weekStartsOn`, narrow for the heading and long for a screen reader. */
export function weekdayNames(locale: string, weekStartsOn: WeekStart): { short: string; long: string }[] {
  // 2023-01-01 is a Sunday.
  return Array.from({ length: 7 }, (_, index) => {
    const day = addDays("2023-01-01", (weekStartsOn + index) % 7);
    return { short: formatDay(day, locale, { weekday: "narrow" }), long: formatDay(day, locale, { weekday: "long" }) };
  });
}
