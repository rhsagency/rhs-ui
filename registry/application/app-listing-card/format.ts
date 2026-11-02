/**
 * The numbers behind AppListingCard, as plain functions: they hold no state
 * and call no hook, so a Server Component can use them too. Every function
 * takes the locale, so the same input gives the same text on the server and
 * in the browser.
 */

const numbers = new Map<string, Intl.NumberFormat>();

/** A number formatter for the locale, kept for the next call. An unknown locale falls back to US English: a typo must not take the page down. */
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

/** A count with the locale's separators: "12,400" or "12.400". */
export function countText(value: number, locale: string): string {
  return numberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

/** A rating with one decimal: "4.7". */
export function scoreText(value: number, locale: string): string {
  return numberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

/** A share as a whole percent: "42%". */
export function percentText(share: number, locale: string): string {
  return numberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(Math.min(1, Math.max(0, share))).replace(/\s/g, " ");
}

/**
 * A download size from its bytes, in the unit that keeps it short: "812 KB",
 * "48 MB", "1.2 GB". Intl writes the unit in the locale's own way, and some
 * spaces as no-break spaces: a plain space looks the same and every engine
 * agrees on it.
 */
export function sizeText(bytes: number, locale: string): string {
  const unit = bytes >= 1e9 ? "gigabyte" : bytes >= 1e6 ? "megabyte" : "kilobyte";
  const divisor = unit === "gigabyte" ? 1e9 : unit === "megabyte" ? 1e6 : 1e3;
  const value = bytes / divisor;
  return numberFormat(locale, { style: "unit", unit, unitDisplay: "short", maximumFractionDigits: value < 10 ? 1 : 0 })
    .format(value)
    .replace(/\s/g, " ");
}

/** "3.2.1" is written "v3.2.1"; a version that already starts with a letter ("beta 4") is left as it is. */
export function versionText(version: string): string {
  return /^\d/.test(version.trim()) ? `v${version.trim()}` : version.trim();
}
