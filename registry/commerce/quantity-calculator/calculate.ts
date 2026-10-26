/** The unit the coverage of a pack, and every result, is in. */
export type AreaUnit = "m2" | "ft2";

/** How many packs a job needs, and what they cover. Areas are in the unit the coverage was given in. */
export interface PackEstimate {
  /** Whole packs to order: always rounded up. */
  packs: number;
  /** The packs the job needs before rounding up: 6.875. */
  exactPacks: number;
  /** True when the job needs a whole number of packs exactly, so there was nothing to round up. */
  exact: boolean;
  /** The area to cover plus the waste margin. */
  needed: number;
  /** What the packs cover together. */
  covered: number;
  /** What is left over after the area itself is covered. */
  spare: number;
}

/** Thousandths of a unit: areas and coverage are counted in whole thousandths so 0.1 + 0.2 never drifts. */
const MILLI = 1000;
/** Hundredths of a percent, for the same reason. */
const BASIS = 10_000;

/** The character the locale writes a decimal with: "." for en-US, "," for nl-NL. */
function decimalOf(locale: string): "." | "," {
  return new Intl.NumberFormat(locale).formatToParts(1.1).find((part) => part.type === "decimal")?.value === "," ? "," : ".";
}

/**
 * Reads what a shopper typed: "7.5", "7,5", "1,200" or "1.200,5", whichever way the locale groups and divides.
 * A number that could be either (1,200 in an English locale) is read the way the locale writes it. Anything that
 * is not a plain number, such as "12 m", "1e3" or "1.2.3", comes back as null; so does an empty field.
 */
export function parseDecimal(text: string, locale: string): number | null {
  let value = text.trim().replace(/\s/g, "");
  if (!value) return null;
  const decimal = decimalOf(locale);
  const group = decimal === "." ? "," : ".";
  // A separator that only ever groups three digits is a thousands separator: 1,200 in en-US, 1.200 in nl-NL.
  if (new RegExp(`^-?\\d{1,3}(\\${group}\\d{3})+(\\${decimal}\\d*)?$`).test(value)) value = value.split(group).join("");
  value = value.replace(",", ".");
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(value)) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * Works out the packs for an area, a waste margin and what one pack covers. Everything is counted in whole
 * thousandths, so a pack of 1.44 and a margin of 10% give the same answer on every machine, and the packs
 * are rounded up with integer arithmetic: 6.875 packs is 7, and exactly 7 stays 7. Null when the area or
 * the coverage is not above zero.
 */
export function estimatePacks(area: number, wastePercent: number, coveragePerPack: number): PackEstimate | null {
  const areaMilli = Math.round(area * MILLI);
  const coverageMilli = Math.round(coveragePerPack * MILLI);
  const wasteBasis = Math.round(Math.max(0, wastePercent) * 100);
  if (!(areaMilli > 0) || !(coverageMilli > 0)) return null;
  const neededScaled = areaMilli * (BASIS + wasteBasis);
  const perPackScaled = coverageMilli * BASIS;
  const packs = Math.floor((neededScaled + perPackScaled - 1) / perPackScaled);
  return {
    packs,
    exactPacks: neededScaled / perPackScaled,
    exact: neededScaled % perPackScaled === 0,
    needed: neededScaled / (MILLI * BASIS),
    covered: (packs * coverageMilli) / MILLI,
    spare: (packs * coverageMilli - areaMilli) / MILLI,
  };
}

/** The area of a rectangle, rounded to a thousandth. */
export const rectangleArea = (length: number, width: number): number => Math.round(length * width * MILLI) / MILLI;
