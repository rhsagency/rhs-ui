/**
 * The arithmetic behind the Aspect ratio picker, as plain functions with no
 * React: reduce a size to its ratio, write it, flip it and draw it.
 */

/** A ratio as whole numbers, such as 16 and 9. */
export interface AspectRatio {
  width: number;
  height: number;
}

/** The largest whole number that divides both. */
export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

/** A size or a ratio in its lowest terms: 1920 by 1080 is 16 by 9. */
export function reduceRatio(width: number, height: number): AspectRatio {
  const divisor = gcd(width, height);
  return { width: Math.round(width) / divisor, height: Math.round(height) / divisor };
}

/** "16:9". */
export const ratioLabel = (ratio: AspectRatio): string => `${ratio.width}:${ratio.height}`;

/** Whether two ratios are the same shape, however they are written: 16:9 and 1920:1080. */
export function sameRatio(a: AspectRatio, b: AspectRatio): boolean {
  return a.width * b.height === b.width * a.height;
}

/** The same ratio turned on its side: 16:9 becomes 9:16. */
export const flipRatio = (ratio: AspectRatio): AspectRatio => ({ width: ratio.height, height: ratio.width });

export type Orientation = "landscape" | "portrait";

/** Square counts as landscape, because turning it changes nothing. */
export const orientationOf = (ratio: AspectRatio): Orientation => (ratio.height > ratio.width ? "portrait" : "landscape");

/** The ratio in the orientation asked for. */
export function inOrientation(ratio: AspectRatio, orientation: Orientation): AspectRatio {
  return orientationOf(ratio) === orientation || ratio.width === ratio.height ? ratio : flipRatio(ratio);
}

/** The shapes on offer when you give none. */
export const DEFAULT_RATIOS: readonly AspectRatio[] = [
  { width: 1, height: 1 },
  { width: 4, height: 3 },
  { width: 3, height: 2 },
  { width: 16, height: 9 },
  { width: 9, height: 16 },
];

/** The size, in pixels, to draw a ratio at so that its longer side is `longest` long. A very long shape keeps a few pixels of its short side, so it can still be seen. */
export function outlineSize(ratio: AspectRatio, longest: number): { width: number; height: number } {
  const scale = longest / Math.max(ratio.width, ratio.height);
  const side = (length: number) => Math.max(5, Math.round(length * scale * 10) / 10);
  return { width: side(ratio.width), height: side(ratio.height) };
}

/**
 * How to lay `count` tiles out in rows of `columns`. When the last row is short
 * its tiles are made wider, so every row ends at the same edge and no cell is left
 * empty: five tiles in rows of three become a row of three and a row of two, on a
 * grid of six columns where the first tiles span two and the last two span three.
 */
export function tileSpans(count: number, columns: number): { columns: number; spans: number[] } {
  const per = Math.max(1, Math.min(columns, count));
  const last = count - (Math.ceil(count / per) - 1) * per;
  if (last === per) return { columns: per, spans: Array.from({ length: count }, () => 1) };
  const grid = (per * last) / gcd(per, last);
  return { columns: grid, spans: Array.from({ length: count }, (_, index) => (index < count - last ? grid / per : grid / last)) };
}

/** The smallest and largest number accepted for a custom width or height. */
export const CUSTOM_LIMITS = { min: 1, max: 99_999 } as const;
