/**
 * The calendar days behind AvailabilityCalendar, as plain functions: they hold
 * no state and call no hook, so a Server Component can use them too. A day is
 * a day on the calendar ("2026-03-14"), never a moment, so none of this shifts
 * with a time zone: the arithmetic is done in UTC and so is the writing.
 */

/** A calendar day as "2026-03-14". */
export type Day = string;

/** A run of days, first and last included: a stay from the 14th to the 18th is `{ start: "2026-03-14", end: "2026-03-18" }`. */
export interface DayRange {
  start: Day;
  end: Day;
}

/** One day, or a run of them. */
export type DaySpec = Day | DayRange;

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS = 86_400_000;
/** No run is longer than this: a typo in an end date must not fill the page with years. */
const LONGEST_RUN = 1100;

/** The day as a count of days since 1970-01-01, or null when it is not a real day on the calendar. */
export function dayNumber(day: Day): number | null {
  const match = DAY.exec(day);
  if (!match) return null;
  const [year, month, date] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const at = Date.UTC(year, month - 1, date);
  const back = new Date(at);
  if (back.getUTCFullYear() !== year || back.getUTCMonth() !== month - 1 || back.getUTCDate() !== date) return null;
  return Math.floor(at / MS);
}

/** The day for a count of days since 1970-01-01. */
export function dayOf(count: number): Day {
  return new Date(count * MS).toISOString().slice(0, 10);
}

export function addDays(day: Day, count: number): Day {
  const at = dayNumber(day);
  return at === null ? day : dayOf(at + count);
}

/** The first of the month the day is in: "2026-03-14" is "2026-03-01". */
export function monthStart(day: Day): Day {
  return `${day.slice(0, 7)}-01`;
}

/** How many days the month of the day has. */
export function daysInMonth(day: Day): number {
  const match = DAY.exec(day);
  if (!match) return 30;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]), 0)).getUTCDate();
}

/** The same day some months on, held to the end of a shorter month: one month after January 31st is February 28th. */
export function addMonths(day: Day, count: number): Day {
  const match = DAY.exec(day);
  if (!match) return day;
  const target = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1 + count, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return dayOf(Math.floor(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(Number(match[3]), last)) / MS));
}

/** The day of the week: 0 is Sunday, 6 is Saturday. */
export function weekdayOf(day: Day): number {
  const at = dayNumber(day) ?? 0;
  // 1970-01-01 was a Thursday.
  return (((at + 4) % 7) + 7) % 7;
}

/** Today's day on the calendar of the time zone. An unknown zone reads as UTC. */
export function todayIn(timeZone: string): Day {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Every day named by a list of days and runs, as one set. Anything that is not a real day is left out. */
export function daySet(specs: readonly DaySpec[] | undefined): Set<Day> {
  const days = new Set<Day>();
  for (const spec of specs ?? []) {
    if (typeof spec === "string") {
      if (dayNumber(spec) !== null) days.add(spec);
      continue;
    }
    const first = dayNumber(spec.start);
    const last = dayNumber(spec.end);
    if (first === null || last === null) continue;
    const from = Math.min(first, last);
    const to = Math.min(Math.max(first, last), from + LONGEST_RUN);
    for (let at = from; at <= to; at += 1) days.add(dayOf(at));
  }
  return days;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

/** A day written in the locale. Intl writes some spaces as thin or narrow no-break spaces, and the version of the Unicode data decides which: a plain space looks the same and every engine agrees on it. */
export function dayText(day: Day, locale: string, options: Intl.DateTimeFormatOptions): string {
  const at = dayNumber(day);
  if (at === null) return day;
  const key = `${locale}|${JSON.stringify(options)}`;
  let found = formatters.get(key);
  if (!found) {
    try {
      found = new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" });
    } catch {
      found = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
    }
    formatters.set(key, found);
  }
  return found.format(at * MS).replace(/\s/g, " ");
}

/** "{count}" and friends in a template, filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
