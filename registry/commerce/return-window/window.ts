/** A moment: a Date, an ISO 8601 string or epoch milliseconds. A date-only string such as "2026-10-20" is a calendar day. */
export type ReturnMoment = Date | string | number;

/** Where a return window stands. */
export type ReturnState = "open" | "closing" | "closed";

/** The window of one order: when it ends and how much of it is left. */
export interface ReturnWindowInfo {
  /** The last day a return can be started, as a UTC date at midnight: write it with a UTC formatter. */
  lastDay: Date;
  /** Calendar days from today to the last day: 0 is the last day itself, negative once it has passed. */
  daysLeft: number;
  /** Open, closing soon (under `soonDays` days left) or closed. */
  state: ReturnState;
  /** The part of the window still ahead, from 0 to 1. */
  remaining: number;
}

const DAY = 86_400_000;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A zone name that would throw while rendering falls back to UTC. */
export function knownZone(timeZone: string): string {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

/**
 * The calendar day a moment falls on in a zone, as a UTC midnight, so days can be counted and written without
 * the zone getting in the way. A date-only string already is a calendar day and is never shifted by the zone.
 * Null when the moment is not a date.
 */
export function calendarDay(moment: ReturnMoment, timeZone: string): Date | null {
  if (typeof moment === "string") {
    const plain = DATE_ONLY.exec(moment);
    if (plain) return new Date(Date.UTC(Number(plain[1]), Number(plain[2]) - 1, Number(plain[3])));
  }
  const instant = new Date(moment);
  if (Number.isNaN(instant.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: knownZone(timeZone), year: "numeric", month: "numeric", day: "numeric" }).formatToParts(instant);
  const pick = (type: string): number => Number(parts.find((part) => part.type === type)?.value);
  return new Date(Date.UTC(pick("year"), pick("month") - 1, pick("day")));
}

/** The last day of the window: the day of delivery plus the days of the window. Null when the delivery date is not a date. */
export function lastDayOf(deliveredAt: ReturnMoment, windowDays: number, timeZone: string): Date | null {
  const delivered = calendarDay(deliveredAt, timeZone);
  return delivered && Number.isFinite(windowDays) && windowDays >= 0 ? new Date(delivered.getTime() + Math.floor(windowDays) * DAY) : null;
}

/**
 * Where the window stands on a day. Days are whole calendar days in the zone, so an order whose window ends today
 * is still open at 23:59 and closed a minute later, however many hours that is from the delivery. Under
 * `soonDays` days left the window is closing; the last day counts as 0 days left.
 */
export function returnWindowAt(deliveredAt: ReturnMoment, windowDays: number, now: ReturnMoment, timeZone: string, soonDays = 3): ReturnWindowInfo | null {
  const lastDay = lastDayOf(deliveredAt, windowDays, timeZone);
  const today = calendarDay(now, timeZone);
  if (!lastDay || !today) return null;
  const daysLeft = Math.round((lastDay.getTime() - today.getTime()) / DAY);
  const state: ReturnState = daysLeft < 0 ? "closed" : daysLeft < soonDays ? "closing" : "open";
  const remaining = windowDays > 0 ? Math.min(1, Math.max(0, daysLeft / windowDays)) : 0;
  return { lastDay, daysLeft, state, remaining };
}
