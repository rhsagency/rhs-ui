/**
 * The times and numbers behind DeliveryStopCard, as plain functions: they hold
 * no state and call no hook, so a Server Component can use them too. Every
 * function takes the locale and the time zone, so the same input gives the
 * same text on the server and in the browser.
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

/**
 * A time of day written in the locale, in the zone: "12:30" in one, "12:30 PM"
 * in another. Intl writes some spaces as narrow no-break spaces, and the
 * version of the Unicode data decides which: a plain space looks the same and
 * every engine agrees on it. Null when the input is not a moment.
 */
export function timeIn(input: DateInput, locale: string, timeZone: string): string | null {
  const at = new Date(input).getTime();
  if (Number.isNaN(at)) return null;
  return formatter(locale, timeZone, { hour: "numeric", minute: "2-digit" }).format(at).replace(/\s/g, " ");
}

/** "{count}" and friends in a template, filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

/** A count with the locale's separators: "2" or "1,200". */
export function countText(value: number, locale: string): string {
  let found = numbers.get(locale);
  if (!found) {
    try {
      found = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    } catch {
      found = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
    }
    numbers.set(locale, found);
  }
  return found.format(value);
}
