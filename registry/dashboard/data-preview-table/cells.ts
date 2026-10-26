/** What a column holds. It decides how a value is read, aligned and written. */
export type PreviewColumnType = "text" | "number" | "date" | "boolean" | "json";

export interface PreviewColumn {
  /** The column's name. It is the header, and the key to read from a row that is an object. */
  name: string;
  type: PreviewColumnType;
}

/** A row is an array in the order of `columns`, or an object keyed by column name. */
export type PreviewRow = readonly unknown[] | Readonly<Record<string, unknown>>;

export interface CellContext {
  /** BCP 47 locale for numbers and dates. */
  locale: string;
  /** IANA zone for dates that carry a time. */
  timeZone: string;
  /** Text and JSON longer than this many characters are cut, with an ellipsis. Numbers, dates and booleans are never cut. */
  truncateAt: number;
}

/** A cell as the table draws it. `null` and `empty` are not values of a type: they are the two ways to have nothing. */
export type CellKind = "null" | "empty" | PreviewColumnType;

export interface CellView {
  kind: CellKind;
  /** What the cell shows, cut at `truncateAt`. */
  text: string;
  /** The whole value as text, for the tooltip. */
  full: string;
  /** Whether `text` is shorter than `full`. */
  truncated: boolean;
  /** What Ctrl+C copies: the raw value, not the localised one. */
  copy: string;
}

export function valueAt(row: PreviewRow, column: PreviewColumn, index: number): unknown {
  return Array.isArray(row) ? row[index] : (row as Readonly<Record<string, unknown>>)[column.name];
}

/** The type names, in the words the headers use. */
export const TYPE_LABEL: Readonly<Record<PreviewColumnType, string>> = { text: "text", number: "number", date: "date", boolean: "boolean", json: "json" };

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
/** A moment written out in full starts with a day of its own: "2026-11-04T09:30:00Z". */
const DAY_THEN_TIME = /^(\d{4}-\d{2}-\d{2})[T ]/;
/** A plain decimal, which is how a CSV import hands over a number: no exponent, no grouping, no stray leading zeros ("007" is an id, not a 7). */
const DECIMAL = /^-?(?:0|[1-9]\d*)(?:\.(\d+))?$/;

function prettyJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function compact(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function cut(text: string, limit: number): { text: string; truncated: boolean } {
  const flat = text.replace(/\s+/g, " ").trim();
  const chars = Array.from(flat);
  return chars.length > limit ? { text: `${chars.slice(0, limit).join("").trimEnd()}…`, truncated: true } : { text: flat, truncated: false };
}

/**
 * The day a "2026-11-04" names, or null when there is no such day. A Date rolls "2026-02-30" over into
 * the second of March without complaint, so the day only counts if it reads back the same.
 */
function realDay(text: string): Date | null {
  const day = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(day.getTime()) && day.toISOString().slice(0, 10) === text ? day : null;
}

/**
 * A date or a moment as text, or null when the value is not one, so the cell shows it as written. A date
 * without a time is the same day everywhere, so it is never moved into another zone, and a day that does
 * not exist ("2026-02-30") is never quietly moved to one that does.
 */
function dateText(value: unknown, context: CellContext): string | null {
  const { locale, timeZone } = context;
  if (typeof value === "string" && DATE_ONLY.test(value)) {
    const day = realDay(value);
    return day ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(day) : null;
  }
  const lead = typeof value === "string" ? DAY_THEN_TIME.exec(value)?.[1] : undefined;
  if (lead && !realDay(lead)) return null;
  const moment = value instanceof Date ? value : typeof value === "string" || typeof value === "number" ? new Date(value) : null;
  if (!moment || Number.isNaN(moment.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone }).format(moment);
}

/** What `Intl.NumberFormat` reads when it is given text: ES2023 formats a numeric string digit for digit, while the typings still say `number`. */
type TextFormatter = { format(value: number | bigint | string): string };

/**
 * A number as text, or null when the value is not one, so the cell shows it as written. A number or a
 * bigint keeps every digit it has. Text is formatted from the text itself and never through Number(), which
 * would round "9007199254740993" to ...992 and turn "1.10" into 1.1: a preview must show what the file says.
 */
function numberText(value: unknown, locale: string): string | null {
  if (typeof value === "number") return Number.isFinite(value) ? new Intl.NumberFormat(locale, { maximumFractionDigits: 20 }).format(value) : null;
  if (typeof value === "bigint") return new Intl.NumberFormat(locale).format(value);
  if (typeof value !== "string") return null;
  const text = value.trim();
  const match = DECIMAL.exec(text);
  if (!match) return null;
  const decimals = match[1]?.length ?? 0;
  try {
    const formatter: TextFormatter = new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: Math.max(20, decimals) });
    return formatter.format(text);
  } catch {
    // An engine that only allows 20 decimals: show the text rather than a rounded number.
    return null;
  }
}

/** Reads one value the way its column says to, and works out what to show, what to reveal and what to copy. */
export function viewOf(value: unknown, type: PreviewColumnType, context: CellContext): CellView {
  const { locale, truncateAt } = context;
  if (value === null || value === undefined) return { kind: "null", text: "null", full: "null", truncated: false, copy: "null" };
  if (typeof value === "string" && value === "") return { kind: "empty", text: "empty", full: "", truncated: false, copy: "" };

  let shown: string;
  let full: string;
  let copy: string;
  if (type === "number") {
    shown = numberText(value, locale) ?? String(value);
    full = shown;
    copy = String(value);
  } else if (type === "date") {
    shown = dateText(value, context) ?? String(value);
    full = shown;
    copy = value instanceof Date ? value.toISOString() : String(value);
  } else if (type === "json") {
    const raw = typeof value === "string" ? value : compact(value);
    shown = raw;
    full = typeof value === "string" ? prettyJson(value) : JSON.stringify(value, null, 2) ?? raw;
    copy = raw;
  } else {
    shown = typeof value === "object" ? compact(value) : String(value);
    full = typeof value === "object" ? (JSON.stringify(value, null, 2) ?? shown) : shown;
    copy = typeof value === "object" ? shown : String(value);
  }
  // Only prose and data are cut. A number or a date cut in the middle says something else, so those are always whole.
  const clipped = type === "text" || type === "json" ? cut(shown, truncateAt) : { text: shown, truncated: false };
  return { kind: type, text: clipped.text, full, truncated: clipped.truncated, copy };
}

/**
 * Scrolls a region just far enough for a cell the keyboard has reached to clear what is pinned inside it: the
 * row numbers on the left and the header above. A browser leaves a focused cell where it is while any sliver of
 * it shows, and here that can be a sliver beside the row numbers, so the keyboard would sit on a cell it cannot
 * read. A click never moves the table.
 */
export function clearOfPinned(region: HTMLElement, cell: HTMLElement): void {
  try {
    if (!cell.matches(":focus-visible")) return;
  } catch {
    // A browser without :focus-visible: go on, because the keyboard is the case that matters.
  }
  const area = region.getBoundingClientRect();
  const at = cell.getBoundingClientRect();
  const free = {
    left: area.left + region.clientLeft + (region.querySelector<HTMLElement>("tbody th")?.offsetWidth ?? 0),
    right: area.left + region.clientLeft + region.clientWidth,
    top: area.top + region.clientTop + (region.querySelector<HTMLElement>("thead")?.offsetHeight ?? 0),
    bottom: area.top + region.clientTop + region.clientHeight,
  };
  // A cell wider or taller than the free area lines up with its start, so its first characters are the ones that show.
  if (at.left < free.left) region.scrollLeft -= free.left - at.left;
  else if (at.right > free.right) region.scrollLeft += Math.min(at.right - free.right, at.left - free.left);
  if (at.top < free.top) region.scrollTop -= free.top - at.top;
  else if (at.bottom > free.bottom) region.scrollTop += Math.min(at.bottom - free.bottom, at.top - free.top);
}

/** Puts text on the clipboard. Reports whether it worked, because a page without permission or a secure context cannot. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the older route below.
  }
  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    return ok;
  } catch {
    return false;
  }
}
