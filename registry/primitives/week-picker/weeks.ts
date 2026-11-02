/** How weeks are counted. ISO 8601 numbers a week by the year most of it falls in (week 1 holds the first Thursday); US numbering makes the week with 1 January week 1. */
export type WeekNumbering = "iso" | "us";

/** The first day of the week: 0 is Sunday, 1 is Monday, up to 6 for Saturday. */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** A week, as the picker reports it. */
export interface WeekValue {
  /** The first day of the week as an ISO date: "2026-10-19". */
  start: string;
  /** The last day of the week: "2026-10-25". */
  end: string;
  /** The number of the week in its year, 1 to 53. */
  week: number;
  /** The year the number counts in. Around New Year it can differ from the year of `start`: 2025-12-29 is in week 1 of 2026. */
  year: number;
}

export interface WeekOptions {
  weekStartsOn: WeekStart;
  numbering: WeekNumbering;
}

/** The words the picker says, for another language or your own voice. */
export interface WeekLabels {
  /** The name of the whole control when it has no label of its own. */
  field: string;
  /** What the trigger says while no week is chosen. */
  placeholder: string;
  /** The name of a week: "Week 43". */
  week: (number: number) => string;
  /** The name of the button that goes back one week. */
  previous: string;
  /** The name of the button that goes forward one week. */
  next: string;
  /** The name of the button in the grid that shows the month before. */
  previousMonth: string;
  /** The name of the button in the grid that shows the month after. */
  nextMonth: string;
  /** The heading of the column with week numbers, in full for a screen reader. */
  weekNumber: string;
  /** The same heading, short, for the screen. */
  weekShort: string;
  /** The button that picks the week that holds today. */
  thisWeek: string;
}

export const DEFAULT_LABELS: WeekLabels = {
  field: "Week",
  placeholder: "Pick a week",
  week: (number) => `Week ${number}`,
  previous: "Previous week",
  next: "Next week",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  weekNumber: "Week number",
  weekShort: "Wk",
  thisWeek: "This week",
};

const DAY = 86_400_000;
const pad = (value: number, width = 2) => String(value).padStart(width, "0");

export interface DateNumbers {
  year: number;
  month: number;
  day: number;
}

/** The numbers in an ISO date, or null when it is not one or the day does not exist ("2026-02-31"). */
export function parseIso(iso: string | null | undefined): DateNumbers | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso ?? "").trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // Date.UTC reads the years 0 to 99 as 1900 to 1999, so the picker only takes four-digit years from 1000.
  if (year < 1000) return null;
  const check = new Date(Date.UTC(year, month - 1, day));
  return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day ? { year, month, day } : null;
}

export const toIso = (year: number, month: number, day: number) => `${pad(year, 4)}-${pad(month)}-${pad(day)}`;

/** Whole days since 1970-01-01 for a calendar date. A calendar date has no time zone, so this is UTC arithmetic and a daylight saving change never gets in. */
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
export function startOfWeek(iso: string, weekStartsOn: WeekStart): string {
  return addDays(iso, -((weekday(iso) - weekStartsOn + 7) % 7));
}

/**
 * The week a date is in. A week belongs to the year that holds enough of it:
 * four of its seven days for ISO numbering (so the Thursday, with Monday
 * weeks), and for US numbering the week with 1 January is week 1, so the year
 * its last day falls in. Week 1 is then the week with 4 January or 1 January.
 */
export function weekOf(iso: string, { weekStartsOn, numbering }: WeekOptions): WeekValue {
  const start = startOfWeek(iso, weekStartsOn);
  const end = addDays(start, 6);
  const minimalDays = numbering === "iso" ? 4 : 1;
  const year = parseIso(addDays(start, 7 - minimalDays))?.year ?? 0;
  const first = startOfWeek(toIso(year, 1, minimalDays), weekStartsOn);
  const week = Math.round((dayNumber(start) - dayNumber(first)) / 7) + 1;
  return { start, end, week, year };
}

/** A week as the picker needs it from outside: the week its `start` is in, counted the way this picker counts, or null for nothing usable. */
export function normaliseWeek(value: WeekValue | null | undefined, options: WeekOptions): WeekValue | null {
  return value && parseIso(value.start) ? weekOf(value.start, options) : null;
}

/** True when any day of the week is between `min` and `max` (ISO dates). A week that only touches the range is still one you can pick. */
export function weekAllowed(week: WeekValue, min: string | undefined, max: string | undefined): boolean {
  return (min === undefined || week.end >= min) && (max === undefined || week.start <= max);
}

/** The date, kept inside `min` and `max` when they are given. */
export function clampDay(iso: string, min: string | undefined, max: string | undefined): string {
  if (min !== undefined && iso < min) return min;
  if (max !== undefined && iso > max) return max;
  return iso;
}

/** The calendar date a moment falls on in a time zone, as "YYYY-MM-DD". An unknown zone reads as UTC, and a date written without a time is taken as that very date. */
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

/** Six weeks of seven days that hold the month of `anchor`, so the grid is always as tall as the tallest month. */
export function monthGrid(anchor: string, weekStartsOn: WeekStart): string[][] {
  const parts = parseIso(anchor);
  const first = parts ? toIso(parts.year, parts.month, 1) : anchor;
  const from = startOfWeek(first, weekStartsOn);
  return Array.from({ length: 6 }, (_, row) => Array.from({ length: 7 }, (_, column) => addDays(from, row * 7 + column)));
}

const noon = (iso: string) => {
  const parts = parseIso(iso);
  return parts ? Date.UTC(parts.year, parts.month - 1, parts.day, 12) : Number.NaN;
};

const formats = new Map<string, Intl.DateTimeFormat>();

/** A date format, kept: building one is far slower than using it, and a grid asks for sixty of them. An unknown locale reads as English. */
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
export function formatDay(iso: string, locale: string, options: Intl.DateTimeFormatOptions): string {
  return dateFormat(locale, options).format(noon(iso));
}

/** The days of a week as a span the way the locale writes one: "19 - 25 Oct 2026", "Oct 19 - 25, 2026", and both years when it crosses New Year. Without the year: "19 - 25 Oct". */
export function formatSpan(start: string, end: string, locale: string, month: "short" | "long", withYear = true): string {
  const format = dateFormat(locale, withYear ? { day: "numeric", month, year: "numeric" } : { day: "numeric", month });
  try {
    return format.formatRange(noon(start), noon(end));
  } catch {
    return `${format.format(noon(start))} - ${format.format(noon(end))}`;
  }
}

/** Seven weekday names starting at `weekStartsOn`, short for the heading and long for a screen reader. */
export function weekdayNames(locale: string, weekStartsOn: WeekStart): { short: string; long: string }[] {
  // 2023-01-01 is a Sunday.
  return Array.from({ length: 7 }, (_, index) => {
    const day = addDays("2023-01-01", (weekStartsOn + index) % 7);
    return { short: formatDay(day, locale, { weekday: "short" }), long: formatDay(day, locale, { weekday: "long" }) };
  });
}
