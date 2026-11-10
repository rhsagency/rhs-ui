/** One tier of a rate table: the first amount it covers, and what that amount costs. A tier ends where the next one begins. */
export interface Tier {
  /** The first amount the tier covers, a whole number. The first tier starts where you start it and cannot be moved. */
  from: number;
  /** The rate of the tier, or `null` while it has none. In minor units (cents) when the editor has a `currency`, otherwise the plain number. */
  rate: number | null;
}

/** What the ranges count: one word, or the word in its singular and plural ("order", "orders"). */
export type TierUnit = string | { one: string; other: string };

/** The words the editor says, for translation. A `{name}` mark in a sentence is filled in. */
export interface TieredRatesEditorLabels {
  /** Names the table for a screen reader. Default "Rate tiers". */
  caption?: string;
  /** The row header; `{tier}` is its number. Default "Tier {tier}". */
  tier?: string;
  /** The heading of the column of row headers, which only a screen reader hears. Default "Tier". */
  tierColumn?: string;
  /** The heading of the first column of numbers. Default "From". */
  from?: string;
  /** The heading of the second. Default "To". */
  to?: string;
  /** What a screen reader and a tooltip say about the To column: it is worked out, not typed. Default "set by the next tier". */
  autoHint?: string;
  /** The heading of the column of remove buttons, which only a screen reader hears. Default "Actions". */
  actionsColumn?: string;
  /** What the last tier says in the To column. Default "and up". */
  andUp?: string;
  /** Names a From field; `{tier}`. Default "Tier {tier}, from". */
  fromField?: string;
  /** Names a rate field; `{tier}` and `{rate}`, the rate heading. Default "Tier {tier}, {rate}". */
  rateField?: string;
  /** Names the button that removes a tier; `{tier}`. Default "Remove tier {tier}". */
  remove?: string;
  /** The button that adds a tier. Default "Add tier". */
  add?: string;
  /** The note under the table; `{rate}` is the rate heading and `{ranges}` the list of ranges. Default "{rate} is {ranges}." */
  note?: string;
  /** One range with its rate, in the note; `{rate}` and `{range}`. Default "{rate} for {range}". */
  rangeRate?: string;
  /** A range in words; `{from}`, `{to}` and `{unit}`. Default "{from} to {to} {unit}". */
  range?: string;
  /** A range of one amount; `{from}` and `{unit}`. Default "{from} {unit}". */
  rangeOne?: string;
  /** The last range; `{from}` and `{unit}`. Default "{from} {unit} and up". */
  rangeOpen?: string;
  /** What the note says for a tier that has no rate. Default "no rate yet". */
  noRate?: string;
  /** Why a start is refused when it is too low; `{tier}`, `{previous}`, `{value}` and `{min}`. Default "Tier {tier} cannot start at {value}: tier {previous} would end before it starts. Use {min} or more." */
  refuseLow?: string;
  /** Why a start is refused when it is too high; `{tier}`, `{next}`, `{nextFrom}`, `{value}` and `{max}`. Default "Tier {tier} cannot start at {value}: it would end before it starts, because tier {next} begins at {nextFrom}. Use {max} or less." */
  refuseHigh?: string;
  /** Why an empty start is refused; `{tier}`. Default "Tier {tier} needs a number to start at." */
  refuseEmpty?: string;
  /** Said after a tier is added; `{tier}` and `{from}`. Default "Tier {tier} added, starting at {from}." */
  added?: string;
  /** Said after a tier is removed; `{tier}` and `{into}`, the tier that took over its range. Default "Tier {tier} removed. Its range now belongs to tier {into}." */
  removed?: string;
  /** Said after the first tier is removed, because no tier is before it; `{from}` is where the new first tier starts. Default "First tier removed. The next one now starts at {from} and is tier 1." */
  removedFirst?: string;
}

export const DEFAULT_LABELS = {
  caption: "Rate tiers",
  tier: "Tier {tier}",
  tierColumn: "Tier",
  from: "From",
  to: "To",
  autoHint: "set by the next tier",
  actionsColumn: "Actions",
  andUp: "and up",
  fromField: "Tier {tier}, from",
  rateField: "Tier {tier}, {rate}",
  remove: "Remove tier {tier}",
  add: "Add tier",
  note: "{rate} is {ranges}.",
  rangeRate: "{rate} for {range}",
  range: "{from} to {to} {unit}",
  rangeOne: "{from} {unit}",
  rangeOpen: "{from} {unit} and up",
  noRate: "no rate yet",
  refuseLow: "Tier {tier} cannot start at {value}: tier {previous} would end before it starts. Use {min} or more.",
  refuseHigh: "Tier {tier} cannot start at {value}: it would end before it starts, because tier {next} begins at {nextFrom}. Use {max} or less.",
  refuseEmpty: "Tier {tier} needs a number to start at.",
  added: "Tier {tier} added, starting at {from}.",
  removed: "Tier {tier} removed. Its range now belongs to tier {into}.",
  removedFirst: "First tier removed. The next one now starts at {from} and is tier 1.",
} satisfies Required<TieredRatesEditorLabels>;

export type Words = Required<TieredRatesEditorLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** The unit as a word for a number: a plain unit is used as it is, a pair is chosen by the plural rules of the language. */
export function unitFor(unit: TierUnit, count: number, locale: string): string {
  if (typeof unit === "string") return unit;
  return new Intl.PluralRules(locale).select(count) === "one" ? unit.one : unit.other;
}

/**
 * The tiers as the editor can work with them: in order, each start a whole
 * number above the one before it. A value that arrives out of order or with
 * two tiers starting at the same place is repaired, not trusted, because the
 * To column would otherwise show a range that ends before it starts. An empty
 * value is one tier from 1.
 */
export function tidyTiers(tiers: readonly Tier[]): Tier[] {
  const sorted = [...tiers].map((tier) => ({ from: Math.max(0, Math.round(tier.from)), rate: tier.rate })).sort((a, b) => a.from - b.from);
  if (sorted.length === 0) return [{ from: 1, rate: null }];
  const out: Tier[] = [];
  for (const tier of sorted) {
    const before = out[out.length - 1];
    out.push(before && tier.from <= before.from ? { ...tier, from: before.from + 1 } : tier);
  }
  return out;
}

/** Where tier `index` (from the second on) may start: after the tier before begins, and before the tier after begins. */
export function allowedFrom(tiers: readonly Tier[], index: number): { min: number; max: number } {
  const before = tiers[index - 1];
  const after = tiers[index + 1];
  return { min: before ? before.from + 1 : 0, max: after ? after.from - 1 : Number.POSITIVE_INFINITY };
}

/**
 * Why a start is refused, in words, or `null` when it is fine. `number` writes a
 * number the way the person reads it. While the person is still typing
 * (`settled` false) only a start that no further digit can repair is refused:
 * digits only make a number larger, so one above the top of its range is lost
 * for good, while one below the bottom ("7" on its way to "75") or an empty
 * cell may still become fine.
 */
export function refusalFor(tiers: readonly Tier[], index: number, value: number | null, words: Words, number: (n: number) => string, settled = true): string | null {
  const { min, max } = allowedFrom(tiers, index);
  if (!settled && (value === null || value <= max)) return null;
  if (value === null) return fill(words.refuseEmpty, { tier: index + 1 });
  if (value < min) return fill(words.refuseLow, { tier: index + 1, previous: index, value: number(value), min: number(min) });
  const after = tiers[index + 1];
  if (value > max && after) return fill(words.refuseHigh, { tier: index + 1, next: index + 2, nextFrom: number(after.from), value: number(value), max: number(max) });
  return null;
}

/** The longest reason a start can be refused with, written with long numbers. It is never shown: it measures how much room a reason can need, so the room can be kept free. */
export function widestRefusal(words: Words, number: (n: number) => string): string {
  const big = number(99999999);
  const values = { tier: 10, previous: 9, next: 11, nextFrom: big, value: big, min: big, max: big };
  return [words.refuseLow, words.refuseHigh, words.refuseEmpty].map((text) => fill(text, values)).reduce((longest, text) => (text.length > longest.length ? text : longest));
}

/** The tiers with the start of one of them moved. */
export function withFrom(tiers: readonly Tier[], index: number, from: number): Tier[] {
  return tiers.map((tier, at) => (at === index ? { ...tier, from } : tier));
}

/** The tiers with the rate of one of them changed. */
export function withRate(tiers: readonly Tier[], index: number, rate: number | null): Tier[] {
  return tiers.map((tier, at) => (at === index ? { ...tier, rate } : tier));
}

/** The next round number at or above `target`: 1, 2, 5, 10, 20, 50, 100 and so on. */
function roundUp(target: number): number {
  const power = 10 ** Math.floor(Math.log10(Math.max(1, target)));
  for (const step of [1, 2, 5, 10]) if (step * power >= target) return step * power;
  return 10 * power;
}

/** A tier after the last one. It starts at a round number about twice as far on, and has no rate yet. */
export function withAdded(tiers: readonly Tier[]): Tier[] {
  const last = tiers[tiers.length - 1];
  const from = last ? roundUp(Math.max(last.from + 1, last.from * 2)) : 1;
  return [...tiers, { from, rate: null }];
}

/**
 * The tiers without one of them. Its range goes to the tier before it, which
 * simply runs on to the next start. The first tier has none before it, so the
 * tier after it starts where it did.
 */
export function withoutTier(tiers: readonly Tier[], index: number): Tier[] {
  if (index === 0 && tiers.length > 1) {
    const [first, second, ...rest] = tiers;
    return first && second ? [{ ...second, from: first.from }, ...rest] : [...tiers];
  }
  return tiers.filter((_, at) => at !== index);
}

/** The last amount of tier `index`: one below the start of the next tier, or `null` for the last tier. */
export function endOf(tiers: readonly Tier[], index: number): number | null {
  const after = tiers[index + 1];
  return after ? after.from - 1 : null;
}

/** A number as people read it: grouped for the language, with at most `decimals` digits after the point. */
export function formatNumber(value: number, decimals: number, locale: string): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

/** The text a person has typed as a number: both the point and the comma count as the decimal mark. Empty or unreadable is `null`. */
export function parseNumber(text: string, decimals: number): number | null {
  const cleaned = text.replace(",", ".").replace(decimals > 0 ? /[^\d.]/g : /[^\d]/g, "");
  if (cleaned === "" || cleaned === ".") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/** What may be typed: digits, and with decimals one decimal mark and no more digits after it than are kept. */
export function cleanTyping(text: string, decimals: number): string {
  if (decimals === 0) return text.replace(/\D/g, "");
  const swapped = text.replace(",", ".").replace(/[^\d.]/g, "");
  const [whole = "", ...rest] = swapped.split(".");
  return rest.length ? `${whole}.${rest.join("").slice(0, decimals)}` : whole;
}

/** The whole table in words, for the note under it: "Price per unit is €12.00 for 1 to 9 units, €10.50 for 10 to 49 units and €9.00 for 50 units and up." */
export function describeTiers(tiers: readonly Tier[], context: { rateLabel: string; unit: TierUnit; locale: string; words: Words; rate: (rate: number) => string }): string {
  const { rateLabel, unit, locale, words, rate } = context;
  const count = (n: number) => formatNumber(n, 0, locale);
  const parts = tiers.map((tier, index) => {
    const to = endOf(tiers, index);
    const from = count(tier.from);
    const range =
      to === null
        ? fill(words.rangeOpen, { from, unit: unitFor(unit, tier.from, locale) })
        : to === tier.from
          ? fill(words.rangeOne, { from, unit: unitFor(unit, tier.from, locale) })
          : fill(words.range, { from, to: count(to), unit: unitFor(unit, to, locale) });
    return fill(words.rangeRate, { rate: tier.rate === null ? words.noRate : rate(tier.rate), range });
  });
  return fill(words.note, { rate: rateLabel, ranges: new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(parts) });
}
