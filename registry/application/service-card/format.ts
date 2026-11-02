/**
 * The numbers behind ServiceCard, as plain functions: they hold no state and
 * call no hook, so a Server Component can use them too. Every function takes
 * the locale, so the same input gives the same text on the server and in the
 * browser.
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
 * A price in the locale's own way: a whole amount drops its cents ("€60"), one
 * with cents keeps both ("€59.50"). Intl writes some spaces as no-break
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

/** A count with the locale's separators: "12" or "1,200". */
export function countText(value: number, locale: string): string {
  return numberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

/** "45 min", "1 h", "1 h 30 min": the length of a service from its minutes, in the words of two templates. */
export function durationText(minutes: number, hour: string, minute: string): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return [hours > 0 ? fill(hour, { count: hours }) : "", rest > 0 || hours === 0 ? fill(minute, { count: rest }) : ""].filter(Boolean).join(" ");
}
