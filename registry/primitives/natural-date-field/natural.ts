/**
 * The words the date parser listens for. Every entry is a list of ways to say
 * the same thing, in lower case: the first is the full word, the rest are short
 * forms. Pass a `phrases` object with your own lists for another language; what
 * you leave out stays English. A phrase of several words ("day after tomorrow")
 * is fine, and so are short forms with a dot ("mar.").
 */
export interface NaturalPhrases {
  today: readonly string[];
  tomorrow: readonly string[];
  yesterday: readonly string[];
  /** "day after tomorrow". */
  dayAfterTomorrow: readonly string[];
  /** The seven weekdays, Sunday first. */
  weekdays: readonly (readonly string[])[];
  /** The twelve months, January first. */
  months: readonly (readonly string[])[];
  /** "next friday", "next week": the one after this one. */
  next: readonly string[];
  /** "last friday", "last month": the one before. */
  last: readonly string[];
  /** "this friday": the coming one. */
  this: readonly string[];
  /** "in 3 days". */
  in: readonly string[];
  /** "3 days ago". */
  ago: readonly string[];
  /** "3 days from now". */
  fromNow: readonly string[];
  /** "end of month". */
  endOf: readonly string[];
  /** Words that stand for one: "a week", "an hour". */
  articles: readonly string[];
  /** The units of "in 2 weeks", singular, plural and short. */
  unit: { day: readonly string[]; week: readonly string[]; month: readonly string[]; year: readonly string[] };
  /** Words that mean nothing and are left out: "on friday", "the 14th", "14th of march". */
  filler: readonly string[];
  /** What follows a day number: "14th". */
  ordinals: readonly string[];
}

export const ENGLISH_PHRASES: NaturalPhrases = {
  today: ["today", "tod"],
  tomorrow: ["tomorrow", "tmrw", "tmr", "tom"],
  yesterday: ["yesterday", "yday"],
  dayAfterTomorrow: ["day after tomorrow"],
  weekdays: [
    ["sunday", "sun"],
    ["monday", "mon"],
    ["tuesday", "tue", "tues"],
    ["wednesday", "wed", "weds"],
    ["thursday", "thu", "thur", "thurs"],
    ["friday", "fri"],
    ["saturday", "sat"],
  ],
  months: [
    ["january", "jan"],
    ["february", "feb"],
    ["march", "mar"],
    ["april", "apr"],
    ["may"],
    ["june", "jun"],
    ["july", "jul"],
    ["august", "aug"],
    ["september", "sep", "sept"],
    ["october", "oct"],
    ["november", "nov"],
    ["december", "dec"],
  ],
  next: ["next"],
  last: ["last", "previous"],
  this: ["this", "coming"],
  in: ["in"],
  ago: ["ago"],
  fromNow: ["from now"],
  endOf: ["end of"],
  articles: ["a", "an", "one"],
  unit: {
    day: ["day", "days", "d"],
    week: ["week", "weeks", "w", "wk", "wks"],
    month: ["month", "months", "mo", "mos"],
    year: ["year", "years", "y", "yr", "yrs"],
  },
  filler: ["on", "the", "of", "at", "by", "due"],
  ordinals: ["st", "nd", "rd", "th"],
};

/** The words the field says, in the line under it and to a screen reader. Each can be replaced, for another language or your own voice. */
export interface NaturalDateLabels {
  /** The name of the field for a screen reader when it has no label, id or aria-label of its own. */
  name: string;
  /** The line under the field while nothing is typed. */
  hint: string;
  /** Said when the text is not a date. `examples` are phrases that would work. */
  unreadable: (examples: string) => string;
  /** The examples that go in the sentence above. */
  examples: string;
  /** The date is before `min`. `date` is that day written out. */
  before: (date: string) => string;
  /** The date is after `max`. */
  after: (date: string) => string;
  /** The name of the button that opens the calendar. */
  calendar: string;
  /** What a screen reader hears once the typing pauses: the date it was understood as. */
  said: (date: string) => string;
  /** The key to press, shown beside a date that is not yet committed. */
  confirm: string;
}

export const DEFAULT_LABELS: NaturalDateLabels = {
  name: "Date",
  hint: "Try tomorrow, next friday or in 3 weeks.",
  unreadable: (examples) => `Not sure what that means. Try ${examples}.`,
  examples: "tomorrow, next friday, in 3 weeks or 14 mar",
  before: (date) => `Pick a date on or after ${date}.`,
  after: (date) => `Pick a date on or before ${date}.`,
  calendar: "Open calendar",
  said: (date) => `Understood as ${date}`,
  confirm: "Enter",
};

// Calendar dates ----------------------------------------------------------------------------------------------------------------

const DAY = 86_400_000;
const pad = (value: number, width = 2) => String(value).padStart(width, "0");

export interface DateNumbers {
  year: number;
  month: number;
  day: number;
}

const isLeap = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/** How many days a month has (month 1 to 12), leap years included. */
export function daysInMonth(year: number, month: number): number {
  return month === 2 ? (isLeap(year) ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** The numbers in an ISO date, or null when it is not one or the day does not exist ("2026-02-31"). */
export function parseIso(iso: string | null | undefined): DateNumbers | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso ?? "").trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // Date.UTC reads the years 0 to 99 as 1900 to 1999, so only four-digit years from 1000 are taken.
  return year >= 1000 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month) ? { year, month, day } : null;
}

export const toIso = (year: number, month: number, day: number) => `${pad(year, 4)}-${pad(month)}-${pad(day)}`;

/** Whole days since 1970-01-01 for a calendar date. A calendar date has no time zone, so this is UTC arithmetic and a daylight saving change never gets in. */
export function dayNumber(iso: string): number {
  const parts = parseIso(iso);
  return parts ? Date.UTC(parts.year, parts.month - 1, parts.day) / DAY : Number.NaN;
}

/** The date `days` after (or before, when negative) the one given. */
export function addDays(iso: string, days: number): string {
  const parts = parseIso(iso);
  if (!parts) return iso;
  const moved = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return toIso(moved.getUTCFullYear(), moved.getUTCMonth() + 1, moved.getUTCDate());
}

/** The date `months` later, on the same day of the month or the last day of a shorter one. */
export function addMonths(iso: string, months: number): string {
  const parts = parseIso(iso);
  if (!parts) return iso;
  const target = new Date(Date.UTC(parts.year, parts.month - 1 + months, 1));
  const year = target.getUTCFullYear();
  const month = target.getUTCMonth() + 1;
  return toIso(year, month, Math.min(parts.day, daysInMonth(year, month)));
}

/** 0 for a Sunday up to 6 for a Saturday. */
export function weekday(iso: string): number {
  const parts = parseIso(iso);
  return parts ? new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay() : 0;
}

/** The calendar date a moment falls on in a time zone, as "YYYY-MM-DD". An unknown zone reads as UTC, and a date written without a time is taken as that very date. */
export function isoInZone(moment: Date | string | number, timeZone: string): string | null {
  if (typeof moment === "string" && /^\d{4}-\d{2}-\d{2}$/.test(moment.trim())) return parseIso(moment) ? moment.trim() : null;
  const instant = new Date(moment);
  if (Number.isNaN(instant.getTime())) return null;
  const read = (zone: string) => new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = read(timeZone);
  } catch {
    parts = read("UTC");
  }
  const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value);
  return toIso(part("year"), part("month"), part("day"));
}

/** A calendar date as a Date at local midnight, which is what the Calendar speaks. */
export function toLocalDate(iso: string | null | undefined): Date | undefined {
  const parts = parseIso(iso);
  return parts ? new Date(parts.year, parts.month - 1, parts.day) : undefined;
}

/** A Date the Calendar handed over, as the calendar date it shows. */
export const fromLocalDate = (date: Date) => toIso(date.getFullYear(), date.getMonth() + 1, date.getDate());

/** 0 when the locale's week starts on a Sunday, 1 when it starts on a Monday, for the calendar. */
export function weekStart(locale: string): 0 | 1 {
  try {
    const info = new Intl.Locale(locale) as unknown as { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number }; maximize: () => { region?: string } };
    const first = info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay;
    if (first !== undefined) return first === 7 ? 0 : 1;
    return ["US", "CA", "MX", "BR", "JP", "KR", "PH"].includes(info.maximize().region ?? "") ? 0 : 1;
  } catch {
    return 1;
  }
}

const formats = new Map<string, Intl.DateTimeFormat>();

/** A date format, kept: building one is far slower than using it. An unknown locale reads as English. */
function dateFormat(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = formats.get(key);
  if (!format) {
    try {
      format = new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" });
    } catch {
      format = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
    }
    formats.set(key, format);
  }
  return format;
}

const noon = (iso: string) => {
  const parts = parseIso(iso);
  return parts ? Date.UTC(parts.year, parts.month - 1, parts.day, 12) : Number.NaN;
};

/** The date in full, the way the locale writes it: "Friday 23 October 2026". */
export const fullDate = (iso: string, locale: string): string => dateFormat(locale, { dateStyle: "full" }).format(noon(iso));

/** The date short, for the text of the field after it is committed: "23 Oct 2026". */
export const shortDate = (iso: string, locale: string): string => dateFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(noon(iso));

/** How far a date is from today in the locale's words: "today", "tomorrow", "in 3 days", "yesterday", "5 days ago", "in 3 weeks". */
export function distanceInWords(days: number, locale: string): string {
  let format: Intl.RelativeTimeFormat;
  try {
    format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  } catch {
    format = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  }
  const size = Math.abs(days);
  if (size <= 13) return format.format(days, "day");
  if (size < 60) return format.format(Math.round(days / 7), "week");
  if (size < 700) return format.format(Math.round(days / 30.44), "month");
  return format.format(Math.round(days / 365.25), "year");
}

// The parser ---------------------------------------------------------------------------------------------------------------------

type Unit = "day" | "week" | "month" | "year";
type Keyword = "today" | "tomorrow" | "yesterday" | "dayAfterTomorrow" | "next" | "last" | "this" | "in" | "ago" | "fromNow" | "endOf" | "article" | "filler";

type Token =
  | { kind: Keyword }
  | { kind: "weekday"; value: number }
  | { kind: "month"; value: number }
  | { kind: "unit"; value: Unit }
  | { kind: "number"; value: number; ordinal: boolean; digits: number };

interface Vocabulary {
  words: Map<string, Token>;
  /** Phrases of several words, longest first, each with the placeholder that stands for it once it has been found in the text. */
  phrases: [RegExp, string][];
  ordinals: Set<string>;
}

const vocabularies = new WeakMap<object, Vocabulary>();

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const clean = (word: string) => word.toLowerCase().trim().replace(/\s+/g, " ").replace(/\.$/, "");

function vocabularyOf(phrases: Partial<NaturalPhrases> | undefined): Vocabulary {
  const key = phrases ?? ENGLISH_PHRASES;
  const known = vocabularies.get(key);
  if (known) return known;
  const all: NaturalPhrases = { ...ENGLISH_PHRASES, ...phrases, unit: { ...ENGLISH_PHRASES.unit, ...phrases?.unit } };
  const words = new Map<string, Token>();
  const found: [string, string][] = [];
  let index = 0;
  const add = (list: readonly string[], token: Token) => {
    for (const raw of list) {
      const word = clean(raw);
      if (!word) continue;
      if (word.includes(" ")) {
        // A phrase of several words becomes one placeholder in the text, so the rest of the parser only ever sees single tokens.
        const placeholder = `@${index++}`;
        found.push([word, placeholder]);
        if (!words.has(placeholder)) words.set(placeholder, token);
      } else if (!words.has(word)) words.set(word, token);
    }
  };
  add(all.filler, { kind: "filler" });
  add(all.today, { kind: "today" });
  add(all.tomorrow, { kind: "tomorrow" });
  add(all.yesterday, { kind: "yesterday" });
  add(all.dayAfterTomorrow, { kind: "dayAfterTomorrow" });
  all.weekdays.forEach((list, value) => add(list, { kind: "weekday", value }));
  all.months.forEach((list, value) => add(list, { kind: "month", value }));
  add(all.next, { kind: "next" });
  add(all.last, { kind: "last" });
  add(all.this, { kind: "this" });
  add(all.in, { kind: "in" });
  add(all.ago, { kind: "ago" });
  add(all.fromNow, { kind: "fromNow" });
  add(all.endOf, { kind: "endOf" });
  add(all.articles, { kind: "article" });
  for (const unit of ["day", "week", "month", "year"] as const) add(all.unit[unit], { kind: "unit", value: unit });
  found.sort((a, b) => b[0].length - a[0].length);
  const vocabulary: Vocabulary = {
    words,
    phrases: found.map(([word, placeholder]) => [new RegExp(`(^| )${escapeRegExp(word)}(?= |$)`, "g"), placeholder]),
    ordinals: new Set(all.ordinals.map(clean)),
  };
  vocabularies.set(key, vocabulary);
  return vocabulary;
}

/** The text as words and numbers, or null when a word is not one the parser knows. */
function tokenize(text: string, vocabulary: Vocabulary): Token[] | null {
  let rest = text
    .toLowerCase()
    .replace(/@/g, " ")
    .replace(/[,;]/g, " ")
    // A dot that is not between two digits ends a short form ("mar.", "14. mar") and says nothing more.
    .replace(/(?<!\d)\.|\.(?!\d)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  for (const [pattern, placeholder] of vocabulary.phrases) rest = rest.replace(pattern, `$1${placeholder}`);
  const tokens: Token[] = [];
  for (const word of rest.split(" ")) {
    if (!word) continue;
    const known = vocabulary.words.get(word);
    if (known) {
      if (known.kind !== "filler") tokens.push(known);
      continue;
    }
    // A number, with an ordinal ("14th") or a unit stuck to it ("3d", "2w").
    const number = /^([+-]?)(\d+)([^\d\s]*)$/.exec(word);
    if (!number) return null;
    const value = Number(number[2]) * (number[1] === "-" ? -1 : 1);
    const tail = number[3] ?? "";
    if (!tail) tokens.push({ kind: "number", value, ordinal: false, digits: (number[2] ?? "").length });
    else if (vocabulary.ordinals.has(tail)) tokens.push({ kind: "number", value, ordinal: true, digits: (number[2] ?? "").length });
    else {
      const unit = vocabulary.words.get(tail);
      if (unit?.kind !== "unit") return null;
      tokens.push({ kind: "number", value, ordinal: false, digits: (number[2] ?? "").length }, unit);
    }
  }
  return tokens;
}

const kindOf = (token: Token | undefined): string => token?.kind ?? "";

/** The date `count` units from `from`. A month or a year keeps the day of the month, or the last day of a shorter month. */
function shift(from: string, count: number, unit: Unit): string {
  if (unit === "day") return addDays(from, count);
  if (unit === "week") return addDays(from, count * 7);
  return addMonths(from, unit === "month" ? count : count * 12);
}

/** The first date from `today` on (today included) that falls on this weekday, 0 for Sunday. */
const comingWeekday = (today: string, value: number) => addDays(today, (value - weekday(today) + 7) % 7);

/** The weekday in next week, with weeks that run Monday to Sunday: "next friday" said on a Wednesday is the Friday after the coming one. */
function weekdayNextWeek(today: string, value: number): string {
  const monday = addDays(today, -((weekday(today) + 6) % 7));
  return addDays(monday, 7 + ((value + 6) % 7));
}

/** The latest date before `today` that falls on this weekday. */
function weekdayBefore(today: string, value: number): string {
  return addDays(today, -(((weekday(today) - value + 7) % 7) || 7));
}

/** The last day of the month, or of the year, `offset` of them from now. */
function endOfUnit(today: string, unit: Unit, offset: number): string | null {
  const parts = parseIso(today);
  if (!parts) return null;
  if (unit === "month") {
    const target = parseIso(addMonths(toIso(parts.year, parts.month, 1), offset));
    return target ? toIso(target.year, target.month, daysInMonth(target.year, target.month)) : null;
  }
  return unit === "year" ? toIso(parts.year + offset, 12, 31) : null;
}

interface Context {
  today: string;
  min: string | undefined;
  max: string | undefined;
  locale: string;
}

/** A day and month without a year: the next time it comes round, unless that is outside `min` and `max` and another year is not. */
function withoutYear(month: number, day: number, context: Context): string | null {
  const year = parseIso(context.today)?.year ?? 0;
  const found = [year - 1, year, year + 1, year + 2].map((candidate) => toIso(candidate, month + 1, day)).filter((iso) => parseIso(iso) !== null);
  const coming = found.filter((iso) => iso >= context.today).sort();
  const gone = found.filter((iso) => iso < context.today).sort().reverse();
  const order = [...coming, ...gone];
  const allowed = order.find((iso) => (context.min === undefined || iso >= context.min) && (context.max === undefined || iso <= context.max));
  if (allowed) return allowed;
  // None of them fits: the one nearest to today is the one most likely meant, so it is the one a message will be about.
  const distance = (iso: string) => Math.abs(dayNumber(iso) - dayNumber(context.today));
  return [...order].sort((a, b) => distance(a) - distance(b))[0] ?? null;
}

/** The next date that falls on this day of the month: this month if it has not passed, else the first later month that has such a day. */
function dayOfMonth(day: number, today: string): string | null {
  const parts = parseIso(today);
  if (!parts || day < 1 || day > 31) return null;
  for (let step = 0; step < 14; step += 1) {
    const month = parseIso(addMonths(toIso(parts.year, parts.month, 1), step));
    if (!month || day > daysInMonth(month.year, month.month)) continue;
    const iso = toIso(month.year, month.month, day);
    if (iso >= today) return iso;
  }
  return null;
}

const validDate = (year: number, month: number, day: number): string | null => {
  const iso = toIso(year, month, day);
  return parseIso(iso) ? iso : null;
};

/** A year that was written with two digits, read the way most systems read it: 00 to 68 are this century, 69 to 99 the last one. */
const fullYear = (value: number, digits: number) => (digits <= 2 ? (value >= 69 ? 1900 : 2000) + value : value);

function resolve(tokens: Token[], context: Context): string | null {
  // "friday 23 october" and "friday, october 23, 2026" are how the field writes a date back: the weekday adds nothing.
  const first = tokens[0];
  const second = tokens[1];
  if (tokens.length >= 3 && first?.kind === "weekday" && (second?.kind === "number" || second?.kind === "month")) return resolve(tokens.slice(1), context);
  const signature = tokens.map((token) => kindOf(token)).join(" ");
  const [a, b, c] = tokens;
  const { today } = context;
  switch (signature) {
    case "today":
      return today;
    case "tomorrow":
      return addDays(today, 1);
    case "yesterday":
      return addDays(today, -1);
    case "dayAfterTomorrow":
      return addDays(today, 2);
    case "weekday":
    case "this weekday":
      return comingWeekday(today, (a?.kind === "weekday" ? a : b?.kind === "weekday" ? b : null)?.value ?? 0);
    case "weekday this":
      return a?.kind === "weekday" ? comingWeekday(today, a.value) : null;
    case "next weekday":
      return b?.kind === "weekday" ? weekdayNextWeek(today, b.value) : null;
    case "weekday next":
      return a?.kind === "weekday" ? weekdayNextWeek(today, a.value) : null;
    case "last weekday":
      return b?.kind === "weekday" ? weekdayBefore(today, b.value) : null;
    case "weekday last":
      return a?.kind === "weekday" ? weekdayBefore(today, a.value) : null;
    case "next unit":
      return b?.kind === "unit" ? shift(today, 1, b.value) : null;
    case "last unit":
      return b?.kind === "unit" ? shift(today, -1, b.value) : null;
    case "number unit":
    case "article unit":
      return b?.kind === "unit" ? shift(today, a?.kind === "number" ? a.value : 1, b.value) : null;
    case "in number unit":
    case "in article unit":
      return c?.kind === "unit" ? shift(today, b?.kind === "number" ? b.value : 1, c.value) : null;
    case "number unit ago":
    case "article unit ago":
      return b?.kind === "unit" ? shift(today, -(a?.kind === "number" ? a.value : 1), b.value) : null;
    case "number unit fromNow":
    case "article unit fromNow":
      return b?.kind === "unit" ? shift(today, a?.kind === "number" ? a.value : 1, b.value) : null;
    case "endOf unit":
      return b?.kind === "unit" ? endOfUnit(today, b.value, 0) : null;
    case "endOf next unit":
      return c?.kind === "unit" ? endOfUnit(today, c.value, 1) : null;
    case "endOf last unit":
      return c?.kind === "unit" ? endOfUnit(today, c.value, -1) : null;
    case "endOf this unit":
      return c?.kind === "unit" ? endOfUnit(today, c.value, 0) : null;
    case "number":
      return a?.kind === "number" && a.digits <= 2 ? dayOfMonth(a.value, today) : null;
    case "number month":
      return a?.kind === "number" && b?.kind === "month" && a.digits <= 2 ? withoutYear(b.value, a.value, context) : null;
    case "month number":
      return a?.kind === "month" && b?.kind === "number" && b.digits <= 2 ? withoutYear(a.value, b.value, context) : null;
    case "number month number":
      return a?.kind === "number" && b?.kind === "month" && c?.kind === "number" && a.digits <= 2 && (c.digits === 2 || c.digits === 4) ? validDate(fullYear(c.value, c.digits), b.value + 1, a.value) : null;
    case "month number number":
      return a?.kind === "month" && b?.kind === "number" && c?.kind === "number" && b.digits <= 2 && (c.digits === 2 || c.digits === 4) ? validDate(fullYear(c.value, c.digits), a.value + 1, b.value) : null;
    default:
      return null;
  }
}

/** The order a locale writes a date in numbers, found by asking the browser. Falls back to day, month, year. */
function numericOrder(locale: string): readonly ("d" | "m" | "y")[] {
  try {
    const parts = new Intl.DateTimeFormat(locale, { calendar: "gregory", year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" }).formatToParts(Date.UTC(2006, 10, 22));
    const order = parts.flatMap((part) => (part.type === "day" ? ["d" as const] : part.type === "month" ? ["m" as const] : part.type === "year" ? ["y" as const] : []));
    if (order.length === 3) return order;
  } catch {
    // An unknown locale: the fallback below.
  }
  return ["d", "m", "y"];
}

/** A date written in numbers: 2026-03-14, 14/03/2026, 3/14, 14.3.26. The locale decides which comes first, and the other order is tried when the first is not a date. */
function fromNumbers(text: string, context: Context): string | null | undefined {
  const match = /^(\d{1,4})\s*([-/.])\s*(\d{1,2})(?:\s*\2\s*(\d{1,4}))?$/.exec(text.trim());
  if (!match) return undefined;
  const first = match[1] ?? "";
  const second = match[3] ?? "";
  const third = match[4];
  // Four digits first is a year, whatever the locale writes first: that is how an ISO date reads.
  if (first.length === 4) return third === undefined ? null : validDate(Number(first), Number(second), Number(third));
  const order = numericOrder(context.locale);
  const orders: ("dm" | "md")[] = order.indexOf("d") < order.indexOf("m") ? ["dm", "md"] : ["md", "dm"];
  for (const arrangement of orders) {
    const day = Number(arrangement === "dm" ? first : second);
    const month = Number(arrangement === "dm" ? second : first);
    if (month < 1 || month > 12) continue;
    const iso = third === undefined ? withoutYear(month - 1, day, context) : validDate(fullYear(Number(third), third.length), month, day);
    if (iso) return iso;
  }
  return null;
}

export interface NaturalDateOptions {
  /** What "now" is, as a Date, a timestamp or an ISO string. A date without a time ("2026-10-21") is that very day. Default: the clock. */
  now?: Date | string | number;
  /** The time zone that decides which day it is now. Default "UTC". */
  timeZone?: string;
  /** The locale that decides whether 3/4 is the third of April or the fourth of March. Default "en-US". */
  locale?: string;
  /** Your own words, for another language. What you leave out stays English. */
  phrases?: Partial<NaturalPhrases>;
  /** A date without a year is placed in the year that falls inside these (ISO dates), when the next time it comes round does not. */
  min?: string;
  max?: string;
}

/**
 * A date the way a person would say it, as an ISO date ("2026-10-23"), or null
 * when it is not understood. It reads today, tomorrow, yesterday and weekday
 * names ("friday" is the coming one, "next friday" the one in next week, "last
 * friday" the one before today), "in 3 days", "2 weeks ago", "next month",
 * "end of month" and "end of next year", a day and a month ("14 mar", "march
 * 14th", "the 14th of March 2026") and dates in numbers ("14/03/2026",
 * "2026-03-14"). A day and month without a year are the next time they come
 * round. Everything is worked out as calendar dates against `now` in `timeZone`,
 * so the server and the browser agree. The words are English unless `phrases`
 * says otherwise.
 */
export function parseNaturalDate(text: string, options: NaturalDateOptions = {}): string | null {
  const { now = new Date(), timeZone = "UTC", locale = "en-US", phrases, min, max } = options;
  const today = isoInZone(now, timeZone);
  if (!today || !text.trim()) return null;
  const context: Context = { today, min, max, locale };
  const numbers = fromNumbers(text, context);
  if (numbers !== undefined) return numbers;
  const tokens = tokenize(text, vocabularyOf(phrases));
  if (!tokens?.length) return null;
  const iso = resolve(tokens, context);
  return iso && parseIso(iso) ? iso : null;
}
