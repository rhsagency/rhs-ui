/** The words the field says, in its line under the field and to a screen reader. Each can be replaced, for another language or your own voice. */
export interface PercentageLabels {
  /** The name of the field for a screen reader when it has no label, id or aria-label of its own. */
  name: string;
  /** What a screen reader hears after the number: "12.5 percent". */
  unit: string;
  /** The sentence under the field once there is a base: "20% of 480.00 EUR is 96.00 EUR". */
  result: (rate: string, base: string, result: string) => string;
  /** The line under the field while there is no rate yet. */
  prompt: (base: string) => string;
  /** Said when a number above the highest allowed was brought down to it. */
  capped: (limit: string) => string;
  /** Said when a number below the lowest allowed was brought up to it. */
  raised: (limit: string) => string;
}

export const DEFAULT_LABELS: PercentageLabels = {
  name: "Percentage",
  unit: "percent",
  result: (rate, base, result) => `${rate}% of ${base} is ${result}`,
  prompt: (base) => `Enter a rate to apply it to ${base}.`,
  capped: (limit) => `Capped at ${limit}%.`,
  raised: (limit) => `Raised to the lowest allowed, ${limit}%.`,
};

const formats = new Map<string, Intl.NumberFormat>();

/** A number format, kept: building one is far slower than using it. */
function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = formats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, options);
    formats.set(key, format);
  }
  return format;
}

/**
 * The digits, the separators and the minus of a keyboard in another script
 * (Arabic-Indic, Persian) and the typographic minus, as plain characters.
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
    else plain += char;
  }
  return plain;
}

/** What may stay in the field while someone types: digits, the two decimal signs, a minus and spaces. The percent sign is the field's own, so a typed one goes. */
export function tidyTyping(raw: string): string {
  return asciiNumber(raw).replace(/[^\d.,\s-]/g, "");
}

/**
 * The text as a percentage, rounded half up to `precision` decimals on the
 * digits themselves, or null when it is not a number. "12,5", "12.5" and
 * "12.5%" all mean twelve and a half: the last sign is the decimal one, and a
 * sign that comes twice is only grouping ("1.000.000").
 */
export function parsePercent(raw: string, precision: number): number | null {
  const text = asciiNumber(raw);
  // A decimal sign in front of the first digit still counts: ",5" is a half.
  const first = text.search(/[.,]?\d/);
  if (first === -1) return null;
  const negative = text.slice(0, first).includes("-");
  const body = text.slice(first).replace(/[^\d.,]/g, "");
  const last = Math.max(body.lastIndexOf("."), body.lastIndexOf(","));
  const marks = body.match(/[.,]/g) ?? [];
  const repeated = marks.length > 1 && new Set(marks).size === 1;
  const at = repeated ? -1 : last;
  const whole = (at === -1 ? body : body.slice(0, at)).replace(/[.,]/g, "");
  const fraction = at === -1 ? "" : body.slice(at + 1).replace(/[.,]/g, "");
  let scaled = Number(`${whole || "0"}${fraction.slice(0, precision).padEnd(precision, "0")}`);
  if (fraction.length > precision && fraction.charAt(precision) >= "5") scaled += 1;
  if (!Number.isSafeInteger(scaled)) return null;
  const value = scaled / 10 ** precision;
  return negative && value !== 0 ? -value : value;
}

/** The number as the locale writes it, without trailing zeros: 12.5, 21, "12,5" in the Netherlands. */
export function formatPercent(value: number, precision: number, locale: string): string {
  return numberFormat(locale, { minimumFractionDigits: 0, maximumFractionDigits: precision }).format(value);
}

/** A number kept to `precision` decimals, so 0.1 + 0.2 reads 0.3. */
export function roundTo(value: number, precision: number): number {
  const scale = 10 ** precision;
  const scaled = Math.abs(value) * scale;
  // The epsilon lifts 1.005 * 100 = 100.49999999999999 to the half it was meant to be.
  const rounded = Math.round(scaled * (1 + Number.EPSILON)) / scale;
  return value < 0 && rounded !== 0 ? -rounded : rounded;
}

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** How many decimals a currency has: 2 for euros, 0 for yen, 3 for Kuwaiti dinars. Asked of Intl. */
export function currencyDigits(currency: string): number {
  try {
    return numberFormat("en-US", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

/** An amount in minor units as it is written next to its code: "480.00 EUR", "480 JPY". */
export function formatWithCode(minor: number, currency: string, locale: string): string {
  const digits = currencyDigits(currency);
  return `${numberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(minor / 10 ** digits)} ${currency}`;
}

/** The part of `base` (minor units) a rate of percent is, in minor units, rounded half away from zero. Whole numbers all the way, so no float comes between. */
export function percentOf(base: number, rate: number, precision: number): number {
  const scale = 10 ** precision;
  const scaledRate = Math.round(rate * scale);
  const exact = (base * scaledRate) / (100 * scale);
  const rounded = Math.round(Math.abs(exact));
  return exact < 0 && rounded !== 0 ? -rounded : rounded;
}
