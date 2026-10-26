import type { CallHoursRange, Weekday } from "@rhs-ui/marketing/call-us-section/types";

/** Time helpers of the call-us section. They hold no hooks, so a Server Component can use them. */

/** The days of the week in the order a week is written, Monday first. */
export const WEEKDAYS: readonly Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const SHORT: Record<string, Weekday> = { Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat", Sun: "sun" };

const minutesOf = (time: string): number => {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
};

export interface OpeningStatus {
  open: boolean;
  /** When the line closes, while it is open: "17:30". */
  until?: string;
  /** The next time it opens, while it is closed. */
  next?: { day: "today" | "tomorrow" | Weekday; time: string };
}

/** The weekday and the minute of the day in a time zone, or null for a zone this browser does not know. */
export function zonedClock(date: Date, timeZone: string): { day: Weekday; minutes: number } | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
    const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
    const day = SHORT[pick("weekday")];
    return day ? { day, minutes: (Number(pick("hour")) % 24) * 60 + Number(pick("minute")) } : null;
  } catch {
    return null;
  }
}

/** Whether the line is open at a moment, and when it closes or opens next, all in the business's own time zone. */
export function openingStatus(hours: readonly CallHoursRange[], date: Date, timeZone: string): OpeningStatus | null {
  const clock = zonedClock(date, timeZone);
  if (!clock || hours.length === 0) return null;
  const rangesOn = (day: Weekday) => hours.filter((range) => range.days.includes(day)).sort((a, b) => minutesOf(a.opens) - minutesOf(b.opens));
  const today = rangesOn(clock.day);
  const current = today.find((range) => minutesOf(range.opens) <= clock.minutes && clock.minutes < minutesOf(range.closes));
  if (current) return { open: true, until: current.closes };
  const later = today.find((range) => minutesOf(range.opens) > clock.minutes);
  if (later) return { open: false, next: { day: "today", time: later.opens } };
  const start = WEEKDAYS.indexOf(clock.day);
  for (let step = 1; step <= 7; step += 1) {
    const day = WEEKDAYS[(start + step) % 7];
    const first = day ? rangesOn(day)[0] : undefined;
    if (day && first) return { open: false, next: { day: step === 1 ? "tomorrow" : day, time: first.opens } };
  }
  return { open: false };
}

/** "17:30" in the reader's language: 17:30 on a 24-hour clock, 5:30 PM on a 12-hour one. "24:00" is midnight. */
export function timeText(time: string, locale: string): string {
  const minutes = minutesOf(time) % 1440;
  // A 24-hour clock writes 08:00, so a column of times keeps its width; a 12-hour clock writes 8:00 AM.
  const cycle = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
  const hour = cycle === "h23" || cycle === "h24" ? "2-digit" : "numeric";
  return new Intl.DateTimeFormat(locale, { hour, minute: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1, Math.floor(minutes / 60), minutes % 60)));
}

/** The ranges of one day, in the order they happen, a text each: ["09:00 to 12:30", "13:30 to 18:00"]. A closed day has none. */
export function hoursRanges(hours: readonly CallHoursRange[], day: Weekday, to: string, locale: string): string[] {
  return hours
    .filter((range) => range.days.includes(day))
    .sort((a, b) => minutesOf(a.opens) - minutesOf(b.opens))
    .map((range) => `${timeText(range.opens, locale)} ${to} ${timeText(range.closes, locale)}`);
}

/** "Monday", in the reader's language. */
export function weekdayName(day: Weekday, locale: string): string {
  // 1 January 2024 was a Monday.
  return new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + WEEKDAYS.indexOf(day))));
}

/**
 * The time zone in words: "Central European Time". The generic name does not
 * change with daylight saving, so the server and the browser always agree.
 */
export function zoneName(timeZone: string, locale: string): string {
  try {
    const part = new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: "longGeneric" }).formatToParts(new Date(Date.UTC(2026, 0, 15))).find((entry) => entry.type === "timeZoneName");
    return part?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}

/** Fills {name} markers in a sentence. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (marker, key: string) => values[key] ?? marker);
}
