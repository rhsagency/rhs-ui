/**
 * The numbers behind VehicleCard, as plain functions: they hold no state and
 * call no hook, so a Server Component can use them too. Every function takes
 * the locale, so the same input gives the same text on the server and in the
 * browser.
 */

const numbers = new Map<string, Intl.NumberFormat>();

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
 * A price in full, in the locale's own way ("€38,950"), with no cents: a
 * vehicle is never priced to the cent. Intl writes some spaces as no-break
 * spaces, and the version of the Unicode data decides which: a plain space
 * looks the same and every engine agrees on it. A currency code Intl does not
 * know is written next to the number instead of taking the page down.
 */
export function priceText(value: number, currency: string, locale: string): string {
  try {
    return numberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value).replace(/\s/g, " ");
  } catch {
    return `${currency} ${numberFormat(locale, { maximumFractionDigits: 0 }).format(value)}`;
  }
}

/** A count with the locale's separators: "12,400" or "12.400". */
export function countText(value: number, locale: string): string {
  return numberFormat(locale, { maximumFractionDigits: 1 }).format(value);
}

/** The distance a vehicle has driven, with its unit: "12,400 km", "7,700 mi". */
export function mileageText(value: number, unit: "km" | "mi", locale: string): string {
  return numberFormat(locale, { style: "unit", unit: unit === "mi" ? "mile" : "kilometer", unitDisplay: "short", maximumFractionDigits: 0 }).format(value).replace(/\s/g, " ");
}
