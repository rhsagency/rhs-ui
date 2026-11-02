/**
 * The dates and words behind CertificateCard, as plain functions: they hold no
 * state and call no hook, so a Server Component can use them too. Every
 * function takes the locale and the time zone, so the same input gives the
 * same text on the server and in the browser.
 */

/** A moment or a day: a Date, an ISO string or a timestamp in ms. A string such as "2027-01-12" is a day on the calendar and never shifts with the time zone. */
export type DateInput = Date | string | number;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const formatters = new Map<string, Intl.DateTimeFormat>();

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
 * A date written in the locale, in the zone. A date-only string is a day on
 * the calendar, so it is read and written in UTC and never shifts. Intl
 * writes some spaces as thin or narrow no-break spaces, and the version of
 * the Unicode data decides which: a plain space looks the same and every
 * engine agrees on it. Null when the input is not a date.
 */
export function dateIn(input: DateInput, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string | null {
  const calendar = typeof input === "string" && DATE_ONLY.test(input);
  const at = new Date(calendar ? `${input}T00:00:00Z` : input).getTime();
  if (Number.isNaN(at)) return null;
  return formatter(locale, calendar ? "UTC" : timeZone, options).format(at).replace(/\s/g, " ");
}

/** "{name}" and friends in a template, filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
