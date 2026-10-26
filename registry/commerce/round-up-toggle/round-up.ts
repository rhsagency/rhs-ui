/** What rounding an order up comes to. */
export interface RoundUp {
  /** The extra amount, in minor units: 43 is 0.43. Always above zero. */
  amount: number;
  /** The total once the extra is added, in minor units: 2500 is 25.00. A multiple of the step. */
  total: number;
}

/**
 * The next whole step above a total, and what it adds: 2457 rounded to the next 100 is 2500, an extra 43.
 * Null when there is nothing to round: the total is already a multiple of the step, or the numbers are not
 * usable. Integer arithmetic in minor units, so the extra is never a fraction of a cent.
 */
export function roundUpOf(total: number, step = 100): RoundUp | null {
  if (!Number.isSafeInteger(total) || !Number.isSafeInteger(step) || total <= 0 || step <= 0) return null;
  const rest = total % step;
  return rest === 0 ? null : { amount: step - rest, total: total + step - rest };
}
