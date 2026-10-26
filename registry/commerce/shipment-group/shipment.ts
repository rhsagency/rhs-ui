/** Whether a string is a bare calendar day such as "2026-10-23". */
const isDay = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value);

/** A date as milliseconds, or NaN. */
function parse(value: string): number {
  return Date.parse(value);
}

/** A date written out. A bare day is a calendar day, so it reads as that day in every time zone. */
export function writeDate(value: string, locale: string, options: Intl.DateTimeFormatOptions, timeZone = "UTC"): string | undefined {
  const millis = parse(value);
  return Number.isFinite(millis) ? new Intl.DateTimeFormat(locale, { ...options, timeZone: isDay(value) ? "UTC" : timeZone }).format(millis) : undefined;
}

/**
 * When a delivery arrives, as one or two days: "Fri 24 Oct", or "Thu 23 to Sat 25 Oct" with the month left off the
 * first day when both fall in the same month. `template` joins the two: "{from} to {to}".
 */
export function writeWindow(from: string | undefined, to: string | undefined, locale: string, template: string, timeZone = "UTC"): string | undefined {
  if (from === undefined) return undefined;
  const full: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };
  const last = writeDate(to ?? from, locale, full, timeZone);
  if (to === undefined || to === from) return last;
  const a = parse(from);
  const b = parse(to);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return last;
  const sameMonth = new Date(a).getUTCMonth() === new Date(b).getUTCMonth() && new Date(a).getUTCFullYear() === new Date(b).getUTCFullYear();
  const first = writeDate(from, locale, sameMonth ? { weekday: "short", day: "numeric" } : full, timeZone);
  return first === undefined || last === undefined ? last : template.replace("{from}", first).replace("{to}", last);
}
