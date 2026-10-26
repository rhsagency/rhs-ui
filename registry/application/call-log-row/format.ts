/**
 * Pure helpers for the call log row: phone numbers, durations and calendar
 * days. They call no hook, so a Server Component may use them as well.
 */

/** Calling codes that are three digits long start with one of these pairs (Africa, Ireland, the Baltics, the Gulf and so on). */
const THREE_DIGIT_CODES = new Set(["21", "22", "23", "24", "25", "26", "29", "35", "37", "38", "42", "50", "59", "67", "68", "69", "85", "88", "96", "97", "99"]);

/** How the digits after the calling code are split, by how many there are. Readable, not national: a phone library knows the real rules. */
const GROUPS: Readonly<Record<number, readonly number[]>> = {
  5: [2, 3],
  6: [3, 3],
  7: [3, 4],
  8: [4, 4],
  9: [3, 3, 3],
  10: [3, 3, 4],
  11: [3, 4, 4],
  12: [4, 4, 4],
};

function callingCodeLength(digits: string): number {
  if (digits.startsWith("1") || digits.startsWith("7")) return 1;
  return THREE_DIGIT_CODES.has(digits.slice(0, 2)) ? 3 : 2;
}

function group(digits: string): string {
  const sizes = GROUPS[digits.length] ?? Array.from({ length: Math.ceil(digits.length / 4) }, () => 4);
  const parts: string[] = [];
  let start = 0;
  for (const size of sizes) {
    parts.push(digits.slice(start, start + size));
    start += size;
  }
  return parts.filter(Boolean).join(" ");
}

/** The United States, Canada and the other +1 countries write ten digits as (415) 555-0132. */
function northAmerican(digits: string): string {
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * A phone number written for people. A number that already has spaces,
 * dashes, dots or brackets is shown as it was written. A bare one is grouped:
 * +1 numbers as (415) 555-0132, others by their calling code, and ten digits
 * without a plus the way `locale` writes them (North American for en-US and
 * en-CA, in groups elsewhere). It guesses groups, it does not know national
 * rules: for those, format the number yourself and pass the text.
 */
export function formatPhone(raw: string, locale: string): string {
  const text = raw.trim();
  if (!text) return "";
  if (/[\s().-]/.test(text)) return text.replace(/\s+/g, " ");
  const international = /^(\+|00)/.test(text);
  const digits = text.replace(/^(\+|00)/, "").replace(/\D/g, "");
  if (digits.length < 7) return text;
  if (international) {
    const length = callingCodeLength(digits);
    const code = digits.slice(0, length);
    const rest = digits.slice(length);
    if (code === "1" && rest.length === 10) return `+1 ${northAmerican(rest)}`;
    return `+${code} ${group(rest)}`;
  }
  const northAmericanLocale = /^en(-(US|CA))?$/i.test(locale);
  if (digits.length === 11 && digits.startsWith("1")) return `+1 ${northAmerican(digits.slice(1))}`;
  if (digits.length === 10 && northAmericanLocale) return northAmerican(digits);
  return group(digits);
}

/** "3:21", or "1:02:03" past an hour: a length as a clock, in tabular figures. */
export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = String(whole % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}

function unitWords(value: number, unit: "hour" | "minute" | "second", locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "long" }).format(value);
  } catch {
    return new Intl.NumberFormat("en-US", { style: "unit", unit, unitDisplay: "long" }).format(value);
  }
}

/** "3 minutes 21 seconds": a length said in words, for a screen reader. */
export function durationWords(seconds: number, locale: string): string {
  const whole = Math.max(0, Math.round(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = whole % 60;
  const parts = [hours ? unitWords(hours, "hour", locale) : "", minutes ? unitWords(minutes, "minute", locale) : "", rest || !whole ? unitWords(rest, "second", locale) : ""].filter(Boolean);
  return parts.join(" ");
}

/** A date or a time in the zone. An unknown locale or zone falls back to US English and UTC instead of taking the page down. */
export function dateIn(at: number, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(at);
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
}

/** Hour and minute the way the locale writes them: two digits in a 24-hour locale, so 09:10 lines up with 14:32. */
export function clockOptions(locale: string): Intl.DateTimeFormatOptions {
  try {
    const cycle = new Intl.DateTimeFormat(locale, { hour: "numeric", timeZone: "UTC" }).resolvedOptions().hourCycle;
    return { hour: cycle === "h23" || cycle === "h24" ? "2-digit" : "numeric", minute: "2-digit" };
  } catch {
    return { hour: "numeric", minute: "2-digit" };
  }
}

/** The calendar day in the zone, as a whole number: two moments are on the same day when their numbers are equal, and a day apart when they differ by one. */
export function dayNumber(at: number, timeZone: string): number {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(at);
  } catch {
    parts = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(at);
  }
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value ?? 0);
  return Math.floor(Date.UTC(part("year"), part("month") - 1, part("day")) / 86_400_000);
}

/** The first letter in capitals, in the language of `locale`: "yesterday" at the head of a line becomes "Yesterday". */
export function capitalise(text: string, locale: string): string {
  const [first = "", ...rest] = [...text];
  try {
    return first.toLocaleUpperCase(locale) + rest.join("");
  } catch {
    return first.toUpperCase() + rest.join("");
  }
}
