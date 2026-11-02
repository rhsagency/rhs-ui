export type Side = "top" | "right" | "bottom" | "left";

export interface BoxSides {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** With two fields, one sets the top and the bottom and the other the left and the right. */
export type Axis = "vertical" | "horizontal";

export type FieldKey = Side | Axis;

export const ZERO: BoxSides = { top: 0, right: 0, bottom: 0, left: 0 };

/** The fields in the order Tab visits them: clockwise from the top. */
export const FOUR: readonly FieldKey[] = ["top", "right", "bottom", "left"];
export const TWO: readonly FieldKey[] = ["vertical", "horizontal"];

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/** Rounds away the noise of floating point sums (0.30000000000000004). */
export function tidy(value: number): number {
  return Math.round((value + Number.EPSILON) * 1e4) / 1e4;
}

/** The sides a field sets. */
export function sidesOf(field: FieldKey): readonly Side[] {
  if (field === "vertical") return ["top", "bottom"];
  if (field === "horizontal") return ["left", "right"];
  return [field];
}

/** What a field shows: its own side, or for an axis the first of its two (a pair that was set apart shows its top and its left). */
export function valueOf(sides: BoxSides, field: FieldKey): number {
  return sides[sidesOf(field)[0] ?? "top"];
}

/** The box with one field changed. Linked, every side takes the value. */
export function withField(sides: BoxSides, field: FieldKey, value: number, linked: boolean): BoxSides {
  if (linked) return { top: value, right: value, bottom: value, left: value };
  const next = { ...sides };
  for (const side of sidesOf(field)) next[side] = value;
  return next;
}

/** The name a field has for a screen reader and for a tooltip. */
export const FIELD_NAMES: Record<FieldKey, string> = {
  top: "top",
  right: "right",
  bottom: "bottom",
  left: "left",
  vertical: "top and bottom",
  horizontal: "left and right",
};

const NUMBER = /^\s*(\d+(?:[.,]\d*)?|[.,]\d+)\s*[a-z%]*\s*$/i;

/** "16", "1.5", "1,5" and "16px" are all numbers; anything else is not. */
export function parseSpacing(text: string): number | null {
  const match = NUMBER.exec(text);
  if (!match) return null;
  const value = Number((match[1] ?? "").replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

/** The number as the locale writes it, without grouping and with at most two decimals. */
export function formatSpacing(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: false }).format(value);
}

/** What a screen reader says for a unit, in the singular and the plural. A unit that is not here is read as it is written. */
const SPOKEN: Record<string, readonly [one: string, many: string]> = {
  px: ["pixel", "pixels"],
  pt: ["point", "points"],
  em: ["em", "ems"],
  rem: ["rem", "rems"],
  "%": ["percent", "percent"],
};

export function spokenUnit(unit: string, value: number): string {
  const words = SPOKEN[unit.trim().toLowerCase()];
  if (!words) return unit;
  return value === 1 ? words[0] : words[1];
}
