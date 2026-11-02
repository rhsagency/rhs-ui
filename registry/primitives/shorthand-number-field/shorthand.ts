/** The words the field says, in the line under it and to a screen reader. Each can be replaced, for another language or your own voice. */
export interface ShorthandLabels {
  /** The name of the field for a screen reader when it has no label, id or aria-label of its own. */
  name: string;
  /** What the line under the field says while nothing is typed: the forms that are understood. */
  hint: string;
  /** What a screen reader hears once the typing pauses: the full figure, with the unit. */
  said: (figure: string, unit: string) => string;
  /** Said when the text is not a number. `examples` are forms that would work. */
  unreadable: (examples: string) => string;
  /** The number is below the lowest allowed. `limit` is that number, written out with its unit. */
  atLeast: (limit: string) => string;
  /** The number is above the highest allowed. */
  atMost: (limit: string) => string;
}

export const DEFAULT_LABELS: ShorthandLabels = {
  name: "Number",
  hint: "Try 250k, 1.2M or 3b.",
  said: (figure, unit) => (unit ? `${figure} ${unit}` : figure),
  unreadable: (examples) => `That is not a number I can read. Try ${examples}.`,
  atLeast: (limit) => `Enter at least ${limit}.`,
  atMost: (limit) => `Enter at most ${limit}.`,
};

/** How a number is written when the field is left: the whole figure, or short with a letter. */
export type ShorthandDisplay = "full" | "compact";

const SUFFIXES: Readonly<Record<string, number>> = {
  k: 1e3,
  thousand: 1e3,
  m: 1e6,
  million: 1e6,
  b: 1e9,
  bn: 1e9,
  billion: 1e9,
  t: 1e12,
  tn: 1e12,
  trillion: 1e12,
};

const LETTERS: readonly (readonly [number, string])[] = [
  [1e12, "T"],
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "K"],
];

const formats = new Map<string, Intl.NumberFormat>();

/** A number format, kept: building one is far slower than using it, and a field asks on every keystroke. */
function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = formats.get(key);
  if (!format) {
    try {
      format = new Intl.NumberFormat(locale, options);
    } catch {
      format = new Intl.NumberFormat("en-US", options);
    }
    formats.set(key, format);
  }
  return format;
}

/** The decimal and the grouping sign of a locale. 12345.6 is used because some locales (Spanish, Polish) only group from five digits. */
function separatorsOf(locale: string): { decimal: string; group: string } {
  const parts = numberFormat(locale, { useGrouping: true, minimumFractionDigits: 1 }).formatToParts(12345.6);
  return { decimal: parts.find((part) => part.type === "decimal")?.value ?? ".", group: parts.find((part) => part.type === "group")?.value ?? "," };
}

/**
 * The digits and separators of a keyboard in another script (Arabic-Indic,
 * Persian) and the typographic minus and apostrophe, as plain characters.
 * Written by code point, so the source stays ASCII.
 */
function asciiNumber(text: string): string {
  let plain = "";
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code >= 0x660 && code <= 0x669) plain += String(code - 0x660);
    else if (code >= 0x6f0 && code <= 0x6f9) plain += String(code - 0x6f0);
    else if (code === 0x66b) plain += ".";
    else if (code === 0x66c) plain += ",";
    else if (code === 0x2212 || (code >= 0x2010 && code <= 0x2015)) plain += "-";
    else if (code === 0x2019) plain += "'";
    else if (code === 0xa0 || code === 0x202f) plain += " ";
    else plain += char;
  }
  return plain;
}

/** Which sign in the text is the decimal one, or null when there is none ("1.234.567" has only grouping). */
function decimalSign(body: string, locale: string): string | null {
  const marks = body.match(/[.,]/g);
  if (!marks) return null;
  // Both are there ("1.234,56", "1,234.56"): the last one is the decimal sign.
  if (new Set(marks).size === 2) return body.lastIndexOf(".") > body.lastIndexOf(",") ? "." : ",";
  // The same sign twice or more is only grouping.
  if (marks.length > 1) return null;
  const mark = marks[0] ?? ".";
  const [before = "", after = ""] = body.split(mark);
  // The locale's own sign is a decimal. The other one is accepted as a decimal too ("1,2k" in English), unless it looks like a thousand ("1,200").
  if (mark === separatorsOf(locale).decimal) return mark;
  return after.length === 3 && /^[1-9]\d{0,2}$/.test(before) ? null : mark;
}

/** What the text came to: nothing at all, a number, or something that is not one. */
export type Reading = { kind: "empty" } | { kind: "number"; value: number } | { kind: "unreadable" };

/**
 * The text as a number. k, m, b and t after the digits (or thousand, million,
 * billion and trillion in words) stand for a thousand, a million, a billion and
 * a trillion, so "250k" is 250000 and "1.2 million" is 1200000. The decimal
 * sign is the locale's, and the other one is understood too, so "1,2k" and
 * "1.2k" both mean 1200 while "1,200" is twelve hundred. A currency sign in
 * front and the field's own unit behind are ignored, and so are spaces, which
 * French and Swiss people use to group digits. The sums are done on the digits
 * themselves, so 1.1k is exactly 1100.
 */
export function readShorthand(raw: string, locale: string, unit = ""): Reading {
  // A run of spaces is one space, and nothing that is a number is long: this keeps a pasted wall of text from making the check slow.
  let text = asciiNumber(raw).replace(/\s+/g, " ").trim().toLowerCase();
  if (!text) return { kind: "empty" };
  if (text.length > 80) return { kind: "unreadable" };
  text = text.replace(/^([+-]?)\s*[$€£¥]\s*/, "$1");
  const word = unit.trim().toLowerCase();
  if (word && text.endsWith(word)) text = text.slice(0, text.length - word.length).trim();
  if (!text) return { kind: "empty" };
  const match = /^([+-])?\s*((?:\d|[.,]\d)[\d.,'\s]*?)\s*([a-z]*)$/.exec(text);
  if (!match) return { kind: "unreadable" };
  const multiplier = match[3] ? SUFFIXES[match[3]] : 1;
  if (multiplier === undefined) return { kind: "unreadable" };
  const body = (match[2] ?? "").replace(/[\s']/g, "");
  const sign = decimalSign(body, locale);
  const at = sign === null ? -1 : body.lastIndexOf(sign);
  const whole = (at === -1 ? body : body.slice(0, at)).replace(/[.,]/g, "");
  const fraction = at === -1 ? "" : body.slice(at + 1).replace(/[.,]/g, "");
  const scaled = Number(`${whole || "0"}${fraction}`);
  if (!Number.isSafeInteger(scaled)) return { kind: "unreadable" };
  // Zeros first, then the move of the point: a multiplier is a power of ten, so the sum stays on whole numbers for as long as it can.
  const zeros = Math.round(Math.log10(multiplier));
  const value = fraction.length <= zeros ? scaled * 10 ** (zeros - fraction.length) : scaled / 10 ** (fraction.length - zeros);
  if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) return { kind: "unreadable" };
  return { kind: "number", value: match[1] === "-" && value !== 0 ? -value : value };
}

/** The whole figure as the locale writes it, with grouping: 1,200 or 1.200. */
export function formatFull(value: number, locale: string): string {
  return numberFormat(locale, { useGrouping: true, maximumFractionDigits: 10 }).format(value);
}

/** The figure short with a letter, 1.2K or 3B, when that loses nothing (two decimals at most); the whole figure when it would. */
export function formatCompact(value: number, locale: string): string {
  const size = Math.abs(value);
  for (const [multiplier, letter] of LETTERS) {
    if (size < multiplier) continue;
    const scaled = value / multiplier;
    if (Math.abs(scaled * 100 - Math.round(scaled * 100)) > 1e-6) break;
    return `${numberFormat(locale, { useGrouping: true, maximumFractionDigits: 2 }).format(scaled)}${letter}`;
  }
  return formatFull(value, locale);
}

/** A number as the field writes it when it is left. */
export const write = (value: number, display: ShorthandDisplay, locale: string): string => (display === "compact" ? formatCompact(value, locale) : formatFull(value, locale));
