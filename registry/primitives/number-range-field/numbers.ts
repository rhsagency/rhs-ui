/** A range with open ends: a number at either end, or null when that end is left open. */
export interface NumberRange {
  min: number | null;
  max: number | null;
}

/** The words the field says, for another language or your own voice. Each can be replaced. */
export interface NumberRangeLabels {
  /** The name of the first field for a screen reader, read after the group's label: "Mileage, Minimum". */
  minName: string;
  /** The name of the second field for a screen reader. */
  maxName: string;
  /** What the first field shows while it is empty. It says what an open end means. */
  noMin: string;
  /** What the second field shows while it is empty. */
  noMax: string;
  /** The word between the two fields. */
  to: string;
  /** Said when the end is below the start; `start` is the start as written, with its unit. */
  inverted: (start: string) => string;
  /** Said when a number above the highest allowed was brought down to it. */
  capped: (limit: string) => string;
  /** Said when a number below the lowest allowed was brought up to it. */
  raised: (limit: string) => string;
}

export const DEFAULT_LABELS: NumberRangeLabels = {
  minName: "Minimum",
  maxName: "Maximum",
  noMin: "No min",
  noMax: "No max",
  to: "to",
  inverted: (start) => `The maximum cannot be below the minimum of ${start}.`,
  capped: (limit) => `Brought down to the highest allowed, ${limit}.`,
  raised: (limit) => `Brought up to the lowest allowed, ${limit}.`,
};

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** True when both ends are numbers and the end is below the start. */
export function isInverted(range: NumberRange): boolean {
  return range.min !== null && range.max !== null && range.max < range.min;
}

/** How many decimals a step has: 1 for 0.5, 2 for 0.25, 0 for 1000. */
export function decimalsOf(step: number): number {
  return Number.isInteger(step) ? 0 : (String(step).split(".")[1]?.length ?? 2);
}

/** A number kept to `digits` decimals, so 0.1 + 0.2 reads 0.3. */
export function roundTo(value: number, digits: number): number {
  const rounded = Number(value.toFixed(digits));
  return Object.is(rounded, -0) ? 0 : rounded;
}

const formats = new Map<string, Intl.NumberFormat>();
const separators = new Map<string, { group: string; decimal: string }>();

/** A number format, kept: building one is far slower than using it. */
function numberFormat(locale: string, digits: number, grouping: boolean): Intl.NumberFormat {
  const key = `${locale}|${digits}|${grouping}`;
  let format = formats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, { minimumFractionDigits: 0, maximumFractionDigits: digits, useGrouping: grouping });
    formats.set(key, format);
  }
  return format;
}

/** The grouping and decimal signs the locale writes, asked of Intl. */
function separatorsOf(locale: string): { group: string; decimal: string } {
  let found = separators.get(locale);
  if (!found) {
    const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
    found = { group: parts.find((part) => part.type === "group")?.value ?? ",", decimal: parts.find((part) => part.type === "decimal")?.value ?? "." };
    separators.set(locale, found);
  }
  return found;
}

/** A number as the locale writes it, with its grouping unless that is switched off: 60,000 in the US, 60.000 in the Netherlands, 2018 for a year. */
export function formatNumber(value: number, locale: string, digits: number, grouping = true): string {
  return numberFormat(locale, digits, grouping).format(value);
}

const DECIMAL_DIGIT = /^\p{Nd}$/u;

/**
 * The value of a decimal digit written in any script (Arabic-Indic, Persian,
 * Bengali, Devanagari, Thai and the rest), or null when the character is not
 * one. The digits of a script are consecutive code points, zero first, in runs
 * of a multiple of ten, so the place in the run is the value.
 */
function digitOf(char: string): number | null {
  if (!DECIMAL_DIGIT.test(char)) return null;
  const code = char.codePointAt(0) ?? 0;
  let start = code;
  while (start > 0 && DECIMAL_DIGIT.test(String.fromCodePoint(start - 1))) start -= 1;
  return (code - start) % 10;
}

/**
 * The digits of a keyboard in another script and the typographic minus, as
 * plain characters. Written by code point, so the source stays ASCII.
 */
function asciiNumber(text: string): string {
  let plain = "";
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    const digit = code > 127 ? digitOf(char) : null;
    if (digit !== null) plain += String(digit);
    else if (code === 0x66b) plain += ".";
    else if (code === 0x66c) plain += ",";
    else if (code === 0x2212 || (code >= 0x2010 && code <= 0x2015)) plain += "-";
    else plain += char;
  }
  return plain;
}

/** What may stay in the field while someone types: digits, the two decimal signs, spaces and, where a negative number is allowed, a minus in front. */
export function tidyTyping(raw: string, allowNegative: boolean): string {
  const plain = asciiNumber(raw).replace(/[^\d.,\s-]/g, "");
  const negative = /^\s*-/.test(plain);
  return (negative && allowNegative ? "-" : "") + plain.replace(/-/g, "");
}

/**
 * The text as a number, or null when it is not one. The locale decides what a
 * lone sign means: "1,500" is fifteen hundred where a comma groups, and "1,5"
 * is one and a half; a sign that comes twice is only grouping, and when both
 * signs are there the last one is the decimal one.
 */
export function parseNumber(raw: string, locale: string): number | null {
  const text = asciiNumber(raw);
  const first = text.search(/\d|[.,]\d/);
  if (first === -1) return null;
  const negative = text.slice(0, first).includes("-");
  const body = text.slice(first).replace(/[^\d.,]/g, "");
  const marks = body.match(/[.,]/g) ?? [];
  let whole = body;
  let fraction = "";
  if (marks.length > 0) {
    const last = Math.max(body.lastIndexOf("."), body.lastIndexOf(","));
    let decimalAt = -1;
    if (new Set(marks).size === 2) {
      decimalAt = last;
    } else if (marks.length === 1) {
      const integer = body.slice(0, last);
      const digitsAfter = body.length - last - 1;
      // Three digits behind a sign the locale does not use for decimals are a group, unless the number starts with a zero ("0,500").
      decimalAt = body.charAt(last) === separatorsOf(locale).decimal ? last : digitsAfter === 3 && integer !== "" && !/^0+$/.test(integer) ? -1 : last;
    }
    if (decimalAt === -1) {
      whole = body.replace(/[.,]/g, "");
    } else {
      whole = body.slice(0, decimalAt).replace(/[.,]/g, "");
      fraction = body.slice(decimalAt + 1).replace(/[.,]/g, "");
    }
  }
  if (whole.length > 15) return null;
  const value = Number(`${whole || "0"}.${fraction || "0"}`);
  if (!Number.isFinite(value)) return null;
  return negative && value !== 0 ? -value : value;
}
