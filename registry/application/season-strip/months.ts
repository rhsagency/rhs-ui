/**
 * The months behind SeasonStrip, as plain functions: they hold no state and
 * call no hook, so a Server Component can use them too. Every function takes
 * the locale, and the ones that read a clock take the time zone, so the
 * server and the browser write the same text.
 */

/** How a month stands: the best time, a good one, out of season, or closed altogether. */
export type SeasonState = "best" | "good" | "off" | "closed";

/** One month: just its state, or its state with a note that opens in a tooltip. */
export type SeasonMonth = SeasonState | { state: SeasonState; note?: string };

/** A month of the strip, in the order it is drawn. */
export interface ResolvedMonth {
  /** 0 for January up to 11 for December. */
  index: number;
  state: SeasonState;
  note?: string;
}

const STATES: readonly string[] = ["best", "good", "off", "closed"];

/**
 * The twelve months in drawing order, starting at `firstMonth` (1 for
 * January up to 12). Missing entries and unknown states count as "off", so a
 * half-filled array still draws a whole strip.
 */
export function resolveMonths(months: readonly SeasonMonth[], firstMonth: number): ResolvedMonth[] {
  const start = Number.isFinite(firstMonth) ? Math.min(12, Math.max(1, Math.round(firstMonth))) - 1 : 0;
  return Array.from({ length: 12 }, (_, step) => {
    const index = (start + step) % 12;
    const entry = months[index];
    const state = typeof entry === "string" ? entry : entry?.state;
    const note = typeof entry === "object" && entry !== null ? entry.note?.trim() : undefined;
    const known = state !== undefined && STATES.includes(state);
    return { index, state: known ? state : "off", note: note ? note : undefined };
  });
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function monthFormatter(locale: string, style: "short" | "long"): Intl.DateTimeFormat {
  const key = `${locale}|${style}`;
  let found = formatters.get(key);
  if (!found) {
    try {
      found = new Intl.DateTimeFormat(locale, { month: style, timeZone: "UTC" });
    } catch {
      // An unknown locale must not take the page down.
      found = new Intl.DateTimeFormat("en-US", { month: style, timeZone: "UTC" });
    }
    formatters.set(key, found);
  }
  return found;
}

/** The name of a month in the locale: "Apr" or "April". */
export function monthName(index: number, locale: string, style: "short" | "long"): string {
  return monthFormatter(locale, style).format(Date.UTC(2026, index, 15));
}

/** Which month it is at a moment, in a time zone: 0 for January up to 11. An unknown zone is read as UTC. */
export function monthAt(at: number, timeZone: string): number {
  const read = (zone: string) => new Intl.DateTimeFormat("en-US", { month: "numeric", timeZone: zone }).formatToParts(at).find((part) => part.type === "month")?.value;
  let value: string | undefined;
  try {
    value = read(timeZone);
  } catch {
    value = read("UTC");
  }
  return Number(value) - 1;
}

/** Names in a sentence: "April, May and September" in the locale's own way of joining. */
export function joinNames(names: readonly string[], locale: string): string {
  try {
    return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(names);
  } catch {
    return names.join(", ");
  }
}
