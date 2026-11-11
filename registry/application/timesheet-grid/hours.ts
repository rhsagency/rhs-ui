/**
 * The arithmetic and the words behind TimesheetGrid, as plain types and
 * functions: they hold no state and call no hook, so a Server Component can use
 * them too. Hours are kept as numbers of hours, summed as whole minutes so a
 * column of 0.1s never drifts, and days are calendar dates ("2026-10-26") that
 * belong to no time zone: only "today" needs one.
 */

/** One line of the timesheet: what the time is spent on. */
export interface TimesheetProject {
  /** A stable identity from your own data. It is the key of the project in `entries`. */
  id: string;
  /** What it is called: "Halcyon rebrand". */
  name: string;
  /** Who it is for: "Halcyon Foods". Shown small under the name. */
  client?: string;
}

/** Hours per project and day: `entries[projectId]["2026-10-26"]` is 7.5. A day with nothing logged has no entry. */
export type TimesheetEntries = Readonly<Record<string, Readonly<Record<string, number>>>>;

/** One cell that changed. */
export interface TimesheetChange {
  /** The `id` of the project. */
  projectId: string;
  /** The day, as "2026-10-26". */
  date: string;
  /** The hours now: 0 when the cell was emptied. */
  hours: number;
}

/** How hours are written: decimal "7.5" or as a clock "7:30". */
export type HoursFormat = "decimal" | "clock";

/** The words the grid says, for translation. `{project}`, `{day}`, `{hours}`, `{cap}`, `{number}`, `{range}` and `{text}` are filled in. */
export interface TimesheetLabels {
  /** The first column. Default "Project". */
  project?: string;
  /** The last column and the footer row. Default "Total". */
  total?: string;
  /** The word on today's column. Default "Today". */
  today?: string;
  /** The button that goes to the current week. Default "This week". */
  thisWeek?: string;
  /** The button that goes back a week. Default "Previous week". */
  previousWeek?: string;
  /** The button that goes forward a week. Default "Next week". */
  nextWeek?: string;
  /** The number of the week, under its dates. Default "Week {number}". */
  week?: string;
  /** Over the week's hours. Default "Week total". */
  weekTotal?: string;
  /** The week's hours against its target. Default "{hours} of {target}". */
  weekProgress?: string;
  /** The unit after a decimal number of hours. Default "h". */
  unit?: string;
  /** Under a day that reached its target. Default "Target met". */
  targetMet?: string;
  /** Under a past day that did not. Default "{hours} short". */
  hoursShort?: string;
  /** Under today, or a day that is still to come, that has not yet. Default "{hours} to go". */
  hoursToGo?: string;
  /** Under a day with more than the cap. Default "Over the {cap} cap". */
  overCap?: string;
  /** The name of a cell for screen readers. Default "{project}, {day}, hours". */
  cell?: string;
  /** The hint under the grid. Default "Type hours like 7.5, 7:30 or 7h 30m. Arrow keys move between cells, Enter saves and moves down, Escape undoes." */
  hint?: string;
  /** The hint under the grid on a narrow, touch screen, where the week scrolls sideways. Default "Tap a cell and type hours, like 7.5, 7:30 or 7h 30m. Swipe sideways for the rest of the week and each project's total." */
  hintTouch?: string;
  /** Said and shown when what was typed is not a time. Default "“{text}” is not a time. Try 7.5, 7:30 or 7h 30m." */
  invalid?: string;
  /** Said and shown when it is more than a day. Default "A day has 24 hours." */
  tooMany?: string;
  /** Said when a cell was saved. Default "{project}, {day}: {hours} hours." */
  saved?: string;
  /** Said when a cell was emptied. Default "{project}, {day}: cleared." */
  cleared?: string;
  /** Written in the banner of a locked week when `lockedReason` is not given. Default "This week is locked. Its hours cannot be changed." */
  locked?: string;
  /** Shown when there are no projects. Default "No projects yet. Add one to start logging time." */
  empty?: string;
  /** The name of the table for screen readers. Default "Timesheet, {range}". */
  caption?: string;
  /** Said after a total, for screen readers. Default "hours". */
  hoursWord?: string;
}

export const DEFAULT_LABELS = {
  project: "Project",
  total: "Total",
  today: "Today",
  thisWeek: "This week",
  previousWeek: "Previous week",
  nextWeek: "Next week",
  week: "Week {number}",
  weekTotal: "Week total",
  weekProgress: "{hours} of {target}",
  unit: "h",
  targetMet: "Target met",
  hoursShort: "{hours} short",
  hoursToGo: "{hours} to go",
  overCap: "Over the {cap} cap",
  cell: "{project}, {day}, hours",
  hint: "Type hours like 7.5, 7:30 or 7h 30m. Arrow keys move between cells, Enter saves and moves down, Escape undoes.",
  hintTouch: "Tap a cell and type hours, like 7.5, 7:30 or 7h 30m. Swipe sideways for the rest of the week and each project’s total.",
  invalid: "“{text}” is not a time. Try 7.5, 7:30 or 7h 30m.",
  tooMany: "A day has 24 hours.",
  saved: "{project}, {day}: {hours} hours.",
  cleared: "{project}, {day}: cleared.",
  locked: "This week is locked. Its hours cannot be changed.",
  empty: "No projects yet. Add one to start logging time.",
  caption: "Timesheet, {range}",
  hoursWord: "hours",
} satisfies Required<TimesheetLabels>;

/** Puts values into a template: `fill("Week {number}", { number: "44" })`. A name it does not know is left as it was. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? (values[key] ?? match) : match));
}

/** What typing into a cell can come to. */
export type ParsedHours = { ok: true; hours: number } | { ok: false; reason: "format" | "range" };

const MINUTES_PER_DAY = 24 * 60;

/**
 * Reads what was typed: 7.5, 7,5, 7:30, 7h, 7h 30m, 30m, 1.5h 15m. Nothing is 0 hours, which empties the cell. The result
 * is rounded to the minute, and more than 24 hours is refused.
 */
export function parseHours(input: string): ParsedHours {
  const text = input.trim().toLowerCase().replace(/\s+/g, " ");
  if (!text) return { ok: true, hours: 0 };
  const number = "(\\d+(?:[.,]\\d+)?|[.,]\\d+)";
  const decimal = (value: string) => Number(value.replace(",", "."));
  let minutes: number;
  // 7:30, and 7h30 as it is written in many languages: the same thing.
  const clock = /^(\d{1,3})(?::|\s*h\s*)(\d{1,2})$/.exec(text);
  const plain = new RegExp(`^${number}\\s*(?:h|hr|hrs|hour|hours)?$`).exec(text);
  const words = new RegExp(`^(?:${number}\\s*(?:h|hr|hrs|hour|hours))?\\s*(?:(\\d+)\\s*(?:m|min|mins|minute|minutes))?$`).exec(text);
  if (clock) {
    const rest = Number(clock[2]);
    if (rest >= 60) return { ok: false, reason: "format" };
    minutes = Number(clock[1]) * 60 + rest;
  } else if (plain) {
    minutes = Math.round(decimal(plain[1] ?? "0") * 60);
  } else if (words && (words[1] || words[2])) {
    minutes = Math.round(decimal(words[1] ?? "0") * 60) + Number(words[2] ?? 0);
  } else {
    return { ok: false, reason: "format" };
  }
  if (!Number.isFinite(minutes)) return { ok: false, reason: "format" };
  return minutes > MINUTES_PER_DAY ? { ok: false, reason: "range" } : { ok: true, hours: minutes / 60 };
}

/** Hours as whole minutes, so sums are exact. */
export function minutesOf(hours: number): number {
  return Math.round(hours * 60);
}

function decimalText(value: number, locale: string, grouping: boolean): string {
  const options = { maximumFractionDigits: 2, useGrouping: grouping };
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    return new Intl.NumberFormat("en-US", options).format(value);
  }
}

/** Minutes the way the grid shows them: "7.5", or "7:30" as a clock. Zero is "0". */
export function minutesText(minutes: number, format: HoursFormat, locale: string): string {
  if (format === "clock") return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
  return decimalText(minutes / 60, locale, true);
}

/** Minutes for a glance, with the unit after a decimal figure: "1.5 h". A clock needs no unit. The space is a no-break one, so a narrow cell never leaves the figure on one line and its unit on the next. */
export function durationText(minutes: number, format: HoursFormat, locale: string, unit: string): string {
  const text = minutesText(minutes, format, locale);
  return format === "clock" ? text : `${text}\u00a0${unit}`;
}

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Whether text is a calendar date as "2026-10-26". */
export function isDayKey(value: string): boolean {
  return DAY_KEY.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

const DAY_MS = 86_400_000;

/** A day key as milliseconds at midnight UTC. */
export function dayMs(key: string): number {
  return Date.parse(`${key}T00:00:00Z`);
}

/** Milliseconds at midnight UTC as a day key. */
export function keyOf(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(key: string, days: number): string {
  return keyOf(dayMs(key) + days * DAY_MS);
}

/** 0 for Sunday up to 6 for Saturday. */
export function weekdayOf(key: string): number {
  return new Date(dayMs(key)).getUTCDay();
}

/** The seven days from the first one, as day keys. */
export function weekDays(start: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

/** The day it is in a time zone, as "2026-10-26". The format of en-CA is the one that sorts. */
export function todayKey(now: number, timeZone: string): string {
  const options = { year: "numeric", month: "2-digit", day: "2-digit" } as const;
  try {
    return new Intl.DateTimeFormat("en-CA", { ...options, timeZone }).format(now);
  } catch {
    return new Intl.DateTimeFormat("en-CA", { ...options, timeZone: "UTC" }).format(now);
  }
}

/** The first day of the week that holds `day`, for a week that starts on `firstWeekday` (0 Sunday to 6 Saturday). */
export function weekStartOf(day: string, firstWeekday: number): string {
  return addDays(day, -((weekdayOf(day) - firstWeekday + 7) % 7));
}

/** The ISO week number of a day: the week with the Thursday decides the year. */
export function isoWeek(day: string): number {
  const thursday = dayMs(day) + (4 - (weekdayOf(day) || 7)) * DAY_MS;
  const yearStart = Date.UTC(new Date(thursday).getUTCFullYear(), 0, 1);
  return Math.ceil(((thursday - yearStart) / DAY_MS + 1) / 7);
}

// Intl writes some spaces as narrow or thin no-break spaces, and the version of its data decides which: a plain space looks the same and every engine agrees on it.
const ODD_SPACES = new RegExp(`[${String.fromCharCode(0x00a0, 0x2009, 0x202f)}]`, "g");

function format(ms: number, locale: string, options: Intl.DateTimeFormatOptions): string {
  let text: string;
  try {
    text = new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(ms);
  } catch {
    text = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(ms);
  }
  return text.replace(ODD_SPACES, " ");
}

/** "Mon". */
export function weekdayText(day: string, locale: string): string {
  return format(dayMs(day), locale, { weekday: "short" });
}

/** "26". */
export function dayNumberText(day: string, locale: string): string {
  return format(dayMs(day), locale, { day: "numeric" });
}

/** "Monday 26 October", the way a screen reader should hear a column. */
export function longDayText(day: string, locale: string): string {
  return format(dayMs(day), locale, { weekday: "long", day: "numeric", month: "long" });
}

/** The two ends of a week as one phrase: "26 Oct – 1 Nov 2026". */
export function rangeText(first: string, last: string, locale: string): string {
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" };
  try {
    return new Intl.DateTimeFormat(locale, options).formatRange(dayMs(first), dayMs(last)).replace(ODD_SPACES, " ");
  } catch {
    return `${format(dayMs(first), locale, options)} – ${format(dayMs(last), locale, options)}`;
  }
}

/** A number the way the locale writes it, for the number of the week. */
export function numberText(value: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return new Intl.NumberFormat("en-US").format(value);
  }
}

/** A copy of the entries with one cell set. Zero removes the entry, so the map stays free of empty days. */
export function withHours(entries: TimesheetEntries, projectId: string, date: string, hours: number): TimesheetEntries {
  const project = { ...(entries[projectId] ?? {}) };
  if (minutesOf(hours) > 0) project[date] = minutesOf(hours) / 60;
  else delete project[date];
  return { ...entries, [projectId]: project };
}

/** The minutes in one cell. */
export function cellMinutes(entries: TimesheetEntries, projectId: string, date: string): number {
  return minutesOf(entries[projectId]?.[date] ?? 0);
}

/** What a day's total says, in words. */
export type DayStatus = { kind: "none" } | { kind: "met" } | { kind: "short"; minutes: number; past: boolean } | { kind: "over" };

/**
 * A day against its target and its cap. More than the cap is flagged on any day. On a working day, the target met, or
 * what is missing: "short" for a day that is over, "to go" for today and the days to come. A future day with nothing
 * on it says nothing yet. A day off says nothing.
 */
export function dayStatus(minutes: number, targetHours: number, capHours: number, working: boolean, when: "past" | "today" | "future"): DayStatus {
  if (minutes > capHours * 60) return { kind: "over" };
  if (!working) return { kind: "none" };
  const target = minutesOf(targetHours);
  if (target > 0 && minutes >= target) return { kind: "met" };
  if (when === "future" && minutes === 0) return { kind: "none" };
  return target > 0 ? { kind: "short", minutes: target - minutes, past: when === "past" } : { kind: "none" };
}
