/** One part of what the customer pays. */
export interface PricePart {
  /** What the money pays for: "Materials", "Making", "Shipping and duties", "Margin". */
  label: string;
  /** How much of the price it is, in minor units: 4200 is 42.00. */
  amount: number;
  /** One line that says what is in it. It opens from the part's name. */
  note?: string;
}

export interface PriceTransparencyLabels {
  /** The heading. */
  title?: string;
  /** What a screen reader hears for the list under the bar. */
  list?: string;
  /** The part for what the parts do not account for, when the price is higher than they add up to. */
  other?: string;
  /** The last row: what everything adds up to. */
  total?: string;
  /** For a screen reader after a part's name that has an explanation. `{label}`. */
  explain?: string;
  /** For a share that rounds to nothing. */
  lessThanOne?: string;
  /** The comparison with the retail price. */
  retail?: string;
  thisPrice?: string;
  /** The sentence over the comparison. `{percent}` is how much lower this price is. */
  saving?: string;
}

export const WORDS = {
  title: "Where the money goes",
  list: "What the price pays for",
  other: "Other costs",
  total: "Price",
  explain: "what is in {label}",
  lessThanOne: "<1%",
  retail: "Typical retail price",
  thisPrice: "This price",
  saving: "You pay {percent} less than the typical retail price.",
} satisfies Required<PriceTransparencyLabels>;

export const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** A part as it is drawn and listed. */
export interface Slice {
  label: string;
  amount: number;
  note?: string;
  /** Its share of the price as a whole percentage. The shares of all the slices add up to exactly 100. */
  share: number;
  /** An index into the tones. */
  tone: number;
  /** True for the part that stands for what the parts do not account for. */
  other: boolean;
}

/**
 * The whole percentages of some amounts, rounded so they add up to exactly 100 (the largest remainders take the
 * spare points), because a list that says 33%, 33% and 33% under a bar that is full looks careless.
 */
export function sharesOf(amounts: readonly number[]): number[] {
  const sum = amounts.reduce((total, amount) => total + amount, 0);
  if (sum <= 0) return amounts.map(() => 0);
  const raw = amounts.map((amount) => (amount / sum) * 100);
  const shares = raw.map((value) => Math.floor(value));
  let spare = 100 - shares.reduce((total, share) => total + share, 0);
  const byRemainder = raw.map((value, index) => ({ index, remainder: value - Math.floor(value) })).sort((a, b) => b.remainder - a.remainder);
  for (const { index } of byRemainder) {
    if (spare <= 0) break;
    shares[index] = (shares[index] ?? 0) + 1;
    spare -= 1;
  }
  return shares;
}

/**
 * The slices of the price: the parts with money in them, in the order given, and one more for what is left when
 * the price is higher than the parts add up to, so the bar always sums to the price. When the parts add up to more
 * than the price, the price is what they add up to. With no usable part at all there are no slices, and the price
 * stands as it is: a product without cost data is never written as free. Returns the total it settled on as well.
 */
export function slicesOf(parts: readonly PricePart[], price: number, otherLabel: string): { slices: Slice[]; total: number } {
  const real = parts.filter((part) => Number.isFinite(part.amount) && part.amount > 0 && part.label.trim() !== "");
  const known = real.reduce((total, part) => total + part.amount, 0);
  const rest = Number.isFinite(price) ? price - known : 0;
  const entries: { label: string; amount: number; note?: string; other: boolean }[] = real.map((part) => ({ label: part.label, amount: part.amount, note: part.note, other: false }));
  if (rest > 0 && real.length > 0) entries.push({ label: otherLabel, amount: rest, other: true });
  const added = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const total = entries.length > 0 ? added : Number.isFinite(price) ? Math.max(0, price) : 0;
  const shares = sharesOf(entries.map((entry) => entry.amount));
  return {
    total,
    slices: entries.map((entry, index) => ({ label: entry.label, amount: entry.amount, note: entry.note, share: shares[index] ?? 0, tone: index, other: entry.other })),
  };
}
