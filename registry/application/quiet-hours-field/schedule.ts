/** The quiet hours a person sets: a switch, two times and the days a quiet period starts on. */
export interface QuietHoursValue {
  /** Whether the schedule is in force. Switching it off keeps everything else, so switching it on again restores the schedule. */
  enabled: boolean;
  /** Where quiet starts, "HH:MM" in 24-hour time. */
  from: string;
  /** Where quiet ends, "HH:MM". Earlier than `from` means the period runs past midnight into the next day. */
  to: string;
  /** The days a quiet period starts on, as `getDay()` numbers: 0 is Sunday, 1 is Monday, up to 6 for Saturday. */
  days: readonly number[];
}

/** The words the field says, for translation. In a sentence, `{from}` and `{to}` stand for the times and `{days}` for the days. */
export interface QuietHoursLabels {
  /** The label of the switch. Default "Quiet hours". */
  title?: string;
  /** The line under it. Default "Mute notifications on a schedule." */
  description?: string;
  /** Above the first time. Default "From". */
  from?: string;
  /** Above the second time. Default "To". */
  to?: string;
  /** The legend of the days. Default "On these days". */
  days?: string;
  /** Beside the moon when the period crosses midnight; `{to}` is the end. Default "Overnight: ends at {to} the next day". */
  overnight?: string;
  /** The summary while the switch is on. Default "Quiet from {from} to {to}, {days}". */
  summaryOn?: string;
  /** The summary while the switch is off. Default "Quiet hours are off. Your schedule is kept: {from} to {to}, {days}." */
  summaryOff?: string;
  /** Said when both times are the same. Default "From and To cannot be the same time. Pick another end." */
  sameTime?: string;
  /** Said when the last day would be turned off. Default "Keep at least one day selected." */
  oneDay?: string;
  /** The days sentence for all seven. Default "every day". */
  everyDay?: string;
  /** The days sentence for Saturday and Sunday. Default "weekends". */
  weekends?: string;
  /** Between the first and the last day of three or more in a row ("Monday to Friday"). Default "to". */
  through?: string;
  /** The days sentence for none. Default "no days". */
  noDays?: string;
}

export const DEFAULT_LABELS = {
  title: "Quiet hours",
  description: "Mute notifications on a schedule.",
  from: "From",
  to: "To",
  days: "On these days",
  overnight: "Overnight: ends at {to} the next day",
  summaryOn: "Quiet from {from} to {to}, {days}",
  summaryOff: "Quiet hours are off. Your schedule is kept: {from} to {to}, {days}.",
  sameTime: "From and To cannot be the same time. Pick another end.",
  oneDay: "Keep at least one day selected.",
  everyDay: "every day",
  weekends: "weekends",
  through: "to",
  noDays: "no days",
} satisfies Required<QuietHoursLabels>;

export type Words = Required<QuietHoursLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => values[key] ?? mark);
}

/** Monday first, the order a sentence about days is written in whichever day the row of chips starts on. */
const READING_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

/** The names of the seven days, from fixed dates in UTC so the server and the browser agree. Indexed by `getDay()`. */
export function dayNames(locale: string): { long: readonly string[]; short: readonly string[] } {
  const sunday = Date.UTC(2024, 0, 7);
  const names = (weekday: "long" | "short") => {
    const format = new Intl.DateTimeFormat(locale, { weekday, timeZone: "UTC" });
    return Array.from({ length: 7 }, (_, day) => format.format(new Date(sunday + day * 86_400_000)));
  };
  return { long: names("long"), short: names("short") };
}

/** The seven days in the order of the row: the first is `weekStartsOn`, the rest follow. */
export function weekOrder(weekStartsOn: number): number[] {
  return Array.from({ length: 7 }, (_, index) => (weekStartsOn + index) % 7);
}

/**
 * The days as words: "Monday to Friday", "every day", "weekends", "Tuesday and
 * Thursday". Three or more in a row are written as the first and the last.
 */
export function describeDays(days: readonly number[], locale: string, words: Words): string {
  const chosen = new Set(days);
  if (chosen.size === 0) return words.noDays;
  if (chosen.size === 7) return words.everyDay;
  if (chosen.size === 2 && chosen.has(0) && chosen.has(6)) return words.weekends;
  const names = dayNames(locale).long;
  const parts: string[] = [];
  let run: number[] = [];
  const flush = () => {
    if (run.length >= 3) parts.push(`${names[run[0]!]} ${words.through} ${names[run[run.length - 1]!]}`);
    else for (const day of run) parts.push(names[day]!);
    run = [];
  };
  for (const day of READING_ORDER) {
    if (chosen.has(day)) run.push(day);
    else flush();
  }
  flush();
  return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(parts);
}

/** Whether a period from `from` to `to` runs past midnight. Both are "HH:MM", so text order is time order. */
export const isOvernight = (from: string, to: string): boolean => to < from;

/** Minutes since midnight for "HH:MM", or NaN for anything else. */
export function toMinutes(time: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : Number.NaN;
}

/**
 * The stretches of the 24 hours a period covers, as [start, end] in minutes.
 * One for a daytime period, two for one that crosses midnight: the evening
 * up to 24:00 and the morning from 00:00.
 */
export function stretches(from: string, to: string): [number, number][] {
  const start = toMinutes(from);
  const end = toMinutes(to);
  if (Number.isNaN(start) || Number.isNaN(end) || start === end) return [];
  return start < end ? [[start, end]] : [[start, 1440], [0, end]];
}
