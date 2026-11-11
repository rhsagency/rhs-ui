/**
 * How the results table reads times and ranks a field, as plain functions with no state, so a Server Component can write a
 * finish time or a gap the way the table does (a headline, a feed, an export) and so the rules can be tested alone.
 */

/** How an entry ended: with a time, or without one. */
export type ResultStatus = "finished" | "dnf" | "dns" | "dsq";

/** What ranking needs to know about a result. */
export interface Rankable {
  /** The official place, if the timing system gave one. */
  place?: number;
  /** The finish time: seconds, or text such as "1:02:45", "20:15.4" or "58.42". */
  time?: number | string | null;
  /** How the entry ended. Default: finished when there is a time, otherwise did not finish. */
  status?: ResultStatus;
}

/**
 * A time as seconds. A number is seconds already; text is read as hours, minutes and seconds ("1:02:45"), minutes and
 * seconds ("20:15.4", "0:42") or plain seconds ("58.42"). A comma works as the decimal point. Anything else, a negative
 * number, NaN or an empty string, is null: a missing time is never read as zero.
 */
export function parseSeconds(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
  const text = value.trim().replace(",", ".");
  const clock = /^(?:(\d+):)?(\d{1,2}):(\d{2}(?:\.\d+)?)$/.exec(text);
  if (clock) return Number(clock[1] ?? 0) * 3600 + Number(clock[2]) * 60 + Number(clock[3]);
  return /^\d+(?:\.\d+)?$/.test(text) ? Number(text) : null;
}

/** A time written the way a results sheet does: `1:02:45` with hours, `20:15` without, and tenths or hundredths when `precision` asks for them. */
export function formatTime(seconds: number, hours: boolean, precision = 0): string {
  const scale = 10 ** precision;
  // Rounded as one number, so 59.96 seconds becomes 1:00.0 and not 0:60.0.
  const ticks = Math.round(Math.max(0, seconds) * scale);
  const whole = Math.floor(ticks / scale);
  const fraction = precision > 0 ? `.${String(ticks - whole * scale).padStart(precision, "0")}` : "";
  const pad = (value: number) => String(value).padStart(2, "0");
  const minutes = Math.floor(whole / 60);
  return hours ? `${Math.floor(minutes / 60)}:${pad(minutes % 60)}:${pad(whole % 60)}${fraction}` : `${minutes}:${pad(whole % 60)}${fraction}`;
}

/** The gap to the winner: "+0:42". */
export const formatGap = (seconds: number, hours: boolean, precision = 0): string => `+${formatTime(seconds, hours, precision)}`;

/** True when any time is an hour or more, which is when every time in the table is written with hours so the column lines up. */
export const needsHours = (seconds: readonly number[]): boolean => seconds.some((value) => value >= 3600);

/** A time as the machine-readable duration of a `time` element: PT1H2M45S. */
export function isoDuration(seconds: number, precision = 0): string {
  const scale = 10 ** precision;
  const ticks = Math.round(Math.max(0, seconds) * scale);
  const whole = Math.floor(ticks / scale);
  const fraction = precision > 0 ? `.${String(ticks - whole * scale).padStart(precision, "0")}` : "";
  return `PT${Math.floor(whole / 3600)}H${Math.floor((whole % 3600) / 60)}M${whole % 60}${fraction}S`;
}

/**
 * A time as words, for a screen reader: "1 hour 2 minutes 45 seconds". "1:02:45" read aloud is a guess between a time of
 * day and a duration, and the words are not. Units come from Intl, so they follow the locale.
 */
export function spokenTime(seconds: number, precision: number, locale: string): string {
  const scale = 10 ** precision;
  const ticks = Math.round(Math.max(0, seconds) * scale);
  const whole = Math.floor(ticks / scale);
  const secs = (ticks - Math.floor(whole / 60) * 60 * scale) / scale;
  const unit = (value: number, name: "hour" | "minute" | "second", digits: number) =>
    new Intl.NumberFormat(locale, { style: "unit", unit: name, unitDisplay: "long", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  return [hours > 0 ? unit(hours, "hour", 0) : "", hours > 0 || minutes > 0 ? unit(minutes, "minute", 0) : "", unit(secs, "second", precision)].filter(Boolean).join(" ");
}

/** A result with what ranking worked out. */
export interface Ranked<R> {
  /** The result as it was given. */
  result: R;
  /** Where it was in the list you gave, which keeps equal results in your order. */
  index: number;
  /** The finish time in seconds, or null for an entry that has none. */
  seconds: number | null;
  /** How the entry ended. */
  status: ResultStatus;
  /** The place, or null when there is none (an entry without a time has no place). */
  place: number | null;
  /** True when someone else holds the same place. */
  tied: boolean;
  /** Seconds behind the winner, or null for the winner, for an equal winner and for an entry without a time. */
  gap: number | null;
}

const ORDER: Record<ResultStatus, number> = { finished: 0, dnf: 1, dsq: 2, dns: 3 };

function entryOf<R extends Rankable>(result: R, index: number) {
  const parsed = parseSeconds(result.time);
  const asked = result.status ?? "finished";
  // A finish needs a time: a result that says finished and has none did not finish, rather than finishing in no time.
  const status: ResultStatus = asked === "finished" && parsed === null ? "dnf" : asked;
  return { result, index, status, seconds: status === "finished" ? parsed : null };
}

/**
 * Whether the places can be trusted as they were given: every finisher has one. Then the table orders by them (a
 * photo finish, a penalty) and shows them in the full list. Without that, places come from the times.
 */
export function isOfficial(results: readonly Rankable[]): boolean {
  const finishers = results.map(entryOf).filter((entry) => entry.status === "finished");
  return finishers.length > 0 && finishers.every((entry) => typeof entry.result.place === "number");
}

export interface RankOptions {
  /** Digits after the second. Two times that are equal at this precision are tied. */
  precision: number;
  /** Order and tie by the places that were given (see `isOfficial`) instead of by the times. */
  official: boolean;
  /** Show the places that were given instead of renumbering: for the whole field, not for one category. */
  supplied: boolean;
}

/**
 * Orders a field and gives it places. Finishers come first, fastest first (or in the order of their official places),
 * then those who did not finish, then the disqualified, then those who did not start. Equal times share a place and
 * the next place is skipped (1, 2, 2, 4), the way a results sheet counts. Places are worked out for the results you
 * pass, so a category gets its own 1, 2, 3.
 */
export function rankResults<R extends Rankable>(results: readonly R[], { precision, official, supplied }: RankOptions): Ranked<R>[] {
  const entries = results.map(entryOf);
  const finishers = entries.filter((entry) => entry.status === "finished");
  const rest = entries.filter((entry) => entry.status !== "finished").sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.index - b.index);
  const scale = 10 ** precision;
  const secondsOf = (entry: (typeof entries)[number]) => entry.seconds ?? 0;
  const byTime = (a: (typeof entries)[number], b: (typeof entries)[number]) => secondsOf(a) - secondsOf(b) || a.index - b.index;
  const placeOf = (entry: (typeof entries)[number]) => entry.result.place ?? 0;
  finishers.sort(official ? (a, b) => placeOf(a) - placeOf(b) || byTime(a, b) : byTime);
  const keyOf = (entry: (typeof entries)[number]) => (official ? placeOf(entry) : Math.round(secondsOf(entry) * scale));

  const winner = finishers[0];
  let rank = 0;
  const ranked = finishers.map((entry, at): Ranked<R> => {
    const before = finishers[at - 1];
    const after = finishers[at + 1];
    if (!before || keyOf(before) !== keyOf(entry)) rank = at + 1;
    const level = (other: (typeof entries)[number] | undefined) => other !== undefined && keyOf(other) === keyOf(entry);
    return {
      result: entry.result,
      index: entry.index,
      seconds: entry.seconds,
      status: "finished",
      place: supplied && official ? placeOf(entry) : rank,
      tied: level(before) || level(after),
      gap: rank === 1 || !winner ? null : secondsOf(entry) - secondsOf(winner),
    };
  });
  return [...ranked, ...rest.map((entry): Ranked<R> => ({ result: entry.result, index: entry.index, seconds: null, status: entry.status, place: null, tied: false, gap: null }))];
}

/** `{name}` placeholders filled in. A placeholder with no value is left as it is, so a missing word shows up in review. */
export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
}
