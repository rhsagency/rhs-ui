/** A moment: a Date, an ISO 8601 string or epoch milliseconds. */
export type EditMoment = Date | string | number;

/** Where the editing time stands. Only the crossings between these are worth announcing. */
export type EditPhase = "plenty" | "ten" | "last" | "expired";

export const toMs = (moment: EditMoment): number => (moment instanceof Date ? moment.getTime() : typeof moment === "number" ? moment : Date.parse(moment));

const MINUTE = 60_000;

/** Whole minutes left, rounded down, so the words never promise time that is gone: 24 minutes and 59 seconds is "24 minutes". Zero in the last minute. */
export const minutesLeft = (remaining: number): number => Math.max(0, Math.floor(remaining / MINUTE));

/**
 * Which side of the two marks the time left is on, by the minutes the words say: "ten" from the moment they read 10
 * minutes, "last" from the moment they read "less than a minute", so what is announced is always what is on the
 * screen. `remaining` is in milliseconds.
 */
export function phaseOf(remaining: number): EditPhase {
  if (remaining <= 0) return "expired";
  const minutes = minutesLeft(remaining);
  if (minutes === 0) return "last";
  return minutes <= 10 ? "ten" : "plenty";
}

/**
 * How long until the words need to change: the moment the whole minutes left go down by one, or the moment time
 * runs out. A timer set for this long, over and over, is one wake-up a minute instead of one a second.
 */
export function untilNextChange(remaining: number): number {
  if (remaining <= 0) return Number.POSITIVE_INFINITY;
  // The whole minutes left drop by one the moment the time left goes below a whole number of minutes; a little extra makes sure it has.
  return (remaining % MINUTE) + 20;
}

/** A length of time in words: "24 minutes", "1 hour", "1 hour 5 minutes". Never "0 minutes": the last minute is the caller's own sentence. */
export function durationWords(minutes: number, locale: string): string {
  const unit = (value: number, name: "hour" | "minute"): string => new Intl.NumberFormat(locale, { style: "unit", unit: name, unitDisplay: "long" }).format(value);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(unit(hours, "hour"));
  if (rest > 0 || hours === 0) parts.push(unit(rest, "minute"));
  return new Intl.ListFormat(locale, { type: "unit", style: "narrow" }).format(parts);
}
