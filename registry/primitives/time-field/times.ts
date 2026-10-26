export type TimeSegment = "hour" | "minute" | "period";
export type Period = "am" | "pm";

/** A time of day. `hour` is on the 24-hour clock, 0 to 23. */
export interface TimeNumbers {
  hour: number;
  minute: number;
}

export interface TimeLayout {
  /** The order the locale writes the parts in. The period is only there on a 12-hour clock. */
  order: readonly TimeSegment[];
  /** What is written between the hour and the minute: ":" in most places, "." in Danish. */
  separator: string;
  /** What the locale calls the morning and the afternoon, "AM" and "PM" in English. */
  periods: Record<Period, string>;
}

export const padNumber = (value: number | string, width: number) => String(value).padStart(width, "0");

/** Digits typed on a keyboard that writes them differently (Arabic-Indic, Persian) as the digits 0 to 9. */
export function asciiDigits(text: string): string {
  return text.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (char) => String(char.charCodeAt(0) >= 0x6f0 ? char.charCodeAt(0) - 0x6f0 : char.charCodeAt(0) - 0x660));
}

/** True when the locale writes the time of day with AM and PM, found by asking the browser. */
export function usesTwelveHour(locale: string): boolean {
  try {
    const cycle = new Intl.DateTimeFormat(locale, { hour: "numeric", timeZone: "UTC" }).resolvedOptions().hourCycle;
    return cycle === "h12" || cycle === "h11";
  } catch {
    return false;
  }
}

const FALLBACK_PERIODS: Record<Period, string> = { am: "AM", pm: "PM" };

/** The order of the parts, the separator and the words for the morning and the afternoon. Falls back to hour, minute, period with a colon. */
export function timeLayout(locale: string, twelve: boolean): TimeLayout {
  const fallback: TimeLayout = { order: twelve ? ["hour", "minute", "period"] : ["hour", "minute"], separator: ":", periods: FALLBACK_PERIODS };
  try {
    const format = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hourCycle: twelve ? "h12" : "h23", timeZone: "UTC" });
    const afternoon = format.formatToParts(Date.UTC(2006, 10, 22, 15, 4));
    const morning = format.formatToParts(Date.UTC(2006, 10, 22, 9, 4));
    const order = afternoon.flatMap((part): TimeSegment[] => (part.type === "hour" ? ["hour"] : part.type === "minute" ? ["minute"] : part.type === "dayPeriod" && twelve ? ["period"] : []));
    if (!order.includes("hour") || !order.includes("minute")) return fallback;
    if (twelve && !order.includes("period")) order.push("period");
    const hourAt = afternoon.findIndex((part) => part.type === "hour");
    const minuteAt = afternoon.findIndex((part) => part.type === "minute");
    const between = afternoon.slice(Math.min(hourAt, minuteAt) + 1, Math.max(hourAt, minuteAt)).find((part) => part.type === "literal")?.value.trim();
    return {
      order,
      separator: between || ":",
      periods: {
        am: morning.find((part) => part.type === "dayPeriod")?.value ?? FALLBACK_PERIODS.am,
        pm: afternoon.find((part) => part.type === "dayPeriod")?.value ?? FALLBACK_PERIODS.pm,
      },
    };
  } catch {
    return fallback;
  }
}

/** Which period a typed character means: "a" is the morning and "p" the afternoon, and so is the first letter of the locale's own words. */
export function periodForKey(key: string, periods: Record<Period, string>): Period | null {
  const typed = key.toLowerCase();
  if (typed.length !== 1) return null;
  const am = periods.am.toLowerCase();
  const pm = periods.pm.toLowerCase();
  const morning = typed === "a" || am.startsWith(typed);
  const afternoon = typed === "p" || pm.startsWith(typed);
  if (morning === afternoon) return null;
  return morning ? "am" : "pm";
}

/** The numbers in a time such as "14:30", or null when it is not one. */
export function parseTime(time: string | null | undefined): TimeNumbers | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec((time ?? "").trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour <= 23 && minute <= 59 ? { hour, minute } : null;
}

/** The time as "14:30": 24-hour, two digits each. */
export const toTime = ({ hour, minute }: TimeNumbers) => `${padNumber(hour, 2)}:${padNumber(minute, 2)}`;

const minutesOf = ({ hour, minute }: TimeNumbers) => hour * 60 + minute;

/** The hour on a 12-hour clock (1 to 12) and the period it falls in. */
export const toTwelve = (hour: number): { hour: number; period: Period } => ({ hour: hour % 12 || 12, period: hour >= 12 ? "pm" : "am" });

/** The hour on the 24-hour clock for an hour on a 12-hour clock: 12 AM is 0 and 12 PM is 12. */
export const fromTwelve = (hour: number, period: Period): number => (hour % 12) + (period === "pm" ? 12 : 0);

/** The next hour in a direction, wrapping round: 23 to 0 on a 24-hour clock, 12 to 1 on a 12-hour clock. Without a starting hour, 0 (12) going up and 23 (11) going down. */
export function stepHour(hour: number | null, delta: 1 | -1, twelve: boolean): number {
  if (!twelve) return hour === null ? (delta === 1 ? 0 : 23) : (hour + delta + 24) % 24;
  if (hour === null) return delta === 1 ? 12 : 11;
  const next = ((hour % 12) + delta + 12) % 12;
  return next === 0 ? 12 : next;
}

/** The next minute in a direction, on the grid of `step` minutes and wrapping round. A minute off the grid goes to the nearest slot in that direction. */
export function stepMinute(minute: number | null, delta: 1 | -1, step: number): number {
  const size = Math.min(30, Math.max(1, Math.floor(step) || 1));
  const last = Math.floor(59 / size) * size;
  if (minute === null) return delta === 1 ? 0 : last;
  if (delta === 1) {
    const next = (Math.floor(minute / size) + 1) * size;
    return next > 59 ? 0 : next;
  }
  if (minute % size !== 0) return Math.floor(minute / size) * size;
  return minute - size < 0 ? last : minute - size;
}

/** A time of day written the way the locale writes it: "9:30 AM" or "09:30". */
export function formatClock(locale: string, minutes: number, twelve: boolean): string {
  const date = Date.UTC(2000, 0, 1, Math.floor(minutes / 60) % 24, minutes % 60);
  try {
    return new Intl.DateTimeFormat(locale, { hour: twelve ? "numeric" : "2-digit", minute: "2-digit", hourCycle: twelve ? "h12" : "h23", timeZone: "UTC" }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-US", { hour: twelve ? "numeric" : "2-digit", minute: "2-digit", hourCycle: twelve ? "h12" : "h23", timeZone: "UTC" }).format(date);
  }
}

/** Whether a time of day lies between `min` and `max`. A range that runs past midnight (22:00 to 06:00) is understood. */
export function inRange(minutes: number, min: number | null, max: number | null): boolean {
  if (min !== null && max !== null && min > max) return minutes >= min || minutes <= max;
  return (min === null || minutes >= min) && (max === null || minutes <= max);
}

/**
 * Why a complete time cannot be used, in words, or null when it can: it lies
 * outside `min` and `max`, and the message names the range the way the clock
 * is written ("Pick a time between 9:00 AM and 5:00 PM.").
 */
export function explainTime(time: TimeNumbers, { min, max, locale, twelve }: { min?: string; max?: string; locale: string; twelve: boolean }): string | null {
  const first = parseTime(min);
  const last = parseTime(max);
  if (!first && !last) return null;
  const from = first ? minutesOf(first) : null;
  const to = last ? minutesOf(last) : null;
  if (inRange(minutesOf(time), from, to)) return null;
  if (from !== null && to !== null) return `Pick a time between ${formatClock(locale, from, twelve)} and ${formatClock(locale, to, twelve)}.`;
  if (from !== null) return `Pick a time at or after ${formatClock(locale, from, twelve)}.`;
  return `Pick a time at or before ${formatClock(locale, to ?? 0, twelve)}.`;
}
