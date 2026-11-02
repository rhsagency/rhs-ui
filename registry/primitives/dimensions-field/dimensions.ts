/** A width and a height, and whether they are tied to each other. */
export interface DimensionsValue {
  /** The width, or null while its field is empty. */
  width: number | null;
  /** The height, or null while its field is empty. */
  height: number | null;
  /** True while the proportions are kept: changing one side moves the other by the ratio the lock was set at. */
  locked: boolean;
}

/** The words the field says, on screen and to a screen reader. Each can be replaced, for another language or your own voice. */
export interface DimensionsLabels {
  /** The name of the whole field when it has no label, id or aria-label of its own. */
  group: string;
  /** The names of the two number fields. */
  width: string;
  height: string;
  /** The name of the lock. It names the action and not the state, because the button announces whether it is pressed. */
  lock: string;
  /** Said when the lock goes on. `ratio` is "3:2". */
  locked: (ratio: string) => string;
  /** Said when the lock goes on while a side is still empty, so there is no ratio to keep yet. */
  lockedEmpty: string;
  /** Said when the lock goes off. */
  unlocked: string;
  /** Said once typing pauses, when the lock moved the other side: "Height is now 533 px". */
  followed: (name: string, value: string, unit: string) => string;
  /** The line under the field while a side is empty. */
  prompt: string;
  /** The ratio beside the size while the lock is on: "3:2 kept". */
  kept: (ratio: string) => string;
  /** Said when a number was brought down to the highest allowed: "Width is at most 4,000 px". */
  atMost: (name: string, limit: string, unit: string) => string;
  /** Said when a number was brought up to the lowest allowed. */
  atLeast: (name: string, limit: string, unit: string) => string;
}

export const DEFAULT_LABELS: DimensionsLabels = {
  group: "Dimensions",
  width: "Width",
  height: "Height",
  lock: "Keep proportions",
  locked: (ratio) => `Proportions kept at ${ratio}.`,
  lockedEmpty: "Proportions will be kept once both sides have a size.",
  unlocked: "Proportions free.",
  followed: (name, value, unit) => `${name} is now ${value}${unit ? ` ${unit}` : ""}.`,
  prompt: "Enter a width and a height.",
  kept: (ratio) => `${ratio} kept`,
  atMost: (name, limit, unit) => `${name} is at most ${limit}${unit ? ` ${unit}` : ""}.`,
  atLeast: (name, limit, unit) => `${name} is at least ${limit}${unit ? ` ${unit}` : ""}.`,
};

const formats = new Map<string, Intl.NumberFormat>();

/** A number format, kept: building one is far slower than using it, and a field asks on every keystroke. */
function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = formats.get(key);
  if (!format) {
    try {
      format = new Intl.NumberFormat(locale, options);
    } catch {
      format = new Intl.NumberFormat("en-US", options);
    }
    formats.set(key, format);
  }
  return format;
}

/**
 * The digits, separators and minus of a keyboard in another script (Arabic-Indic,
 * Persian) as plain characters. Written by code point, so the source stays ASCII.
 */
function asciiNumber(text: string): string {
  let plain = "";
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code >= 0x660 && code <= 0x669) plain += String(code - 0x660);
    else if (code >= 0x6f0 && code <= 0x6f9) plain += String(code - 0x6f0);
    else if (code === 0x66b) plain += ".";
    else if (code === 0x66c) plain += ",";
    else plain += char;
  }
  return plain;
}

/** What may stay in a size field while someone types: digits and the two decimal signs. A unit or a minus goes. */
export function tidyTyping(raw: string): string {
  return asciiNumber(raw).replace(/[^\d.,]/g, "");
}

/** How many decimals a step has: 1 for 1, 2 for 0.25. */
export function decimalsOf(step: number): number {
  if (!Number.isFinite(step) || step <= 0) return 0;
  let decimals = 0;
  let scaled = step;
  while (decimals < 6 && Math.abs(scaled - Math.round(scaled)) > 1e-9) {
    scaled *= 10;
    decimals += 1;
  }
  return decimals;
}

/** A number kept to `precision` decimals, so 0.1 + 0.2 reads 0.3. */
export function roundTo(value: number, precision: number): number {
  const scale = 10 ** precision;
  // The epsilon lifts 1.005 * 100 = 100.49999999999999 to the half it was meant to be.
  return Math.round(value * scale * (1 + Number.EPSILON)) / scale;
}

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * The text as a size, rounded to `precision` decimals, or null when it holds no
 * number. "12,5" and "12.5" both mean twelve and a half: the last sign is the
 * decimal one and a sign that comes twice is only grouping. With whole numbers
 * only, "1.200" is read as twelve hundred, because that is how it is written
 * where the point groups.
 */
export function parseSize(raw: string, precision: number): number | null {
  const body = tidyTyping(raw);
  if (!/\d/.test(body)) return null;
  const marks = body.match(/[.,]/g) ?? [];
  const last = Math.max(body.lastIndexOf("."), body.lastIndexOf(","));
  const repeated = marks.length > 1 && new Set(marks).size === 1;
  const mixed = new Set(marks).size === 2;
  const after = marks.length ? body.slice(last + 1).replace(/[.,]/g, "") : "";
  const grouping = repeated || (precision === 0 && marks.length === 1 && after.length === 3 && /^\d{1,3}$/.test(body.slice(0, last)));
  const at = grouping ? -1 : mixed || marks.length ? last : -1;
  const whole = (at === -1 ? body : body.slice(0, at)).replace(/[.,]/g, "");
  const fraction = at === -1 ? "" : body.slice(at + 1).replace(/[.,]/g, "");
  let scaled = Number(`${whole || "0"}${fraction.slice(0, precision).padEnd(precision, "0")}`);
  if (fraction.length > precision && fraction.charAt(precision) >= "5") scaled += 1;
  return Number.isSafeInteger(scaled) ? scaled / 10 ** precision : null;
}

/** A number as the locale writes it, without grouping, for a field: 1200, 12.5, "12,5" in the Netherlands. */
export function formatPlain(value: number | null, precision: number, locale: string): string {
  return value === null ? "" : numberFormat(locale, { minimumFractionDigits: 0, maximumFractionDigits: precision, useGrouping: false }).format(value);
}

/** A number as the locale writes it in a sentence, with grouping: 1,200. */
export function formatGrouped(value: number, precision: number, locale: string): string {
  return numberFormat(locale, { minimumFractionDigits: 0, maximumFractionDigits: precision }).format(value);
}

/** The width and the height a lock was set at. */
export interface Ratio {
  width: number;
  height: number;
}

/** The ratio of two sizes, or null when either is missing or not above zero. */
export function ratioOf(width: number | null, height: number | null): Ratio | null {
  return width !== null && height !== null && width > 0 && height > 0 ? { width, height } : null;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** A ratio in words: "3:2", "16:9", or "1.29:1" when no small whole numbers describe it. */
export function ratioText(ratio: Ratio, locale: string): string {
  if (Number.isInteger(ratio.width) && Number.isInteger(ratio.height)) {
    const divisor = gcd(ratio.width, ratio.height);
    const [a, b] = [ratio.width / divisor, ratio.height / divisor];
    if (a <= 50 && b <= 50) return `${a}:${b}`;
  }
  const wide = ratio.width >= ratio.height;
  const scaled = numberFormat(locale, { maximumFractionDigits: 2 }).format(wide ? ratio.width / ratio.height : ratio.height / ratio.width);
  return wide ? `${scaled}:1` : `1:${scaled}`;
}
