import type { PhoneCountry } from "@rhs-ui/primitives/phone-input";

/** How a country writes its numbers: the digits after the dialling code, an example, and what to call it in a sentence. */
interface PhoneFormat {
  /** How many digits the national number can have. */
  lengths: readonly number[];
  /** A number as it is usually written, for the message. */
  example: string;
  /** "Dutch": how a number of the country is called. */
  name: string;
  /** How the digits are grouped when the number is shown back. */
  groups: readonly number[];
}

/** The formats of the countries the phone field lists by default, by dialling code. A country that is not here still gets the length rule every number has. */
const FORMATS: Readonly<Record<string, PhoneFormat>> = {
  "31": { lengths: [9], example: "6 12 34 56 78", name: "Dutch", groups: [1, 2, 2, 2, 2] },
  "32": { lengths: [8, 9], example: "470 12 34 56", name: "Belgian", groups: [3, 2, 2, 2] },
  "49": { lengths: [10, 11], example: "151 2345 6789", name: "German", groups: [3, 4, 4] },
  "33": { lengths: [9], example: "6 12 34 56 78", name: "French", groups: [1, 2, 2, 2, 2] },
  "44": { lengths: [10], example: "7400 123456", name: "British", groups: [4, 6] },
  "34": { lengths: [9], example: "612 34 56 78", name: "Spanish", groups: [3, 2, 2, 2] },
  "39": { lengths: [9, 10], example: "312 345 6789", name: "Italian", groups: [3, 3, 4] },
  "1": { lengths: [10], example: "415 555 0132", name: "US or Canadian", groups: [3, 3, 4] },
};

/** The shortest and longest national number any country has, which is all we can say about a country we know nothing else of. */
const ANY = { min: 6, max: 12 } as const;

/** The country a number in the international form belongs to: the one with the longest dialling code that starts it. */
export function countryOf(e164: string, countries: readonly PhoneCountry[]): PhoneCountry | undefined {
  const digits = e164.replace(/\D/g, "");
  return countries.reduce<PhoneCountry | undefined>((best, country) => (digits.startsWith(country.dial) && (!best || country.dial.length > best.dial.length) ? country : best), undefined);
}

/** What is wrong with a number, as data, so the card can say it in its own words. Null when it is fine. */
export type PhoneProblem = { kind: "empty" } | { kind: "known"; name: string; dial: string; digits: string; example: string } | { kind: "generic"; min: number; max: number };

/**
 * Whether a number in the international form ("+31612345678") can be a real
 * one: the right number of digits for its country when we know the country's
 * format, a length every number has when we do not. It cannot know whether the
 * number is in use; only the text message can.
 */
export function phoneProblem(e164: string, countries: readonly PhoneCountry[]): PhoneProblem | null {
  const digits = e164.replace(/\D/g, "");
  if (!digits) return { kind: "empty" };
  const country = countryOf(e164, countries);
  const national = country ? digits.length - country.dial.length : digits.length;
  const format = country ? FORMATS[country.dial] : undefined;
  if (country && format) {
    if (format.lengths.includes(national)) return null;
    return { kind: "known", name: format.name, dial: country.dial, digits: format.lengths.join(" or "), example: format.example };
  }
  return national >= ANY.min && national <= ANY.max ? null : { kind: "generic", ...ANY };
}

/** A number as it is read aloud and shown back: "+31 6 12 34 56 78". The groups are those of the country when we know them, threes when we do not. */
export function formatPhone(e164: string, countries: readonly PhoneCountry[]): string {
  const digits = e164.replace(/\D/g, "");
  const country = countryOf(e164, countries);
  if (!country) return digits ? `+${digits}` : "";
  const national = digits.slice(country.dial.length);
  const pattern = FORMATS[country.dial]?.groups ?? [3, 3, 3, 3];
  const parts: string[] = [];
  let at = 0;
  for (const size of pattern) {
    if (at >= national.length) break;
    parts.push(national.slice(at, at + size));
    at += size;
  }
  if (at < national.length) parts.push(national.slice(at));
  return `+${country.dial} ${parts.join(" ")}`.trim();
}
