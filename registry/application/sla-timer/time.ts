/**
 * The arithmetic behind the SLA timer: working time between two moments, a
 * length of time written for people, and which state a target is in. Pure
 * functions of timestamps, so a tab that slept, a server render and a test all
 * get the same answer.
 */

export const MINUTE = 60_000;
const DAY = 86_400_000;

/** The hours a target counts. Time outside them does not run down the clock. */
export interface BusinessHours {
  /** The days that count, 0 for Sunday to 6 for Saturday. Default Monday to Friday. */
  days?: readonly number[];
  /** When the working day starts, as "09:00". */
  start: string;
  /** When it ends, as "17:30". It must be later than the start. */
  end: string;
  /** The IANA zone the hours are written in, such as "Europe/Amsterdam". Default "UTC". */
  timeZone?: string;
}

const WEEKDAYS: readonly number[] = [1, 2, 3, 4, 5];

const formatters = new Map<string, Intl.DateTimeFormat>();

function zoneFormat(timeZone: string): Intl.DateTimeFormat {
  let format = formatters.get(timeZone);
  if (!format) {
    try {
      format = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" });
    } catch {
      format = zoneFormat("UTC");
    }
    formatters.set(timeZone, format);
  }
  return format;
}

/** The wall clock of a moment in a zone, as numbers. */
function wallClock(ts: number, timeZone: string) {
  const found = zoneFormat(timeZone).formatToParts(ts);
  const get = (type: string) => Number(found.find((part) => part.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") % 24, minute: get("minute"), second: get("second") };
}

/** How far the zone's wall clock is ahead of UTC at a moment, in milliseconds. */
function offsetAt(ts: number, timeZone: string): number {
  const clock = wallClock(ts, timeZone);
  return Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute, clock.second) - Math.floor(ts / 1000) * 1000;
}

/** The moment a wall-clock time on a calendar day happens in the zone. Asked twice, so a day with a clock change still lands right. */
function atWallClock(day: number, minutes: number, timeZone: string): number {
  const asIfUtc = day + minutes * MINUTE;
  const first = asIfUtc - offsetAt(asIfUtc, timeZone);
  return asIfUtc - offsetAt(first, timeZone);
}

/** "09:00" as minutes since midnight, or NaN when it cannot be read. */
export function minutesOf(clock: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(clock.trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : Number.NaN;
}

/** How much of the span between two moments falls inside working hours, in milliseconds. A span that ends before it starts counts nothing. */
export function businessMs(from: number, to: number, hours: BusinessHours): number {
  if (!(to > from)) return 0;
  const zone = hours.timeZone ?? "UTC";
  const days = new Set(hours.days ?? WEEKDAYS);
  const open = minutesOf(hours.start);
  const close = minutesOf(hours.end);
  if (Number.isNaN(open) || Number.isNaN(close) || close <= open) return to - from;
  const first = wallClock(from, zone);
  const last = wallClock(to, zone);
  const lastDay = Date.UTC(last.year, last.month - 1, last.day);
  let total = 0;
  // A day at a time, from the day the span starts to the day it ends; ten years is more than any target needs.
  for (let day = Date.UTC(first.year, first.month - 1, first.day), steps = 0; day <= lastDay && steps < 3660; day += DAY, steps += 1) {
    if (!days.has(new Date(day).getUTCDay())) continue;
    const start = Math.max(from, atWallClock(day, open, zone));
    const end = Math.min(to, atWallClock(day, close, zone));
    if (end > start) total += end - start;
  }
  return total;
}

function unitText(value: number, unit: "day" | "hour" | "minute", display: "short" | "narrow", locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: display }).format(value);
  } catch {
    return new Intl.NumberFormat("en-US", { style: "unit", unit, unitDisplay: display }).format(value);
  }
}

/**
 * A length of time for a glance: "12 min", "3h 40m", "2d 4h". Counting
 * working hours, a day has no fixed length, so it stays in hours ("34h 20m").
 * Under a minute it says `underMinute`.
 */
export function spanText(ms: number, locale: string, options: { hoursOnly?: boolean; underMinute: string; round: "up" | "down" }): string {
  const whole = options.round === "up" ? Math.ceil(ms / MINUTE) : Math.floor(ms / MINUTE);
  if (whole < 1) return options.underMinute;
  const days = options.hoursOnly ? 0 : Math.floor(whole / 1440);
  const hours = Math.floor((whole - days * 1440) / 60);
  const minutes = whole % 60;
  if (days) return [unitText(days, "day", "narrow", locale), hours ? unitText(hours, "hour", "narrow", locale) : ""].filter(Boolean).join(" ");
  if (hours || options.hoursOnly) {
    const total = options.hoursOnly ? Math.floor(whole / 60) : hours;
    return [total ? unitText(total, "hour", "narrow", locale) : "", minutes ? unitText(minutes, "minute", "narrow", locale) : ""].filter(Boolean).join(" ");
  }
  return unitText(minutes, "minute", "short", locale);
}

export type SlaState = "on-track" | "at-risk" | "breached" | "paused";

/** When a target counts as at risk. Either condition is enough. */
export interface SlaThresholds {
  /** At risk once this share of the target is left, from 0 to 1. Default 0.25. */
  atRiskFraction?: number;
  /** At risk once this many minutes are left. Default none. */
  atRiskMinutes?: number;
}

export interface SlaReading {
  state: SlaState;
  /** Milliseconds left when the clock stopped or now: negative once the deadline has passed. */
  remaining: number;
  /** How much of the target has gone, from 0 to 1. */
  elapsed: number;
}

/** Where a target stands, from timestamps alone. `pausedAt` freezes the clock at that moment. */
export function readSla(input: { deadline: number; startedAt: number; pausedAt?: number; now: number; businessHours?: BusinessHours; thresholds?: SlaThresholds }): SlaReading {
  const { deadline, startedAt, pausedAt, now, businessHours, thresholds } = input;
  const reference = pausedAt !== undefined && !Number.isNaN(pausedAt) ? Math.min(pausedAt, now) : now;
  const between = (from: number, to: number) => (businessHours ? businessMs(from, to, businessHours) : Math.max(0, to - from));
  const remaining = reference <= deadline ? between(reference, deadline) : -between(deadline, reference);
  const total = between(startedAt, deadline);
  const elapsed = total <= 0 ? 1 : Math.min(1, Math.max(0, 1 - remaining / total));
  if (pausedAt !== undefined && !Number.isNaN(pausedAt)) return { state: "paused", remaining, elapsed };
  if (remaining < 0) return { state: "breached", remaining, elapsed: 1 };
  const fraction = thresholds?.atRiskFraction ?? 0.25;
  const minutes = thresholds?.atRiskMinutes;
  const risky = (total > 0 && remaining / total <= fraction) || (minutes !== undefined && remaining <= minutes * MINUTE);
  return { state: risky ? "at-risk" : "on-track", remaining, elapsed };
}
