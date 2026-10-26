/** The words the field says, in its messages and to a screen reader. Each can be replaced, for another language or your own voice. */
export interface TimeRangeLabels {
  /** The name of the whole group when you give none of your own. */
  group: string;
  /** The name of the start input. */
  start: string;
  /** The name of the end input. */
  end: string;
  /** The name of the button that opens the list of start times. */
  pickStart: string;
  /** The name of the button that opens the list of end times. */
  pickEnd: string;
  /** What is written after the length when the end falls on the next day, in the field and in the list of end times. */
  nextDay: string;
  /** The length of the range, as it is written next to the field: "2 h 30 min". */
  duration: (minutes: number) => string;
  /** The same length as it is said: "2 hours 30 minutes". */
  spokenDuration: (minutes: number) => string;
  /** What a screen reader hears once a range is complete and allowed. */
  spoken: (start: string, end: string, minutes: number, overnight: boolean) => string;
  /** A text that is not a time. `example` is one that is. */
  notATime: (example: string) => string;
  /** A time outside the allowed hours. */
  outside: (min: string, max: string) => string;
  /** An end that is not after the start. */
  endBeforeStart: (start: string) => string;
  /** Start and end are one moment. */
  sameTime: string;
  /** Said when `keepDuration` moved the end along with the start. */
  moved: (end: string, duration: string) => string;
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** "2 h 30 min", "45 min", "3 h". */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours ? `${hours} h` : "", rest || !hours ? `${rest} min` : ""].filter(Boolean).join(" ");
}

export const DEFAULT_LABELS: TimeRangeLabels = {
  group: "Time range",
  start: "Start time",
  end: "End time",
  pickStart: "Choose a start time from the list",
  pickEnd: "Choose an end time from the list",
  nextDay: "+1 day",
  duration: formatDuration,
  spokenDuration: (minutes) => {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return [hours ? plural(hours, "hour") : "", rest || !hours ? plural(rest, "minute") : ""].filter(Boolean).join(" ");
  },
  spoken: (start, end, minutes, overnight) => `From ${start} to ${end}${overnight ? " the next day" : ""}, ${DEFAULT_LABELS.spokenDuration(minutes)}.`,
  notATime: (example) => `Enter a time, like ${example}.`,
  outside: (min, max) => `Choose a time between ${min} and ${max}.`,
  endBeforeStart: (start) => `The end must be after the start at ${start}.`,
  sameTime: "The start and the end are the same time.",
  moved: (end, duration) => `The end moved to ${end} to keep ${duration}.`,
};

const DAY = 1440;
const pad = (value: number) => String(value).padStart(2, "0");

/** "09:30" as minutes since midnight. A string that is not a time gives 0. */
export function toMinutes(time: string): number {
  const [hours = "0", minutes = "0"] = time.split(":");
  return (Number(hours) || 0) * 60 + (Number(minutes) || 0);
}

/** Minutes since midnight as "09:30". A number past midnight wraps round to the next day. */
export function toTime(minutes: number): string {
  const wrapped = ((Math.round(minutes) % DAY) + DAY) % DAY;
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
}

/**
 * What a person types as a time, as "HH:MM", or null when it is not one.
 * "9", "930", "0930", "9:30", "9.30", "9h30", "14:05", "2:30 pm" and "9am" are
 * all understood; with am or pm the hour runs from 1 to 12.
 */
export function parseTime(raw: string): string | null {
  const text = raw.trim().toLowerCase().replace(/\s+/g, "");
  const suffix = "(?:([ap])\\.?(?:m\\.?)?)?$";
  let hours: number;
  let minutes: number;
  let period: string | undefined;
  const bare = new RegExp(`^(\\d{1,4})${suffix}`).exec(text);
  const split = new RegExp(`^(\\d{1,2})[:.h](\\d{1,2})${suffix}`).exec(text);
  if (bare?.[1]) {
    // Digits only: "9" and "09" are an hour, "930" is nine-thirty, "0930" and "1430" are four digits.
    const digits = bare[1];
    hours = Number(digits.length <= 2 ? digits : digits.slice(0, digits.length - 2));
    minutes = digits.length <= 2 ? 0 : Number(digits.slice(-2));
    period = bare[2];
  } else if (split?.[1] && split[2]) {
    hours = Number(split[1]);
    minutes = Number(split[2]);
    period = split[3];
  } else return null;
  if (period) {
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (period === "p" ? 12 : 0);
  }
  if (hours > 23 || minutes > 59) return null;
  return `${pad(hours)}:${pad(minutes)}`;
}

/** Every `step` minutes from `min` to `max`, both as "HH:MM", the way the Time picker lists them. */
export function buildSlots(min: string, max: string, step: number): string[] {
  const slots: string[] = [];
  const size = Math.max(1, Math.round(step));
  for (let at = toMinutes(min); at <= toMinutes(max); at += size) slots.push(toTime(at));
  return slots;
}

/** The time one step up or down from `time`, on the grid of `step` minutes, kept between `min` and `max`. From nothing, up gives the first slot and down the last. */
export function stepTime(time: string | null, direction: 1 | -1, step: number, min: string, max: string): string {
  const low = toMinutes(min);
  const high = toMinutes(max);
  if (time === null) return toTime(direction === 1 ? low : high);
  const at = toMinutes(time);
  const size = Math.max(1, Math.round(step));
  const next = direction === 1 ? (Math.floor(at / size) + 1) * size : (Math.ceil(at / size) - 1) * size;
  return toTime(Math.min(high, Math.max(low, next)));
}

export interface RangeRules {
  min: string;
  max: string;
  allowOvernight: boolean;
}

/** What is wrong with a range, and in which of the two fields it shows. */
export type RangeProblem = { field: "start" | "end"; kind: "outside" } | { field: "end"; kind: "order" | "same" };

export interface RangeCheck {
  /** The length in minutes, or null while the range is incomplete or not allowed. */
  minutes: number | null;
  /** The end falls on the next day. */
  overnight: boolean;
  problem: RangeProblem | null;
}

/** Whether two times make a range, and how long it is. The end may be on the next day only when `allowOvernight` is set. */
export function checkRange(start: string | null, end: string | null, rules: RangeRules): RangeCheck {
  const outside = (time: string | null) => time !== null && (toMinutes(time) < toMinutes(rules.min) || toMinutes(time) > toMinutes(rules.max));
  if (outside(start)) return { minutes: null, overnight: false, problem: { field: "start", kind: "outside" } };
  if (outside(end)) return { minutes: null, overnight: false, problem: { field: "end", kind: "outside" } };
  if (start === null || end === null) return { minutes: null, overnight: false, problem: null };
  const from = toMinutes(start);
  const to = toMinutes(end);
  if (to === from) return { minutes: null, overnight: false, problem: { field: "end", kind: "same" } };
  if (to < from) return rules.allowOvernight ? { minutes: to + DAY - from, overnight: true, problem: null } : { minutes: null, overnight: false, problem: { field: "end", kind: "order" } };
  return { minutes: to - from, overnight: false, problem: null };
}

/** A start, an end and the time between them. */
export interface TimeRangeValue {
  /** "HH:MM" on the 24-hour clock. */
  start: string;
  /** "HH:MM". With `allowOvernight` it may be earlier than the start, and then it is on the next day. */
  end: string;
  /** The length in minutes. An overnight range counts the night. */
  minutes: number;
}

/** The range two times make, or null while they do not make an allowed one, and whether it runs past midnight. */
export function rangeOf(start: string | null, end: string | null, rules: RangeRules): { value: TimeRangeValue | null; overnight: boolean } {
  const check = checkRange(start, end, rules);
  return { value: check.minutes !== null && start !== null && end !== null ? { start, end, minutes: check.minutes } : null, overnight: check.overnight };
}

/**
 * The end that keeps the length of the range when the start moves, the way a
 * calendar does. Without `allowOvernight` the end stops at `max`; the range
 * then gets shorter, or empty when the start has nowhere left to go.
 */
export function endKeepingLength(oldStart: string, oldEnd: string, newStart: string, rules: RangeRules): string {
  const old = checkRange(oldStart, oldEnd, rules);
  if (old.minutes === null) return oldEnd;
  const wanted = toMinutes(newStart) + old.minutes;
  if (rules.allowOvernight) return toTime(wanted);
  return toTime(Math.min(wanted, toMinutes(rules.max)));
}
