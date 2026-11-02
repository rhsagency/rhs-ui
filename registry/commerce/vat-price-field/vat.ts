/** What the person types: the price without VAT ("excluding") or the price with VAT ("including"). */
export type VatMode = "excluding" | "including";

/** Both sides of one price at one VAT rate, all in minor units (4050 is 40.50 in euros). */
export interface VatPrice {
  /** The price without VAT. */
  net: number;
  /** The VAT itself. */
  vat: number;
  /** The price with VAT: always `net + vat`, so a column of the three adds up. */
  gross: number;
  /** The rate in percent: 21 is 21%. */
  rate: number;
}

/** What the field holds, and what it needs to be put back as it was: the typed amount, which side it is, and the rate. */
export interface VatInput {
  /** The amount as typed, in minor units, or null while the field is empty. */
  value: number | null;
  /** Which side the typed amount is: the price without VAT or the price with it. */
  mode: VatMode;
  /** The VAT rate in percent: 21 is 21%. */
  rate: number;
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

const BASIS = 10_000n;

/** The rate in hundredths of a percent, so 7.7% is 770 and the arithmetic stays whole. */
const basisPoints = (rate: number): bigint => BigInt(Math.max(0, Math.round(rate * 100)));

/** n / d to the nearest whole number, halves up. Both are whole and not negative. */
const divide = (n: bigint, d: bigint): bigint => (2n * n + d) / (2n * d);

const big = (minor: number): bigint => BigInt(Math.max(0, Math.trunc(minor)));

/** A price without VAT worked out to the price with it: the VAT is the net times the rate, rounded half up once. */
export function fromNet(net: number, rate: number): VatPrice {
  const vat = Number(divide(big(net) * basisPoints(rate), BASIS));
  const exact = Math.max(0, Math.trunc(net));
  return { net: exact, vat, gross: exact + vat, rate };
}

/** A price with VAT worked out to the price without it: the net is the gross divided by 1 plus the rate, rounded half up once, and the VAT is what is left. */
export function fromGross(gross: number, rate: number): VatPrice {
  const exact = Math.max(0, Math.trunc(gross));
  const net = Number(divide(big(gross) * BASIS, BASIS + basisPoints(rate)));
  return { net, vat: exact - net, gross: exact, rate };
}

/** The price for what was typed: `amount` is the net when `mode` is "excluding" and the gross when it is "including". Rounded once, so nothing is rounded twice. */
export function vatPrice(amount: number, mode: VatMode, rate: number): VatPrice {
  return mode === "excluding" ? fromNet(amount, rate) : fromGross(amount, rate);
}
