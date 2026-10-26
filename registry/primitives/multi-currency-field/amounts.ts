/** The currencies in the menu when you name none: the ones most price lists need. */
export const DEFAULT_CURRENCIES: readonly string[] = ["EUR", "USD", "GBP", "CHF", "JPY", "CAD", "AUD", "SEK", "NOK", "DKK", "PLN"];

/** The words the field says, in its messages and to a screen reader. Each can be replaced, for another language or your own voice. */
export interface MultiCurrencyLabels {
  /** The name of the amount for a screen reader when the field has no label, id or aria-label of its own. */
  amount: string;
  /** The start of the menu button's name, which always ends in the chosen currency: "Currency: Euro (EUR)". */
  currency: string;
  /** What the search box in the menu asks. */
  search: string;
  /** What the menu says when no currency matches. */
  empty: string;
  /** What a screen reader hears after the amount: "Japanese Yen (JPY), no decimals". */
  unit: (name: string, code: string, digits: number) => string;
  /** Said when the currency changes. `amount` is the number as it now reads, or null while the field is empty. */
  changed: (name: string, amount: string | null) => string;
  /** The text is not an amount. `example` is one in this currency and locale. */
  notAnAmount: (example: string) => string;
  /** A negative amount where none is allowed. */
  negative: string;
  /** The amount is below the lowest allowed. `limit` is that amount, formatted. */
  tooLow: (limit: string) => string;
  /** The amount is above the highest allowed. */
  tooHigh: (limit: string) => string;
}

export const DEFAULT_LABELS: MultiCurrencyLabels = {
  amount: "Amount",
  currency: "Currency",
  search: "Search currencies",
  empty: "No currency matches that.",
  unit: (name, code, digits) => `${name} (${code}), ${digits === 0 ? "no decimals" : `${digits} ${digits === 1 ? "decimal" : "decimals"}`}`,
  changed: (name, amount) => (amount === null ? `Currency changed to ${name}.` : `Currency changed to ${name}. The amount is now ${amount}.`),
  notAnAmount: (example) => `Enter an amount, like ${example}.`,
  negative: "Enter an amount of zero or more.",
  tooLow: (limit) => `Enter at least ${limit}.`,
  tooHigh: (limit) => `Enter at most ${limit}.`,
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

/** How many decimals a currency has: 2 for euros, 0 for yen, 3 for Kuwaiti dinars. Asked of Intl, which knows ISO 4217, so no list here goes out of date. */
export function currencyDigits(currency: string): number {
  try {
    return numberFormat("en-US", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

const names = new Map<string, Intl.DisplayNames>();

/** The name of a currency in the locale: "Euro", "Japanse yen". The code when the browser does not know it. */
export function currencyName(currency: string, locale: string): string {
  try {
    let display = names.get(locale);
    if (!display) {
      display = new Intl.DisplayNames(locale, { type: "currency" });
      names.set(locale, display);
    }
    return display.of(currency) ?? currency;
  } catch {
    return currency;
  }
}

/** The sign a locale writes in front of an amount (the euro sign, "$", "CA$", the yen sign). The code itself where there is no sign (CHF). */
export function currencySymbol(currency: string, locale: string): string {
  try {
    return numberFormat(locale, { style: "currency", currency, currencyDisplay: "symbol" }).formatToParts(0).find((part) => part.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}

/** The decimal and the grouping sign of a locale. 12345.6 is used because some locales (Spanish, Polish) only group from five digits. */
export function separatorsOf(locale: string): { decimal: string; group: string } {
  const parts = numberFormat(locale, { useGrouping: true, minimumFractionDigits: 1 }).formatToParts(12345.6);
  return { decimal: parts.find((part) => part.type === "decimal")?.value ?? ".", group: parts.find((part) => part.type === "group")?.value ?? "," };
}

/**
 * Arabic-Indic and Persian digits and their separators, the typographic minus
 * and apostrophe, as the plain characters, so a keyboard in those scripts types
 * an amount like any other. Written by code point, so the source stays ASCII.
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

/** Characters that can be part of an amount: digits, the two separators, spaces of every kind (a group sign in French and Swiss), apostrophes and a minus. */
export function tidyTyping(raw: string): string {
  return asciiAmount(raw).replace(/[^\d.,\s'-]/g, "");
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
  if (mark === separatorsOf(locale).decimal) return digits === 0 && thousand ? null : mark;
  // The other sign is accepted too: "12,5" is a decimal, "1,234" a thousand.
  return thousand ? null : mark;
}

/** The sign, the whole part and the fraction of the amount in the text, or null when it has no digit. */
function scan(raw: string, digits: number, locale: string): { negative: boolean; whole: string; fraction: string } | null {
  const text = asciiAmount(raw);
  // A decimal sign in front of the first digit still counts: ",5" is a half.
  const first = text.search(/[.,]?\d/);
  if (first === -1) return null;
  const negative = text.slice(0, first).includes("-");
  const body = text.slice(first).replace(/[\s']/g, "").replace(/[^\d.,]/g, "");
  const sign = decimalSign(body, digits, locale);
  if (sign === null) return { negative, whole: body.replace(/[.,]/g, ""), fraction: "" };
  const at = body.lastIndexOf(sign);
  return { negative, whole: body.slice(0, at).replace(/[.,]/g, ""), fraction: body.slice(at + 1).replace(/[.,]/g, "") };
}

/**
 * The text as an amount in minor units, or null when it is not one. Either
 * decimal sign is understood ("12,5" and "12.5"), and so is a grouping sign
 * ("1.250,00", "1 250,00", "1'250.00"). More decimals than the currency has are
 * rounded half up, on the digits themselves, so no float comes between.
 */
export function parseAmount(raw: string, digits: number, locale: string): number | null {
  const found = scan(raw, digits, locale);
  if (!found) return null;
  let minor = Number(`${found.whole || "0"}${found.fraction.slice(0, digits).padEnd(digits, "0")}`);
  if (found.fraction.length > digits && found.fraction.charAt(digits) >= "5") minor += 1;
  if (!Number.isSafeInteger(minor)) return null;
  return found.negative && minor !== 0 ? -minor : minor;
}

/** An amount in minor units as the locale writes a number with that many decimals: "1,250.00", "1.250,00", "1,250". */
export function formatAmount(minor: number, digits: number, locale: string): string {
  return numberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(minor / 10 ** digits);
}

/** The same amount with its currency sign, for a message: "$1,250.00", "1.250,00 EUR" in a locale that writes it so. */
export function formatMoneyText(minor: number, currency: string, digits: number, locale: string): string {
  try {
    return numberFormat(locale, { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(minor / 10 ** digits);
  } catch {
    return `${formatAmount(minor, digits, locale)} ${currency}`;
  }
}

/** An amount moved from a currency with `from` decimals to one with `to`: 1250 (12.50) is 13 in yen. Whole integers, half up, no float. */
export function rescale(minor: number, from: number, to: number): number {
  if (from === to) return minor;
  if (to > from) return minor * 10 ** (to - from);
  const divisor = 10 ** (from - to);
  const size = Math.abs(minor);
  const rounded = Math.floor(size / divisor) + ((size % divisor) * 2 >= divisor ? 1 : 0);
  return minor < 0 && rounded !== 0 ? -rounded : rounded;
}
