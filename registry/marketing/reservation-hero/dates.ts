/**
 * The days and the words behind ReservationHero, as plain functions: they hold
 * no state and call no hook, so a Server Component can use them too. A day is
 * a calendar date written "2026-11-06", the restaurant's own, with no time zone
 * attached: it is never turned into a moment, so no zone can move it to the
 * day before or after. Every function takes the locale, so the same input gives
 * the same text on the server and in the browser.
 */

/** The words the hero says. `{count}`, `{guests}`, `{day}`, `{date}` and `{time}` are filled in. */
export interface ReservationHeroLabels {
  /** Names the form for assistive technology. */
  form: string;
  /** The label of the party size. */
  guests: string;
  /** The label of the date. */
  date: string;
  /** The placeholder of the date when there is none. */
  datePlaceholder: string;
  /** The heading over the times. `{day}` is "today", "tomorrow", "Friday" or, further ahead, "Friday, November 20". */
  timesFor: string;
  /** The tag on a time that is taken. */
  full: string;
  /** How a day after tomorrow is said in a sentence: "on Friday". Today and tomorrow are said without it. `{day}` is the weekday, with its date when the day is a week or more away. */
  onDay: string;
  /** What the polite message says when times are shown. */
  showing: { one: string; other: string };
  /** The party, singular and plural. */
  guestCount: { one: string; other: string };
  /** What the message says while the times load. */
  checking: string;
  /** What the message says when every time is taken. */
  none: string;
  /** What the message says on a day the restaurant is closed. */
  closed: string;
  /** What the message says when the times could not be loaded. */
  error: string;
  /** The button that asks again after an error. */
  retry: string;
  /** The button before a time is chosen. */
  reserve: string;
  /** The button once a time is chosen. */
  reserveAt: string;
  /** Why the button waits, before a time is chosen. */
  chooseTime: string;
  /** Why the button waits while the times load. */
  waiting: string;
  /** Why the button waits when there is no time to choose. */
  noTimes: string;
  /** The line under the button once a time is chosen. */
  chosen: string;
}

export const LABELS: ReservationHeroLabels = {
  form: "Reserve a table",
  guests: "Guests",
  date: "Date",
  datePlaceholder: "Pick a day",
  timesFor: "Times for {day}",
  full: "Full",
  onDay: "on {day}",
  showing: { one: "Showing {count} time for {guests} {day}", other: "Showing {count} times for {guests} {day}" },
  guestCount: { one: "{count} guest", other: "{count} guests" },
  checking: "Checking tables for {guests} {day}...",
  none: "No tables for {guests} {day}. Try another day or fewer guests.",
  closed: "We are closed {day}. Choose another day.",
  error: "We could not check the tables.",
  retry: "Try again",
  reserve: "Reserve a table",
  reserveAt: "Reserve for {guests} at {time}",
  chooseTime: "Choose a time to reserve your table.",
  waiting: "Waiting for the times.",
  noTimes: "There is no time to reserve yet.",
  chosen: "{guests}, {date} at {time}",
};

/** "{count}" and friends in a template, filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

/** The words for this many: the singular form for exactly one, the plural for anything else (the locale decides what counts as one). */
export function plural(forms: { one: string; other: string }, count: number, locale: string): string {
  return new Intl.PluralRules(locale).select(count) === "one" ? forms.one : forms.other;
}

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The day at noon UTC, as a count of milliseconds: noon, so that no rounding or zone can reach another date. NaN when it is not a day. */
function noon(day: string): number {
  const match = DAY.exec(day);
  return match ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12) : Number.NaN;
}

/** Whether the text is a real day: "2026-02-30" is not. */
export function isDay(day: string): boolean {
  const at = noon(day);
  return !Number.isNaN(at) && new Date(at).toISOString().slice(0, 10) === day;
}

/** The day `count` days later (or earlier, when negative). */
export function addDays(day: string, count: number): string {
  return new Date(noon(day) + count * 86_400_000).toISOString().slice(0, 10);
}

/** How many days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((noon(to) - noon(from)) / 86_400_000);
}

/** The weekday of a day: 0 is Sunday, 6 is Saturday. */
export function weekday(day: string): number {
  return new Date(noon(day)).getUTCDay();
}

/** The picker hands back a Date at local midnight: the day it shows is its local date. */
export function dayOfDate(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** The Date at local midnight that the picker shows as this day. */
export function dateOfDay(day: string): Date {
  const [year = 1970, month = 1, date = 1] = day.split("-").map(Number);
  return new Date(year, month - 1, date);
}

const zones = new Map<string, string>();

/** The zone as given, or UTC when Intl does not know it: a typo must not take the page down. */
function zoneOrUtc(zone: string): string {
  let known = zones.get(zone);
  if (known === undefined) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: zone });
      known = zone;
    } catch {
      known = "UTC";
    }
    zones.set(zone, known);
  }
  return known;
}

/** The calendar day it is now in the zone: the restaurant's today, whatever the visitor's clock says. */
export function todayIn(timeZone: string, now: number = Date.now()): string {
  const parts = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: zoneOrUtc(timeZone) }).formatToParts(now);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** A day the restaurant is shut: a weekday (0 is Sunday) it is always shut, or one date it is shut on. */
export type ClosedDay = number | string;

export function isClosed(day: string, closed: readonly ClosedDay[]): boolean {
  const week = weekday(day);
  return closed.some((entry) => entry === week || entry === day);
}

/** The first day from `from` on that is open, looking up to `limit` days ahead; `from` itself when none is. */
export function firstOpen(from: string, closed: readonly ClosedDay[], limit: number): string {
  for (let step = 0; step <= limit; step += 1) {
    const day = addDays(from, step);
    if (!isClosed(day, closed)) return day;
  }
  return from;
}

/** Intl writes some spaces as thin or narrow no-break spaces; a plain space looks the same and every engine agrees on it. */
const plain = (text: string) => text.replace(/\s/g, " ");

/**
 * A day as a heading says it: "today", "tomorrow", the weekday ("Friday") for
 * the rest of the coming week and the weekday with its date ("Friday, November
 * 20") beyond it. `relative` is true for the first two, which need no "on" in
 * front of them in a sentence.
 */
export function dayName(day: string, today: string, locale: string): { name: string; relative: boolean } {
  const gap = daysBetween(today, day);
  if (gap === 0 || gap === 1) return { name: plain(new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(gap, "day")), relative: true };
  const options: Intl.DateTimeFormatOptions = gap > 1 && gap < 7 ? { weekday: "long" } : { weekday: "long", day: "numeric", month: "long" };
  return { name: plain(new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(noon(day))), relative: false };
}

/** A day as a sentence says it: "today", "tomorrow", "on Friday", "on Friday, November 20". */
export function dayPhrase(day: string, today: string, locale: string, onDay: string): string {
  const { name, relative } = dayName(day, today, locale);
  return relative ? name : fill(onDay, { day: name });
}

/** A day in full: "Friday, November 6". */
export function dayText(day: string, locale: string): string {
  return plain(new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(noon(day)));
}

const TIME = /^(\d{1,2}):(\d{2})$/;

/** A time of day written 18:30, as the locale writes it: "18:30" for h23, "6:30 PM" for h12. Anything that is not a time is shown as it was given. */
export function timeText(time: string, locale: string, hourCycle: "h12" | "h23"): string {
  const match = TIME.exec(time.trim());
  const hours = Number(match?.[1]);
  const minutes = Number(match?.[2]);
  if (!match || hours > 23 || minutes > 59) return time;
  return plain(new Intl.DateTimeFormat(locale, { hour: hourCycle === "h23" ? "2-digit" : "numeric", minute: "2-digit", hourCycle, timeZone: "UTC" }).format(Date.UTC(2000, 0, 1, hours, minutes)));
}
