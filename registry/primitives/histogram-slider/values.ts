/** The visible handle, in px. The track keeps it inside its ends, so the bars behind it have to know its size. */
export const THUMB = 24;

/** What the line under the heading is made from. */
export interface HistogramSummary {
  /** How many items sit inside the range: exact when the handles stand on the edges of the bars, an estimate between them. */
  count: number;
  /** The count as the locale writes it: "1,204". */
  countText: string;
  /** The lower and upper end, as plain numbers. */
  low: number;
  high: number;
  /** The same two, as `formatValue` writes them. */
  lowText: string;
  highText: string;
  /** The noun for that many items: "home" for one, "homes" for the rest. */
  noun: string;
}

/** The words the slider says, for another language or your own voice. */
export interface HistogramLabels {
  /** The name of the lower number field. */
  minimum: string;
  /** The name of the upper number field. */
  maximum: string;
  /** The name of the lower handle, given the name of the slider: "Minimum price per night". */
  minimumOf: (label: string) => string;
  /** The name of the upper handle. */
  maximumOf: (label: string) => string;
  /** The sentence under the heading, read out politely as the handles move. */
  summary: (info: HistogramSummary) => string;
}

export const DEFAULT_LABELS: HistogramLabels = {
  minimum: "Minimum",
  maximum: "Maximum",
  minimumOf: (label) => `Minimum ${label.toLowerCase()}`,
  maximumOf: (label) => `Maximum ${label.toLowerCase()}`,
  summary: (info) => `${info.count === 0 ? "No" : info.countText} ${info.noun} between ${info.lowText} and ${info.highText}`,
};

const decimalsOf = (step: number): number => {
  const text = String(step);
  const exponent = /e-(\d+)$/.exec(text);
  if (exponent) return Number(exponent[1]);
  return text.includes(".") ? text.split(".")[1]!.length : 0;
};

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/** The nearest value the slider can stand on: stepped from the minimum, as the slider steps, kept between the ends and free of floating point noise. */
export function snap(value: number, min: number, max: number, step: number): number {
  const stepped = Math.round((value - min) / step) * step + min;
  return Number(clamp(stepped, min, max).toFixed(Math.max(decimalsOf(step), decimalsOf(min))));
}

/** Where a value sits on the track, 0 to 100. */
export const percentOf = (value: number, min: number, max: number): number => (max === min ? 0 : clamp(((value - min) / (max - min)) * 100, 0, 100));

/**
 * The `left` that puts the centre of a handle at `percent` of the track. A handle never leaves the track, so at the ends its centre is half a
 * handle inside it: a plain percentage would drift by up to twelve pixels.
 */
export const handleLeft = (percent: number): string => `calc(${percent}% + ${((0.5 - percent / 100) * THUMB).toFixed(2)}px)`;

/** The value under a pointer, given the box of the track: the centres of the handles run from half a handle in to half a handle in. */
export function valueAt(clientX: number, box: { left: number; width: number }, min: number, max: number, step: number): number {
  const room = Math.max(1, box.width - THUMB);
  const ratio = clamp((clientX - box.left - THUMB / 2) / room, 0, 1);
  return snap(min + ratio * (max - min), min, max, step);
}

/** The x of the centre of a handle that stands on `value`, given the box of the track. */
export const centreOf = (value: number, box: { left: number; width: number }, min: number, max: number): number =>
  box.left + THUMB / 2 + (percentOf(value, min, max) / 100) * Math.max(1, box.width - THUMB);

/** A range as it can be used: both ends on a step, inside the limits and in order. */
export function normaliseRange(range: readonly [number, number], min: number, max: number, step: number): [number, number] {
  const a = snap(range[0], min, max, step);
  const b = snap(range[1], min, max, step);
  return a <= b ? [a, b] : [b, a];
}

/**
 * How many items fall between two values, given the counts of equal buckets laid out from `min` to `max`. A bucket the range only
 * partly covers counts for the part it covers, so the number is exact on the edges of the buckets and a fair estimate between them.
 */
export function countBetween(buckets: readonly number[], min: number, max: number, low: number, high: number): number {
  if (!buckets.length || max <= min) return 0;
  const width = (max - min) / buckets.length;
  let total = 0;
  for (const [index, count] of buckets.entries()) {
    const from = min + index * width;
    const overlap = Math.min(high, from + width) - Math.max(low, from);
    if (overlap > 0) total += count * Math.min(1, overlap / width);
  }
  return Math.round(total);
}

/**
 * A number as typed, in the way the locale writes numbers: "1,400" in English and "1.400" in Dutch are both fourteen hundred, and
 * "1,5" is one and a half where the comma is the decimal mark. Currency signs, letters and spaces are ignored.
 */
export function parseNumber(text: string, locale: string): number | null {
  let group = ",";
  let decimal = ".";
  try {
    const parts = new Intl.NumberFormat(locale).formatToParts(1234567.5);
    group = parts.find((part) => part.type === "group")?.value ?? ",";
    decimal = parts.find((part) => part.type === "decimal")?.value ?? ".";
  } catch {
    /* an unknown locale reads like English */
  }
  const plain = text
    .replace(/[^\d.,+-]/g, "")
    .split(group)
    .join("")
    .split(decimal)
    .join(".");
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(plain)) return null;
  const parsed = Number(plain);
  return Number.isFinite(parsed) ? parsed : null;
}
