/**
 * The numbers and times behind RecipeCard, as plain functions: they hold no
 * state and call no hook, so a Server Component can use them too. Every
 * function takes the locale, so the same input gives the same text on the
 * server and in the browser.
 */

const numbers = new Map<string, Intl.NumberFormat>();

/** A formatter for the locale, kept for the next call. An unknown locale falls back to US English: a typo must not take the page down. */
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

/** A count with the locale's separators: "212" or "1,284". Written in full: a shortened "1.3k" is spelled differently by Node and by browsers in some languages. */
export function countText(value: number, locale: string): string {
  return numberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

/** A rating with one decimal: "4.6". */
export function scoreText(value: number, locale: string): string {
  return numberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

/**
 * A length of time from its minutes, in the locale's own short units: "45 min",
 * "1 hr 15 min", "2 hr". Intl writes some spaces as no-break or narrow
 * no-break spaces, and the version of the Unicode data decides which: a plain
 * space looks the same and every engine agrees on it.
 */
export function minutesText(total: number, locale: string): string {
  const minutes = Math.max(0, Math.round(total));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const write = (value: number, unit: "hour" | "minute") =>
    numberFormat(locale, { style: "unit", unit, unitDisplay: "short", maximumFractionDigits: 0 }).format(value).replace(/\s/g, " ");
  return [hours > 0 ? write(hours, "hour") : "", rest > 0 || hours === 0 ? write(rest, "minute") : ""].filter(Boolean).join(" ");
}
