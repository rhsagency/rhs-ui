/** One choice in a column. A plain string is the same as `{ value: it }`. */
export interface WheelOption {
  /** What the picker reports when this row is chosen. */
  value: string;
  /** What the row says, when that is not the value ("05" for "5", "PM" for "pm"). */
  label?: string;
  /** A row that cannot be chosen: it stays in the list, struck through, and the keys and a stopped swipe move past it. */
  disabled?: boolean;
}

/** One column of the wheel: hours, minutes, AM or PM, a number of guests. */
export interface WheelColumn {
  /** A name for the column that does not change, used in the ids. */
  id: string;
  /** The rows, top to bottom. */
  options: readonly (string | WheelOption)[];
  /** Wrap round, so after 59 minutes comes 00 again. Default false: the column has a first and a last row. */
  loop?: boolean;
  /** The name of the column for a screen reader: "Hours". Default: the id. */
  label?: string;
  /** Where the text of a row sits in its column. Default "center"; a time reads best with the hour at the end and the minute at the start. */
  align?: "start" | "center" | "end";
  /** A mark drawn after the column, at the height of the chosen row: ":" between hours and minutes, or a unit such as "min". */
  separator?: string;
  /** The width of the column in pixels. Default 96. It gives way when the picker has less room. */
  width?: number;
}

export interface NormalOption {
  value: string;
  label: string;
  disabled: boolean;
}

/** The rows of a column with the defaults filled in. */
export function normaliseOptions(options: readonly (string | WheelOption)[]): NormalOption[] {
  return options.map((option) => {
    const item = typeof option === "string" ? { value: option } : option;
    return { value: item.value, label: item.label ?? item.value, disabled: item.disabled === true };
  });
}

/**
 * A run of numbers as rows: `wheelRange(0, 59, { pad: 2 })` is 00 to 59 and
 * `wheelRange(0, 45, { step: 15 })` is 0, 15, 30 and 45. Values are the numbers
 * as text, so they are what the picker reports.
 */
export function wheelRange(from: number, to: number, { step = 1, pad = 0 }: { step?: number; pad?: number } = {}): WheelOption[] {
  const rows: WheelOption[] = [];
  if (!Number.isFinite(from) || !Number.isFinite(to) || step <= 0) return rows;
  for (let number = from; number <= to; number += step) rows.push({ value: String(number), label: String(number).padStart(pad, "0") });
  return rows;
}

/** How many times a looping column is drawn, so that a long flick never runs out of rows: an odd number, with about 200 rows or more in all. */
export function copiesFor(length: number): number {
  if (length < 1) return 1;
  let copies = Math.ceil(200 / length);
  if (copies % 2 === 0) copies += 1;
  return Math.max(3, Math.min(15, copies));
}

/** The first row that can be chosen, or -1 when none can. */
export const firstEnabled = (options: readonly NormalOption[]): number => options.findIndex((option) => !option.disabled);

/** The last row that can be chosen, or -1. */
export function lastEnabled(options: readonly NormalOption[]): number {
  for (let index = options.length - 1; index >= 0; index -= 1) if (!options[index]?.disabled) return index;
  return -1;
}

/** The row with this value, else the first that can be chosen: a value the column does not have is not an error, the wheel just starts at the top. */
export function indexOfValue(options: readonly NormalOption[], value: string | undefined): number {
  const found = options.findIndex((option) => option.value === value);
  return found === -1 ? Math.max(0, firstEnabled(options)) : found;
}

/** The row `steps` places from `from` that can be chosen, skipping rows that cannot; wrapping round in a loop, and stopping at the end otherwise. */
export function stepIndex(options: readonly NormalOption[], from: number, steps: number, loop: boolean): number {
  const count = options.length;
  if (!count || !steps) return from;
  const direction = steps > 0 ? 1 : -1;
  let index = from;
  for (let remaining = Math.abs(steps); remaining > 0; remaining -= 1) {
    let candidate = index;
    let found = false;
    for (let tries = 0; tries < count; tries += 1) {
      candidate += direction;
      if (loop) candidate = ((candidate % count) + count) % count;
      else if (candidate < 0 || candidate >= count) break;
      if (!options[candidate]?.disabled) {
        found = true;
        break;
      }
    }
    if (!found) break;
    index = candidate;
  }
  return index;
}

/** The row nearest to `from` that can be chosen, or -1. */
export function nearestEnabled(options: readonly NormalOption[], from: number): number {
  for (let distance = 0; distance < options.length; distance += 1) {
    if (options[from - distance] && !options[from - distance]?.disabled) return from - distance;
    if (options[from + distance] && !options[from + distance]?.disabled) return from + distance;
  }
  return -1;
}

/** A label as it is typed: lower case, and a number without its leading zeros, so "7" finds "07". */
const typedForm = (text: string) => text.toLowerCase().trim().replace(/^0+(?=\d)/, "");

/**
 * The row that what was typed so far points at. A number finds the first row
 * that starts with it ("7" finds 07, "45" finds 45), a letter finds the first
 * row that starts with it ("p" finds PM), and the same key pressed again goes
 * on to the next row that starts with that letter.
 */
export function matchTyped(options: readonly NormalOption[], typed: string, from: number): number {
  const wanted = typedForm(typed);
  if (!wanted) return -1;
  const starts = (option: NormalOption | undefined) => option !== undefined && !option.disabled && typedForm(option.label).startsWith(wanted);
  // The same letter again goes on to the next row with that letter. Digits do not: "11" is eleven.
  const repeated = wanted.length > 1 && /\D/.test(wanted[0] ?? "") && [...wanted].every((char) => char === wanted[0]);
  if (repeated) {
    const letter = wanted.slice(0, 1);
    for (let offset = 1; offset <= options.length; offset += 1) {
      const index = (from + offset) % options.length;
      if (typedForm(options[index]?.label ?? "").startsWith(letter) && !options[index]?.disabled) return index;
    }
  }
  return options.findIndex(starts);
}
