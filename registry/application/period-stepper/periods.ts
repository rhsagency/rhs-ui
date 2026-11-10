/**
 * The calendar behind PeriodStepper, as plain functions: they hold no state and
 * call no hook, so a Server Component can use them too. A day is the string
 * "2026-10-26": a day on the calendar, not a moment, so it never shifts with a
 * time zone. All the arithmetic runs in UTC for that reason, and only `todayIn`
 * looks at a clock. Every function that writes a date takes the locale.
 */

export type PeriodUnit = "day" | "week" | "month" | "year";

/** The words the stepper says, for translation. `{unit}` and `{number}` are filled in. */
export interface PeriodStepperLabels {
  /** The name of the group of controls. Default "Change period". */
  group?: string;
  /** The name of the button that goes back; `{unit}` is the word for the unit. Default "Previous {unit}". */
  previous?: string;
  /** The name of the button that goes forward. Default "Next {unit}". */
  next?: string;
  /** The button that brings the current period back. Default "Today". */
  today?: string;
  /** The label of a week; `{number}`. Default "Week {number}". */
  week?: string;
  /** Joins the two ends of a range: "19 to 25 Oct 2026". Default "to". */
  to?: string;
  /** Said to a screen reader when the label has focus. Default "Use the left and right arrow keys to change the period." */
  hint?: string;
  /** The words for the units, as they go into `previous` and `next`. Default day, week, month and year. */
  units?: Partial<Record<PeriodUnit, string>>;
}

export const DEFAULT_LABELS = {
  group: "Change period",
  previous: "Previous {unit}",
  next: "Next {unit}",
  today: "Today",
  week: "Week {number}",
  to: "to",
  hint: "Use the left and right arrow keys to change the period.",
  units: { day: "day", week: "week", month: "month", year: "year" },
} satisfies Required<PeriodStepperLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

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

const fromNumber = (count: number): string => new Date(count * DAY_MS).toISOString().slice(0, 10);

/** The day `count` days after (or, when negative, before) `day`. */
export function addDays(day: string, count: number): string {
  return fromNumber(toNumber(day) + count);
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

/** The first day of the period that holds `day`. */
export function startOf(unit: PeriodUnit, day: string, weekStart: number): string {
  switch (unit) {
    case "day":
      return day;
    case "week":
      return startOfWeek(day, weekStart);
    case "month":
      return `${day.slice(0, 7)}-01`;
    case "year":
      return `${day.slice(0, 4)}-01-01`;
  }
}

/** The last day of the period that begins on `start` (a day that is the start of its period). */
export function endOf(unit: PeriodUnit, start: string): string {
  switch (unit) {
    case "day":
      return start;
    case "week":
      return addDays(start, 6);
    case "month":
      // Day 0 of the next month is the last day of this one.
      return fromNumber(Date.UTC(Number(start.slice(0, 4)), Number(start.slice(5, 7)), 0) / DAY_MS);
    case "year":
      return `${start.slice(0, 4)}-12-31`;
  }
}

/** The start of the period `count` periods after (or before, when negative) the one that begins on `start`. */
export function shift(unit: PeriodUnit, start: string, count: number): string {
  switch (unit) {
    case "day":
      return addDays(start, count);
    case "week":
      return addDays(start, count * 7);
    case "month":
      return fromNumber(Date.UTC(Number(start.slice(0, 4)), Number(start.slice(5, 7)) - 1 + count, 1) / DAY_MS);
    case "year":
      return `${String(Number(start.slice(0, 4)) + count).padStart(4, "0")}-01-01`;
  }
}

/**
 * The number of the week the day falls in. With Monday as the first day it is
 * the ISO week: week 1 holds the first Thursday of the year, so a week at the
 * turn of the year can be week 52 or 53 of the old one. With any other first
 * day it is the common calendar count: week 1 is the one that holds 1 January.
 */
export function weekNumber(day: string, weekStart: number): number {
  const first = startOfWeek(day, weekStart);
  if (weekStart === 1) {
    const thursday = toNumber(first) + 3;
    const year = new Date(thursday * DAY_MS).getUTCFullYear();
    const januaryFirst = Date.UTC(year, 0, 1) / DAY_MS;
    return Math.floor((thursday - januaryFirst) / 7) + 1;
  }
  const year = new Date((toNumber(first) + 6) * DAY_MS).getUTCFullYear();
  const weekOne = toNumber(startOfWeek(`${year}-01-01`, weekStart));
  return Math.floor((toNumber(first) - weekOne) / 7) + 1;
}

/** Noon, so no zone can tip the day over. */
const at = (day: string): number => toNumber(day) * DAY_MS + DAY_MS / 2;

/** A day written in the reader's language. An unknown locale falls back to English instead of throwing. */
export function formatDay(day: string, locale: string, options: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(at(day));
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at(day));
  }
}

/**
 * Two days as one range, written the way the locale writes a range, with the
 * dash it would use replaced by a word: "19 to 25 Oct 2026". The locale also
 * decides what is said once ("Oct 2026") and what twice.
 */
export function formatRange(from: string, to: string, locale: string, joiner: string): string {
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" };
  const run = (zone: string) => {
    const formatter = new Intl.DateTimeFormat(zone, options);
    const parts = formatter.formatRangeToParts(at(from), at(to));
    const firstEnd = parts.findIndex((part) => part.source === "endRange");
    const lastStart = parts.reduce((found, part, index) => (part.source === "startRange" ? index : found), -1);
    if (firstEnd < 0 || lastStart < 0 || lastStart > firstEnd) return formatter.formatRange(at(from), at(to));
    // What sits between the last piece of the start and the first piece of the end is the dash.
    return [...parts.slice(0, lastStart + 1), { value: ` ${joiner} ` }, ...parts.slice(firstEnd)].map((part) => part.value).join("");
  };
  try {
    return run(locale);
  } catch {
    return run("en-US");
  }
}

/** A period as it is written: the lead, the part after it when there is one, and the whole as a screen reader hears it. */
export interface PeriodText {
  primary: string;
  secondary?: string;
  full: string;
}

/** How a day is written under its weekday: "26 Oct 2026". */
const DAY_DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

/** What the label of a period says: "Week 43" over "19 to 25 Oct 2026", "October 2026", "2026", or the weekday "Monday" over its date "26 Oct 2026". */
export function describePeriod(unit: PeriodUnit, start: string, options: { locale: string; weekStart: number; text: Required<PeriodStepperLabels> }): PeriodText {
  const { locale, weekStart, text } = options;
  switch (unit) {
    case "day": {
      // Two lines like a week, so a day is not the one unit that needs a label twice as wide as the others.
      const full = formatDay(start, locale, { weekday: "long", ...DAY_DATE });
      return { primary: formatDay(start, locale, { weekday: "long" }), secondary: formatDay(start, locale, DAY_DATE), full };
    }
    case "week": {
      const primary = fill(text.week, { number: new Intl.NumberFormat(locale).format(weekNumber(start, weekStart)) });
      const secondary = formatRange(start, endOf("week", start), locale, text.to);
      return { primary, secondary, full: `${primary}, ${secondary}` };
    }
    case "month": {
      const full = formatDay(start, locale, { month: "long", year: "numeric" });
      return { primary: full, full };
    }
    case "year": {
      const full = formatDay(start, locale, { year: "numeric" });
      return { primary: full, full };
    }
  }
}

const pad = (value: number): string => String(value).padStart(2, "0");

/**
 * The widest text each line of a unit's label can hold, written in the
 * language of the label, so that the label can keep room for it: drawn
 * invisibly in the label's own box it holds the control at one width while it
 * steps, and the buttons stay under the pointer. The widest week range crosses
 * New Year (the year is said twice) and the weeks that do are found in seven
 * years in a row, whatever day the week starts on; the widest month is one of
 * twelve and the widest weekday one of seven. They never depend on the period
 * shown, or the width would jump at the turn of a year.
 */
export function labelSamples(unit: PeriodUnit, options: { locale: string; weekStart: number; week: string; to: string }): { primary: string[]; secondary: string[] } {
  const { locale, weekStart, week, to } = options;
  switch (unit) {
    case "day":
      return {
        primary: Array.from({ length: 7 }, (_, index) => formatDay(addDays("2026-10-26", index), locale, { weekday: "long" })),
        secondary: Array.from({ length: 12 }, (_, month) => formatDay(`2026-${pad(month + 1)}-28`, locale, DAY_DATE)),
      };
    case "week":
      return {
        primary: [fill(week, { number: new Intl.NumberFormat(locale).format(53) })],
        secondary: Array.from({ length: 7 }, (_, index) => {
          const first = startOfWeek(`${2020 + index}-12-31`, weekStart);
          return formatRange(first, endOf("week", first), locale, to);
        }),
      };
    case "month":
      return { primary: Array.from({ length: 12 }, (_, month) => formatDay(`2026-${pad(month + 1)}-01`, locale, { month: "long", year: "numeric" })), secondary: [] };
    case "year":
      return { primary: [formatDay("2026-01-01", locale, { year: "numeric" })], secondary: [] };
  }
}
