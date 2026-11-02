/** A ready-made length: the choice reads "30 days" and means thirty days from the start. */
export interface ExpiryPreset {
  label: string;
  /** How many days after the start the date falls. */
  days: number;
}

export const DEFAULT_PRESETS: readonly ExpiryPreset[] = [
  { label: "1 day", days: 1 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "1 year", days: 365 },
];

/** The words the select says, for another language or your own voice. */
export interface ExpiryLabels {
  /** The trigger while nothing is chosen. */
  placeholder: string;
  /** The choice that means no end date. */
  never: string;
  /** The choice that opens the date picker. */
  custom: string;
  /** The line under the field for a date, given the date as it is written: "Expires Tue 17 Nov 2026". */
  expires: (date: string) => string;
  /** The line under the field for no end date. */
  neverExpires: string;
  /** The line when the date is before the start. */
  past: string;
  /** The line when the date is after the latest allowed one, given that date as it is written. */
  beyond: (date: string) => string;
  /** The line under a preset that is too long for `max`, given that date as it is written. */
  tooLong: (date: string) => string;
  /** The name of the date picker for a screen reader. */
  dateLabel: string;
}

export const DEFAULT_LABELS: ExpiryLabels = {
  placeholder: "Choose when it expires",
  never: "Never",
  custom: "Custom date",
  expires: (date) => `Expires ${date}`,
  neverExpires: "Never expires",
  past: "That date has passed. Choose a later one.",
  beyond: (date) => `That is too far ahead. The latest date is ${date}.`,
  tooLong: (date) => `Past the limit of ${date}`,
  dateLabel: "Expiry date",
};

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const pad = (value: number, width = 2) => String(value).padStart(width, "0");

/** The numbers in a calendar date such as "2026-11-17", or null when it is not one or the day does not exist ("2026-02-31"). */
export function parseIso(iso: string | null | undefined): { year: number; month: number; day: number } | null {
  const match = ISO.exec((iso ?? "").trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day ? { year, month, day } : null;
}

/** The date `days` after the one given. A calendar date has no time zone, so this is UTC arithmetic and a clock change never gets in. */
export function addDays(iso: string, days: number): string {
  const parts = parseIso(iso);
  if (!parts) return iso;
  const moved = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return `${pad(moved.getUTCFullYear(), 4)}-${pad(moved.getUTCMonth() + 1)}-${pad(moved.getUTCDate())}`;
}

/** The calendar date it is in a time zone at an instant. */
export function dateIn(timeZone: string, instant: number | Date = Date.now()): string {
  const read = (zone: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(instant)
      .reduce<Record<string, string>>((all, part) => ({ ...all, [part.type]: part.value }), {});
  let parts: Record<string, string>;
  try {
    parts = read(timeZone);
  } catch {
    parts = read("UTC");
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** The start as a calendar date: a date as it is, a moment as the day it falls on in the time zone. */
export function startOf(from: Date | string | number, timeZone: string): string | null {
  if (typeof from === "string" && parseIso(from)) return from.trim();
  const moment = new Date(from);
  return Number.isNaN(moment.getTime()) ? null : dateIn(timeZone, moment);
}

/** The date for the calendar, as the local day it names: the calendar works in the reader's own time zone, so midnight there. */
export function toLocalDate(iso: string): Date | null {
  const parts = parseIso(iso);
  return parts ? new Date(parts.year, parts.month - 1, parts.day) : null;
}

/** The calendar date of a local day the calendar gave back. */
export const fromLocalDate = (date: Date): string => `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/**
 * A date as it is written under the field: "Tue 17 Nov 2026" in en-GB. It names a day, so it is formatted in UTC whatever the reader's
 * time zone. Newer language data writes "Tue 17 Nov 2026" and older writes "Tue, 17 Nov 2026"; where the day number follows the weekday the
 * comma between them is left out, so the line reads the same in every browser.
 */
export function writeDate(iso: string, locale: string): string {
  const parts = parseIso(iso);
  if (!parts) return iso;
  const written = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).formatToParts(Date.UTC(parts.year, parts.month - 1, parts.day));
  return written.map((part, index) => (part.type === "literal" && written[index - 1]?.type === "weekday" && written[index + 1]?.type === "day" ? part.value.replace(/^,/, "") : part.value)).join("");
}
