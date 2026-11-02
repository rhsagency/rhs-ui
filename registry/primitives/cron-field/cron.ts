/**
 * Everything the Cron field knows, as plain functions with no React and no
 * library: read a five-field cron expression, say in words what it does, and
 * work out when it runs next in a given time zone. A server can use them too,
 * to check an expression before it is stored.
 *
 * The grammar is the one every cron has: `*`, numbers, lists (`1,15`), ranges
 * (`1-5`), steps (`*` + `/15`, `10-40/10`) and, in the month and weekday fields,
 * names (`JAN`, `MON`). `@hourly`, `@daily`, `@weekly`, `@monthly` and `@yearly`
 * are accepted too. As in Vixie cron, a day of the month and a day of the week
 * that are both restricted match when either one does.
 */

export type CronFieldName = "minute" | "hour" | "dayOfMonth" | "month" | "dayOfWeek";

export interface CronFieldSpec {
  name: CronFieldName;
  /** How the field is named at the start of a sentence: "Day of month". */
  title: string;
  /** The short name under the field in the map: "day". */
  label: string;
  /** The smallest value. */
  min: number;
  /** The largest value that is accepted: 7 for the weekday, where 7 is Sunday as well as 0. */
  max: number;
  /** The largest value that is a day of its own: 6 for the weekday. */
  last: number;
  /** The names that stand for numbers, from `min` up. */
  names?: readonly string[];
  /** What a value out of range is told: "Minute must be 0 to 59". */
  range: string;
  /** What a value that cannot be read is told to write instead. */
  hint: string;
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
const HINT = "Use a number, a list (1,15), a range (1-5) or a step (*/15).";

/** The five fields in the order they are written. */
export const CRON_FIELDS: readonly CronFieldSpec[] = [
  { name: "minute", title: "Minute", label: "minute", min: 0, max: 59, last: 59, range: "Minute must be 0 to 59", hint: HINT },
  { name: "hour", title: "Hour", label: "hour", min: 0, max: 23, last: 23, range: "Hour must be 0 to 23", hint: HINT },
  { name: "dayOfMonth", title: "Day of month", label: "day", min: 1, max: 31, last: 31, range: "Day of month must be 1 to 31", hint: HINT },
  { name: "month", title: "Month", label: "month", min: 1, max: 12, last: 12, names: MONTHS, range: "Month must be 1 to 12 or JAN to DEC", hint: `${HINT} Names such as JAN work too.` },
  { name: "dayOfWeek", title: "Day of week", label: "weekday", min: 0, max: 7, last: 6, names: WEEKDAYS, range: "Day of week must be 0 to 6 or SUN to SAT", hint: `${HINT} Names such as MON work too.` },
];

const MACROS: Readonly<Record<string, string>> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

/** A cron expression that was read: every field as a sorted list of the values it allows. */
export interface CronSchedule {
  minutes: readonly number[];
  hours: readonly number[];
  daysOfMonth: readonly number[];
  months: readonly number[];
  /** 0 is Sunday; a 7 in the expression is already 0 here. */
  daysOfWeek: readonly number[];
  /** The five fields as they were written. */
  fields: readonly string[];
  /** The day of the month field begins with `*`: it allows every day, so the weekday decides. */
  domStar: boolean;
  /** The day of the week field begins with `*`. */
  dowStar: boolean;
}

/** One word of the expression: which field it is, and what is wrong with it, if anything. */
export interface CronToken {
  /** The text as typed. */
  text: string;
  /** The field it belongs to, or null for a word past the fifth. */
  field: CronFieldName | null;
  /** What is wrong with it, in words, or null. */
  error: string | null;
}

export interface CronParse {
  /** The expression is complete and every field is right. */
  ok: boolean;
  /** What is wrong, in the order of the fields, or null: nothing typed, the wrong number of fields, or a field. */
  problem: "empty" | "count" | "field" | "shortcut" | null;
  /** The first problem in words, or null. */
  error: string | null;
  /** How many words the expression has (a shortcut counts as the five it stands for). */
  count: number;
  /** Every word, with its own error; they let a field show which part is wrong. */
  tokens: readonly CronToken[];
  /** The schedule, once the expression is ok. */
  schedule: CronSchedule | null;
}

const NUMBER = /^\d+$/;
const clip = (text: string) => (text.length > 14 ? `${text.slice(0, 14)}…` : text);

type Read<T> = { ok: true; value: T } | { ok: false; error: string };

function readValue(token: string, spec: CronFieldSpec): Read<number> {
  if (NUMBER.test(token)) {
    const value = Number(token);
    return value < spec.min || value > spec.max ? { ok: false, error: spec.range } : { ok: true, value };
  }
  const named = spec.names?.indexOf(token.toUpperCase()) ?? -1;
  if (named >= 0) return { ok: true, value: spec.min + named };
  return { ok: false, error: `${spec.title} can't read "${clip(token)}". ${spec.hint}` };
}

function readTerm(term: string, spec: CronFieldSpec): Read<number[]> {
  const unreadable = { ok: false, error: `${spec.title} can't read "${clip(term)}". ${spec.hint}` } as const;
  if (term === "") return { ok: false, error: `${spec.title} has an empty part. Remove the extra comma.` };
  const pieces = term.split("/");
  if (pieces.length > 2) return unreadable;
  const [rangeText = "", stepText] = pieces;
  let step = 1;
  if (stepText !== undefined) {
    if (!NUMBER.test(stepText)) return unreadable;
    step = Number(stepText);
    if (step < 1 || step > spec.last) return { ok: false, error: `${spec.title} step must be 1 to ${spec.last}` };
  }
  let from: number;
  let to: number;
  if (rangeText === "*" || (rangeText === "?" && spec.name.startsWith("dayOf"))) {
    from = spec.min;
    to = spec.last;
  } else if (rangeText.includes("-")) {
    const ends = rangeText.split("-");
    if (ends.length !== 2) return unreadable;
    const a = readValue(ends[0] ?? "", spec);
    if (!a.ok) return a;
    const b = readValue(ends[1] ?? "", spec);
    if (!b.ok) return b;
    if (b.value < a.value) return { ok: false, error: `${spec.title} range ${clip(rangeText)} runs backwards. Put the smaller one first.` };
    from = a.value;
    to = b.value;
  } else {
    const a = readValue(rangeText, spec);
    if (!a.ok) return a;
    from = a.value;
    // "5/15" means from 5 on, every 15; a bare 5 is only 5.
    to = stepText === undefined ? a.value : spec.last;
  }
  const values: number[] = [];
  for (let value = from; value <= to; value += step) values.push(spec.name === "dayOfWeek" && value === 7 ? 0 : value);
  return { ok: true, value: values };
}

function readField(text: string, spec: CronFieldSpec): Read<number[]> {
  const all = new Set<number>();
  for (const term of text.split(",")) {
    const read = readTerm(term, spec);
    if (!read.ok) return read;
    for (const value of read.value) all.add(value);
  }
  return { ok: true, value: [...all].sort((a, b) => a - b) };
}

const NAMES_OF_FIELDS = "minute, hour, day of month, month and day of week";

/**
 * Reads an expression. It never throws: a half-typed expression comes back
 * with the words that are already wrong marked, so a field can show them while
 * the rest is still being typed.
 */
export function parseCron(expression: string): CronParse {
  let text = expression.trim();
  if (text === "") {
    return { ok: false, problem: "empty", error: "Type a cron expression, such as 0 9 * * 1-5.", count: 0, tokens: [], schedule: null };
  }
  if (text.startsWith("@")) {
    const expanded = MACROS[text.toLowerCase()];
    if (!expanded) {
      return { ok: false, problem: "shortcut", error: `"${clip(text)}" is not a cron shortcut. Use @hourly, @daily, @weekly, @monthly or @yearly.`, count: 1, tokens: [{ text, field: null, error: "Not a shortcut" }], schedule: null };
    }
    text = expanded;
  }
  const words = text.split(/\s+/);
  const lists: number[][] = [];
  const tokens: CronToken[] = words.map((word, index) => {
    const spec = CRON_FIELDS[index];
    if (!spec) return { text: word, field: null, error: "Past the fifth field" };
    const read = readField(word, spec);
    if (read.ok) lists[index] = read.value;
    return { text: word, field: spec.name, error: read.ok ? null : read.error };
  });
  const broken = tokens.find((token) => token.error !== null && token.field !== null);
  if (broken) return { ok: false, problem: "field", error: broken.error, count: words.length, tokens, schedule: null };
  if (words.length !== 5) {
    const found = words.length === 1 ? "one" : String(words.length);
    const extra = words.length === 6 ? " A sixth field is usually seconds, which this format does not have." : "";
    return { ok: false, problem: "count", error: `A cron expression has five fields: ${NAMES_OF_FIELDS}. This one has ${found}.${extra}`, count: words.length, tokens, schedule: null };
  }
  const [minutes, hours, daysOfMonth, months, daysOfWeek] = lists as [number[], number[], number[], number[], number[]];
  return {
    ok: true,
    problem: null,
    error: null,
    count: 5,
    tokens,
    schedule: { minutes, hours, daysOfMonth, months, daysOfWeek, fields: words, domStar: /^[*?]/.test(words[2] ?? ""), dowStar: /^[*?]/.test(words[4] ?? "") },
  };
}

/** True when the expression is complete and right. A server can call this before it stores one. */
export function isCron(expression: string): boolean {
  return parseCron(expression).ok;
}

/* ------------------------------------------------------------------ */
/* In words                                                            */
/* ------------------------------------------------------------------ */

const ordinal = (n: number) => {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
};
const counted = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
/** Whether the values run one after the other: 3, 4, 5. */
const isRun = (values: readonly number[]) => values.length > 1 && values.every((value, index) => index === 0 || value === (values[index - 1] ?? 0) + 1);

type Shape = { kind: "any" | "single" | "range" | "list" } | { kind: "step"; step: number; start: number };

/**
 * The shape a field has. A step counts as one only where it really is
 * "every n": the gaps between the runs are all n, also across the turn of the
 * hour or the day, so `*` + `/45` in the minute field (at :00 and :45) stays a list.
 */
function shapeOf(values: readonly number[], text: string, spec: CronFieldSpec): Shape {
  const total = spec.last - spec.min + 1;
  if (values.length === total) return { kind: "any" };
  if (values.length === 1) return { kind: "single" };
  const step = /^(?:\*|\d+(?:-\d+)?)\/(\d+)$/.exec(text)?.[1];
  const first = values[0] ?? spec.min;
  const lastValue = values[values.length - 1] ?? first;
  if (step !== undefined && Number(step) > 1) {
    const n = Number(step);
    const even = values.every((value, index) => index === 0 || value - (values[index - 1] ?? 0) === n);
    // Minutes and hours go round, so the gap from the last run to the first of the next round has to be n as well. A day of the month does not go round: it only has to run on to the end of the month.
    const wraps = spec.name === "dayOfMonth" ? lastValue + n > spec.last : first + total - lastValue === n;
    if (even && wraps) return { kind: "step", step: n, start: first };
  }
  return isRun(values) ? { kind: "range" } : { kind: "list" };
}

/**
 * A locale tag the runtime can use. `en_US`, the usual typo, is read as
 * `en-US`, and anything that is not a language tag (or is empty) becomes
 * `en-US`, so a wrong prop never stops a page from rendering.
 */
export function safeLocale(locale: string | undefined): string {
  try {
    return Intl.getCanonicalLocales((locale ?? "").replace(/_/g, "-"))[0] ?? "en-US";
  } catch {
    return "en-US";
  }
}

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;

/**
 * How a clock time is written in a sentence: `09:00` on a 24-hour clock and
 * `9:00 AM` on a 12-hour one, whichever the locale uses. Only that choice follows
 * the locale. The figures stay Latin, so a sentence never mixes scripts.
 */
export function clockWriter(locale: string): (hour: number, minute: number) => string {
  const cycle = new Intl.DateTimeFormat(safeLocale(locale), { hour: "numeric", timeZone: "UTC" }).resolvedOptions().hourCycle;
  const twelve = cycle === "h11" || cycle === "h12";
  const pad = (n: number) => String(n).padStart(2, "0");
  // A no-break space keeps "5:45 PM" on one line.
  return (hour, minute) => (twelve ? `${hour % 12 || 12}:${pad(minute)}\u00A0${hour < 12 ? "AM" : "PM"}` : `${pad(hour)}:${pad(minute)}`);
}

/** The words a sentence is made of. The names and the list are English; the clock follows the locale. */
function writer(locale: string) {
  return {
    clock: clockWriter(locale),
    weekday: (day: number) => WEEKDAY_NAMES[day] ?? "",
    month: (month: number) => MONTH_NAMES[month - 1] ?? "",
    list: (items: readonly (string | number)[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`),
  };
}
type Writer = ReturnType<typeof writer>;

interface Phrase {
  text: string;
  /** Says at which times it runs ("At 09:00"), and not how often ("Every hour"). */
  at: boolean;
}

function timePhrase(schedule: CronSchedule, w: Writer): Phrase {
  const [minuteField = "", hourField = ""] = schedule.fields;
  const mv = schedule.minutes;
  const hv = schedule.hours;
  const m = shapeOf(mv, minuteField.toLowerCase(), CRON_FIELDS[0]!);
  const h = shapeOf(hv, hourField.toLowerCase(), CRON_FIELDS[1]!);
  const every = (text: string): Phrase => ({ text, at: false });
  const firstH = hv[0] ?? 0;
  const lastH = hv[hv.length - 1] ?? 0;
  const firstM = mv[0] ?? 0;
  const lastM = mv[mv.length - 1] ?? 0;
  // Where the first run is not at midnight, say so: "starting at 01:00".
  const startsAt = (hour: number, minute: number) => (hour || minute ? `, starting at ${w.clock(hour, minute)}` : "");

  if (m.kind === "any" && h.kind === "any") return every("Every minute");

  if (h.kind === "any") {
    if (m.kind === "step") return every(`Every ${m.step} minutes${m.start ? `, starting at minute ${m.start}` : ""}`);
    if (m.kind === "single") return every(firstM === 0 ? "Every hour" : `At ${counted(firstM, "minute")} past every hour`);
    if (m.kind === "range") return every(`Every minute from minute ${firstM} through ${lastM} of every hour`);
    return every(`At ${w.list(mv)} minutes past every hour`);
  }

  if (m.kind === "any") {
    if (h.kind === "single") return every(`Every minute from ${w.clock(firstH, 0)} to ${w.clock(firstH, 59)}`);
    if (h.kind === "range") return every(`Every minute from ${w.clock(firstH, 0)} to ${w.clock(lastH, 59)}`);
    // Every minute, but only inside every second hour or so: a burst, not an even gap.
    if (h.kind === "step") return every(`Every minute during every ${ordinal(h.step)} hour${startsAt(h.start, 0)}`);
    return every(`Every minute of the ${w.list(hv.map((hour) => w.clock(hour, 0)))} hours`);
  }

  if (m.kind === "step") {
    if (h.kind === "single" || h.kind === "range") return every(`Every ${m.step} minutes, from ${w.clock(firstH, firstM)} to ${w.clock(lastH, lastM)}`);
    if (h.kind === "step") return every(`Every ${m.step} minutes during every ${ordinal(h.step)} hour${startsAt(firstH, firstM)}`);
    return every(`Every ${m.step} minutes during the ${w.list(hv.map((hour) => w.clock(hour, 0)))} hours`);
  }

  if (h.kind === "range" && m.kind === "single" && hv.length >= 3) return every(`Every hour from ${w.clock(firstH, firstM)} to ${w.clock(lastH, firstM)}`);

  if (h.kind === "step" && m.kind === "single") {
    const past = firstM ? `, at ${counted(firstM, "minute")} past the hour` : "";
    const from = h.start ? `, starting at ${w.clock(h.start, firstM)}` : "";
    return every(`Every ${h.step} hours${past}${from}`);
  }

  if (mv.length * hv.length <= 6) {
    const times = hv.flatMap((hour) => mv.map((minute) => w.clock(hour, minute)));
    return { text: `At ${w.list(times)}`, at: true };
  }

  // The window runs from the first run to the last: 0,15,30,45 in 9-17 goes on until 17:45, not 17:00.
  if (h.kind === "range" && hv.length >= 3) return every(`At ${w.list(mv)} minutes past every hour from ${w.clock(firstH, firstM)} to ${w.clock(lastH, lastM)}`);

  return every(`At ${mv.length === 1 ? "minute" : "minutes"} ${w.list(mv)} past ${hv.length === 1 ? "hour" : "hours"} ${w.list(hv)}`);
}

/** Monday to Sunday is how a week reads, so a run of days is found in that order. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

function weekdayPhrase(days: readonly number[], w: Writer): string {
  if (days.length === 1) return `every ${w.weekday(days[0] ?? 0)}`;
  const ordered = WEEK_ORDER.filter((day) => days.includes(day));
  const positions = ordered.map((day) => WEEK_ORDER.indexOf(day));
  if (positions.length >= 3 && isRun(positions)) return `${w.weekday(ordered[0] ?? 0)} to ${w.weekday(ordered[ordered.length - 1] ?? 0)}`;
  return w.list(ordered.map((day) => w.weekday(day)));
}

function dayOfMonthPhrase(schedule: CronSchedule, w: Writer, ofMonth: string): string {
  const days = schedule.daysOfMonth;
  const shape = shapeOf(days, (schedule.fields[2] ?? "").toLowerCase(), CRON_FIELDS[2]!);
  if (shape.kind === "step") return `every ${ordinal(shape.step)} day ${ofMonth}${shape.start > 1 ? `, starting on the ${ordinal(shape.start)}` : ""}`;
  if (shape.kind === "range") return `from the ${ordinal(days[0] ?? 1)} to the ${ordinal(days[days.length - 1] ?? 31)} ${ofMonth}`;
  return `on the ${w.list(days.map(ordinal))} ${ofMonth}`;
}

/** The days a run happens on, in words; empty when it happens every day. */
function dayPhrase(schedule: CronSchedule, w: Writer): string {
  const { daysOfMonth, months, daysOfWeek } = schedule;
  const dom = daysOfMonth.length < 31;
  const dow = daysOfWeek.length < 7;
  const anyMonth = months.length === 12;
  const names = w.list(months.map((month) => w.month(month)));
  const run = !anyMonth && months.length >= 3 && isRun(months);
  const scope = anyMonth ? "" : run ? `from ${w.month(months[0] ?? 1)} to ${w.month(months[months.length - 1] ?? 12)}` : `in ${names}`;
  const withScope = (text: string) => (scope ? `${text} ${scope}` : text);

  if (!dom && !dow) return anyMonth ? "" : withScope("every day");
  if (dow && !dom) return withScope(weekdayPhrase(daysOfWeek, w));
  if (dom && !dow) {
    const text = dayOfMonthPhrase(schedule, w, !anyMonth && !run ? `of ${names}` : "of the month");
    return run ? `${text}, ${scope}` : text;
  }
  // Both are restricted. With a `*` in front of one of them a day must match both; otherwise it is enough that it matches one.
  const days = dayOfMonthPhrase(schedule, w, "of the month");
  if (schedule.domStar || schedule.dowStar) return withScope(`${days}, when it falls on ${weekdayPhrase(daysOfWeek, w).replace(/^every /, "a ")}`);
  return withScope(`${days} and ${weekdayPhrase(daysOfWeek, w)}`);
}

/**
 * Says in words what a schedule does: "At 09:00, Monday to Friday". The
 * sentence is English whatever the locale, names of days and months and the
 * word "and" included, so it never mixes two languages. The locale decides one
 * thing: whether the clock is written on 12 hours ("9:00 AM") or 24 ("09:00").
 * A locale that is not a language tag falls back to `en-US`. It has no full
 * stop, so it can stand as a heading or in a sentence.
 */
export function describeCron(schedule: CronSchedule, options: { locale?: string } = {}): string {
  const w = writer(safeLocale(options.locale));
  const time = timePhrase(schedule, w);
  const days = dayPhrase(schedule, w);
  if (days) return `${time.text}, ${days}`;
  return time.at ? `${time.text}, every day` : time.text;
}

/* ------------------------------------------------------------------ */
/* Next runs                                                           */
/* ------------------------------------------------------------------ */

const DAY = 86_400_000;
const MINUTE = 60_000;
/** Far enough to find the next 29 February, and then some. */
const HORIZON_DAYS = 366 * 9;

const zones = new Map<string, Intl.DateTimeFormat>();

/** A formatter that reads the wall clock of a zone. It throws a RangeError for a zone that does not exist. */
function zoneFormat(timeZone: string): Intl.DateTimeFormat {
  let format = zones.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" });
    zones.set(timeZone, format);
  }
  return format;
}

interface Wall {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/** The date and time a clock in `timeZone` shows at an instant. */
function wallAt(instant: number, timeZone: string): Wall {
  const wall: Wall = { year: 0, month: 0, day: 0, hour: 0, minute: 0 };
  for (const part of zoneFormat(timeZone).formatToParts(instant)) {
    if (part.type in wall) wall[part.type as keyof Wall] = Number(part.value);
  }
  return wall;
}

const wallToUtc = (wall: Wall) => Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);
const floorMinute = (instant: number) => instant - (((instant % MINUTE) + MINUTE) % MINUTE);
const offsetAt = (instant: number, timeZone: string) => wallToUtc(wallAt(instant, timeZone)) - floorMinute(instant);

/**
 * The instant a clock in `timeZone` shows this date and time, or null when it
 * never does: the hour that is skipped when the clocks go forward. When the
 * clocks go back, a time that comes twice is read at its first.
 */
function instantOf(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): number | null {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  // The offset a day before and a day after bracket any change of the clocks; where they differ, the two guesses are the two readings.
  const guesses = new Set([wall - offsetAt(wall - DAY, timeZone), wall - offsetAt(wall + DAY, timeZone)]);
  const real = [...guesses].filter((guess) => wallToUtc(wallAt(guess, timeZone)) === wall);
  return real.length ? Math.min(...real) : null;
}

function toInstant(when: Date | number | string): number {
  const instant = when instanceof Date ? when.getTime() : typeof when === "string" ? Date.parse(when) : when;
  if (!Number.isFinite(instant)) throw new RangeError("The time is not a valid date");
  return instant;
}

export interface NextRunsOptions {
  /** Count the runs after this time. A Date, a timestamp or an ISO string. Default: now. */
  from?: Date | number | string;
  /** The zone whose clock the schedule follows, such as "Europe/Amsterdam". Default "UTC". A zone that does not exist throws a RangeError. */
  timeZone?: string;
  /** How many runs. Default 3. */
  count?: number;
}

/**
 * When a schedule runs next, as the instants it happens, soonest first. The
 * schedule is read on the clock of `timeZone`, so "0 9 * * *" is 09:00 in
 * Amsterdam whichever zone the reader is in. A run that is left out or moved
 * by daylight saving follows the usual cron rule: a time the clocks skip that
 * day is not listed, and a time that comes twice is listed once, at its first.
 * It returns fewer than `count` (or none) for a schedule that rarely or never
 * happens, such as the 31st of February.
 */
export function nextRuns(schedule: CronSchedule, options: NextRunsOptions = {}): Date[] {
  const { timeZone = "UTC", count = 3 } = options;
  const from = toInstant(options.from ?? Date.now());
  const found: Date[] = [];
  if (count <= 0) return found;

  const months = new Set(schedule.months);
  const monthDays = new Set(schedule.daysOfMonth);
  const weekDays = new Set(schedule.daysOfWeek);
  const either = !schedule.domStar && !schedule.dowStar;

  const start = wallAt(from, timeZone);
  // Hours that are long gone on the first day are not worth a lookup; the three hours of room are for the clocks changing.
  const skipBefore = start.hour * 60 + start.minute - 180;
  let cursor = Date.UTC(start.year, start.month - 1, start.day);
  for (let offset = 0; offset < HORIZON_DAYS; offset += 1, cursor += DAY) {
    const date = new Date(cursor);
    const month = date.getUTCMonth() + 1;
    if (!months.has(month)) continue;
    const day = date.getUTCDate();
    const inMonth = monthDays.has(day);
    const inWeek = weekDays.has(date.getUTCDay());
    if (either ? !(inMonth || inWeek) : !(inMonth && inWeek)) continue;
    for (const hour of schedule.hours) {
      for (const minute of schedule.minutes) {
        if (offset === 0 && hour * 60 + minute < skipBefore) continue;
        const instant = instantOf(date.getUTCFullYear(), month, day, hour, minute, timeZone);
        if (instant === null || instant <= from) continue;
        found.push(new Date(instant));
        if (found.length >= count) return found;
      }
    }
  }
  return found;
}

/** The whole days between the dates two instants have on a clock in `timeZone`. */
function dayNumber(instant: number, timeZone: string): number {
  const wall = wallAt(instant, timeZone);
  return Math.round(Date.UTC(wall.year, wall.month - 1, wall.day) / DAY);
}

/**
 * How far away a run is, in the reader's own words ("in 15 minutes", "in 6 hr 15 min",
 * "tomorrow", "in 3 days"). Under twelve hours the minutes are told as well, so runs a
 * quarter of an hour apart never read the same; longer spans are rounded, not cut.
 */
export function runDistance(run: Date, now: Date | number | string, options: { locale?: string; timeZone?: string } = {}): string {
  const { timeZone = "UTC" } = options;
  const locale = safeLocale(options.locale);
  const from = toInstant(now);
  const words = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const minutes = Math.max(0, Math.ceil((run.getTime() - from) / MINUTE));
  const days = dayNumber(run.getTime(), timeZone) - dayNumber(from, timeZone);
  if (days <= 0) {
    if (minutes < 60) return words.format(minutes, "minute");
    const hours = Math.floor(minutes / 60);
    if (hours < 12 && minutes % 60) {
      // "in 6 hours" has the word that says it lies ahead in front of the number ("in", "over", "dans"). Keep that word and put the hours and minutes after it.
      const parts = words.formatToParts(hours, "hour");
      const ahead = parts.length === 3 && parts[0]?.type === "literal" ? parts[0].value : "";
      if (ahead.trim()) {
        const unit = (value: number, name: "hour" | "minute") => new Intl.NumberFormat(locale, { style: "unit", unit: name, unitDisplay: "short" }).format(value);
        return `${ahead}${unit(hours, "hour")} ${unit(minutes % 60, "minute")}`;
      }
    }
    return words.format(Math.round(minutes / 60), "hour");
  }
  if (days < 60) return words.format(days, "day");
  if (days < 730) return words.format(Math.round(days / 30.44), "month");
  return words.format(Math.round(days / 365.25), "year");
}

/** True for a time zone this runtime knows ("Europe/Amsterdam", "UTC"). */
export function isTimeZone(timeZone: string): boolean {
  try {
    zoneFormat(timeZone);
    return true;
  } catch {
    return false;
  }
}
