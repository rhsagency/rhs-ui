/**
 * The numbers behind PropertyCard, as plain functions: they hold no state and
 * call no hook, so a Server Component can use them too. Every function takes
 * the locale, so the same input gives the same text on the server and in the
 * browser.
 */

const formats = new Map<string, Intl.NumberFormat>();

function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let found = formats.get(key);
  if (!found) {
    try {
      found = new Intl.NumberFormat(locale, options);
    } catch {
      found = new Intl.NumberFormat("en-US", options);
    }
    formats.set(key, found);
  }
  return found;
}

/**
 * A price in full, in the locale's own way ("€1,250,000"), with no cents: a
 * listing is never priced to the cent. Intl writes some spaces as no-break
 * spaces, and the version of the Unicode data decides which: a plain space
 * looks the same and every engine agrees on it. A currency code Intl does not
 * know is written next to the number instead of taking the page down.
 */
export function priceText(value: number, currency: string, locale: string): string {
  try {
    return numberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value).replace(/[\u00a0\u2009\u202f]/g, " ");
  } catch {
    return `${currency} ${numberFormat(locale, { maximumFractionDigits: 0 }).format(value)}`;
  }
}

/** A count with the locale's separators: "1,250" or "1.250". */
export function countText(value: number, locale: string): string {
  return numberFormat(locale, { maximumFractionDigits: 1 }).format(value);
}

/** "{count}" and friends in a template, filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
