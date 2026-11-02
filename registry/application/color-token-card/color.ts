/**
 * The colour arithmetic behind ColorTokenCard, as plain functions with no
 * React: read a hex, rgb or oklch colour, write it in another of the three,
 * and work out the WCAG 2 contrast against a background. A build step or a
 * server can use them to document a palette with the same numbers the card
 * shows.
 */

/** The three ways a colour is written. */
export type ColorFormat = "hex" | "rgb" | "oklch";

/** A colour in sRGB: red, green and blue from 0 to 255 (fractions allowed), alpha from 0 to 1. */
export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** One channel from the sRGB curve to light, as WCAG 2 and the OKLab maths want it. */
const toLinear = (channel: number) => {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

/** And back, from light to the sRGB curve, as 0 to 255. */
const fromLinear = (value: number) => {
  const light = clamp(value, 0, 1);
  return (light <= 0.0031308 ? light * 12.92 : 1.055 * light ** (1 / 2.4) - 0.055) * 255;
};

/** Which of the three formats a colour is written in, or null for anything else (named colours, hsl and so on). */
export function formatOf(text: string): ColorFormat | null {
  const value = text.trim().toLowerCase();
  if (value.startsWith("#")) return "hex";
  if (/^rgba?\(/.test(value)) return "rgb";
  if (/^oklch\(/.test(value)) return "oklch";
  return null;
}

function parseHex(text: string): Rgba | null {
  const match = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.exec(text);
  if (!match?.[1]) return null;
  const digits = match[1].length <= 4 ? [...match[1]].map((digit) => digit + digit).join("") : match[1];
  const at = (index: number) => parseInt(digits.slice(index, index + 2), 16);
  return { r: at(0), g: at(2), b: at(4), a: digits.length === 8 ? at(6) / 255 : 1 };
}

/** A CSS number or percentage: a percentage is that share of `full`. "none" is zero. */
function part(token: string | undefined, full: number): number | null {
  if (token === undefined) return null;
  if (token.toLowerCase() === "none") return 0;
  const percent = /^([+-]?(?:\d+\.?\d*|\.\d+))%$/.exec(token);
  if (percent?.[1]) return (Number(percent[1]) / 100) * full;
  const number = /^([+-]?(?:\d+\.?\d*|\.\d+))(?:deg)?$/i.exec(token);
  return number?.[1] ? Number(number[1]) : null;
}

/** OKLCH (lightness 0 to 1, chroma, hue in degrees) to sRGB, clipped to the gamut. */
function oklchToRgb(lightness: number, chroma: number, hue: number): Pick<Rgba, "r" | "g" | "b"> {
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return {
    r: fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

function parseFunction(text: string): Rgba | null {
  const match = /^(rgba?|oklch)\(\s*([^)]*?)\s*\)$/i.exec(text);
  if (!match?.[1] || match[2] === undefined) return null;
  const tokens = match[2].split(/[\s,/]+/).filter(Boolean);
  if (tokens.length < 3 || tokens.length > 4) return null;
  const alpha = tokens.length === 4 ? part(tokens[3], 1) : 1;
  if (alpha === null) return null;
  if (match[1].toLowerCase() === "oklch") {
    const lightness = part(tokens[0], 1);
    const chroma = part(tokens[1], 0.4);
    const hue = part(tokens[2], 360);
    if (lightness === null || chroma === null || hue === null) return null;
    return { ...oklchToRgb(clamp(lightness, 0, 1), Math.max(0, chroma), hue), a: clamp(alpha, 0, 1) };
  }
  const [r, g, b] = [part(tokens[0], 255), part(tokens[1], 255), part(tokens[2], 255)];
  if (r === null || g === null || b === null) return null;
  return { r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255), a: clamp(alpha, 0, 1) };
}

/** Reads `#0a7d5c`, `rgb(10 125 92)` (also with commas and an alpha) or `oklch(0.55 0.115 169)`. Null for anything else. */
export function parseColor(text: string): Rgba | null {
  const value = text.trim();
  return parseHex(value) ?? parseFunction(value);
}

const hex2 = (channel: number) => Math.round(clamp(channel, 0, 255)).toString(16).padStart(2, "0").toUpperCase();

/** Fixed decimals with the trailing zeros dropped: 0.5 and not 0.500. */
const trimmed = (value: number, decimals: number) => String(Number(value.toFixed(decimals)));

const alphaText = (alpha: number) => (alpha < 1 ? ` / ${trimmed(alpha * 100, 1)}%` : "");

/** A colour as OKLCH numbers: lightness 0 to 1, chroma, hue in degrees (0 for a grey, which has none). */
export function toOklch(color: Rgba): { l: number; c: number; h: number } {
  const [r, g, b] = [toLinear(color.r), toLinear(color.g), toLinear(color.b)];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const chroma = Math.hypot(a, bb);
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    c: chroma,
    h: chroma < 0.0002 ? 0 : ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360,
  };
}

/**
 * A colour written in a format. A colour given as `source` in that same format
 * keeps its own digits, so a token written as `oklch(0.62 0.17 155)` is not
 * rewritten as the rounded sRGB it clips to.
 */
export function formatColor(color: Rgba, format: ColorFormat, source?: string): string {
  if (source !== undefined && formatOf(source) === format) return format === "hex" ? source.trim().toUpperCase() : source.trim();
  if (format === "hex") return `#${hex2(color.r)}${hex2(color.g)}${hex2(color.b)}${color.a < 1 ? hex2(color.a * 255) : ""}`;
  if (format === "rgb") return `rgb(${Math.round(color.r)} ${Math.round(color.g)} ${Math.round(color.b)}${alphaText(color.a)})`;
  const { l, c, h } = toOklch(color);
  return `oklch(${trimmed(l, 3)} ${trimmed(c, 3)} ${trimmed(h, 1)}${alphaText(color.a)})`;
}

/** How much light a colour gives off, from 0 (black) to 1 (white), on the 8-bit values a screen shows. */
function luminance(color: Pick<Rgba, "r" | "g" | "b">): number {
  return 0.2126 * toLinear(Math.round(color.r)) + 0.7152 * toLinear(Math.round(color.g)) + 0.0722 * toLinear(Math.round(color.b));
}

/**
 * The WCAG 2 contrast ratio of a colour on an opaque background, from 1 (the
 * same) to 21 (black on white). A colour with transparency is first laid over
 * the background, the way a browser draws it.
 */
export function contrastOn(color: Rgba, background: Pick<Rgba, "r" | "g" | "b">): number {
  const flat = {
    r: color.r * color.a + background.r * (1 - color.a),
    g: color.g * color.a + background.g * (1 - color.a),
    b: color.b * color.a + background.b * (1 - color.a),
  };
  const [first, second] = [luminance(flat), luminance(background)];
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/** What a ratio reaches: AAA from 7, AA from 4.5, "large" from 3 (AA for large text only), otherwise a fail. */
export type ContrastGrade = "aaa" | "aa" | "large" | "fail";

export function gradeOf(ratio: number): ContrastGrade {
  return ratio >= 7 ? "aaa" : ratio >= 4.5 ? "aa" : ratio >= 3 ? "large" : "fail";
}

/**
 * The ratio as it is written, "4.8:1": two decimals at most, a trailing zero
 * dropped. A ratio is never rounded up to a number it does not reach: 4.499 is
 * written 4.49, not 4.5, so what is written and what passes never disagree.
 */
export function formatRatio(ratio: number, locale: string): string {
  const rounded = Math.round(ratio * 100) / 100;
  const shown = [3, 4.5, 7].some((limit) => rounded >= limit && ratio < limit) ? Math.floor(ratio * 100 + 1e-9) / 100 : rounded;
  let text: string;
  try {
    text = new Intl.NumberFormat(locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(shown);
  } catch {
    text = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(shown);
  }
  return `${text}:1`;
}
