/** The card networks the preview knows. Any other brand is set as the text you pass, with the usual grouping. */
export type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "diners" | "jcb" | "unionpay" | "maestro";

export interface BrandInfo {
  /** The name as it is set on the card and read out. */
  name: string;
  /** How the digits are grouped: 4-4-4-4, or 4-6-5 for American Express. The sum is the length of a full number. */
  groups: readonly number[];
  /** How many digits the security code has. */
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

/** Tried in this order: the narrow prefixes first, the broad ones (Maestro takes the rest of the 6s) last. */
const PATTERNS: readonly (readonly [CardBrand, RegExp])[] = [
  ["amex", /^3[47]/],
  ["diners", /^3(?:0[0-5]|[689])/],
  ["jcb", /^35(?:2[89]|[3-8])/],
  ["visa", /^4/],
  ["mastercard", /^(?:5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/],
  ["discover", /^(?:6011|65|64[4-9])/],
  ["unionpay", /^62/],
  ["maestro", /^(?:50|5[6-9]|6)/],
];

/** The grouping of a card whose network is not known: four groups of four. */
export const DEFAULT_GROUPS: readonly number[] = [4, 4, 4, 4];

/** Only the digits of whatever was typed or pasted: "4242 4242" and "4242-4242" are the same. */
export const digitsOf = (text: string | undefined): string => (text ?? "").replace(/\D/g, "");

/** The network a number belongs to, from its first digits. `undefined` until there are enough of them to tell. */
export function detectBrand(number: string | undefined): CardBrand | undefined {
  const digits = digitsOf(number);
  return PATTERNS.find(([, pattern]) => pattern.test(digits))?.[0];
}

/** What is known about a brand: a network by its key, or any other name with the usual grouping. */
export function brandInfo(brand: string | undefined): BrandInfo | undefined {
  if (!brand) return undefined;
  const key = brand.toLowerCase().replace(/[^a-z]/g, "");
  const known = (Object.keys(BRANDS) as CardBrand[]).find((candidate) => candidate === key);
  return known ? BRANDS[known] : { name: brand, groups: DEFAULT_GROUPS, cvc: 3 };
}

export const lengthOf = (groups: readonly number[]): number => groups.reduce((sum, size) => sum + size, 0);

/** "4242424242424242" -> "4242 4242 4242 4242", grouped as the brand groups it. Digits beyond a full number are left off. */
export function formatNumber(number: string | undefined, groups: readonly number[] = DEFAULT_GROUPS): string {
  const digits = digitsOf(number).slice(0, lengthOf(groups));
  const parts: string[] = [];
  let offset = 0;
  for (const size of groups) {
    if (offset >= digits.length) break;
    parts.push(digits.slice(offset, offset + size));
    offset += size;
  }
  return parts.join(" ");
}

/** The month and the year of an expiry as typed, as at most two digits each: "09/28", "0928" and "09 / 28" all give ["09", "28"]. */
export function expiryParts(expiry: string | undefined): readonly [string, string] {
  const digits = digitsOf(expiry).slice(0, 4);
  return [digits.slice(0, 2), digits.slice(2, 4)];
}

/** "0928" -> "09/28", for an input that formats as the person types. */
export function formatExpiry(expiry: string | undefined): string {
  const [month, year] = expiryParts(expiry);
  return year ? `${month}/${year}` : month;
}
