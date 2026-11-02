/** The card networks the fieldset knows by their first digits. Any other card is set as "Card" with four groups of four. */
export type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "diners" | "jcb" | "unionpay" | "maestro";

export interface BrandInfo {
  /** The name as it is written beside the field and read out. */
  name: string;
  /** How the digits are grouped: 4-4-4-4, or 4-6-5 for American Express. The sum is the length of a full number. */
  groups: readonly number[];
  /** How many digits the security code has: four on the front of an American Express card, three elsewhere. */
  cvc: number;
}

export const BRANDS: Readonly<Record<CardBrand, BrandInfo>> = {
  visa: { name: "Visa", groups: [4, 4, 4, 4], cvc: 3 },
  mastercard: { name: "Mastercard", groups: [4, 4, 4, 4], cvc: 3 },
  amex: { name: "American Express", groups: [4, 6, 5], cvc: 4 },
  discover: { name: "Discover", groups: [4, 4, 4, 4], cvc: 3 },
  diners: { name: "Diners Club", groups: [4, 6, 4], cvc: 3 },
  jcb: { name: "JCB", groups: [4, 4, 4, 4], cvc: 3 },
  unionpay: { name: "UnionPay", groups: [4, 4, 4, 4], cvc: 3 },
  maestro: { name: "Maestro", groups: [4, 4, 4, 4], cvc: 3 },
};

/** What is assumed until the first digits say which network it is. */
export const UNKNOWN: BrandInfo = { name: "", groups: [4, 4, 4, 4], cvc: 3 };

/** Tried in this order: the narrow prefixes first. A number that matches none of them is a card of unknown network, not a guess. */
const PATTERNS: readonly (readonly [CardBrand, RegExp])[] = [
  ["amex", /^3[47]/],
  ["diners", /^3(?:0[0-5]|[689])/],
  ["jcb", /^35(?:2[89]|[3-8])/],
  ["visa", /^4/],
  ["mastercard", /^(?:5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/],
  ["discover", /^(?:6011|65|64[4-9])/],
  ["unionpay", /^62/],
  ["maestro", /^(?:5018|5020|5038|5893|6304|6759|676[1-3])/],
];

/** Only the digits of whatever was typed or pasted: "4242 4242" and "4242-4242" are the same. */
export const digitsOf = (text: string): string => text.replace(/\D/g, "");

/** The network a number belongs to, from its first digits, or undefined while they do not say. */
export function detectBrand(digits: string): CardBrand | undefined {
  return PATTERNS.find(([, pattern]) => pattern.test(digits))?.[0];
}

export const lengthOf = (groups: readonly number[]): number => groups.reduce((sum, size) => sum + size, 0);

/** "4242424242424242" as "4242 4242 4242 4242", grouped as the network groups it. Digits beyond a full number (an unknown network may have up to 19) go in groups of four. */
export function formatNumber(digits: string, groups: readonly number[]): string {
  const parts: string[] = [];
  let at = 0;
  for (const size of groups) {
    if (at >= digits.length) break;
    parts.push(digits.slice(at, at + size));
    at += size;
  }
  while (at < digits.length) {
    parts.push(digits.slice(at, at + 4));
    at += 4;
  }
  return parts.join(" ");
}

/** The most digits a card number may have: a full number of a known network, 19 for the rest. */
export const maxDigits = (brand: CardBrand | undefined): number => (brand ? lengthOf(BRANDS[brand].groups) : 19);

/** The Luhn check every card number passes: double every second digit from the right, add them all up, and the sum ends in 0. */
export function luhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = digits.charCodeAt(index) - 48;
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return digits.length > 0 && sum % 10 === 0;
}

/**
 * The expiry as month and two-digit year, from whatever was typed, pasted or autofilled: "0928", "09/28", "09 / 28"
 * and "09/2028" all give "0928". A single digit above 1 can only be a month, so it gets its zero ("3" is "03").
 */
export function expiryDigits(text: string): string {
  const all = digitsOf(text);
  const digits = all.length === 6 ? `${all.slice(0, 2)}${all.slice(4)}` : all.slice(0, 4);
  return digits.length === 1 && digits > "1" ? `0${digits}` : digits;
}

/** "0928" as "09 / 28". The separator comes with the third digit, so Backspace can always get back past it. */
export function formatExpiry(digits: string): string {
  return digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
}

/** "0928" as "09/28" for the value you get back, and "09/2" while the year is half typed. */
export const expiryValue = (digits: string): string => (digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);

export type NumberProblem = "empty" | "incomplete" | "invalid";
export type ExpiryProblem = "empty" | "incomplete" | "month" | "expired";
export type CodeProblem = "empty" | "incomplete";

/** What is wrong with a card number, or null. A number of a known network is complete at its full length, any other from 12 digits up. */
export function numberProblem(digits: string, brand: CardBrand | undefined): NumberProblem | null {
  if (!digits) return "empty";
  const full = brand ? lengthOf(BRANDS[brand].groups) : 12;
  if (digits.length < full) return "incomplete";
  return luhn(digits) ? null : "invalid";
}

/**
 * What is wrong with an expiry, or null. A card is good through the last day of its month, so "09/28" is expired
 * from 1 October 2028. `now` is read in UTC, so the check is the same on every server and in every browser.
 */
export function expiryProblem(digits: string, now: Date): ExpiryProblem | null {
  if (!digits) return "empty";
  if (digits.length < 4) return "incomplete";
  const month = Number(digits.slice(0, 2));
  const year = 2000 + Number(digits.slice(2));
  if (month < 1 || month > 12) return "month";
  return year * 12 + month < now.getUTCFullYear() * 12 + now.getUTCMonth() + 1 ? "expired" : null;
}

/** What is wrong with a security code, or null. */
export function codeProblem(code: string, length: number): CodeProblem | null {
  if (!code) return "empty";
  return code.length < length ? "incomplete" : null;
}

/** Where the caret goes after the text was reformatted: right behind the `count`th digit, so editing in the middle of "4242 4242" does not throw the caret to the end. */
export function caretAfter(text: string, count: number): number {
  if (count <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (/\d/.test(text.charAt(index))) {
      seen += 1;
      if (seen === count) return index + 1;
    }
  }
  return text.length;
}
