/** One part of the whole: a stable id for the value, and the name people read. */
export interface AllocationPart {
  id: string;
  label: string;
}

/** What each part holds, by id. */
export type Shares = Record<string, number>;

/** The words the slider says, for another language or your own voice. */
export interface AllocationLabels {
  /** The name of a handle, given the two parts it moves: "Move the boundary between Email and Social". */
  handle: (left: string, right: string) => string;
  /** What a handle's value is read as, given the two parts it affects: "Email 40, Social 35". */
  between: (left: string, leftValue: string, right: string, rightValue: string) => string;
  /** The name of a part's number field. */
  field: (part: string) => string;
  /** The name of a part's lock button. */
  lock: (part: string) => string;
  /** The name of the list of parts. */
  parts: string;
  /** The label of the total row. */
  total: string;
  /** Said when the parts add up, given the total as written: "Adds up to 100%". */
  adds: (total: string) => string;
  /** Said when they fall short, given the missing amount as written: "15% left to assign". */
  short: (missing: string) => string;
  /** Said when they go over, given the excess as written: "10% over". */
  over: (excess: string) => string;
  /** The button that spreads what is missing or too much over the parts that are not locked. */
  balance: string;
  /** What stands in the bar for the part of the whole that nobody has. */
  unassigned: string;
  /** Said under the total when too few parts are free to move: "Unlock at least two parts to move the split." */
  needTwo: string;
}

export const DEFAULT_LABELS: AllocationLabels = {
  handle: (left, right) => `Boundary between ${left} and ${right}`,
  between: (left, leftValue, right, rightValue) => `${left} ${leftValue}, ${right} ${rightValue}`,
  field: (part) => `${part} share`,
  lock: (part) => `Lock ${part}`,
  parts: "Parts",
  total: "Total",
  adds: (total) => `Adds up to ${total}`,
  short: (missing) => `${missing} left to assign`,
  over: (excess) => `${excess} over`,
  balance: "Balance",
  unassigned: "Unassigned",
  needTwo: "Unlock at least two parts to move the split.",
};

/**
 * The shades the parts are told apart by, strongest first, with the colour of the words that sit on each. They are steps between the
 * foreground and the background, so they work in both themes. The steps are chosen so the words read at 4.5 to 1 on every one of them in
 * light and in dark: none of them lands in the middle grey, where neither dark nor light words would.
 */
export const SHADES: readonly { fill: string; ink: string }[] = [
  { fill: "bg-foreground", ink: "text-background" },
  { fill: "bg-foreground/78", ink: "text-background" },
  { fill: "bg-foreground/60", ink: "text-background" },
  { fill: "bg-foreground/34", ink: "text-foreground" },
  { fill: "bg-foreground/20", ink: "text-foreground" },
  { fill: "bg-foreground/10", ink: "text-foreground" },
];

/** How many places after the decimal point a step has: 0.5 has one. */
export const decimalsOf = (step: number): number => {
  const text = String(step);
  const exponent = /e-(\d+)$/.exec(text);
  if (exponent) return Number(exponent[1]);
  return text.includes(".") ? text.split(".")[1]!.length : 0;
};

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/** A number on the grid of `step`, free of floating point noise (0.1 + 0.2). */
export const onGrid = (value: number, step: number): number => Number((Math.round(value / step) * step).toFixed(decimalsOf(step)));

/** Every part's share, in the order of the parts. A part with no entry holds nothing. */
export const sharesOf = (values: Shares, parts: readonly AllocationPart[]): number[] => parts.map((part) => Math.max(0, values[part.id] ?? 0));

export const sumOf = (values: Shares, parts: readonly AllocationPart[]): number =>
  Number(
    sharesOf(values, parts)
      .reduce((total, share) => total + share, 0)
      .toFixed(6),
  );

/**
 * Hands out `units` whole steps in proportion to `weights`, never more to one than `room` allows. The largest remainders get the odd
 * steps, so the whole amount is placed exactly whenever there is room for it. Returns the number of steps for each.
 */
function apportion(units: number, weights: readonly number[], room: readonly number[]): number[] {
  const given = weights.map(() => 0);
  let left = units;
  for (let round = 0; round < 8 && left > 0; round += 1) {
    const open = weights.map((_, index) => (given[index]! < room[index]! ? index : -1)).filter((index) => index >= 0);
    if (!open.length) break;
    const weight = open.reduce((total, index) => total + weights[index]!, 0);
    const shares = open.map((index) => (weight > 0 ? (left * weights[index]!) / weight : left / open.length));
    const whole = shares.map((share, at) => Math.min(Math.floor(share), room[open[at]!]! - given[open[at]!]!));
    for (const [at, index] of open.entries()) given[index] = given[index]! + whole[at]!;
    left -= whole.reduce((total, amount) => total + amount, 0);
    // The odd steps go to the largest remainders, one each, while there is room.
    const order = open.map((index, at) => ({ index, rest: shares[at]! - Math.floor(shares[at]!) })).sort((a, b) => b.rest - a.rest);
    for (const { index } of order) {
      if (left <= 0) break;
      if (given[index]! < room[index]!) {
        given[index] = given[index]! + 1;
        left -= 1;
      }
    }
  }
  return given;
}

/** An even split of `total` between the parts, on the grid of `step`: 100 over three parts is 34, 33 and 33. */
export function evenShares(parts: readonly AllocationPart[], total: number, step: number): Shares {
  if (!parts.length) return {};
  const units = Math.round(total / step);
  const base = Math.floor(units / parts.length);
  const extra = units - base * parts.length;
  return Object.fromEntries(parts.map((part, index) => [part.id, onGrid((base + (index < extra ? 1 : 0)) * step, step)]));
}

/** The parts that are free to change, by position. */
const free = (parts: readonly AllocationPart[], locked: ReadonlySet<string>) => parts.map((part, index) => (locked.has(part.id) ? -1 : index)).filter((index) => index >= 0);

/**
 * The two parts a handle moves: the nearest part that is not locked on its left, and the nearest on its right. Handle `k` stands between
 * part `k` and part `k + 1`. A locked part between them keeps its size and slides along. Null when there is no free part on a side.
 */
export function pairOf(parts: readonly AllocationPart[], locked: ReadonlySet<string>, handle: number): { left: number; right: number } | null {
  let left = handle;
  while (left >= 0 && locked.has(parts[left]!.id)) left -= 1;
  let right = handle + 1;
  while (right < parts.length && locked.has(parts[right]!.id)) right += 1;
  return left >= 0 && right < parts.length ? { left, right } : null;
}

/** The most a handle can move in each direction: the left part down to `min`, the right part down to `min`. */
export function reachOf(values: Shares, parts: readonly AllocationPart[], pair: { left: number; right: number }, min: number): { back: number; forward: number } {
  const shares = sharesOf(values, parts);
  return { back: Math.max(0, shares[pair.left]! - min), forward: Math.max(0, shares[pair.right]! - min) };
}

/** The handle moved by `delta` (positive to the right): the part on its left gains it and the part on its right gives it up. The parts in between stay as they are. */
export function moveHandle(values: Shares, parts: readonly AllocationPart[], locked: ReadonlySet<string>, handle: number, delta: number, min: number, step: number): Shares {
  const pair = pairOf(parts, locked, handle);
  if (!pair) return values;
  const reach = reachOf(values, parts, pair, min);
  const moved = onGrid(clamp(delta, -reach.back, reach.forward), step);
  if (moved === 0) return values;
  const left = parts[pair.left]!.id;
  const right = parts[pair.right]!.id;
  return { ...values, [left]: onGrid((values[left] ?? 0) + moved, step), [right]: onGrid((values[right] ?? 0) - moved, step) };
}

/**
 * One part set to a number that was typed. The difference is taken from the other parts that are free, or given to them, in proportion to
 * what they hold, so the total stays what it was. The number is kept to what the others can make room for.
 */
export function setShare(values: Shares, parts: readonly AllocationPart[], locked: ReadonlySet<string>, id: string, target: number, min: number, step: number): Shares {
  const index = parts.findIndex((part) => part.id === id);
  if (index < 0 || locked.has(id)) return values;
  const others = free(parts, locked).filter((at) => at !== index);
  if (!others.length) return values;
  const shares = sharesOf(values, parts);
  const current = shares[index]!;
  const room = others.map((at) => Math.max(0, shares[at]! - min));
  const wanted = clamp(onGrid(target, step), min, current + room.reduce((total, amount) => total + amount, 0));
  const delta = onGrid(wanted - current, step);
  if (delta === 0) return values;
  const units = Math.round(Math.abs(delta) / step);
  const result = { ...values, [id]: wanted };
  if (delta > 0) {
    const taken = apportion(
      units,
      room,
      room.map((amount) => Math.round(amount / step)),
    );
    for (const [at, other] of others.entries()) result[parts[other]!.id] = onGrid(shares[other]! - taken[at]! * step, step);
  } else {
    const weights = others.map((other) => shares[other]!);
    const given = apportion(
      units,
      weights,
      weights.map(() => Number.POSITIVE_INFINITY),
    );
    for (const [at, other] of others.entries()) result[parts[other]!.id] = onGrid(shares[other]! + given[at]! * step, step);
  }
  return result;
}

/** What is missing (positive) or too much (negative) for the parts to make `total`. */
export const shortfallOf = (values: Shares, parts: readonly AllocationPart[], total: number): number => Number((total - sumOf(values, parts)).toFixed(6));

/** The missing amount spread over the parts that are free, or the excess taken from them, in proportion to what they hold. Unchanged when nothing is free to take it. */
export function balance(values: Shares, parts: readonly AllocationPart[], locked: ReadonlySet<string>, total: number, min: number, step: number): Shares {
  const gap = shortfallOf(values, parts, total);
  const open = free(parts, locked);
  if (gap === 0 || !open.length) return values;
  const shares = sharesOf(values, parts);
  const units = Math.round(Math.abs(gap) / step);
  const result = { ...values };
  if (gap > 0) {
    const given = apportion(
      units,
      open.map((at) => shares[at]!),
      open.map(() => Number.POSITIVE_INFINITY),
    );
    for (const [at, part] of open.entries()) result[parts[part]!.id] = onGrid(shares[part]! + given[at]! * step, step);
  } else {
    const room = open.map((at) => Math.max(0, shares[at]! - min));
    const taken = apportion(
      units,
      room,
      room.map((amount) => Math.round(amount / step)),
    );
    for (const [at, part] of open.entries()) result[parts[part]!.id] = onGrid(shares[part]! - taken[at]! * step, step);
  }
  return result;
}

/** A number as typed: "45", "-3", "1,5" and "1.5" all work, anything else is not a number. */
export function parseNumber(text: string): number | null {
  const clean = text.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(clean)) return null;
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : null;
}
