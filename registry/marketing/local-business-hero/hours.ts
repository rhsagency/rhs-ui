import type { OpeningDay } from "@rhs-ui/primitives/opening-hours";

export type { OpeningDay };

export interface LocalBusinessLabels {
  /** Open, with the closing time: "Open now, closes {time}". */
  open: string;
  /** Open, in the last hour before closing: "Closing soon, at {time}". */
  closingSoon: string;
  /** Open around the clock, so there is no closing time to give. */
  always: string;
  /** Closed, and opening later today: "Closed now, opens {time}". */
  opensToday: string;
  /** Closed, and opening tomorrow: "Closed now, opens tomorrow {time}". */
  opensTomorrow: string;
  /** Closed, and opening on another day: "Closed now, opens {day} {time}". The day is the name you gave it in `hours`. */
  opensLater: string;
  /** Closed, and nothing opens in the week. */
  closed: string;
  /** A day without opening times, in today's line and in the week's list. */
  closedDay: string;
  /** The word before today's hours in the card, and the mark read after today's name in the week. */
  today: string;
  /** The call button: "Call {phone}". */
  call: string;
  /** The directions button. */
  directions: string;
  /** The summary of the folded week. */
  week: string;
  /** Read before the address by a screen reader. */
  address: string;
}

export const LABELS: LocalBusinessLabels = {
  open: "Open now, closes {time}",
  closingSoon: "Closing soon, at {time}",
  always: "Open around the clock",
  opensToday: "Closed now, opens {time}",
  opensTomorrow: "Closed now, opens tomorrow {time}",
  opensLater: "Closed now, opens {day} {time}",
  closed: "Closed",
  closedDay: "Closed",
  today: "Today",
  call: "Call {phone}",
  directions: "Get directions",
  week: "Opening hours this week",
  address: "Address",
};

/** Fills the `{name}` holes of a label. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

/** Where the business's clock stands: the day (an index into `hours`) and the minutes since midnight. */
export interface Clock {
  today: number;
  minutes: number;
}

export type BusinessStatus =
  | { state: "open"; closesAt?: string; soon: boolean }
  | { state: "closed"; opens?: { when: "today" | "tomorrow" | "later"; day: string; time: string } };

const DAY = 1440;
const WEEK = 7 * DAY;
const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const formatters = new Map<string, Intl.DateTimeFormat>();

/** Any way a moment is handed in, as milliseconds; undefined when it is not a date at all. */
export function toTimestamp(value: Date | string | number | undefined): number | undefined {
  if (value === undefined) return undefined;
  const time = value instanceof Date ? value.getTime() : typeof value === "number" ? value : Date.parse(value);
  return Number.isNaN(time) ? undefined : time;
}

/**
 * What the wall clock in the business's own time zone says at that moment.
 * The names of the day are only read back as parts here, in a fixed locale,
 * never shown. A time zone the browser does not know gives null, and the
 * block then says nothing about the status rather than guess.
 */
export function zonedClock(at: number, timeZone: string, weekStartsOn: 0 | 1 = 1): Clock | null {
  try {
    let format = formatters.get(timeZone);
    if (!format) {
      format = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
      formatters.set(timeZone, format);
    }
    const parts = format.formatToParts(new Date(at));
    const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
    const weekday = WEEKDAYS[part("weekday")];
    const hour = Number(part("hour")) % 24;
    const minute = Number(part("minute"));
    if (weekday === undefined || Number.isNaN(hour) || Number.isNaN(minute)) return null;
    return { today: (weekday - weekStartsOn + 7) % 7, minutes: hour * 60 + minute };
  } catch {
    return null;
  }
}

const RANGE = /(\d{1,2})[:.](\d{2})\s*(?:to|until|till|tot|-|–|—)\s*(\d{1,2})[:.](\d{2})/gi;

/**
 * One day's opening text as ranges of minutes: [] for a closed day, and
 * undefined for text with no times in it ("By appointment"), which nothing
 * can be worked out from.
 */
export function parseDay(hours: string | null): readonly (readonly [number, number])[] | undefined {
  if (hours === null || /^\s*closed\s*$/i.test(hours)) return [];
  const ranges: (readonly [number, number])[] = [];
  for (const match of hours.matchAll(RANGE)) {
    const [from, to] = [Number(match[1]) * 60 + Number(match[2]), Number(match[3]) * 60 + Number(match[4])];
    if (Number(match[2]) < 60 && Number(match[4]) < 60 && from <= DAY && to <= DAY) ranges.push([from, to]);
  }
  return ranges.length ? ranges : undefined;
}

/**
 * Can this week ever give a status? It takes seven days, a time zone the
 * runtime knows and hours it can read: at least one day with times in it, or
 * a week where every day is plainly closed. The server asks this while
 * rendering, so a week that never will (12-hour times, six days, a misspelt
 * zone) leaves no empty pill and no blank band behind it. A single day it
 * cannot read ("By appointment") only hides the pill on that day.
 */
export function canTellStatus(days: readonly OpeningDay[], timeZone: string): boolean {
  if (days.length !== 7 || zonedClock(0, timeZone) === null) return false;
  const parsed = days.map((day) => parseDay(day.hours));
  return parsed.some((ranges) => ranges?.length) || parsed.every((ranges) => ranges !== undefined);
}

/** 18:00 for 1080. An end that falls exactly on midnight reads 24:00, a start there reads 00:00. */
function clockText(minutes: number, closing = false): string {
  const whole = closing && minutes > 0 && minutes % DAY === 0 ? DAY : minutes % DAY;
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}

/**
 * Is the business open at this moment, and if not, when does it open next?
 * The week has to be seven days; a night that runs past midnight carries
 * into the next day, back-to-back days are one long opening, and a day
 * whose text holds no times makes today's answer unknown (null).
 */
export function statusAt(days: readonly OpeningDay[], clock: Clock): BusinessStatus | null {
  if (days.length !== 7) return null;
  const parsed = days.map((day) => parseDay(day.hours));
  if (parsed[clock.today] === undefined) return null;
  const now = clock.today * DAY + clock.minutes;

  const week: { start: number; end: number }[] = [];
  parsed.forEach((ranges, day) => {
    for (const [from, to] of ranges ?? []) week.push({ start: day * DAY + from, end: day * DAY + (to > from ? to : to + DAY) });
  });
  // The week is laid out three times so an opening that crosses either end of it joins the one beside it.
  const spans = [-WEEK, 0, WEEK].flatMap((shift) => week.map((span) => ({ start: span.start + shift, end: span.end + shift }))).sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [];
  for (const span of spans) {
    const last = merged[merged.length - 1];
    if (last && span.start <= last.end) last.end = Math.max(last.end, span.end);
    else merged.push({ ...span });
  }

  const current = merged.find((span) => span.start <= now && now < span.end);
  if (current) {
    if (current.end - current.start > WEEK) return { state: "open", soon: false };
    return { state: "open", closesAt: clockText(current.end, true), soon: current.end - now <= 60 };
  }
  const next = merged.find((span) => span.start > now);
  if (!next) return { state: "closed" };
  const absolute = Math.floor(next.start / DAY);
  const offset = absolute - clock.today;
  return {
    state: "closed",
    opens: { when: offset === 0 ? "today" : offset === 1 ? "tomorrow" : "later", day: days[((absolute % 7) + 7) % 7]?.day ?? "", time: clockText(next.start) },
  };
}

/** The status as a sentence, from your labels. */
export function describeStatus(status: BusinessStatus, labels: LocalBusinessLabels): string {
  if (status.state === "open") return status.closesAt ? fill(status.soon ? labels.closingSoon : labels.open, { time: status.closesAt }) : labels.always;
  if (!status.opens) return labels.closed;
  const { when, day, time } = status.opens;
  return fill(when === "today" ? labels.opensToday : when === "tomorrow" ? labels.opensTomorrow : labels.opensLater, { day, time });
}
