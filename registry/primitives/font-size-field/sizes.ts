/** The sizes an editor offers: a ladder from a caption to a heading. */
export const DEFAULT_SIZES: readonly number[] = [12, 14, 16, 18, 24, 32];

/** What a screen reader says for a unit, in the singular and the plural. A unit that is not here is read as it is written. */
const SPOKEN: Record<string, readonly [one: string, many: string]> = {
  px: ["pixel", "pixels"],
  pt: ["point", "points"],
  em: ["em", "ems"],
  rem: ["rem", "rems"],
  "%": ["percent", "percent"],
  vw: ["viewport width", "viewport width"],
  vh: ["viewport height", "viewport height"],
};

/** "pixels" for px, in the right number. */
export function spokenUnit(unit: string, value: number): string {
  const words = SPOKEN[unit.trim().toLowerCase()];
  if (!words) return unit;
  return value === 1 ? words[0] : words[1];
}

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/** Rounds away the noise of floating point sums (14.600000000000001) without ever changing what a person typed. */
export function roundTo(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

const NUMBER = /^\s*(\d+(?:[.,]\d*)?|[.,]\d+)\s*[a-z%]*\s*$/i;

/** "16", "16.5", "16,5" and "16px" are all numbers; anything else is not. A comma counts as a decimal sign in every locale, because that is what people type. */
export function parseSize(text: string): number | null {
  const match = NUMBER.exec(text);
  if (!match) return null;
  const value = Number((match[1] ?? "").replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

/** The number as the locale writes it, without grouping: 1,000 px is never a font size, and "16" must stay "16". */
export function formatSize(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: false }).format(value);
}

/**
 * The next size along the ladder in a direction: the first preset above the value going up, the last one
 * below it going down. Past either end of the ladder it takes plain steps, so a size is never stuck.
 */
export function ladderStep(value: number, direction: 1 | -1, sizes: readonly number[], step: number): number {
  const ladder = [...new Set(sizes)].sort((a, b) => a - b);
  const next = direction === 1 ? ladder.find((size) => size > value + 1e-9) : [...ladder].reverse().find((size) => size < value - 1e-9);
  return next ?? roundTo(value + direction * step);
}
