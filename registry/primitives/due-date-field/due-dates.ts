/** The words the field says, in its chips, in the line under them and to a screen reader. Each can be replaced, for another language or your own voice. */
export interface DueDateLabels {
  /** The name of the group of chips. */
  group: string;
  /** The first quick pick. */
  today: string;
  /** The second quick pick. */
  tomorrow: string;
  /** The third quick pick: the coming Monday. */
  nextWeek: string;
  /** The chip that opens the calendar. */
  pick: string;
  /** The chip that clears the date. */
  none: string;
  /** The line under the chips while there is no date. */
  noDate: string;
  /** The line under the chips for a date that has passed. `distance` is the time that went by: "2 days". */
  overdue: (distance: string) => string;
  /** The name of the calendar panel. */
  calendar: string;
}

export const DEFAULT_LABELS: DueDateLabels = {
  group: "Due date",
  today: "Today",
  tomorrow: "Tomorrow",
  nextWeek: "Next week",
  pick: "Pick a date",
  none: "No date",
  noDate: "No due date",
  overdue: (distance) => `Overdue by ${distance}`,
  calendar: "Choose a due date",
};

/** A quick pick. */
export interface DueDateChip {
  /** A stable key for the chip. */
  id: string;
  /** What the chip says. */
  label: string;
  /** The date it picks, "YYYY-MM-DD", or a function that works it out from today's date, also "YYYY-MM-DD". */
  date: string | ((today: string) => string);
}

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
  const check = new Date(Date.UTC(year, month - 1, day));
  return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day ? { year, month, day } : null;
}

export const toIso = (year: number, month: number, day: number) => `${pad(year, 4)}-${pad(month)}-${pad(day)}`;

/** Whole days since 1970-01-01 for a calendar date. Calendar days have no time zone, so this is UTC arithmetic and a daylight saving change never gets in. */
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

/** The coming Monday: the first Monday after the date given, so on a Monday it is a week away. */
export function nextMonday(iso: string): string {
  const parts = parseIso(iso);
  if (!parts) return iso;
  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  return addDays(iso, ((8 - weekday) % 7) || 7);
}

/** The calendar date the moment falls on in a time zone, as "YYYY-MM-DD". An unknown zone reads as UTC. */
export function isoInZone(moment: Date | string | number, timeZone: string): string | null {
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

/** A calendar date as a Date at local midnight, which is what the Calendar speaks. */
export function toLocalDate(iso: string): Date | null {
  const parts = parseIso(iso);
  return parts ? new Date(parts.year, parts.month - 1, parts.day) : null;
}

/** A Date the Calendar handed over, as the calendar date it shows. */
export const fromLocalDate = (date: Date) => toIso(date.getFullYear(), date.getMonth() + 1, date.getDate());

/** The date as people write it in the locale: "Fri 23 Oct", and with the year when it is not this year's. */
export function dateInWords(iso: string, locale: string, today: string | null): string {
  const parts = parseIso(iso);
  if (!parts) return iso;
  const elsewhere = today !== null && parseIso(today)?.year !== parts.year;
  return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", ...(elsewhere ? { year: "numeric" } : {}), timeZone: "UTC" }).format(Date.UTC(parts.year, parts.month - 1, parts.day, 12));
}

/** How far a date is from today in the locale's words: "today", "tomorrow", "in 3 days", "yesterday", "5 days ago", "in 3 weeks". */
export function distanceInWords(days: number, locale: string): string {
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const size = Math.abs(days);
  if (size <= 13) return format.format(days, "day");
  if (size < 60) return format.format(Math.round(days / 7), "week");
  return format.format(Math.round(days / 30.44), "month");
}

/** How long ago a due date was, without a direction: "2 days", "3 weeks", "4 months". */
export function lengthInWords(days: number, locale: string): string {
  const size = Math.abs(days);
  const [count, unit] = size <= 13 ? [size, "day"] : size < 60 ? [Math.round(size / 7), "week"] : [Math.round(size / 30.44), "month"];
  return new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "long" }).format(count);
}

/** The quick picks when you name none. */
export function defaultChips(labels: DueDateLabels): DueDateChip[] {
  return [
    { id: "today", label: labels.today, date: (today) => today },
    { id: "tomorrow", label: labels.tomorrow, date: (today) => addDays(today, 1) },
    { id: "next-week", label: labels.nextWeek, date: (today) => nextMonday(today) },
  ];
}

/** The date a chip picks, worked out from today. */
export function chipDate(chip: DueDateChip, today: string): string {
  return typeof chip.date === "function" ? chip.date(today) : chip.date;
}
