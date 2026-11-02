/**
 * The time zone arithmetic behind TeamClocks, as plain functions: they hold no
 * state and call no hook, so a Server Component can use them too. Each one
 * takes a moment (a timestamp in ms) and the zones it needs, and every
 * formatter takes the locale, so the server and the browser write the same
 * text for the same moment.
 */

/** When someone works, in their own zone. */
export interface WorkHours {
  /** When the working day starts, as "09:00". */
  start: string;
  /** When it ends, as "17:30". An end before the start is a shift through midnight. */
  end: string;
  /** The days that count, 0 for Sunday to 6 for Saturday. Default Monday to Friday. */
  days?: readonly number[];
}

export const DEFAULT_HOURS: WorkHours = { start: "09:00", end: "17:00", days: [1, 2, 3, 4, 5] };

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

/** What the wall clock in a zone shows at a moment, as numbers. */
export interface WallClock {
  year: number;
  month: number;
  day: number;
  /** 0 for Sunday up to 6 for Saturday. */
  weekday: number;
  hour: number;
  minute: number;
  second: number;
}

export function wallClock(at: number, timeZone: string): WallClock {
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
    second: number("second"),
  };
}

/** How far a zone's wall clock is ahead of UTC at a moment, in minutes. */
export function offsetMinutes(at: number, timeZone: string): number {
  const wall = wallClock(at, timeZone);
  return Math.round((Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second) - Math.floor(at / 1000) * 1000) / MINUTE);
}

/** "09:00" as minutes since midnight, or NaN when it cannot be read. */
export function minutesOf(clock: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(clock.trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : Number.NaN;
}

/** Whether the wall clock in the zone is inside working hours at that moment. */
export function isWorking(at: number, timeZone: string, hours: WorkHours): boolean {
  const wall = wallClock(at, timeZone);
  const days = hours.days ?? DEFAULT_HOURS.days ?? [];
  const start = minutesOf(hours.start);
  const end = minutesOf(hours.end);
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  const now = wall.hour * 60 + wall.minute;
  if (start <= end) return days.includes(wall.weekday) && now >= start && now < end;
  // A shift through midnight belongs to the day it started on.
  return (days.includes(wall.weekday) && now >= start) || (days.includes((wall.weekday + 6) % 7) && now < end);
}

/** How many calendar days the zone's date is ahead of the other zone's date at a moment: -1, 0 or 1 (a day can differ by two at most). */
export function dayDifference(at: number, timeZone: string, otherZone: string): number {
  const date = (zone: string) => {
    const wall = wallClock(at, zone);
    return Date.UTC(wall.year, wall.month - 1, wall.day);
  };
  return Math.round((date(timeZone) - date(otherZone)) / DAY);
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

/** The time of day in the zone: "08:30", or "8:30 AM" with `hour12`. */
export function timeText(at: number, timeZone: string, locale: string, hour12: boolean): string {
  return format(locale, timeZone, hour12 ? { hour: "numeric", minute: "2-digit", hour12: true } : { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }, at);
}

/** The short weekday in the zone: "Tue". */
export function weekdayText(at: number, timeZone: string, locale: string): string {
  return format(locale, timeZone, { weekday: "short" }, at);
}

/** An offset for a glance: "+6 h", "-8 h", "+4 h 30 m", with a real minus sign. */
export function offsetText(minutes: number): string {
  const total = Math.abs(minutes);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes < 0 ? "−" : "+"}${hours} h${rest ? ` ${rest} m` : ""}`;
}

function unit(value: number, name: "hour" | "minute", locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: "unit", unit: name, unitDisplay: "long" }).format(value);
  } catch {
    return new Intl.NumberFormat("en-US", { style: "unit", unit: name, unitDisplay: "long" }).format(value);
  }
}

/** A length of time in words, for a screen reader: "6 hours", "4 hours 30 minutes". */
export function durationWords(minutes: number, locale: string): string {
  const total = Math.abs(minutes);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return [hours || !rest ? unit(hours, "hour", locale) : "", rest ? unit(rest, "minute", locale) : ""].filter(Boolean).join(" ");
}

/** "America/Los_Angeles" as "Los Angeles": the place in a zone's name. */
export function cityOf(timeZone: string): string {
  const last = timeZone.split("/").pop() ?? timeZone;
  return last.replace(/_/g, " ");
}

/** The zone the browser is in. Only the browser knows it, so call it after the page is live. */
export function browserZone(locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale).resolvedOptions().timeZone;
  } catch {
    return new Intl.DateTimeFormat("en-US").resolvedOptions().timeZone;
  }
}

/** The angles of the two hands on an analog face, in degrees clockwise from twelve o'clock. */
export function handAngles(at: number, timeZone: string): { hour: number; minute: number } {
  const wall = wallClock(at, timeZone);
  return { hour: ((wall.hour % 12) + wall.minute / 60) * 30, minute: wall.minute * 6 };
}
