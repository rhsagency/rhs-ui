/** One way to buy a product: a single piece, a box of 12, a pallet of 240. */
export interface SalesUnit {
  /** Identity of the unit, handed back in `value` and `onChange`. */
  id: string;
  /** What the shopper reads: "Piece", "Box of 12", "Pallet of 240". */
  label: string;
  /** How many pieces one of this unit holds: 1, 12, 240. The price per piece and the conversion between units come from it. */
  pieces: number;
  /** The price of one of this unit, in minor units: 2520 is 25.20. */
  price: number;
  /** The unit as a lowercase noun for sentences: "box". Defaults to the label up to " of ". */
  name?: string;
  /** Its plural: "boxes". Defaults to a regular plural of `name`. */
  plural?: string;
  /** The fewest that can be bought. Defaults to the step. */
  min?: number;
  /** Quantities are multiples of this: 6 for a product sold in sixes. Defaults to 1. */
  step?: number;
  /** The most that can be bought, such as the stock. Leave it out for no limit. */
  max?: number;
}

/** A unit as a noun, singular and plural. */
export interface UnitNouns {
  /** For one: "box". */
  one: string;
  /** For any other number: "boxes". */
  other: string;
}

/** The limits on a quantity, worked out from a unit's `min`, `step` and `max`. `min` and `max` are always multiples of `step`. */
export interface QuantityRules {
  /** The fewest that can be bought. */
  min: number;
  /** Quantities are multiples of this. */
  step: number;
  /** `null` means no limit. */
  max: number | null;
}

/** Which rule a quantity ran into. */
export type RuleHit = "min" | "step" | "max";

/** A regular English plural: box to boxes, party to parties, piece to pieces. */
export function pluralOf(noun: string): string {
  if (/(s|x|z|ch|sh)$/i.test(noun)) return `${noun}es`;
  if (/[^aeiou]y$/i.test(noun)) return `${noun.slice(0, -1)}ies`;
  return `${noun}s`;
}

/** The unit's name for sentences: what the unit says, or the label up to " of " ("Box of 12" is a "box"). */
export function nounsOf(unit: Pick<SalesUnit, "label" | "name" | "plural">): UnitNouns {
  const one = (unit.name ?? unit.label.split(/\s+of\s+/i)[0] ?? unit.label).trim().toLowerCase();
  return { one, other: unit.plural ?? pluralOf(one) };
}

/** Normalises the limits: a minimum that is not a multiple of the step is rounded up to one, a maximum rounded down. */
export function rulesOf(limits: { min?: number; step?: number; max?: number }): QuantityRules {
  const step = Math.max(1, Math.floor(limits.step ?? 1));
  const wanted = Math.max(1, Math.floor(limits.min ?? step), step);
  return {
    min: Math.ceil(wanted / step) * step,
    step,
    max: limits.max === undefined ? null : Math.floor(limits.max / step) * step,
  };
}

/** Whether anything can be bought at all: a maximum below the minimum means sold out. */
export const isAvailable = (rules: QuantityRules): boolean => rules.max === null || rules.max >= rules.min;

/**
 * The nearest quantity the rules allow, and the rule that had to move it.
 * `nearest` is for typing; `up` is for conversions, where the shopper must never end up short.
 */
export function snapQuantity(rules: QuantityRules, value: number, rounding: "nearest" | "up" = "nearest"): { quantity: number; hit: RuleHit | null } {
  if (!Number.isFinite(value) || value < rules.min) return { quantity: rules.min, hit: "min" };
  if (rules.max !== null && value > rules.max) return { quantity: rules.max, hit: "max" };
  const steps = value / rules.step;
  const quantity = (rounding === "up" ? Math.ceil(steps - 1e-9) : Math.round(steps)) * rules.step;
  if (rules.max !== null && quantity > rules.max) return { quantity: rules.max, hit: "max" };
  return { quantity, hit: quantity === value ? null : "step" };
}

/** What a quantity of one unit becomes in another: the same number of pieces, rounded up to what the new unit allows. */
export function convertQuantity(from: Pick<SalesUnit, "pieces">, quantity: number, to: Pick<SalesUnit, "pieces" | "min" | "step" | "max">) {
  const pieces = quantity * from.pieces;
  const snapped = snapQuantity(rulesOf(to), pieces / to.pieces, "up");
  const converted = snapped.quantity * to.pieces;
  return { quantity: snapped.quantity, pieces: converted, exact: converted === pieces, hit: snapped.hit };
}

/** The price of one piece in minor units. It is often a fraction of a cent. */
export const pricePerPiece = (unit: Pick<SalesUnit, "price" | "pieces">): number => unit.price / unit.pieces;

/** The unit the others are compared with: the one with the highest price per piece, which is usually the smallest pack. */
export function referenceUnit<T extends Pick<SalesUnit, "price" | "pieces">>(units: readonly T[]): T | undefined {
  return units.reduce<T | undefined>((best, unit) => (best === undefined || pricePerPiece(unit) > pricePerPiece(best) ? unit : best), undefined);
}

/** How much cheaper a piece is in this unit than in the reference unit, in whole percent. Zero for the reference itself. */
export function savingPercent<T extends Pick<SalesUnit, "id" | "price" | "pieces">>(units: readonly T[], unit: T): number {
  const reference = referenceUnit(units);
  if (!reference || reference.id === unit.id) return 0;
  return Math.max(0, Math.round((1 - pricePerPiece(unit) / pricePerPiece(reference)) * 100));
}

/** What a quantity of this unit saves against buying the same pieces in the reference unit. */
export interface LineSaving<T> {
  /** In minor units. */
  amount: number;
  /** In whole percent, at least 1. */
  percent: number;
  /** The unit it is compared with. */
  reference: T;
}

export function savingOnLine<T extends Pick<SalesUnit, "id" | "price" | "pieces">>(units: readonly T[], unit: T, quantity: number): LineSaving<T> | null {
  const reference = referenceUnit(units);
  if (!reference || reference.id === unit.id) return null;
  const atReference = Math.round((reference.price * unit.pieces * quantity) / reference.pieces);
  const amount = atReference - unit.price * quantity;
  if (!(amount > 0)) return null;
  return { amount, percent: Math.max(1, Math.round((amount / atReference) * 100)), reference };
}

/** The line total of a quantity of one unit, in minor units. */
export const lineTotal = (unit: Pick<SalesUnit, "price">, quantity: number): number => unit.price * quantity;

/** The price of an amount sold by weight, in minor units, rounded half up to the cent. */
export const weightTotal = (pricePerKilo: number, grams: number): number => Math.round((pricePerKilo * grams) / 1000);

/** A weight as people write it: "250 g", "1 kg", "1.25 kg". */
export function formatWeight(grams: number, locale: string): string {
  const kilo = grams >= 1000;
  return new Intl.NumberFormat(locale, { style: "unit", unit: kilo ? "kilogram" : "gram", unitDisplay: "short", maximumFractionDigits: kilo ? 2 : 0 }).format(kilo ? grams / 1000 : grams);
}

/** A price per piece: whole cents when it is, three decimals when it is not, so 12 pieces at the shown price never contradict the line total. */
export function formatPerPiece(amount: number, currency: string, locale: string): string {
  const whole = Math.abs(amount - Math.round(amount)) < 1e-9;
  return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: whole ? 2 : 3 }).format(amount / 100);
}
