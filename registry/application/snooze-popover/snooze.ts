/**
 * The date maths and the words behind SnoozePopover, as plain functions: they
 * hold no state, so a Server Component can use them too. Every calculation
 * takes the moment and the time zone as arguments and reads the calendar of
 * that zone through Intl, never the zone of the machine it runs on, so the
 * server and the browser reach the same dates, daylight saving included.
 */

/** A moment: a Date, an ISO string or a timestamp in milliseconds. */
export type SnoozeTime = Date | string | number;

/** A day on the calendar, with no zone and no time. `month` runs from 1 to 12. */
export interface CivilDay {
  year: number;
  month: number;
  day: number;
}

/** What the wall clock and the calendar of a zone show at one moment. */
export interface WallTime extends CivilDay {
  /** 0 for Sunday up to 6 for Saturday. */
  weekday: number;
  hour: number;
  minute: number;
}

/** One choice in the list: a label, and a way to work out the moment it means from now. */
export interface SnoozePreset {
  /** A stable identity: "tomorrow". It is the key of the row. */
  id: string;
  /** What it is called: "Tomorrow morning". */
  label: string;
  /** The moment this choice means, counted from `now` in `timeZone`, or `null` when it does not apply today. A moment that is not in the future is left out of the list. `atTime` and `nextWeekday` below do the zone work. */
  resolve: (now: Date, timeZone: string) => Date | null | undefined;
}

/** The words the popover says, for translation. `{when}` and `{zone}` are filled in. */
export interface SnoozeLabels {
  /** The button's text. Default "Snooze". */
  trigger?: string;
  /** The title of the list. Default "Snooze until". */
  title?: string;
  /** The first of the default choices. Default "Later today". */
  laterToday?: string;
  /** The second. Default "Tomorrow morning". */
  tomorrowMorning?: string;
  /** The third. Default "This weekend". */
  thisWeekend?: string;
  /** The fourth. Default "Next week". */
  nextWeek?: string;
  /** The row that opens the calendar. Default "Pick date and time". */
  pick?: string;
  /** Goes back from the calendar to the list. Default "Back". */
  back?: string;
  /** The label of the time field. Default "Time". */
  time?: string;
  /** The small line over the choice written out in words. Default "Snooze until". */
  until?: string;
  /** The button under the calendar. Default "Snooze". */
  confirm?: string;
  /** The word for today in the time at the right of a row. Default "Today". */
  today?: string;
  /** The word for tomorrow. Default "Tomorrow". */
  tomorrow?: string;
  /** The line that says which zone every time is in. Default "All times are in {zone}". */
  zone?: string;
  /** Shown when the picked moment has already gone. Default "That time has already passed. Pick a later one." */
  past?: string;
  /** Said when it is done. Default "Snoozed until {when}". */
  snoozed?: string;
  /** Said while the choice is being saved. Default "Snoozing". */
  snoozing?: string;
  /** Shown and said when saving failed. Default "Could not snooze. Nothing was changed." */
  failed?: string;
}

export const DEFAULT_LABELS = {
  trigger: "Snooze",
  title: "Snooze until",
  laterToday: "Later today",
  tomorrowMorning: "Tomorrow morning",
  thisWeekend: "This weekend",
  nextWeek: "Next week",
  pick: "Pick date and time",
  back: "Back",
  time: "Time",
  until: "Snooze until",
  confirm: "Snooze",
  today: "Today",
  tomorrow: "Tomorrow",
  zone: "All times are in {zone}",
  past: "That time has already passed. Pick a later one.",
  snoozed: "Snoozed until {when}",
  snoozing: "Snoozing",
  failed: "Could not snooze. Nothing was changed.",
} satisfies Required<SnoozeLabels>;

/** Puts values into a template: `fill("Snoozed until {when}", { when })`. A name it does not know is left as it was. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? (values[key] ?? match) : match));
}

/** Whether a handler returned a promise, so a quick answer does not flash a busy state. */
export function isThenable(value: unknown): value is PromiseLike<unknown> {
  return typeof value === "object" && value !== null && typeof (value as { then?: unknown }).then === "function";
}

/** A moment as milliseconds, or NaN when it is not a date at all. */
export function toTimestamp(time: SnoozeTime): number {
  return new Date(time).getTime();
}

const MINUTE = 60_000;
const DAY = 86_400_000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const wallFormats = new Map<string, Intl.DateTimeFormat>();

function wallFormat(timeZone: string): Intl.DateTimeFormat {
  let found = wallFormats.get(timeZone);
  if (!found) {
    try {
      found = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", weekday: "short", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" });
    } catch {
      // An unknown zone is read as UTC: a typo must not take the page down.
      found = wallFormat("UTC");
    }
    wallFormats.set(timeZone, found);
  }
  return found;
}

/** What the wall clock and the calendar in a zone show at a moment. */
export function wallOf(at: number, timeZone: string): WallTime {
  const parts = wallFormat(timeZone).formatToParts(at);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const number = (type: string) => Number(get(type));
  return {
    year: number("year"),
    month: number("month"),
    day: number("day"),
    weekday: Math.max(0, WEEKDAYS.indexOf(get("weekday"))),
    hour: number("hour") % 24,
    minute: number("minute"),
  };
}

/** How far a zone's wall clock is ahead of UTC at a moment, in minutes. */
function offsetMinutes(at: number, timeZone: string): number {
  const wall = wallFormat(timeZone).formatToParts(at);
  const get = (type: string) => Number(wall.find((part) => part.type === type)?.value);
  return Math.round((Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second")) - Math.floor(at / 1000) * 1000) / MINUTE);
}

/** The moment a wall clock in a zone shows a given time: "08:00 on 23 October in Amsterdam". It is worked out for that date, so daylight saving counts. */
export function zonedTime(wall: CivilDay & { hour: number; minute: number }, timeZone: string): Date {
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);
  // The offset is read at the guess, then again at the corrected guess, which is right on both sides of a change of clocks.
  const first = asUtc - offsetMinutes(asUtc, timeZone) * MINUTE;
  return new Date(asUtc - offsetMinutes(first, timeZone) * MINUTE);
}

/** A calendar day some days away: the arithmetic is on dates, so a day with 23 or 25 hours still counts as one. */
export function addDays(day: CivilDay, days: number): CivilDay {
  const moved = new Date(Date.UTC(day.year, day.month - 1, day.day + days));
  return { year: moved.getUTCFullYear(), month: moved.getUTCMonth() + 1, day: moved.getUTCDate() };
}

/** The number of the day, for comparing calendar days. */
export function dayNumber(day: CivilDay): number {
  return Math.floor(Date.UTC(day.year, day.month - 1, day.day) / DAY);
}

/** "08:00" for the wall time of a zone: the form the time field takes. */
export function clockText(wall: Pick<WallTime, "hour" | "minute">): string {
  return `${String(wall.hour).padStart(2, "0")}:${String(wall.minute).padStart(2, "0")}`;
}

/** "08:00" as an hour and a minute, or null when it cannot be read. */
export function readClock(text: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  return match ? { hour: Number(match[1]), minute: Number(match[2]) } : null;
}

/** The day `days` away from today in the zone, at that time: `atTime(now, zone, { days: 1, hour: 8 })` is tomorrow at eight. */
export function atTime(now: Date, timeZone: string, when: { days?: number; hour?: number; minute?: number }): Date {
  const day = addDays(wallOf(now.getTime(), timeZone), when.days ?? 0);
  return zonedTime({ ...day, hour: when.hour ?? 9, minute: when.minute ?? 0 }, timeZone);
}

/**
 * The next time a weekday comes round in the zone (0 is Sunday): today when it is that day and `includeToday` is on, otherwise the
 * next one, at the hour and minute given.
 */
export function nextWeekday(now: Date, timeZone: string, weekday: number, when: { hour?: number; minute?: number; includeToday?: boolean } = {}): Date {
  const today = wallOf(now.getTime(), timeZone);
  const ahead = (weekday - today.weekday + 7) % 7;
  return atTime(now, timeZone, { days: ahead === 0 && !when.includeToday ? 7 : ahead, hour: when.hour ?? 9, minute: when.minute ?? 0 });
}

/** The four choices every snooze menu has: later today at six, tomorrow at eight, Saturday at nine, and Monday at eight. */
export function defaultPresets(words: Pick<Required<SnoozeLabels>, "laterToday" | "tomorrowMorning" | "thisWeekend" | "nextWeek">): SnoozePreset[] {
  return [
    { id: "later-today", label: words.laterToday, resolve: (now, timeZone) => atTime(now, timeZone, { hour: 18 }) },
    { id: "tomorrow-morning", label: words.tomorrowMorning, resolve: (now, timeZone) => atTime(now, timeZone, { days: 1, hour: 8 }) },
    {
      id: "this-weekend",
      label: words.thisWeekend,
      // On a Sunday the weekend is already here, and the next one is "Next week" away.
      resolve: (now, timeZone) => (wallOf(now.getTime(), timeZone).weekday === 0 ? null : nextWeekday(now, timeZone, 6, { hour: 9, includeToday: true })),
    },
    { id: "next-week", label: words.nextWeek, resolve: (now, timeZone) => nextWeekday(now, timeZone, 1, { hour: 8 }) },
  ];
}

/** One choice with the moment it works out to. */
export interface SnoozeOption {
  preset: SnoozePreset;
  date: Date;
}

/** The choices that still make sense now: each one worked out from `now`, those that would land in the past left out, and two that land on the same minute shown once. */
export function presetOptions(presets: readonly SnoozePreset[], now: number, timeZone: string): SnoozeOption[] {
  const seen = new Set<number>();
  const options: SnoozeOption[] = [];
  for (const preset of presets) {
    let date: Date | null | undefined;
    try {
      date = preset.resolve(new Date(now), timeZone);
    } catch {
      date = null;
    }
    if (!date || Number.isNaN(date.getTime()) || date.getTime() <= now) continue;
    const minute = Math.floor(date.getTime() / MINUTE);
    if (seen.has(minute)) continue;
    seen.add(minute);
    options.push({ preset, date });
  }
  return options;
}

function format(locale: string, timeZone: string, options: Intl.DateTimeFormatOptions, at: number): string {
  let text: string;
  try {
    text = new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(at);
  } catch {
    text = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
  // Intl writes some spaces as narrow no-break spaces, and the version of its data decides which: a plain space looks the same and every engine agrees on it.
  return text.replace(/\s/g, " ");
}

/** The way the locale writes a time: 24 hours with two digits where it counts that way ("08:00"), otherwise 12 hours ("8:00 AM"). */
function clockOptions(locale: string): Intl.DateTimeFormatOptions {
  let cycle: string | undefined;
  try {
    cycle = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
  } catch {
    cycle = "h12";
  }
  return cycle === "h23" || cycle === "h24" ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" } : { hour: "numeric", minute: "2-digit" };
}

/** The time of day in the zone, in the locale's way of writing it. */
export function timeText(at: number, locale: string, timeZone: string): string {
  return format(locale, timeZone, clockOptions(locale), at);
}

/** The whole moment in words, for the preview and the announcement: "Thu 23 Oct, 08:00". */
export function whenText(at: number, locale: string, timeZone: string): string {
  return format(locale, timeZone, { weekday: "short", day: "numeric", month: "short", ...clockOptions(locale) }, at);
}

/**
 * The moment as the right-hand side of a row: "Today, 18:00", "Tomorrow, 08:00", and further out the weekday and the date,
 * "Sat 24 Oct, 09:00". The days are the days of the zone, so "tomorrow" is the day after today there and not 24 hours on.
 */
export function rowText(at: number, now: number, locale: string, timeZone: string, words: Pick<Required<SnoozeLabels>, "today" | "tomorrow">): string {
  const apart = dayNumber(wallOf(at, timeZone)) - dayNumber(wallOf(now, timeZone));
  const time = timeText(at, locale, timeZone);
  if (apart === 0) return `${words.today}, ${time}`;
  if (apart === 1) return `${words.tomorrow}, ${time}`;
  return `${format(locale, timeZone, { weekday: "short", day: "numeric", month: "short" }, at)}, ${time}`;
}

/** The name of the zone in full words, as the locale has it: "Central European Standard Time". */
export function zoneName(at: number, locale: string, timeZone: string): string {
  const parts = (() => {
    try {
      return new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: "long" }).formatToParts(at);
    } catch {
      return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", timeZoneName: "long" }).formatToParts(at);
    }
  })();
  return parts.find((part) => part.type === "timeZoneName")?.value ?? timeZone;
}

/** A slot such as "08:00" written the way the locale writes a time of day: "08:00", or "8:00 AM". */
export function slotText(slot: string, locale: string): string {
  const clock = readClock(slot);
  return clock ? format(locale, "UTC", clockOptions(locale), Date.UTC(2000, 0, 1, clock.hour, clock.minute)) : slot;
}

/** Every slot of the day at a step, as "HH:MM": what the time field offers. */
export function daySlots(step: number): string[] {
  const slots: string[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += step) slots.push(`${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`);
  return slots;
}
