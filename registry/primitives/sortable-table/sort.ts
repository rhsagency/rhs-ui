/**
 * How the sortable table puts rows in order, as plain functions with no state and no hook, so a Server Component can sort the
 * rows for the first paint with exactly the rule the table applies when a header is pressed.
 */

/** How the values of a column are compared. */
export type SortType = "text" | "number" | "date";

export type SortDirection = "ascending" | "descending";

/** The sort in force: which column, and which way. `null` is no sort, the rows as they came. */
export interface SortState {
  /** The `key` of the column. */
  key: string;
  /** `ascending` (smallest, earliest, A first) or `descending`. */
  direction: SortDirection;
}

/** Nothing there: null, undefined, an empty string, or a number that is not one. Such a value always sorts below the rest. */
export function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === "" || (typeof value === "number" && Number.isNaN(value));
}

/** A value as a number for comparing, or null when it is empty or is not a finite number. */
export function toNumber(value: unknown): number | null {
  if (isEmpty(value)) return null;
  const number = typeof value === "number" ? value : typeof value === "bigint" ? Number(value) : Number(String(value).trim());
  return Number.isFinite(number) ? number : null;
}

/** A value as a point in time for comparing (an ISO date or date-time, a Date or a timestamp), or null when it is empty or is not a date. */
export function toTime(value: unknown): number | null {
  if (isEmpty(value)) return null;
  const time = value instanceof Date ? value.getTime() : typeof value === "number" ? value : Date.parse(String(value));
  return Number.isFinite(time) ? time : null;
}

/** The sort a press on a header leads to: ascending, then descending, then off. Another column starts at ascending. */
export function nextSort(current: SortState | null, key: string): SortState | null {
  if (!current || current.key !== key) return { key, direction: "ascending" };
  return current.direction === "ascending" ? { key, direction: "descending" } : null;
}

function collatorFor(locale: string): Intl.Collator {
  try {
    return new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
  } catch {
    return new Intl.Collator("en-US", { numeric: true, sensitivity: "base" });
  }
}

/**
 * The rows in order, each with the place it had in `rows`, as a new array. Text goes by the locale's collation, with the
 * numbers inside it in natural order ("file 2" before "file 10"); numbers and dates go by value. A value that is empty
 * is always last, whichever way the column goes, and rows that compare equal keep the order they came in, so nothing
 * jumps when the direction flips.
 */
export function sortEntries<Row>(rows: readonly Row[], read: (row: Row) => unknown, type: SortType, direction: SortDirection, locale = "en-US"): { row: Row; index: number }[] {
  const sign = direction === "ascending" ? 1 : -1;
  const collator = collatorFor(locale);
  const keyed = rows.map((row, index) => {
    const raw = read(row);
    const key = type === "number" ? toNumber(raw) : type === "date" ? toTime(raw) : isEmpty(raw) ? null : String(raw);
    return { row, index, key };
  });
  keyed.sort((a, b) => {
    if (a.key === null || b.key === null) return a.key === b.key ? a.index - b.index : a.key === null ? 1 : -1;
    const order = typeof a.key === "string" && typeof b.key === "string" ? collator.compare(a.key, b.key) : Number(a.key) - Number(b.key);
    return order * sign || a.index - b.index;
  });
  return keyed.map(({ row, index }) => ({ row, index }));
}

/** The rows in order, as a new array. See `sortEntries`. */
export function sortRows<Row>(rows: readonly Row[], read: (row: Row) => unknown, type: SortType, direction: SortDirection, locale = "en-US"): Row[] {
  return sortEntries(rows, read, type, direction, locale).map((entry) => entry.row);
}
