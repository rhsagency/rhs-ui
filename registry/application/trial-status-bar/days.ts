/**
 * The calendar arithmetic behind TrialStatusBar, as plain functions with no
 * React: they hold no state, so a Server Component, a test or an email can use
 * them with the same results. Days are counted on the calendar in a time zone,
 * never as blocks of 24 hours, so the number only changes at midnight there.
 */

const DAY = 86_400_000;

/** A moment as a timestamp, or null when it is not a date. */
export function momentOf(input: string | number | Date): number | null {
  const at = new Date(input).getTime();
  return Number.isNaN(at) ? null : at;
}

/** The calendar day of a moment in a zone, as a number of days since 1970: two moments on the same date have the same number. An unknown zone is read as UTC. */
export function calendarDay(at: number, timeZone: string): number {
  const read = (zone: string) => new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(at);
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = read(timeZone);
  } catch {
    parts = read("UTC");
  }
  const number = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return Date.UTC(number("year"), number("month") - 1, number("day")) / DAY;
}

/** How a trial stands: calm while there is time, firm in the last days, ended after the end. */
export interface TrialStatus {
  tone: "calm" | "firm" | "ended";
  /** Calendar days from today to the day it ends: 0 on the last day. Negative after the end. */
  daysLeft: number;
  /** How much of the trial has gone, from 0 to 1, or null when the start is not known. */
  elapsed: number | null;
}

/** Under this many days left the tone is firm. */
export const FIRM_FROM_DAYS = 3;

export function trialStatus({ now, startedAt, endsAt, timeZone }: { now: number; startedAt: number | null; endsAt: number; timeZone: string }): TrialStatus {
  const daysLeft = calendarDay(endsAt, timeZone) - calendarDay(now, timeZone);
  const ended = now >= endsAt;
  const length = startedAt === null ? 0 : endsAt - startedAt;
  const elapsed = startedAt === null || length <= 0 ? (ended ? 1 : null) : Math.min(1, Math.max(0, (now - startedAt) / length));
  return { tone: ended ? "ended" : daysLeft <= FIRM_FROM_DAYS ? "firm" : "calm", daysLeft: ended ? Math.min(daysLeft, -1) : daysLeft, elapsed: ended ? 1 : elapsed };
}

/** A whole number written in the locale. */
export function dayCount(value: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return new Intl.NumberFormat("en-US").format(value);
  }
}

/** A day written short, in the zone: "14 Nov". */
export function dayText(at: number, locale: string, timeZone: string): string {
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  let text: string;
  try {
    text = new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(at);
  } catch {
    text = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
  // Intl writes some spaces as narrow no-break spaces, and the version of its data decides which: a plain space looks the same and every engine agrees on it.
  return text.replace(/\s/g, " ");
}
