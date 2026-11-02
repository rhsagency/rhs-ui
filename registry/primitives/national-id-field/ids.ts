/**
 * The table behind the National ID field, as plain functions with no React: for
 * each country how a personal identity number is written, what it is made of
 * and how its check works. A server can use `isNationalId` to check a number
 * before it is stored, with the same rules the field shows.
 *
 * The checks are arithmetic only. They tell a mistyped number from a possible
 * one; they cannot tell whether a number was ever issued, or to whom. Nothing
 * here keeps, logs or sends a number.
 */

/** What can be wrong with a number: the wrong length, characters in the wrong places, a failed check, or a part that is never issued. */
export type NationalIdProblem = "length" | "characters" | "check" | "range";

export interface NationalIdRule {
  /** The country, in English: "Netherlands". */
  name: string;
  /** What the number is called there: "BSN". */
  label: string;
  /** One sentence for what a right number is made of. It is the error for a number of the wrong length or shape, and the hint under the field. */
  describe: string;
  /** A made-up number, written the way it is printed, for the placeholder. It passes the checks and belongs to nobody. */
  example: string;
  /** The longest the number can be without its separators. */
  maxLength: number;
  /** `numeric` asks a phone for the digit keyboard. */
  keyboard: "numeric" | "text";
  /** Keeps what can be part of the number (capitals and digits, or digits only), at most `maxLength` of it. */
  clean(raw: string): string;
  /** Writes a cleaned number the way it is printed, also while it is only part typed. */
  format(clean: string): string;
  /** null when the number is right, otherwise what is wrong. A number that is not complete yet is `length`. */
  check(clean: string): NationalIdProblem | null;
  /** The words for a problem, where `describe` is not the best thing to say. */
  messages?: Partial<Record<NationalIdProblem, string>>;
}

/* ---- small pieces the rules are made of ---- */

const digitsOnly = (max: number) => (raw: string) => raw.replace(/\D/g, "").slice(0, max);
const lettersAndDigits = (max: number) => (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, max);

/** Writes a number in groups, with a separator after each group that has something after it. */
function grouped(sizes: readonly number[], separators: string | readonly string[] = " ") {
  return (clean: string): string => {
    let out = "";
    let at = 0;
    for (const [index, size] of sizes.entries()) {
      if (at >= clean.length) break;
      const next = at + size;
      out += clean.slice(at, next);
      if (clean.length > next) out += typeof separators === "string" ? separators : (separators[index] ?? "");
      at = next;
    }
    return out + clean.slice(at);
  };
}

const sumOf = (digits: string, weights: readonly number[]) => [...digits].reduce((sum, digit, index) => sum + Number(digit) * (weights[index] ?? 0), 0);

/** The Luhn check: from the right, every second digit is doubled, and the digits of everything add up to a multiple of ten. */
function luhn(digits: string): boolean {
  let sum = 0;
  for (let index = digits.length - 1, double = false; index >= 0; index -= 1, double = !double) {
    let digit = Number(digits[index]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/* ---- the rules ---- */

const nl: NationalIdRule = {
  name: "Netherlands",
  label: "BSN",
  describe: "A BSN has nine digits and passes the eleven test.",
  example: "111 222 333",
  maxLength: 9,
  keyboard: "numeric",
  clean: digitsOnly(9),
  format: grouped([3, 3, 3]),
  check(id) {
    if (id.length !== 9) return "length";
    // The eleven test: nine times the first digit, eight times the second, down to two times the eighth, minus the last.
    const sum = sumOf(id, [9, 8, 7, 6, 5, 4, 3, 2, -1]);
    return sum !== 0 && sum % 11 === 0 ? null : "check";
  },
  messages: { check: "These nine digits do not pass the eleven test. Check for a mistyped digit." },
};

const us: NationalIdRule = {
  name: "United States",
  label: "SSN",
  describe: "A Social Security number has nine digits, like 123-45-6789.",
  example: "123-45-6789",
  maxLength: 9,
  keyboard: "numeric",
  clean: digitsOnly(9),
  format: grouped([3, 2, 4], "-"),
  check(id) {
    if (id.length !== 9) return "length";
    const area = id.slice(0, 3);
    // 000, 666 and everything from 900 are never issued as an area; no group or serial is all zeros.
    return area === "000" || area === "666" || area.startsWith("9") || id.slice(3, 5) === "00" || id.slice(5) === "0000" ? "range" : null;
  },
  messages: { range: "That is not a number that is ever issued. An SSN never starts with 000, 666 or 9, and no part of it is all zeros." },
};

const BAD_FIRST = /^[DFIQUV]/;
const BAD_SECOND = /^.[DFIOQUV]/;
const BAD_PREFIX = new Set(["BG", "GB", "NK", "KN", "TN", "NT", "ZZ"]);

const gb: NationalIdRule = {
  name: "United Kingdom",
  label: "National Insurance number",
  describe: "A National Insurance number is two letters, six digits and a letter from A to D, like AB 12 34 56 C.",
  example: "AB 12 34 56 C",
  maxLength: 9,
  keyboard: "text",
  clean: lettersAndDigits(9),
  format: grouped([2, 2, 2, 2, 1]),
  check(id) {
    if (id.length !== 9) return "length";
    if (!/^[A-Z]{2}\d{6}[A-D]$/.test(id)) return "characters";
    return BAD_FIRST.test(id) || BAD_SECOND.test(id) || BAD_PREFIX.has(id.slice(0, 2)) ? "range" : null;
  },
  messages: { range: "That prefix is never issued. A National Insurance number does not start with D, F, I, Q, U or V, and its second letter is never O." },
};

const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

const es: NationalIdRule = {
  name: "Spain",
  label: "DNI or NIE",
  describe: "A DNI is eight digits and a check letter. A NIE is X, Y or Z, seven digits and a check letter.",
  example: "12345678-Z",
  maxLength: 9,
  keyboard: "text",
  clean: lettersAndDigits(9),
  format: (clean) => (/^[XYZ]/.test(clean) ? grouped([1, 7, 1], "-")(clean) : grouped([8, 1], "-")(clean)),
  check(id) {
    if (id.length !== 9) return "length";
    const nie = /^[XYZ]\d{7}[A-Z]$/.test(id);
    if (!nie && !/^\d{8}[A-Z]$/.test(id)) return "characters";
    // A NIE counts its first letter as 0, 1 or 2 and is then checked like a DNI: the number modulo 23 picks the letter.
    const number = nie ? Number(`${"XYZ".indexOf(id[0] ?? "X")}${id.slice(1, 8)}`) : Number(id.slice(0, 8));
    return DNI_LETTERS[number % 23] === id[8] ? null : "check";
  },
  messages: { check: "The letter does not belong to these digits. Check the digits and the letter." },
};

/**
 * What a character is worth in an odd place of a codice fiscale (the 1st, 3rd,
 * 5th and so on), for the letters A to Z in turn. A digit is worth what the
 * letter in its place in the alphabet is worth: 0 as A, 1 as B, 2 as C. In an
 * even place a digit is worth itself and a letter its place in the alphabet.
 */
const IT_ODD_VALUES = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21, 2, 4, 18, 20, 11, 3, 6, 8, 12, 14, 16, 10, 22, 25, 24, 23] as const;

const italianOdd = (char: string) => IT_ODD_VALUES[/\d/.test(char) ? Number(char) : char.charCodeAt(0) - 65] ?? 0;

const it: NationalIdRule = {
  name: "Italy",
  label: "codice fiscale",
  describe: "A codice fiscale has sixteen characters: six letters, two digits, a letter, two digits, a letter, three digits and a check letter.",
  example: "RSSMRA85T10A562S",
  maxLength: 16,
  keyboard: "text",
  clean: lettersAndDigits(16),
  format: (clean) => clean,
  check(id) {
    if (id.length !== 16) return "length";
    // The letters L to V may stand in for digits when two people would otherwise share a number (omocodia).
    if (!/^[A-Z]{6}[\dLMNPQRSTUV]{2}[ABCDEHLMPRST][\dLMNPQRSTUV]{2}[A-Z][\dLMNPQRSTUV]{3}[A-Z]$/.test(id)) return "characters";
    let sum = 0;
    for (let index = 0; index < 15; index += 1) {
      const char = id[index] ?? "0";
      sum += index % 2 === 0 ? italianOdd(char) : /\d/.test(char) ? Number(char) : char.charCodeAt(0) - 65;
    }
    return String.fromCharCode(65 + (sum % 26)) === id[15] ? null : "check";
  },
  messages: { check: "The last letter does not match the rest. Check each character against the card." },
};

const fr: NationalIdRule = {
  name: "France",
  label: "NIR",
  describe: "A French social security number (NIR) has fifteen digits and ends in a two-digit key that fits the first thirteen.",
  example: "1 84 12 76 451 089 46",
  maxLength: 15,
  keyboard: "text",
  clean: lettersAndDigits(15),
  format: grouped([1, 2, 2, 2, 3, 3, 2]),
  check(id) {
    if (id.length !== 15) return "length";
    // Corsica has the departments 2A and 2B in the place of 20.
    if (!/^[1-478]\d{4}(?:\d{2}|2[AB])\d{6}\d{2}$/.test(id)) return "characters";
    const month = Number(id.slice(3, 5));
    if (month === 0 || (month > 12 && month < 20)) return "range";
    const body = Number(id.slice(0, 13).replace("2A", "19").replace("2B", "18"));
    return 97 - (body % 97) === Number(id.slice(13)) ? null : "check";
  },
  messages: { check: "The two-digit key at the end does not fit the other digits. Check for a mistyped digit.", range: "The month in this number does not exist." },
};

const de: NationalIdRule = {
  name: "Germany",
  label: "Steuer-ID",
  describe: "A German tax ID (Steuer-ID) has eleven digits, does not start with 0, and ends in a check digit.",
  example: "86 095 742 719",
  maxLength: 11,
  keyboard: "numeric",
  clean: digitsOnly(11),
  format: grouped([2, 3, 3, 3]),
  check(id) {
    if (id.length !== 11) return "length";
    if (id.startsWith("0")) return "range";
    // Of the first ten digits exactly one appears twice or three times and the others at most once.
    const counts = new Map<string, number>();
    for (const digit of id.slice(0, 10)) counts.set(digit, (counts.get(digit) ?? 0) + 1);
    const repeated = [...counts.values()].filter((count) => count > 1);
    if (repeated.length !== 1 || (repeated[0] ?? 0) > 3) return "range";
    // ISO 7064, modulus 11 and 10.
    let product = 10;
    for (const digit of id.slice(0, 10)) {
      let sum = (Number(digit) + product) % 10;
      if (sum === 0) sum = 10;
      product = (sum * 2) % 11;
    }
    return (11 - product) % 10 === Number(id[10]) ? null : "check";
  },
  messages: { range: "That is not a pattern a Steuer-ID can have: of the first ten digits, exactly one repeats, and no more than three times." },
};

const be: NationalIdRule = {
  name: "Belgium",
  label: "national register number",
  describe: "A Belgian national register number has eleven digits (YY.MM.DD-XXX.CC), and its last two digits are a check on the nine before them.",
  example: "85.07.30-033.28",
  maxLength: 11,
  keyboard: "numeric",
  clean: digitsOnly(11),
  format: grouped([2, 2, 2, 3, 2], [".", ".", "-", ".", ""]),
  check(id) {
    if (id.length !== 11) return "length";
    const body = Number(id.slice(0, 9));
    const key = Number(id.slice(9));
    // People born in 2000 or later are counted with a 2 in front of the nine digits.
    return 97 - (body % 97) === key || 97 - ((2_000_000_000 + body) % 97) === key ? null : "check";
  },
  messages: { check: "The last two digits do not fit the other nine. Check for a mistyped digit." },
};

const pt: NationalIdRule = {
  name: "Portugal",
  label: "NIF",
  describe: "A NIF has nine digits and ends in a check digit.",
  example: "123 456 789",
  maxLength: 9,
  keyboard: "numeric",
  clean: digitsOnly(9),
  format: grouped([3, 3, 3]),
  check(id) {
    if (id.length !== 9) return "length";
    if (id.startsWith("0") || (id.startsWith("4") && !id.startsWith("45"))) return "range";
    const rest = 11 - (sumOf(id.slice(0, 8), [9, 8, 7, 6, 5, 4, 3, 2]) % 11);
    return (rest >= 10 ? 0 : rest) === Number(id[8]) ? null : "check";
  },
  messages: { range: "A NIF does not start with 0, and a 4 is only used as 45." },
};

const pl: NationalIdRule = {
  name: "Poland",
  label: "PESEL",
  describe: "A PESEL has eleven digits: a date of birth, a serial number and a check digit.",
  example: "44051401359",
  maxLength: 11,
  keyboard: "numeric",
  clean: digitsOnly(11),
  format: (clean) => clean,
  check(id) {
    if (id.length !== 11) return "length";
    const month = Number(id.slice(2, 4));
    const day = Number(id.slice(4, 6));
    // The month carries the century: 1 to 12 for the 1900s, 21 to 32 for the 2000s, 41 to 52 for the 2100s, and so on.
    if (month % 20 < 1 || month % 20 > 12 || month > 92 || day < 1 || day > 31) return "range";
    return (10 - (sumOf(id.slice(0, 10), [1, 3, 7, 9, 1, 3, 7, 9, 1, 3]) % 10)) % 10 === Number(id[10]) ? null : "check";
  },
  messages: { range: "The date of birth inside this number does not exist." },
};

const se: NationalIdRule = {
  name: "Sweden",
  label: "personnummer",
  describe: "A personnummer is ten digits (YYMMDD-NNNC), or twelve with the century. The first digits are a date and the last is a check digit.",
  example: "811218-9876",
  maxLength: 12,
  keyboard: "numeric",
  clean: digitsOnly(12),
  format: (clean) => (clean.length > 10 ? grouped([8, 4], "-")(clean) : grouped([6, 4], "-")(clean)),
  check(id) {
    if (id.length !== 10 && id.length !== 12) return "length";
    if (id.length === 12 && !/^(19|20)/.test(id)) return "range";
    const own = id.slice(-10);
    const month = Number(own.slice(2, 4));
    const day = Number(own.slice(4, 6));
    // A coordination number (samordningsnummer) adds 60 to the day.
    if (month < 1 || month > 12 || day < 1 || (day > 31 && (day < 61 || day > 91))) return "range";
    return luhn(own) ? null : "check";
  },
  messages: { range: "The date inside this number does not exist.", check: "The last digit does not fit the others. Check for a mistyped digit." },
};

const ca: NationalIdRule = {
  name: "Canada",
  label: "SIN",
  describe: "A Social Insurance Number has nine digits and passes the Luhn check.",
  example: "046 454 286",
  maxLength: 9,
  keyboard: "numeric",
  clean: digitsOnly(9),
  format: grouped([3, 3, 3]),
  check(id) {
    if (id.length !== 9) return "length";
    if (/^0+$/.test(id)) return "range";
    return luhn(id) ? null : "check";
  },
  messages: { range: "A SIN is never all zeros.", check: "These nine digits do not pass the Luhn check. Check for a mistyped digit." },
};

/** The countries that come with the field, by ISO code. Add or replace one with the `countries` prop. */
export const NATIONAL_IDS: Readonly<Record<string, NationalIdRule>> = { BE: be, CA: ca, DE: de, ES: es, FR: fr, GB: gb, IT: it, NL: nl, PL: pl, PT: pt, SE: se, US: us };

type Rules = Readonly<Record<string, NationalIdRule>>;

const ruleFor = (country: string, rules: Rules): NationalIdRule | undefined => rules[country.trim().toUpperCase()];

/** What can be part of a number of this country, as capitals and digits without the separators, cut at its longest. An unknown country keeps letters and digits. */
export function cleanNationalId(country: string, raw: string, rules: Rules = NATIONAL_IDS): string {
  return (ruleFor(country, rules)?.clean ?? lettersAndDigits(24))(raw);
}

/** The number the way the country prints it ("111 222 333"), also while it is part typed. */
export function formatNationalId(country: string, raw: string, rules: Rules = NATIONAL_IDS): string {
  const rule = ruleFor(country, rules);
  return rule ? rule.format(rule.clean(raw)) : cleanNationalId(country, raw, rules);
}

/** What is wrong with a number, or null when it is right. A country that is not in the table has no check, and every number passes it. */
export function checkNationalId(country: string, raw: string, rules: Rules = NATIONAL_IDS): NationalIdProblem | null {
  const rule = ruleFor(country, rules);
  return rule ? rule.check(rule.clean(raw)) : null;
}

/** Whether a number is complete and passes its country's checks. A server can call this before it stores one. */
export function isNationalId(country: string, raw: string, rules: Rules = NATIONAL_IDS): boolean {
  const rule = ruleFor(country, rules);
  if (!rule) return false;
  const clean = rule.clean(raw);
  return clean !== "" && rule.check(clean) === null;
}

/** The sentence for a problem, in words that never repeat the number. */
export function nationalIdMessage(country: string, problem: NationalIdProblem, rules: Rules = NATIONAL_IDS): string {
  const rule = ruleFor(country, rules);
  return rule?.messages?.[problem] ?? rule?.describe ?? "This number is not right.";
}

/** The number with every letter and digit hidden, the separators kept: "••• ••• •••". */
export function maskNationalId(formatted: string): string {
  return formatted.replace(/[A-Za-z0-9]/g, "•");
}
