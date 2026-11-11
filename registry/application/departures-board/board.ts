/**
 * How the departures board reads times, works out what a departure is doing and notices what changed between two
 * updates, as plain functions with no state, so a Server Component can write the same status the board does (a
 * notification, a push alert, an email) and so the rules can be tested alone.
 */

/** A moment: a Date, a timestamp in milliseconds or an ISO string with its offset. */
export type DateInput = Date | string | number;

/** What a departure is doing, as the board says it. */
export type DepartureStatus = "on-time" | "delayed" | "cancelled" | "boarding";

/** A moment as milliseconds, or null for no moment and for text that is not one. */
export function toMs(value: DateInput | null | undefined): number | null {
  if (value === undefined || value === null) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

/** One piece of a written time: the digits and the colon, or the period (AM, PM) that is set smaller beside them. */
export interface TimePart {
  kind: "time" | "period";
  value: string;
}

const NBSP = "\u00a0";

/**
 * A moment's time of day as the locale writes it in the time zone, in pieces: en-US gives "2:10" and "PM", en-GB and
 * most others give "14:10". Spaces are made non-breaking, so a time never splits across a line, and so the server and
 * the browser write the same text whichever space character their Intl uses. A 24-hour clock keeps its leading zero, so
 * a column of times lines up. A time zone Intl does not know (a typo, an empty string from a feed) falls back to UTC
 * rather than throwing while the board renders.
 */
export function timeParts(ms: number, locale: string, timeZone: string): TimePart[] {
  const read = (zone: string) => {
    const twentyFour = /^h2[34]$/.test(new Intl.DateTimeFormat(locale, { hour: "numeric", timeZone: zone }).resolvedOptions().hourCycle ?? "");
    return new Intl.DateTimeFormat(locale, { hour: twentyFour ? "2-digit" : "numeric", minute: "2-digit", timeZone: zone }).formatToParts(ms);
  };
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = read(timeZone);
  } catch {
    parts = read("UTC");
  }
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

/** The time as one string, for a sentence: "2:10 PM". */
export const plainTime = (ms: number, locale: string, timeZone: string): string =>
  timeParts(ms, locale, timeZone)
    .map((part) => part.value)
    .join("");

/** What the board needs to know of a departure. */
export interface DepartureLike {
  id: string;
  scheduled: DateInput;
  expected?: DateInput;
  platform?: string;
  status?: DepartureStatus;
}

/** A departure with what the board worked out about it. */
export interface Resolved<D extends DepartureLike> {
  /** The departure as it was given. */
  departure: D;
  /** The planned time, or null when it is not a time. */
  scheduled: number | null;
  /** The time it is expected to leave: the planned time when nothing else is known. */
  expected: number | null;
  /** Whole minutes behind the plan, 0 when on time. */
  delay: number;
  /** What it is doing: the status you gave, or delayed or on time worked out from the two times. */
  status: DepartureStatus;
  /** True once it has left. A cancelled departure never leaves, and one that is boarding has not gone yet. */
  departed: boolean;
  /** What the rows are ordered by: the expected time, or the planned time for a cancelled one. */
  sortAt: number;
}

/** Works out what a departure is doing. `now` is the moment the board is read at, or null when it is not known. */
export function resolveDeparture<D extends DepartureLike>(departure: D, now: number | null): Resolved<D> {
  const scheduled = toMs(departure.scheduled);
  const expected = toMs(departure.expected) ?? scheduled;
  const delay = scheduled !== null && expected !== null ? Math.max(0, Math.round((expected - scheduled) / 60_000)) : 0;
  const status = departure.status ?? (delay > 0 ? "delayed" : "on-time");
  const at = status === "cancelled" ? scheduled : expected;
  return {
    departure,
    scheduled,
    expected,
    delay,
    status,
    departed: now !== null && at !== null && status !== "boarding" && status !== "cancelled" && at < now,
    // A departure with no time sinks to the bottom: a board is read from the top.
    sortAt: at ?? Number.MAX_SAFE_INTEGER,
  };
}

/** Rows in the order a board shows them: by the time they leave. Departures at the same time keep the order you gave them. */
export function sortResolved<D extends DepartureLike>(rows: readonly Resolved<D>[]): Resolved<D>[] {
  return rows.map((row, index) => ({ row, index })).sort((a, b) => a.row.sortAt - b.row.sortAt || a.index - b.index).map((entry) => entry.row);
}

/** What the board remembers of a row, to tell what changed at the next update. */
export interface Snapshot {
  status: DepartureStatus;
  delay: number;
  platform: string;
}

export const snapshotOf = <D extends DepartureLike>(row: Resolved<D>): Snapshot => ({ status: row.status, delay: row.delay, platform: row.departure.platform ?? "" });

/** What changed about a row, in the words a reader would use. */
export type ChangeKind = "cancelled" | "boarding" | "delayed" | "on-time" | "platform";

export interface Change<D extends DepartureLike> {
  row: Resolved<D>;
  kinds: ChangeKind[];
}

/**
 * The rows that changed between two updates, and how. Only a row that was on the board before can change: a row that
 * has just appeared is not news, and a row that has left is not worth saying. A changed status, a delay that grew or
 * shrank and a platform that was given or moved each count; a time that only crept along does not.
 */
export function changesBetween<D extends DepartureLike>(before: ReadonlyMap<string, Snapshot>, after: readonly Resolved<D>[]): Change<D>[] {
  const changes: Change<D>[] = [];
  for (const row of after) {
    const old = before.get(row.departure.id);
    if (!old || row.departed) continue;
    const kinds: ChangeKind[] = [];
    if (row.status !== old.status || (row.status === "delayed" && row.delay !== old.delay)) kinds.push(row.status);
    const platform = row.departure.platform ?? "";
    if (platform !== "" && platform !== old.platform) kinds.push("platform");
    if (kinds.length > 0) changes.push({ row, kinds });
  }
  return changes;
}

/** `{name}` placeholders filled in. A placeholder with no value is left as it is, so a missing word shows up in review. */
export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
}
