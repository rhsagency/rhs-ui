/**
 * The WCAG 2 contrast arithmetic, as plain functions with no React: read a hex
 * colour, work out its relative luminance, compare two colours and say what the
 * ratio passes. A build step or a server can use them to check a palette with
 * the same numbers the field shows.
 */

/** A colour as red, green and blue, each from 0 to 255. */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** A colour written `#rgb` or `#rrggbb` (the `#` is optional) as `#rrggbb` in lower case, or null for anything else. */
export function normalizeHex(text: string): string | null {
  const hex = text.trim().replace(/^#/, "").toLowerCase();
  if (/^[\da-f]{3}$/.test(hex)) return `#${[...hex].map((digit) => digit + digit).join("")}`;
  return /^[\da-f]{6}$/.test(hex) ? `#${hex}` : null;
}

/** The red, green and blue of a hex colour, or null when it is not one. */
export function parseHex(text: string): Rgb | null {
  const hex = normalizeHex(text);
  if (!hex) return null;
  return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
}

/** One channel from the sRGB curve to light, as WCAG 2 defines it. */
const linear = (channel: number) => {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

/** How much light a colour gives off, from 0 (black) to 1 (white). A colour that is not a hex colour counts as black. */
export function relativeLuminance(color: string | Rgb): number {
  const rgb = typeof color === "string" ? parseHex(color) : color;
  if (!rgb) return 0;
  return 0.2126 * linear(rgb.r) + 0.7152 * linear(rgb.g) + 0.0722 * linear(rgb.b);
}

/** The contrast ratio of two colours, from 1 (the same) to 21 (black on white). The order does not matter. */
export function contrastRatio(a: string | Rgb, b: string | Rgb): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/** The ratios the checks turn on. */
const THRESHOLDS = [3, 4.5, 7];

/**
 * The ratio as it is written, "4.8:1": two decimals, a trailing zero dropped,
 * as the browsers' own tools write it. A ratio is never rounded up to a number
 * it does not reach: 4.499 is written 4.49, not 4.50, so what is written and
 * what passes never disagree.
 */
export function formatRatio(ratio: number, locale = "en-US"): string {
  const rounded = Math.round(ratio * 100) / 100;
  const shown = THRESHOLDS.some((threshold) => rounded >= threshold && ratio < threshold) ? Math.floor(ratio * 100 + 1e-9) / 100 : rounded;
  return `${new Intl.NumberFormat(locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(shown)}:1`;
}

export type ContrastLevelId = "normal-aa" | "normal-aaa" | "large-aa" | "large-aaa";

export interface ContrastVerdict {
  id: ContrastLevelId;
  /** "Normal text AA". */
  label: string;
  /** The lowest ratio that passes. */
  needs: number;
  passes: boolean;
}

/** The four checks: normal text needs 4.5:1 for AA and 7:1 for AAA, large text (24px, or 19px bold) needs 3:1 and 4.5:1. */
export function contrastVerdicts(ratio: number): ContrastVerdict[] {
  const levels: [ContrastLevelId, string, number][] = [
    ["normal-aa", "Normal text AA", 4.5],
    ["normal-aaa", "Normal text AAA", 7],
    ["large-aa", "Large text AA", 3],
    ["large-aaa", "Large text AAA", 4.5],
  ];
  return levels.map(([id, label, needs]) => ({ id, label, needs, passes: ratio >= needs }));
}
