import type { ReactNode } from "react";

/** The visible knob, in px. The track keeps it inside its ends, so a tick or a label under the knob has to know its size. */
export const THUMB = 20;

/** A tick on the track, with a label under it when it has one. */
export interface SliderMark {
  value: number;
  label?: ReactNode;
}

/** The words the field says, for another language or your own voice. */
export interface SliderFieldLabels {
  /** The text of the button that goes back to the default. Default "Reset". */
  reset: string;
  /** What that button is called for a screen reader and in its tooltip, given the default as it is written. Default "Reset to 45 min". */
  resetTo: (formatted: string) => string;
  /** Read after the field to say what the default is. Default "Default 45 min". */
  defaultIs: (formatted: string) => string;
  /** The name of the number field, given the name of the slider. Default "Session length, exact value". */
  exactValue: (label: string) => string;
}

export const DEFAULT_LABELS: SliderFieldLabels = {
  reset: "Reset",
  resetTo: (formatted) => `Reset to ${formatted}`,
  defaultIs: (formatted) => `Default ${formatted}`,
  exactValue: (label) => `${label}, exact value`,
};

const decimalsOf = (step: number): number => {
  const text = String(step);
  const exponent = /e-(\d+)$/.exec(text);
  if (exponent) return Number(exponent[1]);
  return text.includes(".") ? text.split(".")[1]!.length : 0;
};

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/** The nearest value the slider can stand on: stepped from the minimum, as the slider steps, kept between the ends and free of floating point noise (0.1 + 0.2). */
export function snap(value: number, min: number, max: number, step: number): number {
  const stepped = Math.round((value - min) / step) * step + min;
  return Number(clamp(stepped, min, max).toFixed(Math.max(decimalsOf(step), decimalsOf(min))));
}

/** Where a value sits on the track, 0 to 100. */
export const percentOf = (value: number, min: number, max: number): number => (max === min ? 0 : clamp(((value - min) / (max - min)) * 100, 0, 100));

/**
 * The `left` that puts something under the centre of the knob when the knob stands at `percent`. The knob never leaves the track, so at the
 * ends its centre is half a knob inside it: a plain percentage would drift by up to ten pixels.
 */
export const markLeft = (percent: number): string => `calc(${percent}% + ${((0.5 - percent / 100) * THUMB).toFixed(2)}px)`;

const decimalByLocale = new Map<string, string>();
const formatsByLocale = new Map<string, Intl.NumberFormat>();

/** An `Intl.NumberFormat` that writes Latin digits, so that what the field shows is what it can read back. A locale that is not a valid tag counts as en-US. */
function latinFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  try {
    return new Intl.NumberFormat(locale, { ...options, numberingSystem: "latn" });
  } catch {
    return new Intl.NumberFormat("en-US", options);
  }
}

/** The sign a locale starts its decimals with, asked of Intl and kept: "." in en-US, "," in nl-NL and fr-FR. */
function decimalSign(locale: string): string {
  let found = decimalByLocale.get(locale);
  if (found === undefined) {
    found = latinFormat(locale, {}).formatToParts(1.5).find((part) => part.type === "decimal")?.value ?? ".";
    decimalByLocale.set(locale, found);
  }
  return found;
}

/** A number the way the field shows it while you edit: the locale's own decimal sign, no grouping, every decimal. 1.5 is "1,5" in nl-NL, and parseNumber reads that back as 1.5. */
export function plainNumber(value: number, locale: string): string {
  let format = formatsByLocale.get(locale);
  if (!format) {
    format = latinFormat(locale, { useGrouping: false, maximumFractionDigits: 20 });
    formatsByLocale.set(locale, format);
  }
  // Some scripts put an invisible direction mark in front of a minus sign; the field has no use for it.
  return format.format(value).replace(/\p{Cf}/gu, "");
}

const FIRST_GROUP = /^[1-9]\d{0,2}$/;
const isPoint = (sign: string): boolean => sign === "." || sign === ",";

/**
 * A number as typed, or null when it is not one: "45", "-3", "2 500" and ".5" all work, anything else is not a number. The locale says which
 * sign is the decimal one: with en-US "3.5" is three and a half and "3,000" is three thousand, with nl-NL "3,5" is three and a half and
 * "3.000" is three thousand. A sign that is not the locale's decimal one is still read when it can mean only one thing: alone, with three
 * digits after it and a number that does not start with a zero before it, it groups ("1,500" is fifteen hundred in en-US); in any other place
 * it is a decimal, so "1,5" is one and a half there too. With two kinds of sign the last is the decimal one ("1.234,5", "1,234.5"), and a sign
 * that comes more than once is only grouping.
 */
export function parseNumber(text: string, locale = "en-US"): number | null {
  const clean = text.replace(/[\u{2010}-\u{2015}\u{2212}]/gu, "-").replace(/[\s\p{Cf}]/gu, "");
  const body = clean.replace(/^[-+]/, "");
  if (!/^[\d.,'\u{2019}]*\d[\d.,'\u{2019}]*$/u.test(body)) return null;
  const marks = body.replace(/\d/g, "");
  const kinds = new Set(marks);
  if (kinds.size > 2) return null;
  const last = marks.slice(-1);
  // Where the decimals start, or -1 when every sign in the number is grouping.
  let point = -1;
  if (kinds.size === 2) {
    if (!isPoint(last) || body.indexOf(last) !== body.lastIndexOf(last)) return null;
    point = body.lastIndexOf(last);
  } else if (marks.length === 1 && isPoint(last)) {
    const at = body.indexOf(last);
    const grouping = body.length - at - 1 === 3 && FIRST_GROUP.test(body.slice(0, at));
    if (last === decimalSign(locale) || !grouping) point = at;
  }
  const integer = point < 0 ? body : body.slice(0, point);
  const fraction = point < 0 ? "" : body.slice(point + 1);
  // What is left of the point has to look like grouping: 1,234 and 12,345,678, never 1,23 or 1,2,3.
  const groups = integer.split(/[.,'\u{2019}]/u);
  if (groups.length > 1 && !(FIRST_GROUP.test(groups[0]!) && groups.slice(1).every((group) => group.length === 3))) return null;
  const parsed = Number(`${groups.join("") || "0"}.${fraction || "0"}`);
  if (!Number.isFinite(parsed)) return null;
  return clean.startsWith("-") && parsed !== 0 ? -parsed : parsed;
}
