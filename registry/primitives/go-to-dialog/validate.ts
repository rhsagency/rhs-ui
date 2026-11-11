/**
 * What the go-to dialog checks and says, as plain functions with no state and no hook, so a Server Component can run
 * the same check on a value that came back in a request.
 */

/** What the dialog asks for: a whole number (a page, a line, a row) or a calendar date. */
export type GoToKind = "number" | "date";

/** What `onGo` receives for each kind: a number for `number`, an ISO date such as `2026-03-14` for `date`. */
export type GoToValue<K extends GoToKind = GoToKind> = K extends "date" ? string : number;

/** The words the dialog says, for another language or your own wording. `{min}`, `{max}`, `{noun}` and `{article}` are filled in. */
export interface GoToLabels {
  /** The button that goes. Default "Go". */
  go: string;
  /** The button that closes without going. Default "Cancel". */
  cancel: string;
  /** The hint under the field when there are two limits. Default "{min} to {max}". */
  range: string;
  /** The hint when there is a lower limit only. Default "{min} or more". */
  atLeast: string;
  /** The hint when there is an upper limit only, which only a date can have. Default "Up to {max}". */
  atMost: string;
  /** Said when Go is pressed with nothing typed. Default "Enter {article} {noun}." */
  empty: string;
  /** Said when the text is not a whole number. Default "Use whole numbers only." */
  whole: string;
  /** Said when a number is outside two limits. Default "Pick {article} {noun} between {min} and {max}." */
  between: string;
  /** Said when a number is below the lower limit and there is no upper one. Default "Pick {article} {noun} of {min} or more." */
  below: string;
  /** The label of the shortcut hint in the footer. Default "Shortcut". */
  shortcut: string;
  /** What a screen reader hears after the title. Default "Press Enter to go, or Escape to cancel." */
  description: string;
}

export const DEFAULT_LABELS = {
  go: "Go",
  cancel: "Cancel",
  range: "{min} to {max}",
  atLeast: "{min} or more",
  atMost: "Up to {max}",
  empty: "Enter {article} {noun}.",
  whole: "Use whole numbers only.",
  between: "Pick {article} {noun} between {min} and {max}.",
  below: "Pick {article} {noun} of {min} or more.",
  shortcut: "Shortcut",
  description: "Press Enter to go, or Escape to cancel.",
} satisfies GoToLabels;

/** Puts values into the `{name}` places of a sentence. A place without a value is left as it is. */
export function fillIn(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/** "a" or "an" for a noun in English: "a page", "an invoice". Other languages write their own sentence in `labels`. */
export function articleFor(noun: string): "a" | "an" {
  return /^[aeiou]/i.test(noun.trim()) ? "an" : "a";
}

/** A number in the locale: "1,240" in en-US, "1.240" in de-DE. */
export function formatWhole(value: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
  } catch {
    return String(value);
  }
}

/** An ISO date as it is written in the locale: "14 March 2026". Read as a calendar day, so the time zone never moves it. */
export function formatDay(iso: string, locale: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return iso;
  const at = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(at);
  } catch {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(at);
  }
}

/** The character a locale puts between groups of thousands, or an empty string when it has none. */
function groupSeparator(locale: string): string {
  try {
    return new Intl.NumberFormat(locale).formatToParts(1_000_000).find((part) => part.type === "group")?.value ?? "";
  } catch {
    return ",";
  }
}

/** Digits typed on a keyboard that writes them differently (Arabic-Indic, Persian) as the digits 0 to 9. */
function asciiDigits(text: string): string {
  return text.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (char) => String(char.charCodeAt(0) >= 0x6f0 ? char.charCodeAt(0) - 0x6f0 : char.charCodeAt(0) - 0x660));
}

/** A whole number from what was typed, with the locale's thousands separator and spaces allowed ("1,240"), or null when it is anything else. */
export function readWhole(text: string, locale: string): number | null {
  // `\s` covers the no-break spaces some locales put between thousands.
  let cleaned = asciiDigits(text).replace(/\s/g, "");
  const group = groupSeparator(locale).replace(/\s/g, "");
  if (group) cleaned = cleaned.split(group).join("");
  return /^\d{1,15}$/.test(cleaned) ? Number(cleaned) : null;
}

export type NumberCheck = { state: "empty" } | { state: "invalid"; message: string } | { state: "valid"; value: number };

export interface NumberCheckOptions {
  /** The lowest number that can be used. Default 1. */
  min?: number;
  /** The highest number that can be used. */
  max?: number;
  /** The locale for reading and writing numbers. Default "en-US". */
  locale?: string;
  /** What is being picked: "page", "line", "row". Default "number". */
  noun?: string;
  /** Other words for the messages. */
  labels?: Partial<GoToLabels>;
}

/** The hint that shows the range: "1 to 240". */
export function numberHint({ min = 1, max, locale = "en-US", labels }: NumberCheckOptions): string {
  const words = { ...DEFAULT_LABELS, ...labels };
  const values = { min: formatWhole(min, locale), max: max === undefined ? "" : formatWhole(max, locale) };
  return fillIn(max === undefined ? words.atLeast : words.range, values);
}

/** The hint under a date field: "3 March 2026 to 28 October 2026", with whichever limits there are. Null with none. */
export function dayHint({ min, max, locale = "en-US", labels }: { min?: string; max?: string; locale?: string; labels?: Partial<GoToLabels> }): string | null {
  const words = { ...DEFAULT_LABELS, ...labels };
  const values = { min: min ? formatDay(min, locale) : "", max: max ? formatDay(max, locale) : "" };
  if (min && max) return fillIn(words.range, values);
  if (min) return fillIn(words.atLeast, values);
  if (max) return fillIn(words.atMost, values);
  return null;
}

/**
 * Reads what was typed and says what is wrong with it, in words, or gives the number. Nothing typed is `empty`, which is
 * not an error until someone presses Go.
 */
export function checkNumber(text: string, options: NumberCheckOptions = {}): NumberCheck {
  const { min = 1, max, locale = "en-US", noun = "number", labels } = options;
  if (!text.trim()) return { state: "empty" };
  const words = { ...DEFAULT_LABELS, ...labels };
  const values = { min: formatWhole(min, locale), max: max === undefined ? "" : formatWhole(max, locale), noun, article: articleFor(noun) };
  const value = readWhole(text, locale);
  if (value === null) return { state: "invalid", message: fillIn(words.whole, values) };
  if (value < min || (max !== undefined && value > max)) {
    return { state: "invalid", message: fillIn(max === undefined ? words.below : words.between, values) };
  }
  return { state: "valid", value };
}
