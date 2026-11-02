/** The three prices of a product, in minor units (4900 is 49.00 in euros). Null is a field that is empty. */
export interface PricingValue {
  /** What the customer pays. */
  price: number | null;
  /** The earlier or list price shown crossed out beside the price. */
  compareAt: number | null;
  /** What one item costs you. Never shown to customers. */
  cost: number | null;
}

/** The most whole currency units the field takes, so every amount stays an exact integer. */
const MAX_WHOLE = 12;

/** Digits after the decimal point the currency has, asked of Intl so the list never goes stale: 2 for euros, 0 for yen, 3 for Kuwaiti dinars. */
export function minorDigits(currency: string, locale: string): number {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
}

/** The sign this locale writes between the whole part and the fraction: "." or ",". */
function decimalOf(locale: string): string {
  return new Intl.NumberFormat(locale).formatToParts(1.5).find((part) => part.type === "decimal")?.value ?? ".";
}

interface Parts {
  whole: string;
  fraction: string;
  /** The separator the person typed between the two, or null when there is none. */
  sign: string | null;
}

/**
 * Reads typed text as a whole part and a fraction. "12,5", "12.50", "1.234,50" and "1,234.50" all work: when both
 * kinds of separator are there the last one is the decimal sign, when only one is there it is the decimal sign if
 * it is the locale's, if it comes once and leaves no more digits than the currency has decimals ("12.5", "12,50"),
 * and a thousands separator otherwise ("1,234", "1.234.567"). Currencies without decimals have no decimal sign.
 */
function split(raw: string, digits: number, locale: string): Parts {
  const cleaned = raw.replace(/[^\d.,]/g, "");
  const last = Math.max(cleaned.lastIndexOf(","), cleaned.lastIndexOf("."));
  const plain = (text: string) => text.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, MAX_WHOLE);
  if (last === -1 || digits === 0) return { whole: plain(cleaned), fraction: "", sign: null };
  const sign = cleaned.charAt(last);
  const before = cleaned.slice(0, last);
  const tail = cleaned.slice(last + 1);
  const other = sign === "," ? "." : ",";
  const repeated = before.includes(sign);
  const decimal = !repeated && (before.includes(other) || sign === decimalOf(locale) || tail.length <= digits);
  if (!decimal) return { whole: plain(cleaned), fraction: "", sign: null };
  return { whole: plain(before), fraction: tail.replace(/\D/g, "").slice(0, digits), sign };
}

/** Typed text kept to what can be an amount: digits and at most one decimal sign, never more decimals than the currency has. */
export function tidyTyping(raw: string, digits: number, locale: string): string {
  const { whole, fraction, sign } = split(raw, digits, locale);
  return sign === null ? whole : `${whole || "0"}${sign}${fraction}`;
}

/** Typed text as an amount in minor units, or null when there is no number in it. */
export function parseAmount(raw: string, digits: number, locale: string): number | null {
  if (!/\d/.test(raw)) return null;
  const { whole, fraction } = split(raw, digits, locale);
  return Number(`${whole || "0"}${fraction.padEnd(digits, "0")}`);
}

/** An amount in minor units as the field shows it once it is left: the locale's grouping and decimal sign, every decimal the currency has. */
export function formatAmount(minor: number, digits: number, locale: string): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(minor / 10 ** digits);
}

/** An amount in minor units as money in the given currency and locale. */
export function formatMoneyText(minor: number, currency: string, digits: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(minor / 10 ** digits);
}

/** A rate in percent as text in the locale: "21%". Fractions stay ("7.7%"). */
export function formatRate(rate: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 }).format(rate / 100);
}

/** Everything worked out from the three prices, in whole minor units. A figure is null where it cannot be known. */
export interface Pricing {
  /** How much the compare-at price is above the price, as a share of the compare-at price (0.2 is 20% off). Null unless the compare-at price is above the price. */
  discount: number | null;
  /** How much the customer saves, in minor units. */
  saved: number | null;
  /** Price minus cost, in minor units. Negative when the product sells below cost. */
  profit: number | null;
  /** Profit as a share of the price (0.6 is a 60% margin). Null when there is no price above zero or no cost. */
  margin: number | null;
  /** True when a compare-at price is given that is lower than the price: a mistake worth saying so. */
  compareAtTooLow: boolean;
}

/**
 * Discount, profit and margin from the three prices. The prices are whole minor units, so the differences are exact
 * and each share is one division of two whole numbers at the end: nothing is rounded before it is worked out.
 */
export function pricingOf({ price, compareAt, cost }: PricingValue): Pricing {
  const above = price !== null && compareAt !== null && compareAt > price && compareAt > 0;
  const profit = price !== null && cost !== null ? price - cost : null;
  return {
    discount: above ? (compareAt - price) / compareAt : null,
    saved: above ? compareAt - price : null,
    profit,
    margin: profit !== null && price !== null && price > 0 ? profit / price : null,
    compareAtTooLow: price !== null && compareAt !== null && compareAt < price,
  };
}
