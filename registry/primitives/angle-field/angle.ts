export interface AngleRange {
  min: number;
  max: number;
  /** The range is a full turn: past the top it comes round to the bottom, and the other way. */
  wrap: boolean;
}

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/** Rounds away the noise of floating point sums (14.600000000000001). */
export function tidy(value: number): number {
  return Math.round((value + Number.EPSILON) * 1e6) / 1e6;
}

/** Brings an angle into the range: round the turn when it wraps (360 is 0), hold at the limits when it does not. */
export function fit(value: number, { min, max, wrap }: AngleRange): number {
  if (!wrap) return clamp(tidy(value), min, max);
  const span = max - min;
  return tidy((((value - min) % span) + span) % span + min);
}

/** The angle of a point seen from the middle of the dial, in degrees clockwise from straight up: right is 90, down is 180, left is 270. */
export function pointerAngle(dx: number, dy: number): number {
  const degrees = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return degrees < 0 ? degrees + 360 : degrees;
}

const apart = (a: number, b: number): number => {
  const turn = (((a - b) % 360) + 360) % 360;
  return Math.min(turn, 360 - turn);
};

/**
 * The value a point on the dial stands for. A range that wraps takes the angle as it is. One that does not
 * takes the turn that lies inside it (-90 and 270 are the same place, and which one is meant depends on the
 * range), and a point in the part of the dial the range leaves out goes to the nearer limit.
 */
export function fromPointer(angle: number, range: AngleRange, current: number): number {
  if (range.wrap) return fit(angle, range);
  const inside: number[] = [];
  for (let turn = -4; turn <= 4; turn += 1) {
    const candidate = angle + 360 * turn;
    if (candidate >= range.min && candidate <= range.max) inside.push(candidate);
  }
  if (inside.length) return inside.reduce((best, candidate) => (Math.abs(candidate - current) < Math.abs(best - current) ? candidate : best));
  return apart(angle, range.min) <= apart(angle, range.max) ? range.min : range.max;
}

/** The nearest multiple of `every`, for a drag held to a grid with Shift. */
export const snapTo = (value: number, every: number): number => tidy(Math.round(value / every) * every);

/** The next multiple of `every` in a direction: from 17 with a grid of 15 it is 30 going up and 15 going down. */
export function nextOnGrid(value: number, direction: 1 | -1, every: number): number {
  return tidy(direction === 1 ? (Math.floor(value / every + 1e-9) + 1) * every : (Math.ceil(value / every - 1e-9) - 1) * every);
}

const POINTS = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"] as const;

/** The nearest of the eight points of the compass, with 0 degrees at the top and the angle growing clockwise. */
export function compassName(degrees: number): string {
  return POINTS[Math.round((((degrees % 360) + 360) % 360) / 45) % 8] ?? "north";
}

/** The number as the locale writes it, without grouping and with at most two decimals. */
export function formatAngle(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: false }).format(value);
}

/** What a screen reader says: "90 degrees", or with a compass "90 degrees, east". */
export function spokenAngle(value: number, locale: string, compass: boolean): string {
  const words = `${formatAngle(value, locale)} ${Math.abs(value) === 1 ? "degree" : "degrees"}`;
  return compass ? `${words}, ${compassName(value)}` : words;
}

const NUMBER = /^\s*([+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+))\s*(?:°|deg|degrees?)?\s*$/i;

/** "45", "-45", "45°", "45,5" and "45 deg" are all angles; anything else is not. */
export function parseAngle(text: string): number | null {
  const match = NUMBER.exec(text);
  if (!match) return null;
  const value = Number((match[1] ?? "").replace(",", "."));
  return Number.isFinite(value) ? value : null;
}
