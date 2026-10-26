import type { RecipeIngredient } from "@rhs-ui/marketing/recipe-layout/types";

/**
 * Rescaling a quantity the way a cook writes it: fractions for spoons, cups
 * and counted things, decimals for metric weights and volumes, and a bigger
 * unit once the number gets big. It holds no hooks, so a Server Component can
 * use it to write the same lines the page shows.
 */

/** The fractions each kind of measure has, and a cook can read at a glance. */
const SPOON = [0, 1 / 8, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4, 1] as const;
const CUP = [0, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4, 1] as const;
const COUNT = [0, 1 / 4, 1 / 2, 3 / 4, 1] as const;

const GLYPHS: ReadonlyArray<readonly [number, string]> = [
  [1 / 8, "⅛"],
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [1 / 2, "½"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
];

/** Units written with a decimal rather than a fraction. */
const DECIMAL_UNITS = new Set(["g", "kg", "ml", "l", "cl", "dl", "mm", "cm"]);

/** A number as a whole and one of the fractions of its measure: 1.5 is "1½", 0.3 is "⅓". Null when it rounds to nothing. */
function toFraction(value: number, fractions: readonly number[]): { text: string; value: number } | null {
  if (!Number.isFinite(value) || value <= 0) return null;
  const whole = Math.floor(value + 1e-9);
  const rest = Math.max(0, value - whole);
  let best = fractions[0] ?? 0;
  for (const fraction of fractions) if (Math.abs(fraction - rest) < Math.abs(best - rest)) best = fraction;
  const carried = best === 1;
  const wholes = carried ? whole + 1 : whole;
  const glyph = carried ? "" : (GLYPHS.find(([fraction]) => Math.abs(fraction - best) < 1e-9)?.[1] ?? "");
  const text = `${wholes > 0 ? wholes : ""}${glyph}`;
  return text === "" ? null : { text, value: wholes + (carried ? 0 : best) };
}

/** Whole grams and millilitres to the nearest 5 from 20 up, to the nearest half below that. */
function roundMetric(value: number): number {
  return value >= 20 ? Math.round(value / 5) * 5 : Math.round(value * 2) / 2;
}

const isHalfMultiple = (value: number) => Math.abs(value * 2 - Math.round(value * 2)) < 1e-6;

export interface ScaledAmount {
  /** The number as it is written: "1½", "250", "0.75". Empty when the amount rounds to nothing. */
  text: string;
  /** The number the text stands for, to decide between one and many. */
  value: number;
  /** The unit after conversion: 1500 g is "1.5 kg". */
  unit: string | undefined;
}

/**
 * Scales a quantity by a factor and writes it with a sensible number and unit.
 * With `whole` the amount is a whole number of at least one: an egg is never ¾.
 */
export function scaleAmount(quantity: number, unit: string | undefined, factor: number, locale = "en-US", whole = false): ScaledAmount {
  let value = quantity * factor;
  if (whole) {
    const count = Math.max(1, Math.round(value));
    return { text: new Intl.NumberFormat(locale).format(count), value: count, unit };
  }
  let shown = unit;
  if (shown === "g" && value >= 1000) [value, shown] = [value / 1000, "kg"];
  else if (shown === "kg" && value < 1) [value, shown] = [value * 1000, "g"];
  else if (shown === "ml" && value >= 1000) [value, shown] = [value / 1000, "l"];
  else if (shown === "l" && value < 1) [value, shown] = [value * 1000, "ml"];
  else if (shown === "tsp" && value >= 3 && isHalfMultiple(value / 3)) [value, shown] = [value / 3, "tbsp"];
  else if (shown === "tbsp" && value < 1) [value, shown] = [value * 3, "tsp"];
  else if (shown === "cup" && value < 0.25) [value, shown] = [value * 16, "tbsp"];

  if (shown !== undefined && DECIMAL_UNITS.has(shown)) {
    // Past a kilogram or a litre, to the nearest 50 g or 50 ml: 1.13 kg is 1.15 kg.
    const number = shown === "kg" || shown === "l" ? Math.round(value * 20) / 20 : roundMetric(value);
    return { text: new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(number), value: number, unit: shown };
  }
  const fractions = shown === "tsp" || shown === "tbsp" ? SPOON : shown === "cup" ? CUP : COUNT;
  const fraction = toFraction(value, fractions);
  return { text: fraction?.text ?? "", value: fraction?.value ?? value, unit: shown };
}

export interface ShownIngredient {
  /** The amount: "1½", or a few words such as "a pinch of" when it rounds to nothing. Empty for a line without a quantity. */
  amount: string;
  /** The unit, in its plural form when the amount is more than one. */
  unit: string;
  name: string;
  note?: string;
}

/** An ingredient written for a number of servings, as a factor of the servings the recipe is written for. */
export function showIngredient(ingredient: RecipeIngredient, factor: number, locale = "en-US", pinch = "a pinch of"): ShownIngredient {
  if (ingredient.quantity === undefined) return { amount: "", unit: "", name: ingredient.name, note: ingredient.note };
  const scaled = scaleAmount(ingredient.quantity, ingredient.unit, factor, locale, ingredient.whole);
  const many = scaled.value > 1;
  const unit = scaled.unit === undefined ? "" : many && scaled.unit === ingredient.unit && ingredient.unitPlural ? ingredient.unitPlural : scaled.unit;
  const name = many && !unit && ingredient.plural ? ingredient.plural : ingredient.name;
  return { amount: scaled.text === "" ? pinch : scaled.text, unit: scaled.text === "" ? "" : unit, name, note: ingredient.note };
}

/** The same line as plain text, for search engines and for reading aloud: "1½ tbsp olive oil, plus extra to serve". */
export function ingredientLine(ingredient: RecipeIngredient, factor = 1, locale = "en-US", pinch = "a pinch of"): string {
  const shown = showIngredient(ingredient, factor, locale, pinch);
  const text = [shown.amount, shown.unit, shown.name].filter(Boolean).join(" ");
  return shown.note ? `${text}, ${shown.note}` : text;
}

/** Minutes as the cook says them: "15 min", "1 h 10 min". */
export function formatMinutes(minutes: number, words: { hour: string; minute: string }, locale = "en-US"): string {
  const total = Math.max(0, Math.round(minutes));
  const number = new Intl.NumberFormat(locale);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  const parts: string[] = [];
  if (hours) parts.push(`${number.format(hours)} ${words.hour}`);
  if (rest || !hours) parts.push(`${number.format(rest)} ${words.minute}`);
  return parts.join(" ");
}
