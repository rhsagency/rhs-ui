/** The words the field says, in its messages and to a screen reader. Each can be replaced, for another language or your own voice. */
export interface AmountPresetsLabels {
  /** The last chip, the one that opens the field for any other amount. */
  other: string;
  /** The word on the suggested preset. */
  popular: string;
  /** What a screen reader calls the field for any other amount. */
  customAmount: string;
  /** The amount asked for is outside both limits. `low` and `high` are written with their currency: "5 EUR". */
  between: (low: string, high: string) => string;
  /** Only a lowest amount is set. */
  atLeast: (low: string) => string;
  /** Only a highest amount is set. */
  atMost: (high: string) => string;
  /** The amount is zero or less. */
  positive: string;
  /** The text is not an amount. */
  notAnAmount: string;
}

export const DEFAULT_LABELS: AmountPresetsLabels = {
  other: "Other",
  popular: "Most popular",
  customAmount: "Other amount",
  between: (low, high) => `Choose between ${low} and ${high}.`,
  atLeast: (low) => `Choose at least ${low}.`,
  atMost: (high) => `Choose at most ${high}.`,
  positive: "Enter an amount above zero.",
  notAnAmount: "Enter an amount, in numbers.",
};

const formats = new Map<string, Intl.NumberFormat>();

/** A number format, kept: building one is far slower than using it, and a field asks on every keystroke. */
function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = formats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, options);
    formats.set(key, format);
  }
  return format;
}

/** How many decimals a currency has: 2 for euros, 0 for yen, 3 for Kuwaiti dinars. Asked of Intl, which knows ISO 4217. */
export function currencyDigits(currency: string): number {
  try {
    return numberFormat("en-US", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

/** The sign a locale writes in front of an amount (the euro sign, "$", "CA$"). The code itself where there is no sign (CHF). */
export function currencySymbol(currency: string, locale: string): string {
  try {
    return numberFormat(locale, { style: "currency", currency, currencyDisplay: "symbol" }).formatToParts(0).find((part) => part.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}

/** The decimal sign of a locale. */
function decimalOf(locale: string): string {
  return numberFormat(locale, { useGrouping: true, minimumFractionDigits: 1 }).formatToParts(12345.6).find((part) => part.type === "decimal")?.value ?? ".";
}

/**
 * Arabic-Indic and Persian digits and their separators, the typographic minus
 * and apostrophe, as the plain characters. Written by code point, so the
 * source stays ASCII.
 */
function asciiAmount(text: string): string {
  let plain = "";
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code >= 0x660 && code <= 0x669) plain += String(code - 0x660);
    else if (code >= 0x6f0 && code <= 0x6f9) plain += String(code - 0x6f0);
    else if (code === 0x66b) plain += ".";
    else if (code === 0x66c) plain += ",";
    else if (code === 0x2212 || (code >= 0x2010 && code <= 0x2015)) plain += "-";
    else if (code === 0x2019) plain += "'";
    else plain += char;
  }
  return plain;
}

/** What may stay in the field while someone types: digits, the two decimal signs, spaces and apostrophes. A gift is never negative, so a minus goes too. */
export function tidyTyping(raw: string): string {
  return asciiAmount(raw).replace(/[^\d.,\s']/g, "");
}

/** Which sign in the text is the decimal one, or null when there is none ("1.234.567" has only grouping). */
function decimalSign(body: string, digits: number, locale: string): string | null {
  const marks = body.match(/[.,]/g);
  if (!marks) return null;
  // Both are there ("1.234,56", "1,234.56"): the last one is the decimal sign.
  if (new Set(marks).size === 2) return body.lastIndexOf(".") > body.lastIndexOf(",") ? "." : ",";
  // The same sign twice or more is only grouping.
  if (marks.length > 1) return null;
  const mark = marks[0] ?? ".";
  const [before = "", after = ""] = body.split(mark);
  const thousand = after.length === 3 && /^[1-9]\d{0,2}$/.test(before);
  // The locale's own sign is a decimal, except for a currency with no decimals, where "1.234" can only be a thousand.
  if (mark === decimalOf(locale)) return digits === 0 && thousand ? null : mark;
  // The other sign is accepted too: "12,5" is a decimal, "1,234" a thousand.
  return thousand ? null : mark;
}

/**
 * The text as an amount in minor units, or null when it is not one. Either
 * decimal sign is understood ("12,5" and "12.5"), and so is a grouping sign
 * ("1.250,00", "1 250,00"). More decimals than the currency has are rounded half
 * up, on the digits themselves, so no float comes between.
 */
export function parseAmount(raw: string, digits: number, locale: string): number | null {
  const text = asciiAmount(raw);
  // A decimal sign in front of the first digit still counts: ",5" is a half.
  const first = text.search(/[.,]?\d/);
  if (first === -1) return null;
  const body = text.slice(first).replace(/[\s']/g, "").replace(/[^\d.,]/g, "");
  const sign = decimalSign(body, digits, locale);
  const at = sign === null ? -1 : body.lastIndexOf(sign);
  const whole = (at === -1 ? body : body.slice(0, at)).replace(/[.,]/g, "");
  const fraction = at === -1 ? "" : body.slice(at + 1).replace(/[.,]/g, "");
  let minor = Number(`${whole || "0"}${fraction.slice(0, digits).padEnd(digits, "0")}`);
  if (fraction.length > digits && fraction.charAt(digits) >= "5") minor += 1;
  return Number.isSafeInteger(minor) ? minor : null;
}

/** An amount in minor units as the locale writes a number with that many decimals: "1,250.00", "1.250,00", "1,250". */
export function formatAmount(minor: number, digits: number, locale: string): string {
  return numberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(minor / 10 ** digits);
}

/** A preset as a chip says it, in the locale's own way: "$25", "$12.50", "25 EUR" where that is how it is written. Whole amounts lose their zeros. */
export function formatPreset(minor: number, currency: string, locale: string): string {
  const digits = currencyDigits(currency);
  const whole = minor % 10 ** digits === 0;
  try {
    return numberFormat(locale, { style: "currency", currency, minimumFractionDigits: whole ? 0 : digits, maximumFractionDigits: digits }).format(minor / 10 ** digits);
  } catch {
    return `${formatAmount(minor, digits, locale)} ${currency}`;
  }
}

/** An amount next to its code, as a limit is explained: "5 EUR", "12.50 EUR". Whole amounts lose their zeros. */
export function formatWithCode(minor: number, currency: string, locale: string): string {
  const digits = currencyDigits(currency);
  const whole = minor % 10 ** digits === 0;
  return `${numberFormat(locale, { minimumFractionDigits: whole ? 0 : digits, maximumFractionDigits: digits }).format(minor / 10 ** digits)} ${currency}`;
}
