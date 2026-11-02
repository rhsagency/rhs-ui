/**
 * Splits `cells` squares between parts in proportion to their shares, by the
 * largest remainder method: every part first gets the whole number of squares
 * its share earns, then the squares still left over go one each to the parts
 * with the biggest fractions, so the squares always add up to exactly `cells`
 * and no part is rounded away by the others. Ties go to the earlier part.
 *
 * Shares are read as weights, so 82, 11 and 7 give the same split as 8.2, 1.1
 * and 0.7. A share that is negative or not a number counts as zero, and when
 * nothing has any weight every part gets none.
 *
 *   allocateSquares([82, 11, 7]); // [82, 11, 7]
 *   allocateSquares([33.4, 33.3, 33.3]); // [34, 33, 33]
 *   allocateSquares([50.5, 49.5]); // [51, 49]
 */
export function allocateSquares(shares: readonly number[], cells = 100): number[] {
  const weights = shares.map((share) => (Number.isFinite(share) && share > 0 ? share : 0));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return weights.map(() => 0);
  // Multiply before dividing: for whole numbers that is exact, so 82 of 100 never becomes 81.99999999999999.
  const exact = weights.map((weight) => (weight * cells) / total);
  const squares = exact.map((value) => Math.floor(value));
  let left = cells - squares.reduce((sum, count) => sum + count, 0);
  const byRemainder = exact.map((value, index) => ({ index, remainder: value - Math.floor(value) })).sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const { index } of byRemainder) {
    if (left <= 0) break;
    squares[index] = (squares[index] ?? 0) + 1;
    left -= 1;
  }
  return squares;
}
