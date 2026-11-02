/**
 * The dates and numbers behind FundraiserCard, as plain functions: they hold
 * no state and call no hook, so a Server Component can use them too. Every
 * function takes the locale (and the time zone for dates), so the same input
 * gives the same text on the server and in the browser.
 */

/** A moment: a Date, an ISO string or a timestamp in ms. */
export type DateInput = Date | string | number;

const formatters = new Map<string, Intl.DateTimeFormat>();
const numbers = new Map<string, Intl.NumberFormat>();

/** A formatter for the locale and zone, kept for the next call. An unknown locale or zone falls back to US English and UTC: a typo must not take the page down. */
function formatter(locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${timeZone}|${JSON.stringify(options)}`;
  let found = formatters.get(key);
  if (!found) {
    try {
      found = new Intl.DateTimeFormat(locale, { ...options, timeZone });
    } catch {
      found = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
    }
    formatters.set(key, found);
  }
  return found;
}

/** A number formatter for the locale, kept for the next call. An unknown locale or currency falls back to US English: a typo must not take the page down. */
function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let found = numbers.get(key);
  if (!found) {
    try {
      found = new Intl.NumberFormat(locale, options);
    } catch {
      found = new Intl.NumberFormat("en-US", options.style === "currency" ? { ...options, style: "decimal", currency: undefined } : options);
    }
    numbers.set(key, found);
  }
  return found;
}

/**
 * A date written in the locale, in the zone. Intl writes some spaces as thin
 * or narrow no-break spaces, and the version of the Unicode data decides
 * which: a plain space looks the same and every engine agrees on it.
 */
export function dateIn(at: number, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  return formatter(locale, timeZone, options).format(at).replace(/\s/g, " ");
}

/** The calendar day of a moment in the zone, as a count of days. */
export function dayNumber(at: number, timeZone: string): number {
  const parts = formatter("en-US", timeZone, { year: "numeric", month: "numeric", day: "numeric" }).formatToParts(at);
  const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value);
  return Math.floor(Date.UTC(part("year"), part("month") - 1, part("day")) / 86_400_000);
}

/** "{count}" and friends in a template, filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

/**
 * An amount in the currency and locale you name: a whole amount drops its
 * cents ("€4,820"), one with cents keeps both ("€4,820.50"). A currency code
 * Intl does not know is written next to the number instead of taking the page
 * down.
 */
export function moneyText(value: number, currency: string, locale: string): string {
  const fraction = Number.isInteger(value) ? 0 : 2;
  try {
    return numberFormat(locale, { style: "currency", currency, minimumFractionDigits: fraction, maximumFractionDigits: fraction }).format(value).replace(/\s/g, " ");
  } catch {
    return `${currency} ${numberFormat(locale, { minimumFractionDigits: fraction, maximumFractionDigits: fraction }).format(value)}`;
  }
}

/** A count with the locale's separators: "112" or "1,284". */
export function countText(value: number, locale: string): string {
  return numberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

/** A share as a whole percent: "48%". */
export function percentText(share: number, locale: string): string {
  return numberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(share).replace(/\s/g, " ");
}
