/**
 * The arithmetic of the time tracker. Time is never counted: it is the
 * difference between two timestamps, so a tab that slept, a reload and a
 * throttled timer cannot make it drift.
 */

/** Something a timestamp can be written as. */
export type Moment = number | string | Date;

/** A moment as milliseconds since 1970, or null when it is missing or not a date. */
export function momentOf(value: Moment | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const at = value instanceof Date ? value.getTime() : typeof value === "number" ? value : new Date(value).getTime();
  return Number.isNaN(at) ? null : at;
}

/**
 * How much time has been tracked at `now`: what was saved when it was last
 * paused, plus the run in progress. A clock that is behind `startedAt` never
 * gives a negative run.
 */
export function elapsedAt(now: number, running: boolean, startedAt: number | null, accumulated: number): number {
  const saved = Number.isFinite(accumulated) ? Math.max(0, accumulated) : 0;
  return saved + (running && startedAt !== null ? Math.max(0, now - startedAt) : 0);
}

/** Hours, minutes and seconds as the display writes them: "00:12:41". Past 99 hours it grows a digit. */
export function clockParts(ms: number): [string, string, string] {
  const total = Math.floor(Math.max(0, ms) / 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return [pad(Math.floor(total / 3600)), pad(Math.floor((total % 3600) / 60)), pad(total % 60)];
}

/** The same as one string: "00:12:41". */
export function formatClock(ms: number): string {
  return clockParts(ms).join(":");
}

/**
 * The time in words, for what is said aloud: "45 seconds", "12 minutes",
 * "1 hour, 5 minutes". Under a minute it counts seconds, after that it leaves
 * them out, since a change a second is exactly what is not announced.
 */
export function formatWords(ms: number, locale = "en-US"): string {
  const total = Math.floor(Math.max(0, ms) / 1000);
  const unit = (value: number, name: "hour" | "minute" | "second") => {
    const options = { style: "unit", unit: name, unitDisplay: "long" } as const;
    try {
      return new Intl.NumberFormat(locale, options).format(value);
    } catch {
      return new Intl.NumberFormat("en-US", options).format(value);
    }
  };
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const parts = hours > 0 ? [unit(hours, "hour"), ...(minutes > 0 ? [unit(minutes, "minute")] : [])] : minutes > 0 ? [unit(minutes, "minute")] : [unit(total, "second")];
  try {
    return new Intl.ListFormat(locale, { style: "long", type: "unit" }).format(parts);
  } catch {
    return parts.join(", ");
  }
}
