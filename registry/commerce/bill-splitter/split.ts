/** One person's part of a bill in minor units, split into what it is made of. */
export interface BillShare {
  /** Position in the list of people, from 0. */
  index: number;
  /** The name shown for this person. */
  name: string;
  /** Their part of the bill itself. */
  subtotal: number;
  /** Their part of the tip. */
  tip: number;
  /** What rounding their share up added. 0 while rounding is off. */
  rounding: number;
  /** Everything they pay: the subtotal, the tip and the rounding. */
  total: number;
  /** ISO 4217 code the amounts are in. */
  currency: string;
}

/** One line of the bill. */
export interface BillItem {
  /** Identity of the line, for your list's key. */
  id: string;
  /** What it is: "Tagliatelle ragù". */
  name: string;
  /** The price of the line in minor units, quantity included: 1850 is 18.50. */
  amount: number;
  /** Who had it, as positions in the list of people (0 is the first). Leave it out when everyone shares it. */
  sharedBy?: readonly number[];
}

export interface SplitInput {
  /** The bill in minor units. */
  total: number;
  /** How many people share it. */
  people: number;
  /** The lines of the bill. Without them the bill is split equally. */
  items?: readonly { amount: number; sharedBy?: readonly number[] }[];
  /** The tip, in percent of the bill. */
  tipPercent: number;
  /** Round every share up to a multiple of this many minor units. 0 leaves the shares as they are. */
  roundTo?: number;
}

export interface SplitResult {
  /** Each person's part of the bill itself. Adds up to the bill. */
  subtotals: number[];
  /** Each person's part of the tip. Adds up to `tipTotal`. */
  tips: number[];
  /** What rounding up added for each person. */
  roundings: number[];
  /** What each person pays. Adds up to `grandTotal`. */
  totals: number[];
  /** The bill itself, as it was given. */
  billTotal: number;
  /** The tip in all, in minor units: the tip percentage of the bill. */
  tipTotal: number;
  /** What rounding every share up added in all. 0 while rounding is off. */
  roundingTotal: number;
  /** The bill, the tip and the rounding together. */
  grandTotal: number;
}

// BigInt() calls, never 0n literals: a literal needs a compile target of ES2020, and Next.js starts a project at ES2017.
const ZERO = BigInt(0);
const ONE = BigInt(1);

/**
 * Hands out `amount` in proportion to `weights`, in whole minor units, so the parts always add up to
 * `amount`. Every part is rounded down first; the cents that are left go one each to the parts with the
 * largest fractions, and equal fractions go to whoever is first in line. The same input always gives the
 * same parts, on the server and in the browser. All arithmetic is exact (BigInt), whatever the size.
 */
export function allocate(amount: number, weights: readonly number[]): number[] {
  if (weights.length === 0) return [];
  const units = BigInt(Math.abs(Math.round(amount)));
  const given = weights.map((weight) => BigInt(Math.max(0, Math.round(weight))));
  // Weights that are all zero fall back to equal parts.
  const parts = given.every((weight) => weight === ZERO) ? given.map(() => ONE) : given;
  const whole = parts.reduce((sum, weight) => sum + weight, ZERO);
  const floors = parts.map((weight) => (units * weight) / whole);
  const rests = parts.map((weight) => (units * weight) % whole);
  let left = Number(units - floors.reduce((sum, part) => sum + part, ZERO));
  const out = floors.map((part) => Number(part));
  const order = rests.map((rest, index) => ({ rest, index })).sort((a, b) => (a.rest === b.rest ? a.index - b.index : a.rest > b.rest ? -1 : 1));
  for (const { index } of order) {
    if (left <= 0) break;
    out[index] = (out[index] ?? 0) + 1;
    left -= 1;
  }
  return amount < 0 ? out.map((part) => (part === 0 ? 0 : -part)) : out;
}

/** The people who share a line: the valid positions in `sharedBy`, or everyone when there are none. */
export function participantsOf(sharedBy: readonly number[] | undefined, people: number): number[] {
  const valid = [...new Set((sharedBy ?? []).filter((position) => Number.isInteger(position) && position >= 0 && position < people))].sort((a, b) => a - b);
  return valid.length ? valid : Array.from({ length: people }, (_, index) => index);
}

/**
 * Splits a bill between people, in whole minor units. Equally, or by item (a line shared by the people who
 * had it, any difference between the bill and its lines shared in proportion to what each person had). The tip is a percentage of the
 * bill and the bill plus the tip is handed out in one go, so people never pay more than one cent apart in an
 * equal split. Rounding up comes last. The parts of each column add up to the whole, always.
 */
export function splitBill({ total, people, items, tipPercent, roundTo = 0 }: SplitInput): SplitResult {
  const count = Math.max(1, Math.floor(people));
  const equal = !items || items.length === 0;
  const ones = Array.from({ length: count }, () => 1);

  let subtotals: number[];
  if (equal) {
    subtotals = allocate(total, ones);
  } else {
    subtotals = ones.map(() => 0);
    let listed = 0;
    for (const item of items) {
      const group = participantsOf(item.sharedBy, count);
      allocate(item.amount, group.map(() => 1)).forEach((part, position) => {
        const who = group[position] ?? 0;
        subtotals[who] = (subtotals[who] ?? 0) + part;
      });
      listed += item.amount;
    }
    // What the lines do not cover (a service charge, a discount) is shared in proportion to what each person had.
    if (total !== listed) {
      const had = [...subtotals];
      allocate(total - listed, had).forEach((part, who) => {
        subtotals[who] = (subtotals[who] ?? 0) + part;
      });
    }
  }

  const tipTotal = Math.max(0, Math.round((total * Math.max(0, tipPercent)) / 100));
  const totals = allocate(total + tipTotal, equal ? ones : subtotals);
  const tips = totals.map((value, who) => value - (subtotals[who] ?? 0));
  const unit = roundTo > 1 ? roundTo : 0;
  const roundings = totals.map((value) => (unit ? Math.ceil(value / unit) * unit - value : 0));
  const roundingTotal = roundings.reduce((sum, value) => sum + value, 0);
  return {
    subtotals,
    tips,
    roundings,
    totals: totals.map((value, who) => value + (roundings[who] ?? 0)),
    billTotal: total,
    tipTotal,
    roundingTotal,
    grandTotal: total + tipTotal + roundingTotal,
  };
}
