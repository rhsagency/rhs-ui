/** The words the field says, for translation. A `{name}` mark in a sentence is filled in. */
export interface SendScheduleLabels {
  /** The legend. Default "When should it go out?" */
  legend?: string;
  /** The first choice. Default "Send now". */
  now?: string;
  /** The line under the first choice. Default "Sent immediately, nothing to schedule." */
  nowHint?: string;
  /** The second choice. Default "Schedule for later". */
  later?: string;
  /** The line under the second choice. Default "Pick the day and time it goes out." */
  laterHint?: string;
  /** Under the pickers; `{zone}` and `{offset}`. Default "Times are in {zone} ({offset})." */
  zoneNote?: string;
  /** The same while the offset is not known yet; `{zone}`. Default "Times are in {zone}." */
  zoneOnly?: string;
  /** Under the pickers; `{when}` is the earliest time. Default "Earliest: {when}." */
  earliest?: string;
  /** Refusal for a time inside the lead time; `{when}` is the earliest time. Default "That is too soon. The earliest time is {when}." */
  soon?: string;
  /** Refusal for a time that has passed. Default "That time has passed. The earliest time is {when}." */
  past?: string;
  /** A day and a time in one phrase; `{date}` and `{time}`. Default "{date} at {time}". */
  at?: string;
  /** The sentence for "now". Default "Goes out as soon as you confirm." */
  sentenceNow?: string;
  /** The sentence for a time; `{when}`, `{zone}`, `{relative}`. Default "Goes out {when}, {zone}, {relative}". */
  sentenceLater?: string;
  /** The same before the clock is known; `{when}`, `{zone}`. Default "Goes out {when}, {zone}". */
  sentenceLaterQuiet?: string;
  /** While the day or the time is missing. Default "Pick a day and a time to schedule it." */
  sentencePick?: string;
  /** While the time is refused. Default "Not scheduled yet. Pick a later time." */
  sentenceRefused?: string;
}

export const DEFAULT_LABELS = {
  legend: "When should it go out?",
  now: "Send now",
  nowHint: "Sent immediately, nothing to schedule.",
  later: "Schedule for later",
  laterHint: "Pick the day and time it goes out.",
  zoneNote: "Times are in {zone} ({offset}).",
  zoneOnly: "Times are in {zone}.",
  earliest: "Earliest: {when}.",
  soon: "That is too soon. The earliest time is {when}.",
  past: "That time has passed. The earliest time is {when}.",
  at: "{date} at {time}",
  sentenceNow: "Goes out as soon as you confirm.",
  sentenceLater: "Goes out {when}, {zone}, {relative}",
  sentenceLaterQuiet: "Goes out {when}, {zone}",
  sentencePick: "Pick a day and a time to schedule it.",
  sentenceRefused: "Not scheduled yet. Pick a later time.",
} satisfies Required<SendScheduleLabels>;

export type Words = Required<SendScheduleLabels>;

/** What is chosen: send now, or later at `at`, an ISO time with an offset ("2026-10-27T09:00:00+01:00"), or null while it is missing or refused. */
export interface SendScheduleValue {
  mode: "now" | "later";
  at: string | null;
}

/** A day and a time of day, as the house date time picker holds them. */
export interface Draft {
  date: Date | null;
  /** "HH:MM", 24-hour. */
  time: string | null;
}

/** A day and a time of day with no zone attached. */
export interface Wall {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export const pad = (value: number): string => String(value).padStart(2, "0");

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => values[key] ?? mark);
}

const formats = new Map<string, Intl.DateTimeFormat>();

/** A formatter that spells out the wall clock of a zone in numbers. "en-US" here only fixes the order of the parts we read back. */
function zoneFormat(timeZone: string): Intl.DateTimeFormat {
  let format = formats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    formats.set(timeZone, format);
  }
  return format;
}

/** The zone as given, or "UTC" when the browser does not know it. */
export function safeZone(timeZone: string): string {
  try {
    zoneFormat(timeZone);
    return timeZone;
  } catch {
    return "UTC";
  }
}

function read(timeZone: string, instant: number): Wall & { second: number } {
  const parts = zoneFormat(timeZone).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") % 24, minute: get("minute"), second: get("second") };
}

/** The wall clock in a zone at an instant (milliseconds since 1970). */
export function wallAt(timeZone: string, instant: number): Wall {
  const { second: _second, ...wall } = read(timeZone, instant);
  return wall;
}

/** How many minutes the zone is ahead of UTC at an instant: Amsterdam is 60 in winter and 120 in summer. */
export function offsetAt(timeZone: string, instant: number): number {
  const wall = read(timeZone, instant);
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);
  return Math.round((asUtc - Math.floor(instant / 1000) * 1000) / 60_000);
}

/** The instant a wall clock reads in a zone. A time the clock skips (spring forward) lands an hour later, and one it repeats (fall back) is read as the second. */
export function instantOf(wall: Wall, timeZone: string): number {
  const guess = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);
  const first = guess - offsetAt(timeZone, guess) * 60_000;
  return guess - offsetAt(timeZone, first) * 60_000;
}

/**
 * The first slot of the time list at or after an instant, as an instant. The list counts `step` minutes from midnight on the wall clock
 * of the zone, so the rounding is done there: on the UTC clock it would name a time the list does not offer in a zone that is not a
 * whole number of hours from UTC (Asia/Kolkata with a step of 60 minutes). Once the last slot of a day is passed it is the first of the next.
 */
export function nextSlot(instant: number, step: number, timeZone: string): number {
  const wall = wallAt(timeZone, Math.ceil(instant / 60_000) * 60_000);
  const minutes = Math.ceil((wall.hour * 60 + wall.minute) / step) * step;
  // Date.UTC carries minutes past midnight into the next day.
  const day = new Date(Date.UTC(wall.year, wall.month - 1, wall.day, 0, minutes));
  return instantOf({ year: day.getUTCFullYear(), month: day.getUTCMonth() + 1, day: day.getUTCDate(), hour: day.getUTCHours(), minute: day.getUTCMinutes() }, timeZone);
}

/** The instant a picked day and time stand for in a zone. */
export function instantOfDraft(date: Date, time: string, timeZone: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return instantOf({ year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate(), hour: hour ?? 0, minute: minute ?? 0 }, timeZone);
}

/** "2026-10-27T09:00:00+01:00": the wall clock in the zone with the zone's offset at that instant. */
export function isoAt(timeZone: string, instant: number): string {
  const wall = wallAt(timeZone, instant);
  const offset = offsetAt(timeZone, instant);
  const size = Math.abs(offset);
  return `${wall.year}-${pad(wall.month)}-${pad(wall.day)}T${pad(wall.hour)}:${pad(wall.minute)}:00${offset < 0 ? "-" : "+"}${pad(Math.floor(size / 60))}:${pad(size % 60)}`;
}

/** The picker's day and time for an ISO time, read in the zone. Nothing for a missing or unreadable one. */
export function draftOf(at: string | null, timeZone: string): Draft {
  const instant = at === null ? Number.NaN : Date.parse(at);
  if (Number.isNaN(instant)) return { date: null, time: null };
  const wall = wallAt(timeZone, instant);
  return { date: new Date(wall.year, wall.month - 1, wall.day), time: `${pad(wall.hour)}:${pad(wall.minute)}` };
}

/** "GMT+1", "GMT+5:30" or "GMT". */
export function gmtLabel(offset: number): string {
  if (offset === 0) return "GMT";
  const size = Math.abs(offset);
  const minutes = size % 60;
  return `GMT${offset < 0 ? "-" : "+"}${Math.floor(size / 60)}${minutes ? `:${pad(minutes)}` : ""}`;
}

/** A day as a sentence wants it: "Tue 27 Oct". The parts are formatted as UTC, so nothing shifts. */
export function dayLabel(wall: Wall, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(wall.year, wall.month - 1, wall.day)));
}

/** "in 3 days", "tomorrow", "in 2 hours", "in 45 minutes": the distance from `now` to `at`, in the unit people would say it in. */
export function relative(now: number, at: number, locale: string): string {
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const minutes = Math.round((at - now) / 60_000);
  // Minutes up to an hour, and up to two hours unless it is a whole hour ("in 90 minutes", but "in 1 hour" and "in 2 hours").
  if (Math.abs(minutes) < 60 || (Math.abs(minutes) < 120 && minutes % 60 !== 0)) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 36) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
}

/** A `now` given as a Date, a number of milliseconds or ISO text, as milliseconds. */
export function millisecondsOf(now: Date | number | string): number {
  return typeof now === "number" ? now : now instanceof Date ? now.getTime() : Date.parse(now);
}
