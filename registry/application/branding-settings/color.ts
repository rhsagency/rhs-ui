/** Swatches offered when you pass none: calm brand colours that all read well on a white page. */
export const DEFAULT_BRAND_COLORS: readonly string[] = ["#111111", "#1d4ed8", "#0e7490", "#0f766e", "#15803d", "#ea580c", "#b91c1c", "#be185d", "#475569"];

/** The smallest contrast a colour needs against a white page to carry links and buttons there (WCAG 1.4.11). */
export const MIN_PAGE_CONTRAST = 3;

/** Red, green and blue from 0 to 255 for "#rrggbb" or "#rgb", or null when it is neither. */
export function parseHex(hex: string): [number, number, number] | null {
  const match = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(hex.trim());
  const digits = match?.[1];
  if (!digits) return null;
  const full = digits.length === 3 ? [...digits].map((digit) => digit + digit).join("") : digits;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

/** WCAG relative luminance: 0 for black, 1 for white. */
export function luminance([red, green, blue]: readonly [number, number, number]): number {
  const channel = (value: number) => {
    const unit = value / 255;
    return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
}

/** WCAG contrast ratio between two luminances, from 1 to 21. */
export function contrastBetween(a: number, b: number): number {
  const high = Math.max(a, b);
  const low = Math.min(a, b);
  return (high + 0.05) / (low + 0.05);
}

/** A contrast ratio to one decimal, cut off rather than rounded: 4.48 reads "4.4", so it never looks like a pass next to "needs 4.5". */
export function formatRatio(ratio: number): string {
  return (Math.floor(ratio * 10) / 10).toFixed(1);
}

export interface BrandColorCheck {
  /** Contrast of white text on the colour. It is also the contrast of the colour against a white page. */
  white: number;
  /** Contrast of black text on the colour. */
  black: number;
  /** The text colour that reads better on it. */
  text: "white" | "black";
  /** Why the colour cannot be used, in a sentence, or null when it can. */
  refusal: string | null;
}

/**
 * Checks a brand colour the way a customer meets it: text on top of it, and
 * the colour itself against a white page. At 4.5 (AA) one of white and black
 * always passes, so what is refused is a colour too light to stand out; at 7
 * (AAA) the mid tones go too, because neither text colour reaches it.
 */
export function checkBrandColor(hex: string, minContrast = 4.5): BrandColorCheck | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const light = luminance(rgb);
  const white = contrastBetween(1, light);
  const black = contrastBetween(0, light);
  const best = Math.max(white, black);
  let refusal: string | null = null;
  if (best < minContrast) {
    refusal = `Neither white nor black text reaches ${minContrast}:1 on it (the best is ${formatRatio(best)}:1). Choose a lighter or a darker one.`;
  } else if (white < MIN_PAGE_CONTRAST) {
    refusal = `It is too light to stand out on a white page (${formatRatio(white)}:1, and links and buttons need ${MIN_PAGE_CONTRAST}:1). Choose a darker one.`;
  }
  return { white, black, text: white >= black ? "white" : "black", refusal };
}

/** The name of the level a contrast ratio stands for: 4.5 is AA, 7 is AAA, anything else is spelled out. */
export function levelName(minContrast: number): string {
  if (minContrast >= 7) return "AAA";
  if (minContrast >= 4.5) return "AA";
  return `${minContrast}:1`;
}
