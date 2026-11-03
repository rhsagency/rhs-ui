/** The visible handle, in px. The track keeps it inside its ends, so the zones and the numbers under it have to know its size. */
export const THUMB = 24;

/** Where the two levels sit: the warning starts at `warn` and the critical zone at `critical`. Above `critical` is the worst. */
export interface ThresholdValue {
  warn: number;
  critical: number;
}

/** The names of the three zones. */
export interface ZoneNames {
  ok: string;
  warn: string;
  critical: string;
}

export const DEFAULT_ZONES: ZoneNames = { ok: "OK", warn: "Warning", critical: "Critical" };

/** The words the slider says, for another language or your own voice. The number and its unit are put together for you. */
export interface ThresholdLabels {
  /** What a handle's value is read as: "Warning starts at 70 percent". Given the name of the zone and the number with its spoken unit. */
  startsAt: (zone: string, value: string) => string;
  /** The name of a handle: "Warning threshold". Given the name of the zone. */
  handle: (zone: string) => string;
  /** The name of a number field: "Warning starts at". Given the name of the zone. */
  field: (zone: string) => string;
  /** The first zone, as a range, without its unit: "up to 70". */
  upTo: (value: string) => string;
  /** The middle zone, as a range: "70 to 90". */
  between: (from: string, to: string) => string;
  /** The last zone, as a range: "above 90". */
  above: (value: string) => string;
  /** The name of the list of zones. */
  zones: string;
}

export const DEFAULT_LABELS: ThresholdLabels = {
  startsAt: (zone, value) => `${zone} starts at ${value}`,
  handle: (zone) => `${zone} threshold`,
  field: (zone) => `${zone} starts at`,
  upTo: (value) => `to ${value}`,
  between: (from, to) => `${from} to ${to}`,
  above: (value) => `above ${value}`,
  zones: "Zones",
};

/** The word a screen reader should say for a unit that is a symbol. Other units are said as they are written. */
const SPOKEN: Record<string, string> = { "%": "percent", "°": "degrees", "°C": "degrees Celsius", "°F": "degrees Fahrenheit", "€": "euros", $: "dollars", "£": "pounds" };

export const spokenUnit = (unit: string): string => SPOKEN[unit] ?? unit;

/** A unit as it follows a number: "%" sticks to it, "ms" stands apart. */
export const unitSuffix = (unit: string): string => (unit === "" ? "" : unit.length === 1 || unit.startsWith("°") ? unit : ` ${unit}`);

/** How many places after the decimal point a step has: 0.5 has one. */
export const decimalsOf = (step: number): number => {
  const text = String(step);
  const exponent = /e-(\d+)$/.exec(text);
  if (exponent) return Number(exponent[1]);
  return text.includes(".") ? text.split(".")[1]!.length : 0;
};

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/** The nearest value the slider can stand on: stepped from the minimum, kept between the ends and free of floating point noise. */
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

/** Two levels as they can be used: on a step, inside the limits and at least `gap` apart, the warning below the critical level. */
export function normaliseLevels(level: ThresholdValue, min: number, max: number, step: number, gap: number): ThresholdValue {
  const warn = clamp(snap(Math.min(level.warn, level.critical), min, max, step), min, max - gap);
  const critical = clamp(snap(Math.max(level.critical, level.warn), min, max, step), warn + gap, max);
  return { warn, critical };
}

/** A number as typed, in the way the locale writes numbers. Units, letters and spaces are ignored. */
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

/** Roughly how wide a number is on the scale, in px, so labels that would run into each other can be told apart without measuring. */
export const labelWidth = (text: string): number => text.length * 7 + 4;
