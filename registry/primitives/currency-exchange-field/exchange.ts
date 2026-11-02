/** Which of the two amounts is meant. */
export type Side = "send" | "receive";

/** An amount and the currency it is in. */
export interface Leg {
  /** The amount in minor units, as a whole number: 1250 is 12.50 in euros and 1,250 in yen. Null while there is none. */
  minor: number | null;
  /** The ISO 4217 code: "EUR". */
  currency: string;
}

/** Both amounts, and the one that is fixed: the one that was typed last. The other is worked out from it. */
export interface ExchangeValue {
  send: Leg;
  receive: Leg;
  fixed: Side;
}

/** Rates as a table: `table.EUR.USD` is how many dollars one euro buys. A pair that is missing is taken from the other way round. */
export type RateTable = Readonly<Record<string, Readonly<Record<string, number>>>>;

/** Rates as a function: how many units of `to` one unit of `from` buys, or null when there is no rate. */
export type RateFunction = (from: string, to: string) => number | null | undefined;

export type Rates = RateTable | RateFunction;

/** What sending costs. It comes out of what is sent, before the rate is applied. */
export interface ExchangeFee {
  /** A share of the amount sent: 0.5 is half a percent. */
  percent?: number;
  /**
   * A fixed part, in minor units of the currency that is sent. A bare number counts the minor units of whichever currency is sent (99 is 0.99 in euros and 99 in yen),
   * so give one figure per currency code ({ EUR: 99, JPY: 150 }) when the field can send more than one. A currency the record does not name has no fixed part.
   */
  flat?: ExchangeLimit;
  /** What the row says, in place of "Fee". */
  label?: string;
}

/** A fee as an object, or as a function that is given what is sent and returns the fee in minor units of that currency. */
export type FeeSource = ExchangeFee | ((sent: { minor: number; currency: string }) => number);

/**
 * One limit for every currency, or one per currency code, in minor units of the currency that is sent. A bare number is read in whichever currency is sent
 * (1000 is 10.00 in euros and 1,000 in yen), so give one figure per code ({ EUR: 1000, JPY: 1600 }) when the field can send more than one.
 */
export type ExchangeLimit = number | Readonly<Record<string, number>>;

/** The words the field says, on screen and to a screen reader. Each can be replaced, for another language or your own voice. */
export interface ExchangeLabels {
  /** The name of the whole field when it has no aria-label of its own. */
  group: string;
  /** The names of the two amounts. */
  send: string;
  receive: string;
  /** The mark on the amount that is fixed. */
  fixed: string;
  /** The start of a currency menu button's name, which always ends in the chosen currency: "Currency: Euro (EUR)". */
  currency: string;
  /** What the search box in the menu asks. */
  search: string;
  /** What the menu says when no currency matches. */
  empty: string;
  /** The name of the swap button. */
  swap: string;
  /** The rate in words. `rate` is the number as it is written. */
  rate: (from: string, to: string, rate: string) => string;
  /** When the rates are from. */
  updated: (time: string) => string;
  /** Said when there is no rate between the two currencies. */
  noRate: (from: string, to: string) => string;
  /** The name of the fee row when the fee has no label of its own. */
  fee: string;
  /** What a screen reader hears once the typing pauses: the amount that was worked out. */
  worked: (name: string, amount: string) => string;
  /** What a screen reader hears after the swap button. */
  swapped: (send: string, receive: string) => string;
  /** The amount sent is below the lowest allowed. `limit` is that amount, written out. */
  atLeast: (limit: string) => string;
  /** The amount sent is above the highest allowed. */
  atMost: (limit: string) => string;
}

export const DEFAULT_LABELS: ExchangeLabels = {
  group: "Currency exchange",
  send: "You send",
  receive: "They receive",
  fixed: "Fixed",
  currency: "Currency",
  search: "Search currencies",
  empty: "No currency matches that.",
  swap: "Swap currencies",
  rate: (from, to, rate) => `1 ${from} = ${rate} ${to}`,
  updated: (time) => `updated ${time}`,
  noRate: (from, to) => `No rate for ${from} to ${to} yet.`,
  fee: "Fee",
  worked: (name, amount) => `${name} ${amount}.`,
  swapped: (send, receive) => `Currencies swapped. You send ${send}, they receive ${receive}.`,
  atLeast: (limit) => `You can send at least ${limit}.`,
  atMost: (limit) => `You can send at most ${limit}.`,
};

/** The currencies in the menus when you name none. */
export const DEFAULT_CURRENCIES: readonly string[] = ["EUR", "USD", "GBP", "CHF", "JPY", "CAD", "AUD"];

// Numbers and currencies -------------------------------------------------------------------------------------------------------

const formats = new Map<string, Intl.NumberFormat>();

/** A number format, kept: building one is far slower than using it, and a field asks on every keystroke. */
function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = formats.get(key);
  if (!format) {
    try {
      format = new Intl.NumberFormat(locale, options);
    } catch {
      format = new Intl.NumberFormat("en-US", options);
    }
    formats.set(key, format);
  }
  return format;
}

/** How many decimals a currency has: 2 for euros, 0 for yen, 3 for Kuwaiti dinars. Asked of Intl, which knows ISO 4217, so no list here goes out of date. */
export function currencyDigits(currency: string): number {
  try {
    return numberFormat("en-US", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

const names = new Map<string, Intl.DisplayNames>();

/** The name of a currency in the locale: "Euro", "Japanse yen". The code when the browser does not know it. */
export function currencyName(currency: string, locale: string): string {
  try {
    let display = names.get(locale);
    if (!display) {
      display = new Intl.DisplayNames(locale, { type: "currency" });
      names.set(locale, display);
    }
    return display.of(currency) ?? currency;
  } catch {
    return currency;
  }
}

/** The decimal and the grouping sign of a locale. 12345.6 is used because some locales (Spanish, Polish) only group from five digits. */
function separatorsOf(locale: string): { decimal: string; group: string } {
  const parts = numberFormat(locale, { useGrouping: true, minimumFractionDigits: 1 }).formatToParts(12345.6);
  return { decimal: parts.find((part) => part.type === "decimal")?.value ?? ".", group: parts.find((part) => part.type === "group")?.value ?? "," };
}

/**
 * Arabic-Indic and Persian digits and their separators, and the typographic
 * apostrophe, as the plain characters, so a keyboard in those scripts types an
 * amount like any other. Written by code point, so the source stays ASCII.
 */
function asciiAmount(text: string): string {
  let plain = "";
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code >= 0x660 && code <= 0x669) plain += String(code - 0x660);
    else if (code >= 0x6f0 && code <= 0x6f9) plain += String(code - 0x6f0);
    else if (code === 0x66b) plain += ".";
    else if (code === 0x66c) plain += ",";
    else if (code === 0x2019) plain += "'";
    else plain += char;
  }
  return plain;
}

/** Characters that can be part of an amount: digits, the two separators, spaces of every kind (a group sign in French and Swiss) and apostrophes. */
export function tidyTyping(raw: string): string {
  return asciiAmount(raw).replace(/[^\d.,\s']/g, "");
}

/** Which sign in the text is the decimal one, or null when there is none ("1.234.567" has only grouping). */
function decimalSign(body: string, digits: number, locale: string): string | null {
  const marks = body.match(/[.,]/g);
  if (!marks) return null;
  // Both are there ("1.234,56", "1,234.56"): the last one is the decimal sign.
  if (new Set(marks).size === 2) return body.lastIndexOf(".") > body.lastIndexOf(",") ? "." : ",";
  // The same sign twice or more is only grouping.
  if (marks.length > 1) return null;
  const mark = marks[0] ?? ".";
  const [before = "", after = ""] = body.split(mark);
  const thousand = after.length === 3 && /^[1-9]\d{0,2}$/.test(before);
  // The locale's own sign is a decimal, except for a currency with no decimals, where "1.234" can only be a thousand.
  if (mark === separatorsOf(locale).decimal) return digits === 0 && thousand ? null : mark;
  // The other sign is accepted too: "12,5" is a decimal, "1,234" a thousand.
  return thousand ? null : mark;
}

/**
 * The text as an amount in minor units, or null when it holds no number. Either
 * decimal sign is understood ("12,5" and "12.5"), and so is a grouping sign
 * ("1.250,00", "1 250,00", "1'250.00"). More decimals than the currency has are
 * rounded half up, on the digits themselves, so no float comes between.
 */
export function parseAmount(raw: string, digits: number, locale: string): number | null {
  const text = asciiAmount(raw);
  // A decimal sign in front of the first digit still counts: ",5" is a half.
  const first = text.search(/[.,]?\d/);
  if (first === -1) return null;
  const body = text.slice(first).replace(/[\s']/g, "").replace(/[^\d.,]/g, "");
  const sign = decimalSign(body, digits, locale);
  const at = sign === null ? -1 : body.lastIndexOf(sign);
  const whole = (at === -1 ? body : body.slice(0, at)).replace(/[.,]/g, "");
  const fraction = at === -1 ? "" : body.slice(at + 1).replace(/[.,]/g, "");
  let minor = Number(`${whole || "0"}${fraction.slice(0, digits).padEnd(digits, "0")}`);
  if (fraction.length > digits && fraction.charAt(digits) >= "5") minor += 1;
  return Number.isSafeInteger(minor) ? minor : null;
}

/** An amount in minor units as the locale writes a number with that many decimals: "1,250.00", "1.250,00", "1,250". */
export function formatAmount(minor: number, digits: number, locale: string): string {
  return numberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(minor / 10 ** digits);
}

/** The same amount with its currency sign, for a message: "$1,250.00", "1.250,00 EUR" in a locale that writes it so. */
export function formatMoneyText(minor: number, currency: string, locale: string): string {
  const digits = currencyDigits(currency);
  try {
    return numberFormat(locale, { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(minor / 10 ** digits);
  } catch {
    return `${formatAmount(minor, digits, locale)} ${currency}`;
  }
}

/** An amount moved from a currency with `from` decimals to one with `to`: 1250 (12.50) is 13 in yen. Whole integers, half up, no float. */
export function rescale(minor: number, from: number, to: number): number {
  if (from === to) return minor;
  if (to > from) return minor * 10 ** (to - from);
  const divisor = 10 ** (from - to);
  return Math.floor(minor / divisor) + ((minor % divisor) * 2 >= divisor ? 1 : 0);
}

/** A rate as it is written in the line between the amounts: up to six figures, so 1.0842 and 163.27 and 0.00667 all read as they are. */
export function writeRate(rate: number, locale: string): string {
  return numberFormat(locale, { maximumSignificantDigits: 6, useGrouping: true }).format(rate);
}

/** The time of day the rates are from, in the locale and the time zone: "10:42". */
export function writeTime(moment: Date | string | number, locale: string, timeZone: string): string | null {
  const instant = new Date(moment);
  if (Number.isNaN(instant.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", timeZone }).format(instant);
  } catch {
    return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(instant);
  }
}

// Rates and sums ---------------------------------------------------------------------------------------------------------------

/** How many units of `to` one unit of `from` buys, or null when the rates do not say. */
export function rateBetween(rates: Rates, from: string, to: string): number | null {
  if (from === to) return 1;
  const usable = (rate: unknown): rate is number => typeof rate === "number" && Number.isFinite(rate) && rate > 0;
  if (typeof rates === "function") {
    const rate = rates(from, to);
    return usable(rate) ? rate : null;
  }
  const direct = rates[from]?.[to];
  if (usable(direct)) return direct;
  const back = rates[to]?.[from];
  return usable(back) ? 1 / back : null;
}

const SCALE = 10_000_000_000n;

/** A rate as a fraction of whole numbers, so every sum below is exact: no float ever comes between an amount and the rate. */
function fractionOf(rate: number): { n: bigint; d: bigint } {
  const [whole = "0", fraction = ""] = rate.toFixed(10).split(".");
  return { n: BigInt(`${whole}${fraction}`), d: SCALE };
}

/** a / b rounded half up, for whole numbers that are not negative. */
const divideRound = (a: bigint, b: bigint): bigint => (2n * a + b) / (2n * b);

/** a / b rounded up, for whole numbers that are not negative. */
const divideUp = (a: bigint, b: bigint): bigint => (a + b - 1n) / b;

const toSafe = (value: bigint): number | null => (value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : null);

/** The limit that applies to a currency: the number itself, or the one the record names for that code. */
export const limitOf = (limit: ExchangeLimit | undefined, currency: string): number | undefined => (typeof limit === "number" ? limit : limit?.[currency]);

/** The fixed part of a fee on an amount sent in `currency`, in minor units of that currency. */
export function flatOf(fee: ExchangeFee, currency: string): number {
  return Math.max(0, Math.round(limitOf(fee.flat, currency) ?? 0));
}

/** The fee on an amount sent, in minor units of that currency. */
export function feeOn(minor: number, currency: string, fee: FeeSource | undefined): number {
  if (fee === undefined || minor <= 0) return 0;
  if (typeof fee === "function") return Math.max(0, Math.round(fee({ minor, currency })));
  const share = Math.round(Math.max(0, fee.percent ?? 0) * 10_000);
  const percent = toSafe(divideRound(BigInt(minor) * BigInt(share), 1_000_000n)) ?? 0;
  return Math.min(minor, percent + flatOf(fee, currency));
}

/** What the other side gets for `minor` sent: the fee is taken off, then the rate applied, rounded half up in the currency's own decimals. */
export function receiveFor(minor: number, from: string, to: string, rate: number, fee: FeeSource | undefined): number | null {
  const net = Math.max(0, minor - feeOn(minor, from, fee));
  const { n, d } = fractionOf(rate);
  return toSafe(divideRound(BigInt(net) * n * 10n ** BigInt(currencyDigits(to)), d * 10n ** BigInt(currencyDigits(from))));
}

/**
 * What has to be sent for `minor` to arrive: the smallest amount that, after the
 * fee and at the rate, leaves the other side with at least that much. Rounded up,
 * so the person at the other end is never short by a cent.
 */
export function sendFor(minor: number, from: string, to: string, rate: number, fee: FeeSource | undefined): number | null {
  const { n, d } = fractionOf(rate);
  const net = toSafe(divideUp(BigInt(minor) * d * 10n ** BigInt(currencyDigits(from)), n * 10n ** BigInt(currencyDigits(to))));
  if (net === null) return null;
  // A first guess from the fee as a share and a fixed part, then moved to the exact smallest amount that works.
  let guess = net;
  if (fee !== undefined && typeof fee !== "function") {
    const share = Math.round(Math.max(0, fee.percent ?? 0) * 10_000);
    if (share >= 1_000_000) return null;
    guess = toSafe(divideUp(BigInt(net + flatOf(fee, from)) * 1_000_000n, BigInt(1_000_000 - share))) ?? net;
  } else if (typeof fee === "function") {
    guess = net + feeOn(net, from, fee);
  }
  const arrives = (sent: number) => sent - feeOn(sent, from, fee) >= net;
  for (let tries = 0; tries < 64 && !arrives(guess); tries += 1) guess += 1;
  for (let tries = 0; tries < 64 && guess > 0 && arrives(guess - 1); tries += 1) guess -= 1;
  return arrives(guess) ? guess : null;
}

/** Both amounts: the fixed one as it is, the other worked out from it, or null when there is nothing to work from or no rate. */
export function resolveValue(value: ExchangeValue, rates: Rates, fee: FeeSource | undefined): { value: ExchangeValue; rate: number | null } {
  const rate = rateBetween(rates, value.send.currency, value.receive.currency);
  const { fixed } = value;
  const known = value[fixed].minor;
  let worked: number | null = null;
  if (known !== null && rate !== null) {
    worked = fixed === "send" ? receiveFor(known, value.send.currency, value.receive.currency, rate, fee) : sendFor(known, value.send.currency, value.receive.currency, rate, fee);
  }
  return {
    rate,
    value: fixed === "send" ? { ...value, receive: { ...value.receive, minor: worked } } : { ...value, send: { ...value.send, minor: worked } },
  };
}
