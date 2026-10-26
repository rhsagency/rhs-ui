/**
 * Calendar days for the week strip. A day is the string "2026-10-26": a day on
 * the calendar, not a moment, so it never shifts with a time zone. All the
 * arithmetic runs in UTC for that reason, and only `todayIn` looks at a clock.
 */

const DAY_MS = 86_400_000;
const PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Whether the text is a real calendar day, such as "2026-10-26". "2026-02-30" is not. */
export function isDay(value: string | null | undefined): value is string {
  const match = value ? PATTERN.exec(value) : null;
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function toNumber(day: string): number {
  const match = PATTERN.exec(day);
  return Date.UTC(Number(match?.[1]), Number(match?.[2]) - 1, Number(match?.[3])) / DAY_MS;
}

/** The day `count` days after (or, when negative, before) `day`. */
export function addDays(day: string, count: number): string {
  return new Date((toNumber(day) + count) * DAY_MS).toISOString().slice(0, 10);
}

/** 0 for Sunday up to 6 for Saturday. */
export function weekdayOf(day: string): number {
  return new Date(toNumber(day) * DAY_MS).getUTCDay();
}

/** The first day of the week `day` falls in, where `weekStart` is 0 for Sunday and 1 for Monday. */
export function startOfWeek(day: string, weekStart: number): string {
  return addDays(day, -((weekdayOf(day) - weekStart + 7) % 7));
}

/** Today's date in the time zone, so the server and the browser agree. An unknown zone falls back to UTC instead of taking the page down. */
export function todayIn(timeZone: string): string {
  const parts = (zone: string) => new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(Date.now());
  let found: Intl.DateTimeFormatPart[];
  try {
    found = parts(timeZone);
  } catch {
    found = parts("UTC");
  }
  const part = (type: string) => found.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** A day written in the reader's language, e.g. `{ weekday: "long", day: "numeric", month: "long" }`. */
export function formatDay(day: string, locale: string, options: Intl.DateTimeFormatOptions): string {
  // Noon, so no zone can tip the day over.
  const at = toNumber(day) * DAY_MS + DAY_MS / 2;
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(at);
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
}

/** Two days as one range, such as the two months a week spans. */
export function formatDays(from: string, to: string, locale: string, options: Intl.DateTimeFormatOptions): string {
  const at = (day: string) => toNumber(day) * DAY_MS + DAY_MS / 2;
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).formatRange(at(from), at(to));
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).formatRange(at(from), at(to));
  }
}

/** How many events a day has: a list of days marks each as one, an object says how many. */
export function countOn(marked: readonly string[] | Readonly<Record<string, number>> | undefined, day: string): number {
  if (!marked) return 0;
  if (Array.isArray(marked)) return (marked as readonly string[]).includes(day) ? 1 : 0;
  return Math.max(0, Math.floor((marked as Readonly<Record<string, number>>)[day] ?? 0));
}
