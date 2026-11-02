/**
 * The numbers and times behind VenueCard, as plain functions: they hold no
 * state and call no hook, so a Server Component can use them too. Every
 * function takes the locale (and the time zone for times), so the same input
 * gives the same text on the server and in the browser.
 */

/** A moment: a Date, an ISO string or a timestamp in ms. */
export type DateInput = Date | string | number;

const formatters = new Map<string, Intl.DateTimeFormat>();
const numbers = new Map<string, Intl.NumberFormat>();

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

function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let found = numbers.get(key);
  if (!found) {
    try {
      found = new Intl.NumberFormat(locale, options);
    } catch {
      found = new Intl.NumberFormat("en-US", options);
    }
    numbers.set(key, found);
  }
  return found;
}

/** "{count}" and friends in a template, filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

/** A count with the locale's separators: "1,204" or "1.204". */
export function countText(value: number, locale: string): string {
  return numberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

/** A rating with one decimal: "4.6". */
export function scoreText(value: number, locale: string): string {
  return numberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

/** A wall-clock time such as "22:00" or "9:30": the time at the venue, which belongs to no zone. */
const WALL_CLOCK = /^(\d{1,2}):(\d{2})$/;

/**
 * A time of day written in the locale: "22:00" in one, "10:00 PM" in another.
 * A string like "22:00" is a wall clock at the venue and is written as it
 * says; any other input is a moment, written in the zone you name. Intl
 * writes some spaces as narrow no-break spaces, and the version of the
 * Unicode data decides which: a plain space looks the same and every engine
 * agrees on it. Null when the input is not a time.
 */
export function timeText(input: DateInput, locale: string, timeZone: string): string | null {
  const clock = typeof input === "string" ? WALL_CLOCK.exec(input.trim()) : null;
  const at = clock ? Date.UTC(1970, 0, 1, Number(clock[1]), Number(clock[2])) : new Date(input).getTime();
  if (Number.isNaN(at)) return null;
  return formatter(locale, clock ? "UTC" : timeZone, { hour: "numeric", minute: "2-digit" }).format(at).replace(/\s/g, " ");
}

/**
 * How far away a place is, in the unit that keeps it short: "450 m", "1.2 km",
 * or in miles "0.3 mi" and "350 ft". The distance is in metres. Intl writes the
 * unit in the locale's own way, and some spaces as no-break spaces: a plain
 * space looks the same and every engine agrees on it.
 */
export function distanceText(metres: number, units: "metric" | "imperial", locale: string): string {
  const write = (value: number, unit: string, digits: number) => numberFormat(locale, { style: "unit", unit, unitDisplay: "short", maximumFractionDigits: digits }).format(value).replace(/\s/g, " ");
  if (units === "imperial") {
    const feet = metres * 3.28084;
    return feet < 528 ? write(Math.max(10, Math.round(feet / 10) * 10), "foot", 0) : write(metres / 1609.344, "mile", 1);
  }
  return metres < 1000 ? write(Math.max(10, Math.round(metres / 10) * 10), "meter", 0) : write(metres / 1000, "kilometer", metres < 10000 ? 1 : 0);
}
