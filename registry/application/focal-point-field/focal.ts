/** A point on an image as percentages, from 0 to 100, ready for CSS `object-position`. */
export interface FocalPoint {
  /** Across, from the left edge. */
  x: number;
  /** Down, from the top edge. */
  y: number;
}

export const CENTRE: FocalPoint = { x: 50, y: 50 };

const clamp = (n: number): number => Math.min(100, Math.max(0, n));

/** How many decimals a step has: 0.5 has one. */
function decimalsOf(step: number): number {
  const [, fraction = ""] = String(step).split(".");
  return fraction.length;
}

/** The nearest multiple of `step` inside 0 to 100, without floating-point dust (0.30000000000000004). */
export function snap(n: number, step: number): number {
  const size = step > 0 && Number.isFinite(step) ? step : 1;
  return Number((Math.round(clamp(n) / size) * size).toFixed(decimalsOf(size)));
}

/** A point snapped to the step and kept inside the image. */
export function snapPoint(point: FocalPoint, step: number): FocalPoint {
  return { x: clamp(snap(point.x, step)), y: clamp(snap(point.y, step)) };
}

const COMMON: readonly (readonly [number, number])[] = [[1, 1], [4, 3], [3, 4], [3, 2], [2, 3], [16, 9], [9, 16], [5, 4], [4, 5], [21, 9], [16, 10], [10, 16], [3, 1], [2, 1], [1, 2], [1, 3]];

/** The ratio written the way people write it: 16 / 9 is "16:9", 0.75 is "3:4". The usual shapes are tried first, then the nearest simple fraction. */
export function ratioLabel(ratio: number): string {
  for (const [width, height] of COMMON) if (Math.abs(width / height - ratio) < 0.004) return `${width}:${height}`;
  for (let denominator = 1; denominator <= 12; denominator += 1) {
    const numerator = Math.round(ratio * denominator);
    if (numerator > 0 && Math.abs(numerator / denominator - ratio) < 0.004) return `${numerator}:${denominator}`;
  }
  return `${Math.round(ratio * 100) / 100}:1`;
}
