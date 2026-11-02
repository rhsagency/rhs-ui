/**
 * The dates and words behind MatchScoreCard, as plain functions: they hold no
 * state and call no hook, so a Server Component can use them too. Every
 * function takes the locale and the time zone, so the same input gives the
 * same text on the server and in the browser.
 */

/** A moment: a Date, an ISO string or a timestamp in ms. */
export type DateInput = Date | string | number;

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
 * A moment written in the locale, in the zone. Intl writes some spaces as thin
 * or narrow no-break spaces, and the version of the Unicode data decides
 * which: a plain space looks the same and every engine agrees on it. Null when
 * the input is not a moment.
 */
export function dateIn(input: DateInput, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string | null {
  const at = new Date(input).getTime();
  if (Number.isNaN(at)) return null;
  return formatter(locale, timeZone, options).format(at).replace(/\s/g, " ");
}

/** "{count}" and friends in a template, filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
