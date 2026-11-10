/**
 * The week behind AvailabilityGrid, as plain functions: they hold no state and
 * call no hook, so a Server Component can use them too (to turn a saved value
 * into a summary, or to check a booking against it). Days are numbers as
 * `Date.getDay()` gives them, 0 for Sunday to 6 for Saturday. A slot is a day
 * and the minute it starts at, written "1-09:00" (Monday, 09:00), and the
 * value of the grid is a list of such keys.
 */

/** The words the grid says, for translation. A `{name}` mark in a sentence is filled in. */
export interface AvailabilityGridLabels {
  /** Names the grid for a screen reader. Default "Weekly availability". */
  grid?: string;
  /** The name of the column of times, for a screen reader. Default "Time". */
  timeColumn?: string;
  /** The name of a cell; `{day}`, `{from}`, `{to}` and `{state}`. Default "{day} {from} to {to}, {state}". */
  cell?: string;
  /** The state of a chosen cell. Default "available". */
  available?: string;
  /** The state of a cell that is not chosen. Default "not available". */
  unavailable?: string;
  /** The name of a day's heading, which is a button that fills or clears the whole day; `{day}`. The short name on the button is put in front of it ("Mon, Fill or clear all of Monday"), so the name always holds what is written on the button. Default "Fill or clear all of {day}". */
  toggleDay?: string;
  /** The legend of a chosen cell. Default "Available". */
  legendOn?: string;
  /** The legend of a cell that is not chosen. Default "Not available". */
  legendOff?: string;
  /** The quick action that chooses every hour of the weekdays. Default "Fill weekdays". */
  fillWeekdays?: string;
  /** The quick action that clears the grid. Default "Clear all". */
  clear?: string;
  /** The small heading over the summary. Default "Summary". */
  summary?: string;
  /** The summary of an empty grid. Default "Nothing chosen yet. Drag across the grid to paint the hours you are free." */
  empty?: string;
  /** The total beside the summary; `{hours}`. Default "{hours} hours a week". */
  total?: string;
  /** The same for exactly one hour. Default "1 hour a week". */
  totalOne?: string;
  /** Two times joined into a range; `{from}` and `{to}`. Default "{from} to {to}". */
  range?: string;
  /** What the days are called when every day is chosen. Default "Every day". */
  everyDay?: string;
  /** What is said politely after a change; `{range}` and `{state}`. Default "{range} set to {state}". */
  changed?: string;
  /** What is said politely after the quick actions. Default "Weekdays filled" and "Everything cleared". */
  filledWeekdays?: string;
  clearedAll?: string;
  /** The hint under the grid. Default "Drag to paint hours. Arrow keys move, Space toggles, Shift with the arrows extends a range." */
  hint?: string;
}

export const DEFAULT_LABELS = {
  grid: "Weekly availability",
  timeColumn: "Time",
  cell: "{day} {from} to {to}, {state}",
  available: "available",
  unavailable: "not available",
  toggleDay: "Fill or clear all of {day}",
  legendOn: "Available",
  legendOff: "Not available",
  fillWeekdays: "Fill weekdays",
  clear: "Clear all",
  summary: "Summary",
  empty: "Nothing chosen yet. Drag across the grid to paint the hours you are free.",
  total: "{hours} hours a week",
  totalOne: "1 hour a week",
  range: "{from} to {to}",
  everyDay: "Every day",
  changed: "{range} set to {state}",
  filledWeekdays: "Weekdays filled",
  clearedAll: "Everything cleared",
  hint: "Drag to paint hours. Arrow keys move, Space toggles, Shift with the arrows extends a range.",
} satisfies Required<AvailabilityGridLabels>;

export type Words = Required<AvailabilityGridLabels>;

/** A place in the grid: a column (a day, in the order shown) and a row (a slot, from the top). */
export interface Cell {
  col: number;
  row: number;
}

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

const two = (n: number) => String(n).padStart(2, "0");

/** The key of one slot: the day, a dash, and the time it starts at as 24-hour hours and minutes ("1-09:00"). */
export function slotKey(day: number, minutes: number): string {
  return `${day}-${two(Math.floor(minutes / 60))}:${two(minutes % 60)}`;
}

/** A key taken apart, or null when it is not one. */
export function parseKey(key: string): { day: number; minutes: number } | null {
  const match = /^([0-6])-(\d{2}):(\d{2})$/.exec(key);
  return match ? { day: Number(match[1]), minutes: Number(match[2]) * 60 + Number(match[3]) } : null;
}

/** The days in the order they are shown: the week from `weekStartsOn`, with only the days asked for. */
export function dayOrder(weekStartsOn: number, days?: readonly number[]): number[] {
  const start = Number.isInteger(weekStartsOn) ? ((weekStartsOn % 7) + 7) % 7 : 1;
  const week = Array.from({ length: 7 }, (_, i) => (start + i) % 7);
  return days ? week.filter((day) => days.includes(day)) : week;
}

/** A slot length that divides the hour evenly (15, 20, 30 or 60); anything else is 30. */
export function slotLength(minutes: number): number {
  return [10, 15, 20, 30, 60].includes(minutes) ? minutes : 30;
}

/** The minute each row starts at, from `startHour` up to but not including `endHour`. */
export function rowStarts(startHour: number, endHour: number, slotMinutes: number): number[] {
  const from = Math.min(23, Math.max(0, Math.floor(startHour)));
  const to = Math.min(24, Math.max(from + 1, Math.floor(endHour)));
  const rows: number[] = [];
  for (let minutes = from * 60; minutes < to * 60; minutes += slotMinutes) rows.push(minutes);
  return rows;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let found = formatters.get(key);
  if (!found) {
    try {
      found = new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" });
    } catch {
      found = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
    }
    formatters.set(key, found);
  }
  return found;
}

/**
 * A time of day in the locale: "09:00" by default, "9:00 AM" with `hour12`.
 * The end of the day is "24:00", not "00:00", so the last slot reads right.
 * Intl writes some spaces as narrow no-break spaces, and the version of its
 * data decides which, so every space is made a plain one.
 */
export function formatTime(minutes: number, locale: string, hour12: boolean): string {
  if (minutes >= 1440 && !hour12) return "24:00";
  const at = Date.UTC(2024, 0, 1, Math.floor(minutes / 60) % 24, minutes % 60);
  const options: Intl.DateTimeFormatOptions = hour12 ? { hour: "numeric", minute: "2-digit", hour12: true } : { hour: "2-digit", minute: "2-digit", hourCycle: "h23" };
  return formatter(locale, options).format(at).replace(/\s/g, " ");
}

/** The names of the seven days, from Sunday, in full and short, as the locale writes them. January 7, 2024 was a Sunday. */
export function dayNames(locale: string): { long: string[]; short: string[] } {
  const name = (day: number, weekday: "long" | "short") => formatter(locale, { weekday }).format(Date.UTC(2024, 0, 7 + day));
  return { long: Array.from({ length: 7 }, (_, day) => name(day, "long")), short: Array.from({ length: 7 }, (_, day) => name(day, "short")) };
}

/** Every key in the rectangle between two cells, whichever corner each is. */
export function rectKeys(order: readonly number[], rows: readonly number[], a: Cell, b: Cell): string[] {
  const keys: string[] = [];
  for (let col = Math.min(a.col, b.col); col <= Math.max(a.col, b.col); col++) {
    for (let row = Math.min(a.row, b.row); row <= Math.max(a.row, b.row); row++) {
      const day = order[col];
      const start = rows[row];
      if (day !== undefined && start !== undefined) keys.push(slotKey(day, start));
    }
  }
  return keys;
}

/** What is chosen, as ranges of minutes per day, for the days shown, in the order shown. Slots that run on from one another are one range. */
export function rangesByDay(selected: ReadonlySet<string>, order: readonly number[], rows: readonly number[], slotMinutes: number): { day: number; ranges: [number, number][] }[] {
  const result: { day: number; ranges: [number, number][] }[] = [];
  for (const day of order) {
    const ranges: [number, number][] = [];
    for (const start of rows) {
      if (!selected.has(slotKey(day, start))) continue;
      const last = ranges[ranges.length - 1];
      if (last && last[1] === start) last[1] = start + slotMinutes;
      else ranges.push([start, start + slotMinutes]);
    }
    if (ranges.length) result.push({ day, ranges });
  }
  return result;
}

/** A list written as the locale writes one: "A, B and C". */
export function listOf(items: readonly string[], locale: string): string {
  return new Intl.ListFormat(locale, { type: "conjunction", style: "long" }).format(items);
}

/**
 * The days of a group as a phrase: runs of three or more days next to each
 * other are "Monday to Friday", shorter runs are named one by one, and every
 * day of the week is "Every day". `order` says which days are next to each
 * other, so a week that starts on Sunday reads right.
 */
export function describeDays(days: readonly number[], order: readonly number[], names: readonly string[], locale: string, text: Words): string {
  if (days.length === 7) return text.everyDay;
  const places = days.map((day) => order.indexOf(day)).sort((a, b) => a - b);
  const items: string[] = [];
  let i = 0;
  while (i < places.length) {
    let j = i;
    while (j + 1 < places.length && (places[j + 1] ?? 0) === (places[j] ?? 0) + 1) j++;
    const first = names[order[places[i] ?? 0] ?? 0] ?? "";
    const last = names[order[places[j] ?? 0] ?? 0] ?? "";
    if (j - i >= 2) items.push(fill(text.range, { from: first, to: last }));
    else for (let k = i; k <= j; k++) items.push(names[order[places[k] ?? 0] ?? 0] ?? "");
    i = j + 1;
  }
  return listOf(items, locale);
}

/** The time ranges of a day as a phrase: "09:00 to 12:30 and 13:30 to 17:00". */
export function describeTimes(ranges: readonly [number, number][], locale: string, hour12: boolean, text: Words): string {
  return listOf(
    ranges.map(([from, to]) => fill(text.range, { from: formatTime(from, locale, hour12), to: formatTime(to, locale, hour12) })),
    locale,
  );
}

/**
 * What is chosen as lines of text, one per group of days that share the same
 * hours: "Monday to Friday, 09:00 to 17:00" and "Saturday, 10:00 to 14:00".
 */
export function summaryLines(selected: ReadonlySet<string>, order: readonly number[], rows: readonly number[], slotMinutes: number, locale: string, hour12: boolean, text: Words): { days: string; times: string }[] {
  const names = dayNames(locale).long;
  const groups = new Map<string, { days: number[]; ranges: [number, number][] }>();
  for (const { day, ranges } of rangesByDay(selected, order, rows, slotMinutes)) {
    const signature = ranges.map((range) => range.join("-")).join(",");
    const group = groups.get(signature);
    if (group) group.days.push(day);
    else groups.set(signature, { days: [day], ranges });
  }
  return [...groups.values()].map((group) => ({ days: describeDays(group.days, order, names, locale, text), times: describeTimes(group.ranges, locale, hour12, text) }));
}

/** How many hours the slots make: 75 slots of 30 minutes are 37.5 hours. */
export function hoursOf(count: number, slotMinutes: number): number {
  return (count * slotMinutes) / 60;
}

/** The whole of a range of cells as words: "Tuesday 09:00 to 09:30", "Tuesday, 09:00 to 11:00", "Monday to Wednesday, 09:00 to 11:00". */
export function describeRect(order: readonly number[], rows: readonly number[], slotMinutes: number, a: Cell, b: Cell, locale: string, hour12: boolean, text: Words): string {
  const names = dayNames(locale).long;
  const first = Math.min(a.col, b.col);
  const last = Math.max(a.col, b.col);
  const from = rows[Math.min(a.row, b.row)] ?? 0;
  const to = (rows[Math.max(a.row, b.row)] ?? 0) + slotMinutes;
  const times = fill(text.range, { from: formatTime(from, locale, hour12), to: formatTime(to, locale, hour12) });
  const days = first === last ? names[order[first] ?? 0] ?? "" : fill(text.range, { from: names[order[first] ?? 0] ?? "", to: names[order[last] ?? 0] ?? "" });
  return first === last && a.row === b.row ? `${days} ${times}` : `${days}, ${times}`;
}
