export type BirthdaySegment = "day" | "month" | "year";

export interface DateNumbers {
  year: number;
  month: number;
  day: number;
}

/** What a person has typed or picked so far, part by part. Digits only; the month is "01" to "12" or empty. */
export interface BirthdayParts {
  day: string;
  month: string;
  year: string;
}

/** A problem with a date of birth: what is wrong in words, and which of the three parts it is about. */
export interface BirthdayProblem {
  part: BirthdaySegment;
  message: string;
}

/** The words the field uses for what it finds wrong. Each can be replaced, for another language or your own voice. */
export interface BirthdayMessages {
  /** A day that is not between 1 and 31. */
  day: string;
  /** A year that is not four digits long. */
  year: string;
  /** A day the month does not have: "February 1990 has only 28 days." */
  noSuchDay: (month: string, year: number, days: number) => string;
  /** A date that has not happened yet. */
  future: string;
  /** A date that makes the person younger than `minAge`. */
  tooYoung: (minAge: number) => string;
  /** A date that makes the person older than `maxAge`. */
  tooOld: (maxAge: number) => string;
}

export const DEFAULT_MESSAGES: BirthdayMessages = {
  day: "Days run from 1 to 31.",
  year: "Enter the year with four digits, like 1990.",
  noSuchDay: (month, year, days) => `${month} ${year} has only ${days} days.`,
  future: "A date of birth cannot be in the future.",
  tooYoung: (minAge) => `You must be at least ${minAge} to register.`,
  tooOld: (maxAge) => `Check the year: that is more than ${maxAge} years ago.`,
};

const isLeap = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/** How many days a month has (month 1 to 12), leap years included. */
export function daysInMonth(year: number, month: number): number {
  return month === 2 ? (isLeap(year) ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export const padNumber = (value: number | string, width: number) => String(value).padStart(width, "0");

/** The date as 1990-03-14. */
export const toIso = (year: number, month: number, day: number) => `${padNumber(year, 4)}-${padNumber(month, 2)}-${padNumber(day, 2)}`;

/** The numbers in an ISO date, or null when it is not one or the day does not exist ("1990-02-31"). */
export function parseIso(iso: string | null | undefined): DateNumbers | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso ?? "").trim());
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month) ? { year, month, day } : null;
}

/** Digits typed on a keyboard that writes them differently (Arabic-Indic, Persian) as the digits 0 to 9. */
export function asciiDigits(text: string): string {
  return text.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (char) => String(char.charCodeAt(0) >= 0x6f0 ? char.charCodeAt(0) - 0x6f0 : char.charCodeAt(0) - 0x660));
}

/** The order a locale writes a date in, found by asking the browser: day, month, year in the Netherlands, month, day, year in the United States, year first in Japan. */
export function birthdayOrder(locale: string): readonly BirthdaySegment[] {
  try {
    const parts = new Intl.DateTimeFormat(locale, { calendar: "gregory", year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" }).formatToParts(Date.UTC(2006, 10, 22));
    const order = parts.flatMap((part): BirthdaySegment[] => (part.type === "day" || part.type === "month" || part.type === "year" ? [part.type] : []));
    if (order.length === 3) return order;
  } catch {
    // An unknown locale: the fallback below.
  }
  return ["day", "month", "year"];
}

const formatMonth = (locale: string, month: number) => {
  const date = Date.UTC(2000, month - 1, 15);
  try {
    return new Intl.DateTimeFormat(locale, { calendar: "gregory", month: "long", timeZone: "UTC" }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-US", { calendar: "gregory", month: "long", timeZone: "UTC" }).format(date);
  }
};

/** The twelve month names in the locale, January first. */
export const monthNames = (locale: string): string[] => Array.from({ length: 12 }, (_, index) => formatMonth(locale, index + 1));

/** A whole date in words, in the locale: "14 March 1990". */
export function longDate(locale: string, { year, month, day }: DateNumbers): string {
  const date = Date.UTC(year, month - 1, day, 12);
  try {
    return new Intl.DateTimeFormat(locale, { calendar: "gregory", dateStyle: "long", timeZone: "UTC" }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-US", { calendar: "gregory", dateStyle: "long", timeZone: "UTC" }).format(date);
  }
}

/** Today in the reader's own time zone. Reads the clock: call it from an effect or a handler, never while rendering on a server. */
export function localToday(): DateNumbers {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

/** How old someone born on `birth` is on `today`, in whole years. */
export function ageOn(birth: DateNumbers, today: DateNumbers): number {
  const before = today.month < birth.month || (today.month === birth.month && today.day < birth.day);
  return today.year - birth.year - (before ? 1 : 0);
}

const compare = (a: DateNumbers, b: DateNumbers) => a.year - b.year || a.month - b.month || a.day - b.day;

/** The part of `date` that is the first to differ from `other`, which is the one to look at first: the year, then the month, then the day. */
function firstDifference(date: DateNumbers, other: DateNumbers): BirthdaySegment {
  return date.year !== other.year ? "year" : date.month !== other.month ? "month" : "day";
}

export interface BirthdayRules {
  /** The youngest age allowed, in whole years. */
  minAge?: number;
  /** The oldest age allowed, in whole years. */
  maxAge?: number;
  /** Today. Until it is known, only what a date can say about itself is checked. */
  today: DateNumbers | null;
  locale: string;
  messages: BirthdayMessages;
  /** The year was typed and left: a year of one to three digits is then a mistake, instead of work in progress. */
  yearLeft: boolean;
}

/**
 * What is wrong with a date of birth, in words and with the part it is about,
 * or null while it is fine or not finished. A day that no month has and a
 * short year are noticed at once; a day the month does not have, a date that
 * has not happened yet and the age limits are checked once all three parts
 * are in.
 */
export function explainBirthday(parts: BirthdayParts, { minAge, maxAge, today, locale, messages, yearLeft }: BirthdayRules): BirthdayProblem | null {
  const day = parts.day === "" ? null : Number(parts.day);
  if (day !== null && parts.day.length === 2 && (day < 1 || day > 31)) return { part: "day", message: messages.day };
  if (yearLeft && parts.year.length > 0 && parts.year.length < 4) return { part: "year", message: messages.year };
  if (day === null || parts.month === "" || parts.year.length !== 4) return null;
  const month = Number(parts.month);
  const year = Number(parts.year);
  if (day < 1 || day > 31) return { part: "day", message: messages.day };
  if (year < 1) return { part: "year", message: messages.year };
  const days = daysInMonth(year, month);
  if (day > days) return { part: "day", message: messages.noSuchDay(monthNames(locale)[month - 1] ?? String(month), year, days) };
  if (!today) return null;
  const birth: DateNumbers = { year, month, day };
  if (compare(birth, today) > 0) return { part: firstDifference(birth, today), message: messages.future };
  if (minAge !== undefined) {
    // The latest birth date that is old enough: the same day, `minAge` years ago.
    const latest: DateNumbers = { year: today.year - minAge, month: today.month, day: today.day };
    if (compare(birth, latest) > 0) return { part: firstDifference(birth, latest), message: messages.tooYoung(minAge) };
  }
  if (maxAge !== undefined) {
    // One day older than this and the person is past `maxAge`: born on or before the day after which they turn `maxAge` + 1.
    const earliest: DateNumbers = { year: today.year - maxAge - 1, month: today.month, day: today.day };
    if (compare(birth, earliest) <= 0) return { part: firstDifference(birth, earliest), message: messages.tooOld(maxAge) };
  }
  return null;
}
