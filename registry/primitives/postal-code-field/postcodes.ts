/**
 * What one country's postal codes look like, and how they are written. Add a
 * country, or change one, by passing your own rules to PostalCodeField's
 * `countries`; the same table can feed an address form's validation on a server.
 */
export interface PostalRule {
  /** What the country is called in the message: "Dutch" in "Dutch postcodes look like 1234 AB.", "UK", "US". */
  adjective: string;
  /** What the country calls the code: "postcode", "postal code", "ZIP code", "PIN code", "Eircode". */
  term: string;
  /** A valid code, as it is written: "1234 AB". It is also the placeholder, and what the message shows. */
  example: string;
  /** Another shape that is just as valid, which the message adds: "90210-1234" for a ZIP code. */
  alternative?: string;
  /** What a valid code looks like once it is formatted: it is tested on `format(cleanPostalCode(text))`, so it can count on the separator. */
  pattern: RegExp;
  /** Puts the separator where the country puts it. It gets the code as capitals and digits only: "1234AB" becomes "1234 AB". */
  format: (clean: string) => string;
  /** The code is digits only, so a phone can show a number pad and the field needs no capitals. */
  numeric: boolean;
}

/** The characters of a code that count: capitals and digits. Spaces, dashes, dots and lower case are how people write it, not part of it. */
export function cleanPostalCode(text: string): string {
  return text.normalize("NFKC").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

const plain = (clean: string) => clean;
const splitAt = (at: number, separator: string) => (clean: string) => (clean.length > at ? `${clean.slice(0, at)}${separator}${clean.slice(at)}` : clean);

function rule(adjective: string, term: string, example: string, pattern: RegExp, format: PostalRule["format"] = plain, alternative?: string): PostalRule {
  return { adjective, term, example, alternative, pattern, format, numeric: !/[A-Z]/.test(example) };
}

// The outward part of a British code is two to four characters and the inward part is always three: the space goes before the last three.
const ukFormat = (clean: string) => (clean.length > 3 ? `${clean.slice(0, -3)} ${clean.slice(-3)}` : clean);

// Five digits, and four more after a dash for the extended ZIP+4 form. Nothing is cut off the end: a tenth digit is a typo, so it has to fail the pattern and be said, not be dropped.
const usFormat = (clean: string) => (clean.length > 5 ? `${clean.slice(0, 5)}-${clean.slice(5)}` : clean);

/**
 * The codes of thirty countries, by ISO 3166-1 alpha-2 code. A code is only
 * judged by its shape: it can be well formed and still belong to no street.
 */
export const POSTAL_CODES: Readonly<Record<string, PostalRule>> = {
  AT: rule("Austrian", "postcode", "1010", /^\d{4}$/),
  AU: rule("Australian", "postcode", "2000", /^\d{4}$/),
  BE: rule("Belgian", "postcode", "1000", /^[1-9]\d{3}$/),
  BR: rule("Brazilian", "CEP", "01310-100", /^\d{5}-\d{3}$/, splitAt(5, "-")),
  CA: rule("Canadian", "postal code", "K1A 0B1", /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] \d[ABCEGHJ-NPRSTV-Z]\d$/, splitAt(3, " ")),
  CH: rule("Swiss", "postcode", "8001", /^[1-9]\d{3}$/),
  CZ: rule("Czech", "postcode", "110 00", /^\d{3} \d{2}$/, splitAt(3, " ")),
  DE: rule("German", "postcode", "10115", /^\d{5}$/),
  DK: rule("Danish", "postcode", "1050", /^\d{4}$/),
  ES: rule("Spanish", "postcode", "28013", /^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/),
  FI: rule("Finnish", "postcode", "00100", /^\d{5}$/),
  FR: rule("French", "postcode", "75008", /^\d{5}$/),
  GB: rule("UK", "postcode", "SW1A 1AA", /^(?:GIR 0AA|[A-PR-UWYZ](?:\d{1,2}|[A-HK-Y]\d[\dABEHMNPRV-Y]?|\d[A-HJKPS-UW]) \d[ABD-HJLNP-UW-Z]{2})$/, ukFormat),
  GR: rule("Greek", "postcode", "105 57", /^\d{3} \d{2}$/, splitAt(3, " ")),
  HU: rule("Hungarian", "postcode", "1011", /^\d{4}$/),
  IE: rule("Irish", "Eircode", "D02 X285", /^(?:[AC-FHKNPRTV-Y]\d{2}|D6W) [0-9AC-FHKNPRTV-Y]{4}$/, splitAt(3, " ")),
  IN: rule("Indian", "PIN code", "110001", /^[1-9]\d{5}$/),
  IT: rule("Italian", "postcode", "00184", /^\d{5}$/),
  JP: rule("Japanese", "postal code", "100-0001", /^\d{3}-\d{4}$/, splitAt(3, "-")),
  LU: rule("Luxembourg", "postcode", "1111", /^\d{4}$/),
  MX: rule("Mexican", "postal code", "06000", /^\d{5}$/),
  NL: rule("Dutch", "postcode", "1234 AB", /^[1-9]\d{3} [A-Z]{2}$/, splitAt(4, " ")),
  NO: rule("Norwegian", "postcode", "0150", /^\d{4}$/),
  NZ: rule("New Zealand", "postcode", "6011", /^\d{4}$/),
  PL: rule("Polish", "postal code", "00-950", /^\d{2}-\d{3}$/, splitAt(2, "-")),
  PT: rule("Portuguese", "postcode", "1000-001", /^\d{4}-\d{3}$/, splitAt(4, "-")),
  SE: rule("Swedish", "postcode", "114 55", /^\d{3} \d{2}$/, splitAt(3, " ")),
  SG: rule("Singapore", "postcode", "238859", /^\d{6}$/),
  US: rule("US", "ZIP code", "90210", /^\d{5}(?:-\d{4})?$/, usFormat, "90210-1234"),
  ZA: rule("South African", "postcode", "0002", /^\d{4}$/),
};

type Rules = Readonly<Record<string, PostalRule>>;

const ruleFor = (country: string, rules: Rules): PostalRule | undefined => rules[country.trim().toUpperCase()];

/**
 * The code the way its country writes it: capitals, and the separator in its
 * place ("1017cj" is "1017 CJ", "902101234" is "90210-1234"). For a country
 * with no rule the text is only trimmed.
 */
export function formatPostalCode(country: string, text: string, rules: Rules = POSTAL_CODES): string {
  const found = ruleFor(country, rules);
  return found ? found.format(cleanPostalCode(text)) : text.trim();
}

/** Whether the text is a well formed code for the country. Without a rule for the country, anything that is not empty is. */
export function isPostalCode(country: string, text: string, rules: Rules = POSTAL_CODES): boolean {
  const found = ruleFor(country, rules);
  if (!text.trim()) return false;
  return found ? found.pattern.test(found.format(cleanPostalCode(text))) : true;
}

/** What a valid code looks like, in words: "Dutch postcodes look like 1234 AB." Null for a country with no rule. */
export function describePostalCode(country: string, rules: Rules = POSTAL_CODES): string | null {
  const found = ruleFor(country, rules);
  if (!found) return null;
  return `${found.adjective} ${found.term}s look like ${found.example}${found.alternative ? ` or ${found.alternative}` : ""}.`;
}

/** What to say when a code is needed and there is none: "Enter a Dutch postcode, like 1234 AB." Null for a country with no rule. */
export function askForPostalCode(country: string, rules: Rules = POSTAL_CODES): string | null {
  const found = ruleFor(country, rules);
  if (!found) return null;
  return `Enter ${/^[AEIO]/i.test(found.adjective) ? "an" : "a"} ${found.adjective} ${found.term}, like ${found.example}.`;
}
