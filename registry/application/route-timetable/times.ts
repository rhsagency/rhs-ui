/**
 * How the route timetable reads clock times and works out what is next, as plain functions with no state, so a Server
 * Component can say "next at Harbour Gate: 10:15" in a headline, a notification or an email the way the table does, and
 * so the rules can be tested alone.
 */

/** A moment: a Date, a timestamp in milliseconds or an ISO string. */
export type DateInput = Date | string | number;

const CLOCK = /^(\d{1,2}):(\d{2})$/;

/** A time of day written 07:42 or 7:42 on the 24-hour clock, as minutes after midnight. Anything else, and a time that does not exist, is null. */
export function parseClock(value: string | null | undefined): number | null {
  const match = CLOCK.exec((value ?? "").trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours > 23 || minutes > 59 ? null : hours * 60 + minutes;
}

/** Minutes after midnight as the machine-readable value of a `time` element: "07:42". */
export function clockString(minutes: number): string {
  return `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/**
 * The time of day, in minutes after midnight, at a moment in a time zone: the clock on the wall of the place the
 * timetable is for, whatever the clock of the reader says. Null for a moment that is not one. An unknown zone falls back to UTC.
 */
export function minutesIn(now: DateInput, timeZone: string): number | null {
  const date = new Date(now);
  if (Number.isNaN(date.getTime())) return null;
  const read = (zone: string) =>
    new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: zone }).formatToParts(date);
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = read(timeZone);
  } catch {
    parts = read("UTC");
  }
  const at = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return (at("hour") % 24) * 60 + at("minute");
}

/** One piece of a written time: the digits and the colon, or the period (AM, PM) that is set smaller beside them. */
export interface TimePart {
  kind: "time" | "period";
  value: string;
}

const NBSP = "\u00a0";

/**
 * A time of day as the locale writes it, in pieces: en-US gives "7:42" and "AM", en-GB and most others give "07:42".
 * Spaces are made non-breaking, so a time never splits across a line, and so the server and the browser write the same
 * text whichever space character their Intl uses. Only a single time is formatted, never a range.
 */
export function timeParts(minutes: number, locale: string): TimePart[] {
  // A 24-hour clock writes 07:42 so a column of times lines up; a 12-hour clock writes 7:42 and the period.
  const twentyFour = /^h2[34]$/.test(new Intl.DateTimeFormat(locale, { hour: "numeric", timeZone: "UTC" }).resolvedOptions().hourCycle ?? "");
  const parts = new Intl.DateTimeFormat(locale, { hour: twentyFour ? "2-digit" : "numeric", minute: "2-digit", timeZone: "UTC" }).formatToParts(Date.UTC(2000, 0, 1, 0, minutes));
  const pieces: TimePart[] = [];
  for (const part of parts) {
    const kind = part.type === "dayPeriod" ? "period" : "time";
    const value = kind === "time" ? part.value.replace(/\s/g, NBSP) : part.value;
    const last = pieces[pieces.length - 1];
    if (last && last.kind === kind) last.value += value;
    else pieces.push({ kind, value });
  }
  return pieces;
}

/** The time as one string, for a sentence: "7:42 AM". */
export const plainTime = (minutes: number, locale: string): string =>
  timeParts(minutes, locale)
    .map((part) => part.value)
    .join("");

/** What a trip does at one stop, as of now. */
export type TripState = "past" | "next" | "later" | "none";

export interface TripLike {
  times: Readonly<Record<string, string | null | undefined>>;
}

/**
 * Where each trip stands at a stop. `next` is the first trip that has not left yet (the earliest time that is not before
 * now); trips before it are `past` and trips after it `later`; a trip that does not stop there is `none`, and so is
 * every trip while the time is not known. A trip at exactly this minute has not left, so it is next.
 */
export function tripStates(trips: readonly TripLike[], stopId: string, now: number | null): { states: TripState[]; minutes: (number | null)[]; next: number } {
  const minutes = trips.map((trip) => parseClock(trip.times[stopId]));
  let next = -1;
  if (now !== null) {
    minutes.forEach((value, index) => {
      const best = next < 0 ? null : minutes[next];
      if (value !== null && value >= now && (best === null || best === undefined || value < best)) next = index;
    });
  }
  const states = minutes.map((value, index): TripState => {
    if (now === null || value === null) return "none";
    if (index === next) return "next";
    return value < now ? "past" : "later";
  });
  return { states, minutes, next };
}

/** `{name}` placeholders filled in. A placeholder with no value is left as it is, so a missing word shows up in review. */
export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
}
