/**
 * When an event happens. `start` and `end` are wall-clock text in the zone you
 * name: "2026-10-27T14:00" is two o'clock there, whatever the browser's own
 * zone is. They are "" while nothing is chosen. `allDay` hides the times and
 * keeps them, so turning it off again brings them back.
 */
export interface EventTimeValue {
  /** "YYYY-MM-DDTHH:mm", or "". */
  start: string;
  /** "YYYY-MM-DDTHH:mm", or "". */
  end: string;
  allDay: boolean;
}

/** The words the fieldset says, for translation. A `{name}` mark in a sentence is filled in. */
export interface EventTimeLabels {
  /** The legend. Default "When". */
  legend?: string;
  /** The label of the start. Default "Starts". */
  starts?: string;
  /** The label of the end. Default "Ends". */
  ends?: string;
  /** The label of the switch. Default "All day". */
  allDay?: string;
  /** On a date picker with no day. Default "Pick a day". */
  pickDay?: string;
  /** On a time picker with a day. Default "Pick a time". */
  pickTime?: string;
  /** On a time picker that waits for a day. Default "Day first". */
  dayFirst?: string;
  /** One timed day: `{day}`, `{from}`, `{to}`, `{length}`, `{zone}`. Default "{day}, {from} to {to} ({length}), {zone}". */
  timedSameDay?: string;
  /** Over midnight: `{fromDay}`, `{from}`, `{toDay}`, `{to}`, `{length}`, `{zone}`. Default "{fromDay}, {from} to {toDay}, {to} ({length}), {zone}". */
  timedRange?: string;
  /** One whole day: `{day}`. Default "{day}, all day". */
  allDaySingle?: string;
  /** Several whole days: `{fromDay}`, `{toDay}`, `{length}`. Default "{fromDay} to {toDay}, all day ({length})". */
  allDayRange?: string;
  /** While the start or the end is missing. Default "Pick a start and an end." */
  incomplete?: string;
  /** When an end at or before the start is refused; `{end}` is the end that stays. Default "The end has to be after the start. It stays at {end}." */
  endBeforeStart?: string;
  /** The same for whole days. Default "The last day cannot be before the first. It stays on {end}." */
  lastDayBeforeFirst?: string;
  /** One day. Default "1 day". */
  dayOne?: string;
  /** Several days; `{count}`. Default "{count} days". */
  dayMany?: string;
  /** Hours in a length; `{count}`. Default "{count} h". */
  hours?: string;
  /** Minutes in a length; `{count}`. Default "{count} min". */
  minutes?: string;
}

export const DEFAULT_LABELS = {
  legend: "When",
  starts: "Starts",
  ends: "Ends",
  allDay: "All day",
  pickDay: "Pick a day",
  pickTime: "Pick a time",
  dayFirst: "Day first",
  timedSameDay: "{day}, {from} to {to} ({length}), {zone}",
  timedRange: "{fromDay}, {from} to {toDay}, {to} ({length}), {zone}",
  allDaySingle: "{day}, all day",
  allDayRange: "{fromDay} to {toDay}, all day ({length})",
  incomplete: "Pick a start and an end.",
  endBeforeStart: "The end has to be after the start. It stays at {end}.",
  lastDayBeforeFirst: "The last day cannot be before the first. It stays on {end}.",
  dayOne: "1 day",
  dayMany: "{count} days",
  hours: "{count} h",
  minutes: "{count} min",
} satisfies Required<EventTimeLabels>;

export type Words = Required<EventTimeLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** A day and a time of day with no zone attached. */
export interface Wall {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const WALL = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/;

export const pad = (value: number): string => String(value).padStart(2, "0");

/** The parts of "YYYY-MM-DDTHH:mm" (or a day alone), or null when the text is not a real moment. */
export function parseWall(text: string): Wall | null {
  const match = WALL.exec(text);
  if (!match) return null;
  const [year, month, day, hour, minute] = [match[1], match[2], match[3], match[4] ?? "0", match[5] ?? "0"].map(Number) as [number, number, number, number, number];
  const probe = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const real = probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day && hour < 24 && minute < 60;
  return real ? { year, month, day, hour, minute } : null;
}

export const formatWall = (wall: Wall): string => `${wall.year}-${pad(wall.month)}-${pad(wall.day)}T${pad(wall.hour)}:${pad(wall.minute)}`;

/** Wall-clock arithmetic: the parts counted as if they were UTC, so there is no daylight saving in the sum. */
export const toMs = (wall: Wall): number => Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);

export function fromMs(ms: number): Wall {
  const date = new Date(ms);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate(), hour: date.getUTCHours(), minute: date.getUTCMinutes() };
}

const dayNumber = (wall: Wall): number => Math.floor(Date.UTC(wall.year, wall.month - 1, wall.day) / 86_400_000);

/** The day of a moment as the calendar wants it: a Date at local midnight, so the same day in any browser zone. */
export function dateOf(text: string): Date | null {
  const wall = parseWall(text);
  return wall ? new Date(wall.year, wall.month - 1, wall.day) : null;
}

/** "HH:mm" of a moment, or null when it has no time. */
export const timeOf = (text: string): string | null => /T(\d{2}:\d{2})$/.exec(text)?.[1] ?? null;

/** The moment on another day, keeping its time of day (or `fallback` when it has none). */
export function withDate(text: string, date: Date, fallback: string): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${timeOf(text) ?? fallback}`;
}

/** The moment at another time of day, or "" while it has no day. */
export function withTime(text: string, time: string): string {
  const wall = parseWall(text);
  return wall ? `${wall.year}-${pad(wall.month)}-${pad(wall.day)}T${time}` : "";
}

export function addMinutes(text: string, minutes: number): string {
  const wall = parseWall(text);
  return wall ? formatWall(fromMs(toMs(wall) + minutes * 60_000)) : "";
}

/** Whether `end` is allowed after `start`: later for a timed event, on or after the same day for whole days. Nothing to compare is allowed. */
export function endAllowed(start: string, end: string, allDay: boolean): boolean {
  const from = parseWall(start);
  const to = parseWall(end);
  if (!from || !to) return true;
  return allDay ? dayNumber(to) >= dayNumber(from) : toMs(to) > toMs(from);
}

/** "1 h", "1 h 30 min", "45 min", "1 day 2 h", "3 days". */
export function formatLength(minutes: number, words: Words, allDay = false): string {
  const days = allDay ? Math.round(minutes / 1440) : Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(days === 1 ? words.dayOne : fill(words.dayMany, { count: days }));
  if (!allDay && hours > 0) parts.push(fill(words.hours, { count: hours }));
  if (!allDay && rest > 0) parts.push(fill(words.minutes, { count: rest }));
  return parts.join(" ") || fill(words.minutes, { count: 0 });
}

/** A day written for a sentence: "Tue 27 Oct". The parts are counted as UTC and formatted as UTC, so nothing shifts. */
export function dayLabel(wall: Wall, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(wall.year, wall.month - 1, wall.day)));
}

const clock = (wall: Wall): string => `${pad(wall.hour)}:${pad(wall.minute)}`;

/** The moment in one phrase, for a sentence about a refusal: "Tue 27 Oct, 15:00", or the day alone for whole days. */
export function momentLabel(text: string, allDay: boolean, locale: string): string {
  const wall = parseWall(text);
  if (!wall) return "";
  return allDay ? dayLabel(wall, locale) : `${dayLabel(wall, locale)}, ${clock(wall)}`;
}

/** The whole event in one sentence, or null while the start or the end is missing. */
export function summarise(value: EventTimeValue, locale: string, timeZone: string, words: Words): string | null {
  const from = parseWall(value.start);
  const to = parseWall(value.end);
  if (!from || !to) return null;
  const sameDay = dayNumber(from) === dayNumber(to);
  if (value.allDay) {
    const length = formatLength((dayNumber(to) - dayNumber(from) + 1) * 1440, words, true);
    return sameDay ? fill(words.allDaySingle, { day: dayLabel(from, locale) }) : fill(words.allDayRange, { fromDay: dayLabel(from, locale), toDay: dayLabel(to, locale), length });
  }
  const length = formatLength(Math.max(0, (toMs(to) - toMs(from)) / 60_000), words);
  return sameDay
    ? fill(words.timedSameDay, { day: dayLabel(from, locale), from: clock(from), to: clock(to), length, zone: timeZone })
    : fill(words.timedRange, { fromDay: dayLabel(from, locale), from: clock(from), toDay: dayLabel(to, locale), to: clock(to), length, zone: timeZone });
}
