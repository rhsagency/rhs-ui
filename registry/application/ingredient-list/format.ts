/**
 * The amounts behind IngredientList, as plain functions: they hold no state
 * and call no hook, so a Server Component can use them too. Every function
 * takes the locale, so the same input gives the same text on the server and
 * in the browser.
 */

/** A unit's words by plural category ("one" and "other" in English; other languages add "few", "many"). */
export type UnitName = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

const numbers = new Map<string, Intl.NumberFormat>();
const plurals = new Map<string, Intl.PluralRules>();

/** A formatter for the locale, kept for the next call. An unknown locale falls back to US English: a typo must not take the page down. */
function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let found = numbers.get(key);
  if (!found) {
    try {
      found = new Intl.NumberFormat(locale, options);
    } catch {
      found = new Intl.NumberFormat("en-US", options);
    }
    numbers.set(key, found);
  }
  return found;
}

function pluralRules(locale: string): Intl.PluralRules {
  let found = plurals.get(locale);
  if (!found) {
    try {
      found = new Intl.PluralRules(locale);
    } catch {
      found = new Intl.PluralRules("en-US");
    }
    plurals.set(locale, found);
  }
  return found;
}

/** "{count}" and friends in a template, filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

/** The words of the units a kitchen uses that Intl has no name for. Pass your own through `units` to add or translate. */
export const DEFAULT_UNITS: Readonly<Record<string, UnitName>> = {
  cup: { one: "cup", other: "cups" },
  tbsp: { one: "tbsp", other: "tbsp" },
  tsp: { one: "tsp", other: "tsp" },
  clove: { one: "clove", other: "cloves" },
  pinch: { one: "pinch", other: "pinches" },
  slice: { one: "slice", other: "slices" },
  can: { one: "can", other: "cans" },
  bunch: { one: "bunch", other: "bunches" },
  sprig: { one: "sprig", other: "sprigs" },
  handful: { one: "handful", other: "handfuls" },
  knob: { one: "knob", other: "knobs" },
  stick: { one: "stick", other: "sticks" },
  piece: { one: "piece", other: "pieces" },
};

/** The units Intl knows by name: its short form follows the locale ("g", "oz", "fl oz") and its plural too. */
const INTL_UNITS: Readonly<Record<string, string>> = { g: "gram", kg: "kilogram", mg: "milligram", ml: "milliliter", l: "liter", oz: "ounce", lb: "pound", floz: "fluid-ounce" };

/** Units that are written as decimals, because a scale is marked in them. Everything else is written as a kitchen fraction. */
const DECIMAL_UNITS = new Set(["g", "kg", "mg", "ml", "l"]);

/** Units that hold a measured amount, which may be an eighth or a third of one. Everything else is something you count, and comes in quarters. */
const MEASURES = new Set(["cup", "tbsp", "tsp", "oz", "lb", "floz"]);

/** The fractions a cook can measure, as [value, written]. */
const MEASURED: readonly (readonly [number, string])[] = [
  [0, ""],
  [1 / 8, "1/8"],
  [1 / 4, "1/4"],
  [1 / 3, "1/3"],
  [3 / 8, "3/8"],
  [1 / 2, "1/2"],
  [5 / 8, "5/8"],
  [2 / 3, "2/3"],
  [3 / 4, "3/4"],
  [7 / 8, "7/8"],
  [1, ""],
];

/** The fractions you can cut a counted thing into. */
const COUNTED: readonly (readonly [number, string])[] = [
  [0, ""],
  [1 / 4, "1/4"],
  [1 / 2, "1/2"],
  [3 / 4, "3/4"],
  [1, ""],
];

function plainNumber(value: number, locale: string, digits = 0): string {
  return numberFormat(locale, { maximumFractionDigits: digits }).format(value);
}

/** An amount snapped to what a cook can measure: the whole part, the fraction as written ("" for none) and the number that all of it stands for. */
interface Snapped {
  whole: number;
  fraction: string;
  value: number;
}

/**
 * Snaps an amount to the nearest stop a cook can measure (an eighth or a third
 * for a measure, a quarter for a counted thing). It never falls back to a
 * decimal, because "0.9 cup" between "1 1/8 cups" and "3/4 cup" reads as a
 * mistake: a tie goes to the larger stop, a cook rounds up rather than short,
 * and a big amount rounds to the half first, because nobody weighs 12 3/8 cups.
 */
function snap(value: number, counted: boolean): Snapped {
  const stops = counted ? COUNTED : MEASURED;
  const input = value >= 10 ? Math.round(value * 2) / 2 : value;
  const whole = Math.floor(input);
  const rest = input - whole;
  let best = stops[0]!;
  // The stops run upwards, so `<=` lets the larger one win a tie. The sliver of allowance keeps float noise (0.9375 reached as 1.25 * 3 / 4) from deciding it.
  for (const stop of stops) if (Math.abs(stop[0] - rest) <= Math.abs(best[0] - rest) + 1e-9) best = stop;
  const rounded = best[0] === 1;
  const carried = rounded ? whole + 1 : whole;
  const fraction = rounded ? "" : best[1];
  // Never down to nothing: an eighth (a quarter for a counted thing) is the least a recipe can ask for.
  if (carried === 0 && fraction === "") return { whole: 0, fraction: stops[1]![1], value: stops[1]![0] };
  return { whole: carried, fraction, value: carried + (rounded ? 0 : best[0]) };
}

function writeSnapped(snapped: Snapped, locale: string): string {
  return [snapped.whole > 0 ? plainNumber(snapped.whole, locale) : "", snapped.fraction].filter(Boolean).join(" ");
}

/**
 * A quantity as a kitchen fraction: 1.5 is "1 1/2", 0.333 is "1/3", 0.9375 is
 * "1". The value snaps to the nearest fraction a cook can measure and is never
 * written as a decimal: nothing smaller than an eighth is asked for, and a big
 * amount rounds to the half. Counted things round to the quarter.
 */
export function fractionText(value: number, locale: string, counted = false): string {
  if (!Number.isFinite(value) || value <= 0) return plainNumber(0, locale);
  return writeSnapped(snap(value, counted), locale);
}

/** A metric amount as a decimal, rounded the way a scale reads: tenths below ten, whole numbers above, fives above a hundred. */
export function decimalText(value: number, locale: string, fine = false): string {
  if (value >= 100) return plainNumber(Math.round(value / 5) * 5, locale);
  if (value >= 10) return plainNumber(value, locale);
  return plainNumber(value, locale, fine ? 2 : 1);
}

/** What the unit is called for this amount, in the locale: "cup" or "cups", "g", "fl oz". An amount of one or less, a fraction of one included, takes the singular. */
export function unitText(unit: string, amount: number, locale: string, names?: Readonly<Record<string, UnitName>>): string {
  const key = unit.trim().toLowerCase();
  const named = names?.[key] ?? DEFAULT_UNITS[key];
  const category: Intl.LDMLPluralRule = amount <= 1 ? "one" : pluralRules(locale).select(amount);
  if (named) return named[category] ?? named.other;
  const intl = INTL_UNITS[key];
  if (intl) {
    const part = numberFormat(locale, { style: "unit", unit: intl, unitDisplay: "short" })
      .formatToParts(amount)
      .find((entry) => entry.type === "unit");
    if (part) return part.value;
  }
  return unit;
}

/**
 * One ingredient's amount as it is written on the card: the number and the
 * unit, from the quantity, scaled to the servings. Grams roll over into
 * kilograms at a thousand and millilitres into litres, and back below one.
 * A quantity that is a string ("a pinch", "a handful") is returned as written.
 * `value` is the number the written amount stands for, once it has snapped to a
 * fraction: it is what the unit and the name pluralise by.
 */
export function amountText(quantity: number | string, unit: string | undefined, locale: string, names?: Readonly<Record<string, UnitName>>): { amount: string; unit?: string; value?: number } {
  if (typeof quantity === "string") return { amount: quantity, unit };
  if (!Number.isFinite(quantity) || quantity <= 0) return { amount: "", unit };
  let value = quantity;
  let key = unit?.trim().toLowerCase() ?? "";
  if (key === "g" && value >= 1000) [value, key] = [value / 1000, "kg"];
  else if (key === "ml" && value >= 1000) [value, key] = [value / 1000, "l"];
  else if (key === "kg" && value < 1) [value, key] = [value * 1000, "g"];
  else if (key === "l" && value < 1) [value, key] = [value * 1000, "ml"];
  const written = key && key !== unit?.trim().toLowerCase() ? key : unit;
  if (DECIMAL_UNITS.has(key)) {
    const amount = decimalText(value, locale, key === "kg" || key === "l");
    return { amount, unit: written ? unitText(written, value, locale, names) : undefined, value };
  }
  const snapped = snap(value, !MEASURES.has(key));
  // The unit's number is the amount the cook reads, so "1 1/2 cups" is plural, "3/4 cup" is not, and 1.03 cups, which is written "1", is "1 cup".
  return { amount: writeSnapped(snapped, locale), unit: written ? unitText(written, snapped.value, locale, names) : undefined, value: snapped.value };
}

/** The name of an ingredient for this amount: a counted thing without a unit ("1 egg", "3 eggs") takes its plural; with a unit the name does not change ("2 cups flour"). */
export function nameText(name: string, plural: string | undefined, amount: number | string | undefined, hasUnit: boolean): string {
  if (!plural || hasUnit || typeof amount !== "number") return name;
  return amount <= 1 ? name : plural;
}
