export type DateSegment = "day" | "month" | "year";

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

export const padNumber = (value: number | string, width: number) => String(value).padStart(width, "0");

/** The date as 2026-03-14. */
export const toIso = (year: number, month: number, day: number) => `${padNumber(year, 4)}-${padNumber(month, 2)}-${padNumber(day, 2)}`;

/** The numbers in an ISO date, or null when it is not one or the day does not exist ("2026-02-31"). */
export function parseIso(iso: string): DateNumbers | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month) ? { year, month, day } : null;
}

/** Digits typed on a keyboard that writes them differently (Arabic-Indic, Persian) as the digits 0 to 9. */
export function asciiDigits(text: string): string {
  return text.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (char) => String(char.charCodeAt(0) >= 0x6f0 ? char.charCodeAt(0) - 0x6f0 : char.charCodeAt(0) - 0x660));
}

/** The order a locale writes a date in, and what it puts between the parts, found by asking the browser. Falls back to day, month, year with a slash. */
export function dateLayout(locale: string): { order: readonly DateSegment[]; separator: string } {
  try {
    const parts = new Intl.DateTimeFormat(locale, { calendar: "gregory", year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" }).formatToParts(Date.UTC(2006, 10, 22));
    const order = parts.flatMap((part) => (part.type === "day" || part.type === "month" || part.type === "year" ? [part.type] : []));
    const separator = parts.find((part) => part.type === "literal")?.value.trim();
    if (order.length === 3) return { order, separator: separator || "/" };
  } catch {
    // An unknown locale: the fallback below.
  }
  return { order: ["day", "month", "year"], separator: "/" };
}

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

const name = (locale: string, options: Intl.DateTimeFormatOptions, year: number, month: number, day: number) => {
  try {
    return new Intl.DateTimeFormat(locale, { calendar: "gregory", timeZone: "UTC", ...options }).format(Date.UTC(year, month - 1, day, 12));
  } catch {
    return new Intl.DateTimeFormat("en-US", { calendar: "gregory", timeZone: "UTC", ...options }).format(Date.UTC(year, month - 1, day, 12));
  }
};

/** The month's name in the locale: "February". */
export const monthName = (locale: string, month: number) => name(locale, { month: "long" }, 2000, month, 15);

/** A whole date in words, in the locale: "14 March 2026". */
export const longDate = (locale: string, date: DateNumbers) => name(locale, { dateStyle: "long" }, date.year, date.month, date.day);

/**
 * Why a date that is all filled in cannot be used, in words, or null when it
 * can: a month that does not exist, a day the month does not have ("February
 * 2026 has only 28 days"), or a date outside `min` and `max` (ISO dates).
 */
export function explainDate(date: DateNumbers, { min, max, locale }: { min?: string; max?: string; locale: string }): string | null {
  if (date.year < 1) return "Years start at 0001.";
  if (date.month < 1 || date.month > 12) return `There is no month ${date.month}. Months run from 1 to 12.`;
  if (date.day < 1) return "Days start at 1.";
  const days = daysInMonth(date.year, date.month);
  if (date.day > days) return `${monthName(locale, date.month)} ${date.year} has only ${days} days.`;
  const iso = toIso(date.year, date.month, date.day);
  const first = min ? parseIso(min) : null;
  const last = max ? parseIso(max) : null;
  if (first && min && iso < min) return `Pick a date on or after ${longDate(locale, first)}.`;
  if (last && max && iso > max) return `Pick a date on or before ${longDate(locale, last)}.`;
  return null;
}
