/** A colour the way a picker thinks of it: hue in degrees (0 to 360), saturation and brightness in percent (0 to 100), alpha from 0 to 1. */
export interface Hsva {
  h: number;
  s: number;
  v: number;
  a: number;
}

/** How a colour is written when it is shown and reported. */
export type ColorFormat = "hex" | "rgb" | "hsl";

type Rgb = readonly [number, number, number];

/** The words the picker says, for another language or your own voice. Each can be replaced. */
export interface ColorAreaLabels {
  /** The name of the picker, on the button that opens it and on the panel. */
  colour: string;
  /** The name of the two-axis area. */
  area: string;
  /** What a screen reader hears for the area: "Saturation 80%, brightness 60%". */
  areaValue: (saturation: number, brightness: number) => string;
  /** The name of the hue slider. */
  hue: string;
  /** What a screen reader hears for the hue slider. */
  hueValue: (degrees: number) => string;
  /** The name of the opacity slider. */
  opacity: string;
  /** What a screen reader hears for the opacity slider. */
  opacityValue: (percent: number) => string;
  /** The name of the box with the typed code. */
  code: string;
  /** The name of the row of preset colours. */
  swatches: string;
  /** The name of the button that picks a colour from anywhere on the screen. */
  eyeDropper: string;
  /** Said under the code while what is typed is not a colour. */
  invalid: (format: ColorFormat) => string;
  /** The first words of a contrast line: "White", "Black". */
  white: string;
  black: string;
  /** The contrast line: `against` is "White" or "Black", `ratio` is "4.6:1" and `verdict` says what it means. */
  contrast: (against: string, ratio: string, verdict: string) => string;
  /** What a contrast ratio means for text. */
  verdicts: { aaa: string; aa: string; large: string; fails: string };
}

export const DEFAULT_LABELS: ColorAreaLabels = {
  colour: "Colour",
  area: "Saturation and brightness",
  areaValue: (saturation, brightness) => `Saturation ${saturation}%, brightness ${brightness}%`,
  hue: "Hue",
  hueValue: (degrees) => `${degrees} degrees`,
  opacity: "Opacity",
  opacityValue: (percent) => `${percent}%`,
  code: "Colour code",
  swatches: "Preset colours",
  eyeDropper: "Pick a colour from the screen",
  invalid: (format) => (format === "hex" ? "Use a hex code such as #2563eb." : format === "rgb" ? "Use a code such as rgb(37, 99, 235) or #2563eb." : "Use a code such as hsl(221, 83%, 53%) or #2563eb."),
  white: "White",
  black: "Black",
  contrast: (against, ratio, verdict) => `${against} text ${ratio}, ${verdict}`,
  verdicts: { aaa: "passes AAA", aa: "passes AA", large: "large text only", fails: "too low for text" },
};

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const byte = (value: number) => Math.round(clamp(value, 0, 255));
const hex2 = (value: number) => byte(value).toString(16).padStart(2, "0");

/** The red, green and blue (0 to 255) of a colour. Alpha is not part of it. */
export function toRgb(color: Hsva): Rgb {
  const hue = (((color.h % 360) + 360) % 360) / 60;
  const s = clamp(color.s, 0, 100) / 100;
  const v = clamp(color.v, 0, 100) / 100;
  const sector = Math.floor(hue);
  const f = hue - sector;
  const p = v * (1 - s);
  const q = v * (1 - s * f);
  const t = v * (1 - s * (1 - f));
  const [r, g, b] = sector === 0 ? [v, t, p] : sector === 1 ? [q, v, p] : sector === 2 ? [p, v, t] : sector === 3 ? [p, q, v] : sector === 4 ? [t, p, v] : [v, p, q];
  return [byte((r ?? 0) * 255), byte((g ?? 0) * 255), byte((b ?? 0) * 255)];
}

/** Hue, saturation and brightness of an RGB colour. A grey has no hue of its own, so `hue` (the one it had) is kept. */
function fromRgb([r, g, b]: Rgb, hue: number): Omit<Hsva, "a"> {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = hue;
  if (d !== 0) {
    h = (max === rn ? ((gn - bn) / d) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4) * 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : (d / max) * 100, v: max * 100 };
}

/** Lightness and saturation in the HSL sense, the way CSS writes hsl(). */
function toHsl(color: Hsva): { h: number; s: number; l: number } {
  const s = clamp(color.s, 0, 100) / 100;
  const v = clamp(color.v, 0, 100) / 100;
  const l = v * (1 - s / 2);
  return { h: (((color.h % 360) + 360) % 360), s: l === 0 || l === 1 ? 0 : ((v - l) / Math.min(l, 1 - l)) * 100, l: l * 100 };
}

/** A colour as text in the chosen format: "#2563eb", "rgb(37, 99, 235)", "hsl(221, 83%, 53%)". With `alpha` and an alpha under 1 the hex code has eight digits and the others are rgba() and hsla(). */
export function formatColor(color: Hsva, format: ColorFormat, alpha: boolean): string {
  const [r, g, b] = toRgb(color);
  const a = alpha ? clamp(color.a, 0, 1) : 1;
  if (format === "hex") return `#${hex2(r)}${hex2(g)}${hex2(b)}${a < 1 ? hex2(a * 255) : ""}`;
  const opacity = Math.round(a * 100) / 100;
  if (format === "rgb") return a < 1 ? `rgba(${r}, ${g}, ${b}, ${opacity})` : `rgb(${r}, ${g}, ${b})`;
  const { h, s, l } = toHsl(color);
  const [hh, ss, ll] = [Math.round(h), Math.round(s), Math.round(l)];
  return a < 1 ? `hsla(${hh}, ${ss}%, ${ll}%, ${opacity})` : `hsl(${hh}, ${ss}%, ${ll}%)`;
}

/** True when two colours come out as the same code, so a value that comes back from outside is not mistaken for a change. */
export function sameColor(a: Hsva, b: Hsva): boolean {
  return formatColor(a, "hex", true) === formatColor(b, "hex", true);
}

const HEX = /^#?([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i;
const FUNCTION = /^(rgba?|hsla?)\(\s*([^)]+?)\s*\)$/i;

/** One number of a colour function: "37", "50%" or "221deg". `scale` is what 100% means. */
function part(text: string | undefined, scale: number): number | null {
  if (text === undefined) return null;
  const match = /^([+-]?(?:\d+\.?\d*|\.\d+))(%|deg)?$/i.exec(text);
  if (!match) return null;
  const number = Number(match[1]);
  return match[2] === "%" ? (number / 100) * scale : number;
}

/**
 * Reads a colour from text: #rgb, #rgba, #rrggbb and #rrggbbaa (the # is
 * optional), or the CSS functions rgb(), rgba(), hsl() and hsla() with commas
 * or spaces. `hue` is kept when the colour is a grey, which has none of its own.
 * Null when the text is not a colour.
 */
export function parseColor(text: string, hue = 0): Hsva | null {
  const source = text.trim();
  const hex = HEX.exec(source);
  if (hex) {
    const digits = (hex[1] ?? "").length <= 4 ? [...(hex[1] ?? "")].map((digit) => digit + digit).join("") : (hex[1] ?? "");
    const channel = (at: number) => Number.parseInt(digits.slice(at, at + 2), 16);
    return { ...fromRgb([channel(0), channel(2), channel(4)], hue), a: digits.length === 8 ? channel(6) / 255 : 1 };
  }
  const fn = FUNCTION.exec(source);
  if (!fn) return null;
  const parts = (fn[2] ?? "").split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return null;
  const alpha = parts.length === 4 ? part(parts[3], 1) : 1;
  if (alpha === null) return null;
  const a = clamp(alpha, 0, 1);
  if (fn[1]?.toLowerCase().startsWith("rgb")) {
    const [r, g, b] = [part(parts[0], 255), part(parts[1], 255), part(parts[2], 255)];
    return r === null || g === null || b === null ? null : { ...fromRgb([clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)], hue), a };
  }
  const [h, s, l] = [part(parts[0], 360), part(parts[1], 100), part(parts[2], 100)];
  if (h === null || s === null || l === null) return null;
  const light = clamp(l, 0, 100) / 100;
  const sat = clamp(s, 0, 100) / 100;
  const v = light + sat * Math.min(light, 1 - light);
  return { h: ((h % 360) + 360) % 360, s: v === 0 ? 0 : 2 * (1 - light / v) * 100, v: v * 100, a };
}

/** How bright a colour is to the eye, from 0 (black) to 1 (white), as WCAG measures it. */
function luminance([r, g, b]: Rgb): number {
  const linear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** The WCAG contrast ratio between two colours, from 1 to 21. It is the same whichever of the two is the text. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

/** What a ratio means for text, in the labels' words: 7 and up is AAA, 4.5 AA, 3 is enough for large text only. */
export function verdictOf(ratio: number, verdicts: ColorAreaLabels["verdicts"]): string {
  return ratio >= 7 ? verdicts.aaa : ratio >= 4.5 ? verdicts.aa : ratio >= 3 ? verdicts.large : verdicts.fails;
}
