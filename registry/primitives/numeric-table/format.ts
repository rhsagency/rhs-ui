/**
 * How the numeric table writes and adds figures, as plain functions with no state, so a Server Component can format the
 * same way the table does (a number in a sentence next to it, an export) and so the rules can be tested alone.
 */

/** What a column holds. `percent` takes fractions: 0.124 is written 12.4%. */
export type NumericKind = "number" | "currency" | "percent" | "text";

/** How a column's totals are worked out: add the figures, average them, or run your own function over the figures that exist. */
export type TotalRule = "sum" | "average" | ((values: readonly number[]) => number | null);

/** The true minus sign. A hyphen is half the width and is read as a dash. */
export const MINUS = "−";

export interface FigureFormat {
  /** The kind of figure: a plain number, money, or a fraction written as a percentage. */
  kind: Exclude<NumericKind, "text">;
  /** Digits after the point, the same in every row of the column so the points line up. Default: 0 for numbers, 1 for percentages, the currency's own for money. */
  precision?: number;
  /** An ISO currency code for `currency`. Default "USD". */
  currency?: string;
  /** The locale that decides the digits, the separators and where the sign and the currency sit. */
  locale: string;
}

/** A formatter for one column. It rounds a value that is a hair below zero to a plain zero instead of writing a minus in front of 0.00. */
export function makeFormatter({ kind, precision, currency, locale }: FigureFormat): Intl.NumberFormat {
  const options: Record<string, unknown> = { signDisplay: "negative" };
  if (kind === "currency") {
    options.style = "currency";
    options.currency = currency ?? "USD";
  }
  if (kind === "percent") options.style = "percent";
  const digits = precision ?? (kind === "percent" ? 1 : kind === "number" ? 0 : undefined);
  if (digits !== undefined) {
    options.minimumFractionDigits = digits;
    options.maximumFractionDigits = digits;
  }
  return new Intl.NumberFormat(locale, options as Intl.NumberFormatOptions);
}

/** One figure, as it is drawn and as it is spoken. */
export interface Figure {
  /** What is drawn: the locale's own writing with a true minus sign in the place the locale puts it. */
  text: string;
  /** The same figure without its sign, for a screen reader that is told "negative" in words. */
  spoken: string;
  negative: boolean;
}

export function formatFigure(formatter: Intl.NumberFormat, value: number): Figure {
  const parts = formatter.formatToParts(value);
  return {
    negative: parts.some((part) => part.type === "minusSign"),
    text: parts.map((part) => (part.type === "minusSign" ? MINUS : part.value)).join(""),
    spoken: parts
      .filter((part) => part.type !== "minusSign")
      .map((part) => part.value)
      .join(""),
  };
}

/** A cell value as a number, or null when there is none: null, undefined, an empty string, NaN and anything that is not a finite number. A zero is a number. */
export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim()) : Number.NaN;
  return Number.isFinite(number) ? number : null;
}

/** The total of a column's figures, or null when it has none: a column of gaps is not a total of zero. */
export function totalOf(rule: TotalRule, values: readonly number[]): number | null {
  if (typeof rule === "function") return rule(values);
  if (values.length === 0) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  return rule === "sum" ? sum : sum / values.length;
}

/** The highest and lowest figure of a column, or null when there is nothing to tell apart (fewer than two figures, or all the same). */
export function extremes(values: readonly number[]): { highest: number; lowest: number } | null {
  if (values.length < 2) return null;
  const highest = Math.max(...values);
  const lowest = Math.min(...values);
  return highest === lowest ? null : { highest, lowest };
}
