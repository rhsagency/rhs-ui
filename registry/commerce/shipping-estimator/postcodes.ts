/**
 * Postcode formats by country, so the shipping estimator can check a postcode
 * before it asks your server for rates. A value is cleaned first (trimmed,
 * upper-cased, spaces collapsed), matched, and then laid out the way the
 * country prints it: "1017ab" becomes "1017 AB". Countries that are not listed
 * accept any short code of letters, digits, spaces and hyphens; countries that
 * have no postcodes make the field optional.
 */
export interface PostcodeRule {
  /** What the country calls it, in lower case: "postcode", "ZIP code", "postal code". */
  noun: string;
  /** A real-looking example for the placeholder and the error message. */
  example: string;
  /** Matches the cleaned value. */
  pattern: RegExp;
  /** Lays a valid value out the way the country prints it. */
  format?: (clean: string) => string;
  /** Digits only: asks a phone for the number pad. */
  numeric?: boolean;
}

export interface PostcodeRuleFor extends PostcodeRule {
  /** True for countries without postcodes: an empty field is fine. */
  optional: boolean;
}

export type PostcodeCheck = { ok: true; value: string } | { ok: false; message: string };

const digits = (noun: string, example: string, pattern: RegExp, format?: (clean: string) => string): PostcodeRule => ({ noun, example, pattern, format, numeric: true });

/** Puts a space before the last `tail` characters: "SW1A1AA" becomes "SW1A 1AA". */
const spaceBeforeLast = (tail: number) => (clean: string) => {
  const compact = clean.replace(/\s/g, "");
  return `${compact.slice(0, -tail)} ${compact.slice(-tail)}`;
};

/** Puts a hyphen at `at`: "1234567" becomes "1234-567". */
const hyphenAt = (at: number) => (clean: string) => {
  const compact = clean.replace(/[\s-]/g, "");
  return `${compact.slice(0, at)}-${compact.slice(at)}`;
};

const RULES: Record<string, PostcodeRule> = {
  NL: { noun: "postcode", example: "1017 AB", pattern: /^[1-9]\d{3} ?(?!SA|SD|SS)[A-Z]{2}$/, format: (clean) => clean.replace(/^(\d{4}) ?([A-Z]{2})$/, "$1 $2") },
  BE: digits("postcode", "1000", /^[1-9]\d{3}$/),
  LU: digits("postcode", "1009", /^\d{4}$/),
  DE: digits("postcode", "10115", /^\d{5}$/),
  AT: digits("postcode", "1010", /^\d{4}$/),
  CH: digits("postcode", "8001", /^[1-9]\d{3}$/),
  LI: digits("postcode", "9490", /^\d{4}$/),
  FR: digits("postcode", "75001", /^\d{5}$/),
  ES: digits("postcode", "28013", /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/),
  PT: digits("postcode", "1000-001", /^\d{4}-?\d{3}$/, hyphenAt(4)),
  IT: digits("postcode", "00184", /^\d{5}$/),
  GB: { noun: "postcode", example: "SW1A 1AA", pattern: /^(GIR ?0AA|[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})$/, format: spaceBeforeLast(3) },
  IE: { noun: "Eircode", example: "D02 AF30", pattern: /^([AC-FHKNPRTV-Y]\d{2}|D6W) ?[0-9AC-FHKNPRTV-Y]{4}$/, format: spaceBeforeLast(4) },
  US: digits("ZIP code", "94103", /^\d{5}(-\d{4})?$/),
  CA: { noun: "postal code", example: "K1A 0B1", pattern: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/, format: spaceBeforeLast(3) },
  AU: digits("postcode", "2000", /^\d{4}$/),
  NZ: digits("postcode", "6011", /^\d{4}$/),
  SE: digits("postcode", "111 22", /^\d{3} ?\d{2}$/, spaceBeforeLast(2)),
  NO: digits("postcode", "0150", /^\d{4}$/),
  DK: digits("postcode", "1050", /^\d{4}$/),
  FI: digits("postcode", "00100", /^\d{5}$/),
  IS: digits("postcode", "101", /^\d{3}$/),
  PL: digits("postcode", "00-950", /^\d{2}-?\d{3}$/, hyphenAt(2)),
  CZ: digits("postcode", "110 00", /^\d{3} ?\d{2}$/, spaceBeforeLast(2)),
  SK: digits("postcode", "811 01", /^\d{3} ?\d{2}$/, spaceBeforeLast(2)),
  HU: digits("postcode", "1051", /^\d{4}$/),
  RO: digits("postcode", "010011", /^\d{6}$/),
  BG: digits("postcode", "1000", /^\d{4}$/),
  GR: digits("postcode", "105 57", /^\d{3} ?\d{2}$/, spaceBeforeLast(2)),
  HR: digits("postcode", "10000", /^\d{5}$/),
  SI: digits("postcode", "1000", /^\d{4}$/),
  EE: digits("postcode", "10111", /^\d{5}$/),
  LV: { noun: "postcode", example: "LV-1050", pattern: /^(LV-?)?\d{4}$/, format: (clean) => `LV-${clean.replace(/\D/g, "")}` },
  LT: { noun: "postcode", example: "LT-01100", pattern: /^(LT-?)?\d{5}$/, format: (clean) => `LT-${clean.replace(/\D/g, "")}` },
  JP: digits("postcode", "100-0001", /^\d{3}-?\d{4}$/, hyphenAt(3)),
  KR: digits("postcode", "04524", /^\d{5}$/),
  CN: digits("postcode", "100000", /^\d{6}$/),
  IN: digits("PIN code", "110001", /^[1-9]\d{5}$/),
  SG: digits("postcode", "018956", /^\d{6}$/),
  MY: digits("postcode", "50450", /^\d{5}$/),
  TH: digits("postcode", "10110", /^\d{5}$/),
  TR: digits("postcode", "34000", /^\d{5}$/),
  BR: digits("postcode", "01310-100", /^\d{5}-?\d{3}$/, hyphenAt(5)),
  MX: digits("postcode", "06000", /^\d{5}$/),
  ZA: digits("postcode", "0001", /^\d{4}$/),
  IL: digits("postcode", "9100000", /^\d{5}(\d{2})?$/),
};

/** Countries without postcodes. Their field stays, but an empty one is accepted. */
const NO_POSTCODE = new Set(["AE", "AG", "AO", "AW", "BS", "BW", "BZ", "CD", "CG", "CI", "CM", "DJ", "DM", "GH", "GM", "GY", "HK", "JM", "KE", "KI", "KM", "KN", "MO", "MW", "NR", "QA", "RW", "SB", "SC", "SL", "SR", "ST", "TL", "TO", "TV", "UG", "VU", "YE", "ZW"]);

const GENERIC: PostcodeRule = { noun: "postcode", example: "", pattern: /^[A-Z0-9][A-Z0-9 -]{1,9}$/ };

/** The rule for a country (ISO 3166-1 alpha-2). Unknown countries get a forgiving generic rule. */
export function postcodeRuleFor(country: string): PostcodeRuleFor {
  const code = country.toUpperCase();
  if (NO_POSTCODE.has(code)) return { ...GENERIC, optional: true };
  return { ...(RULES[code] ?? GENERIC), optional: false };
}

/** Trims, collapses spaces and upper-cases: the form every rule matches against. */
export function cleanPostcode(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

/** The field's label: "Postcode", "ZIP code", "Eircode". */
export function postcodeLabel(rule: PostcodeRule): string {
  return rule.noun.charAt(0).toUpperCase() + rule.noun.slice(1);
}

/**
 * Checks a postcode for a country. A valid one comes back laid out the way the
 * country prints it; an invalid one comes back with a message that says what a
 * good one looks like.
 */
export function checkPostcode(country: string, input: string): PostcodeCheck {
  const rule = postcodeRuleFor(country);
  const clean = cleanPostcode(input);
  if (!clean) return rule.optional ? { ok: true, value: "" } : { ok: false, message: `Enter your ${rule.noun}.` };
  if (!rule.pattern.test(clean)) return { ok: false, message: rule.example ? `Check your ${rule.noun}: it looks like ${rule.example}.` : `Check your ${rule.noun}.` };
  return { ok: true, value: rule.format ? rule.format(clean) : clean };
}

/** Tidies what someone typed for display (case, spacing) without judging it. */
export function tidyPostcode(country: string, input: string): string {
  const check = checkPostcode(country, input);
  return check.ok ? check.value : cleanPostcode(input);
}
