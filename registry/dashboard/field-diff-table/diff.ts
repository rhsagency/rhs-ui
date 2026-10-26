import type { ReactNode } from "react";

/** What happened to a field. `unchanged` fields fold away under "n unchanged fields". */
export type FieldChangeKind = "changed" | "added" | "removed" | "unchanged";

export interface FieldChange {
  /** The field's identity, and the key `formatters` is read by: "status", "due_date". */
  field: string;
  /** What the field is called for a reader: "Due date". Without it the field name is tidied up ("due_date" becomes "Due date"). */
  label?: string;
  /** The value before the edit. Empty (`undefined`, `null`, `""` or `[]`) reads as "was empty". */
  before?: unknown;
  /** The value after the edit. Empty reads as "removed". */
  after?: unknown;
  /** What happened. Worked out from `before` and `after` when you leave it out. */
  kind?: FieldChangeKind;
}

/** Draws one value your way. It is only called for a value that is not empty. */
export type FieldFormatter = (value: unknown, change: FieldChange) => ReactNode;

/** The columns of a change row: field, before, an arrow, after. On a narrow container the field takes a line of its own. */
export const ROW_GRID = "grid grid-cols-[minmax(0,1fr)_1.5rem_minmax(0,1fr)] gap-x-2 gap-y-1.5 @xl:grid-cols-[minmax(8rem,11rem)_minmax(0,1fr)_2rem_minmax(0,1fr)] @xl:gap-x-3";

/** An empty value is not the same as zero or false: those are values. */
export function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "") || (Array.isArray(value) && value.length === 0);
}

function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (typeof a === "object" && typeof b === "object" && a !== null && b !== null) {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return false;
}

/** The kind a change was given, or the one its two values imply. */
export function kindOf(change: FieldChange): FieldChangeKind {
  if (change.kind) return change.kind;
  const before = isEmptyValue(change.before);
  const after = isEmptyValue(change.after);
  if (before && after) return "unchanged";
  if (before) return "added";
  if (after) return "removed";
  return sameValue(change.before, change.after) ? "unchanged" : "changed";
}

/** "due_date" and "dueDate" both become "Due date". A label you gave is left alone. */
export function labelOf(change: FieldChange): string {
  if (change.label) return change.label;
  const words = change.field
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/[_\-.]+/g, " ")
    .trim()
    .toLowerCase();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : change.field;
}

export interface FormatContext {
  /** BCP 47 locale for numbers, dates and lists. */
  locale: string;
  /** IANA zone for dates. */
  timeZone: string;
}

/** A value as text, and whether it should be set in a monospace face (data rather than prose). */
export function describeValue(value: unknown, context: FormatContext): { text: string; mono: boolean } {
  const { locale, timeZone } = context;
  if (typeof value === "string") return { text: value, mono: false };
  if (typeof value === "number") return { text: Number.isFinite(value) ? new Intl.NumberFormat(locale).format(value) : String(value), mono: false };
  if (typeof value === "bigint") return { text: new Intl.NumberFormat(locale).format(value), mono: false };
  if (typeof value === "boolean") return { text: value ? "Yes" : "No", mono: false };
  if (value instanceof Date) {
    return {
      text: Number.isNaN(value.getTime()) ? "Invalid date" : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone }).format(value),
      mono: false,
    };
  }
  if (Array.isArray(value)) {
    const items = value.map((item) => describeValue(item, context).text);
    return { text: new Intl.ListFormat(locale, { style: "narrow", type: "conjunction" }).format(items), mono: false };
  }
  if (typeof value === "object" && value !== null) {
    try {
      return { text: JSON.stringify(value), mono: true };
    } catch {
      return { text: String(value), mono: true };
    }
  }
  return { text: String(value), mono: false };
}

/**
 * Long prose, and a single long token such as an email address or an id, get a
 * line of their own for each side on a narrow container, where two columns
 * would be too thin to read and would break the token in the middle.
 */
export function isLongText(value: unknown): boolean {
  return typeof value === "string" && (value.length > 80 || value.includes("\n") || value.split(/\s+/).some((token) => token.length > 18));
}
