/**
 * The numbers and lists behind TourCard, as plain functions: they hold no
 * state and call no hook, so a Server Component can use them too. Every
 * function takes the locale, so the same input gives the same text on the
 * server and in the browser.
 */

const numbers = new Map<string, Intl.NumberFormat>();
const lists = new Map<string, Intl.ListFormat>();

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

/** "{count}" and friends in a template, filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

/**
 * A price in the locale's own way: a whole amount drops its cents ("€45"), one
 * with cents keeps both ("€45.50"). Intl writes some spaces as no-break
 * spaces, and the version of the Unicode data decides which: a plain space
 * looks the same and every engine agrees on it. A currency code Intl does not
 * know is written next to the number instead of taking the page down.
 */
export function priceText(value: number, currency: string, locale: string): string {
  const fraction = Number.isInteger(value) ? 0 : 2;
  try {
    return numberFormat(locale, { style: "currency", currency, minimumFractionDigits: fraction, maximumFractionDigits: fraction }).format(value).replace(/\s/g, " ");
  } catch {
    return `${currency} ${numberFormat(locale, { minimumFractionDigits: fraction, maximumFractionDigits: fraction }).format(value)}`;
  }
}

/** A count with the locale's separators: "2,193" or "2.193". */
export function countText(value: number, locale: string): string {
  return numberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

/** A rating with one decimal: "4.8". */
export function scoreText(value: number, locale: string): string {
  return numberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

/** One number with its unit written out in the locale's own words: "3 hours", "90 minutes", "2 days". */
function unitText(value: number, unit: "day" | "hour" | "minute", locale: string): string {
  return numberFormat(locale, { style: "unit", unit, unitDisplay: "long", maximumFractionDigits: 0 }).format(value).replace(/\s/g, " ");
}

/**
 * How long a tour takes, with the unit in words: "45 minutes", "3 hours",
 * "1 hour 30 minutes", "2 days". The words come from Intl, so they are the
 * locale's own and need no labels. The length is in minutes.
 */
export function durationText(minutes: number, locale: string): string {
  const total = Math.max(1, Math.round(minutes));
  if (total >= 1440 && total % 1440 === 0) return unitText(total / 1440, "day", locale);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return [hours > 0 ? unitText(hours, "hour", locale) : "", rest > 0 || hours === 0 ? unitText(rest, "minute", locale) : ""].filter(Boolean).join(" ");
}

/** "English, Dutch, German" in the reader's language: a short list of things, with no "and". */
export function listOf(items: readonly string[], locale: string): string {
  let found = lists.get(locale);
  if (!found) {
    try {
      found = new Intl.ListFormat(locale, { style: "short", type: "unit" });
    } catch {
      found = new Intl.ListFormat("en-US", { style: "short", type: "unit" });
    }
    lists.set(locale, found);
  }
  return found.format(items);
}
