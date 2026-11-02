/**
 * The dates behind AppointmentCard, as plain functions: they hold no state and
 * call no hook, so a Server Component can use them too. Every function takes
 * the locale and the time zone, so the same input gives the same text on the
 * server and in the browser.
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
 * A date written in the locale, in the zone. Intl writes some spaces as thin
 * or narrow no-break spaces, and the version of the Unicode data decides
 * which: a plain space looks the same and every engine agrees on it.
 */
export function dateIn(at: number, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  return formatter(locale, timeZone, options).format(at).replace(/[\u00a0\u2009\u202f]/g, " ");
}

/** The calendar day of a moment in the zone, as a count of days. */
export function dayNumber(at: number, timeZone: string): number {
  const parts = formatter("en-US", timeZone, { year: "numeric", month: "numeric", day: "numeric" }).formatToParts(at);
  const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value);
  return Math.floor(Date.UTC(part("year"), part("month") - 1, part("day")) / 86_400_000);
}

/** The short name of a zone at a moment, as the locale writes it: "GMT+1", "EST". */
export function zoneName(at: number, locale: string, timeZone: string): string {
  return formatter(locale, timeZone, { timeZoneName: "short" }).formatToParts(at).find((part) => part.type === "timeZoneName")?.value ?? timeZone;
}

/** Whether a wall clock reads the same in both zones at that moment: two zones with one offset are one zone to the person looking at them. */
export function sameWallClock(at: number, first: string, second: string): boolean {
  const clock = (zone: string) => formatter("en-US", zone, { dateStyle: "short", timeStyle: "short" }).format(at);
  return clock(first) === clock(second);
}

/** "{count}" and friends in a template, filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

/** "45 min", "1 h", "1 h 30 min": the length of an appointment from its minutes, in the words of two templates. */
export function durationText(minutes: number, hour: string, minute: string): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours > 0 ? fill(hour, { count: hours }) : "", rest > 0 || hours === 0 ? fill(minute, { count: rest }) : ""].filter(Boolean).join(" ");
}
