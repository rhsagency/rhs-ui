/** The two ways the field writes a height: one number in centimetres, or two in feet and inches. */
export type HeightUnit = "cm" | "ftin";

/** The words the field says, on screen and to a screen reader. Each can be replaced, for another language or your own voice. */
export interface HeightLabels {
  /** The name of the whole field when it has no label, id or aria-label of its own. */
  group: string;
  /** The name of the centimetres input. */
  centimetres: string;
  /** The names of the feet and the inches input. */
  feet: string;
  inches: string;
  /** The name of the switch, and what its two sides say. */
  unit: string;
  centimetresShort: string;
  feetInchesShort: string;
  /** The unit written after a number: "cm", "ft", "in". */
  cm: string;
  ft: string;
  in: string;
  /** The lowest height allowed, with the same height in the other unit. `limit` and `other` are written out: "100 cm" and "3 ft 3 in". */
  atLeast: (limit: string, other: string) => string;
  /** The highest height allowed. */
  atMost: (limit: string, other: string) => string;
  /** Said when the unit changes: "Now in feet and inches: 5 ft 11 in". */
  switched: (unit: string, height: string) => string;
  /** Said when a number such as 1.8 was read as metres: "Read 1.8 as metres: 180 cm". */
  metres: (typed: string, height: string) => string;
  /** The names of the two units, for the sentence above. */
  centimetresName: string;
  feetInchesName: string;
}

export const DEFAULT_LABELS: HeightLabels = {
  group: "Height",
  centimetres: "Height in centimetres",
  feet: "Feet",
  inches: "Inches",
  unit: "Unit",
  centimetresShort: "cm",
  feetInchesShort: "ft / in",
  cm: "cm",
  ft: "ft",
  in: "in",
  atLeast: (limit, other) => `Enter a height of at least ${limit} (${other}).`,
  atMost: (limit, other) => `Enter a height of at most ${limit} (${other}).`,
  switched: (unit, height) => `Now in ${unit}: ${height}.`,
  metres: (typed, height) => `Read ${typed} as metres: ${height}.`,
  centimetresName: "centimetres",
  feetInchesName: "feet and inches",
};

const CM_PER_INCH = 2.54;

/** A height in centimetres as whole inches, rounded to the nearest. */
export const inchesOf = (cm: number): number => Math.round(cm / CM_PER_INCH);

/** Whole inches as feet and the inches that are left over. */
export function feetAndInches(totalInches: number): { feet: number; inches: number } {
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

/** Feet and inches as whole centimetres. Inches above 11 roll into feet by themselves, because it is only a sum. */
export const centimetresOf = (feet: number, inches: number): number => Math.round((feet * 12 + inches) * CM_PER_INCH);

const formats = new Map<string, Intl.NumberFormat>();

function numberFormat(locale: string): Intl.NumberFormat {
  let format = formats.get(locale);
  if (!format) {
    try {
      format = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    } catch {
      format = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
    }
    formats.set(locale, format);
  }
  return format;
}

/** A whole number as the locale writes it. */
export const whole = (value: number, locale: string): string => numberFormat(locale).format(value);

/** "180 cm". */
export const writeCentimetres = (cm: number, locale: string, unit: string): string => `${whole(cm, locale)} ${unit}`;

/** "5 ft 11 in", rounded to the nearest inch. */
export function writeFeetInches(cm: number, locale: string, ft: string, inch: string): string {
  const { feet, inches } = feetAndInches(inchesOf(cm));
  return `${whole(feet, locale)} ${ft} ${whole(inches, locale)} ${inch}`;
}

/**
 * Digits typed on a keyboard that writes them differently (Arabic-Indic,
 * Persian) as the digits 0 to 9, and a comma or a point as the one decimal sign.
 * Written by code point, so the source stays ASCII.
 */
function asciiNumber(text: string): string {
  let plain = "";
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code >= 0x660 && code <= 0x669) plain += String(code - 0x660);
    else if (code >= 0x6f0 && code <= 0x6f9) plain += String(code - 0x6f0);
    else if (code === 0x66b) plain += ".";
    else plain += char;
  }
  return plain;
}

/** What may stay in the centimetres field while someone types: digits and one decimal sign. */
export function tidyCentimetres(raw: string): string {
  const text = asciiNumber(raw).replace(/[^\d.,]/g, "");
  const first = text.search(/[.,]/);
  return first === -1 ? text.slice(0, 6) : `${text.slice(0, first + 1)}${text.slice(first + 1).replace(/[.,]/g, "")}`.slice(0, 7);
}

/** What may stay in the feet and the inches field: digits only, and no more than two of them. */
export function tidyWhole(raw: string): string {
  return asciiNumber(raw).replace(/\D/g, "").slice(0, 2);
}

/**
 * The text in the centimetres field as whole centimetres, or null when it holds
 * no number. A number with a decimal sign between 0.5 and 3 is a height in
 * metres ("1,8" and "1.80" are 180 cm), which is how it is written in most of
 * the world; anything else is rounded to the nearest centimetre.
 */
export function parseCentimetres(raw: string): { cm: number; metres: boolean } | null {
  const text = tidyCentimetres(raw);
  if (!/\d/.test(text)) return null;
  const number = Number(text.replace(",", ".").replace(/^\./, "0."));
  if (!Number.isFinite(number)) return null;
  if (/[.,]/.test(text) && number >= 0.5 && number <= 3) return { cm: Math.round(number * 100), metres: true };
  return { cm: Math.round(number), metres: false };
}

/** A height written in one go, "5'11", "5 ft 11 in" or "5-11", as feet and inches; null when it is not one. */
export function parseFeetInches(raw: string): { feet: number; inches: number } | null {
  const match = /^\s*(\d{1,2})\s*(?:'|’|ft\.?|feet|foot|-|\s)\s*(?:(\d{1,2})\s*(?:"|”|''|in\.?|inch|inches)?)?\s*$/i.exec(asciiNumber(raw));
  if (!match) return null;
  return { feet: Number(match[1]), inches: Number(match[2] ?? 0) };
}

const REGIONS_THAT_USE_FEET = new Set(["US", "LR", "MM", "GB"]);

/** The unit a locale most likely wants a height in: feet and inches in the United States and the United Kingdom, centimetres elsewhere. */
export function defaultUnitFor(locale: string): HeightUnit {
  try {
    const region = new Intl.Locale(locale).maximize().region ?? "";
    return REGIONS_THAT_USE_FEET.has(region) ? "ftin" : "cm";
  } catch {
    return "cm";
  }
}
