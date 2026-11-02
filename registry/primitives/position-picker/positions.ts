/**
 * The nine places of the Position picker, their names, and how the arrow keys
 * move between them, as plain functions with no React.
 */

export type Position =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

/** The nine places in reading order: left to right, top to bottom. */
export const POSITIONS: readonly Position[] = [
  "top-left",
  "top-center",
  "top-right",
  "center-left",
  "center",
  "center-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

/** The four corners, the most common subset. */
export const CORNERS: readonly Position[] = ["top-left", "top-right", "bottom-left", "bottom-right"];

const NAMES: Readonly<Record<Position, string>> = {
  "top-left": "Top left",
  "top-center": "Top center",
  "top-right": "Top right",
  "center-left": "Center left",
  center: "Center",
  "center-right": "Center right",
  "bottom-left": "Bottom left",
  "bottom-center": "Bottom center",
  "bottom-right": "Bottom right",
};

/** The place in words: "Top right". */
export const positionLabel = (position: Position): string => NAMES[position];

export type ArrowKey = "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown";

const STEPS: Readonly<Record<ArrowKey, readonly [number, number]>> = {
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
};

/**
 * Where an arrow key goes from a place: along the row for left and right, down
 * the column for up and down, going round the edge and passing over any place
 * that is not in `allowed`. It returns null when there is nowhere else to go.
 */
export function movePosition(from: Position, key: ArrowKey, allowed: readonly Position[]): Position | null {
  const index = POSITIONS.indexOf(from);
  const [rowStep, columnStep] = STEPS[key];
  const row = Math.floor(index / 3);
  const column = index % 3;
  for (let step = 1; step < 3; step += 1) {
    const next = POSITIONS[((row + rowStep * step + 3) % 3) * 3 + ((column + columnStep * step + 3) % 3)];
    if (next && allowed.includes(next)) return next;
  }
  return null;
}
