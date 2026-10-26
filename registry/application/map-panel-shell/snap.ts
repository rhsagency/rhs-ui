/**
 * The three heights of the sheet on a phone: `peek` shows the search and
 * nothing else, `half` is half the screen, `full` leaves a strip of the map
 * above it, so the map is still there to go back to.
 */
export type MapPanelSnap = "peek" | "half" | "full";

/** The three snaps from the lowest to the highest. */
export const SNAPS: readonly MapPanelSnap[] = ["peek", "half", "full"];

/** The height of `peek` in rem: the grab handle (1.5) and the search row (2.25 plus 0.75 of padding). */
export const PEEK_REM = 4.5;
/** The strip of the map left above `full`, in rem. */
export const FULL_GAP_REM = 3.5;

/** `value` held between `low` and `high`. */
export const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** The sheet's three heights in px for a map this tall. */
export function snapHeights(total: number, rem: number): Record<MapPanelSnap, number> {
  const peek = Math.min(PEEK_REM * rem, total);
  return { peek, half: clamp(Math.round(total / 2), peek, total), full: Math.max(peek, total - FULL_GAP_REM * rem) };
}

/** Which snap a drag settles on: the one nearest to where the sheet would stop if it kept its speed for another 200ms. `velocity` is px per ms, positive when the sheet is growing. */
export function settleSnap(height: number, velocity: number, heights: Record<MapPanelSnap, number>): MapPanelSnap {
  const target = height + velocity * 200;
  return SNAPS.reduce((best, snap) => (Math.abs(heights[snap] - target) < Math.abs(heights[best] - target) ? snap : best), "half" as MapPanelSnap);
}

/** One snap up or down, stopping at the ends. */
export function stepSnap(current: MapPanelSnap, direction: 1 | -1): MapPanelSnap {
  const index = SNAPS.indexOf(current) + direction;
  return SNAPS[clamp(index, 0, SNAPS.length - 1)] ?? current;
}
