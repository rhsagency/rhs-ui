import type { StatusGlyph } from "@rhs-ui/application/status-message-field/glyphs";

/** How a clear time is reckoned: a number of minutes from now, or the end of the day or the week. */
export interface ClearOption {
  /** What is stored and reported as `clearAfter`. */
  id: string;
  /** What the select says: "1 hour". */
  label: string;
  /** Clear this many minutes from now. */
  minutes?: number;
  /** Clear at the end of today (midnight) or of this week (the coming Monday at midnight), in the time zone you pass. */
  until?: "today" | "week";
}

/** A ready-made status: the text, the icon by name and when it should clear. */
export interface StatusPreset {
  id: string;
  text: string;
  /** The name of an icon of the set (`calendar`, `target`, `palm-tree`...). */
  icon: StatusGlyph;
  /** The id of a clear option. */
  clearAfter: string;
}

export const DEFAULT_CLEAR_OPTIONS: readonly ClearOption[] = [
  { id: "never", label: "Don't clear" },
  { id: "30m", label: "30 minutes", minutes: 30 },
  { id: "1h", label: "1 hour", minutes: 60 },
  { id: "4h", label: "4 hours", minutes: 240 },
  { id: "today", label: "Today", until: "today" },
  { id: "week", label: "This week", until: "week" },
];

export const DEFAULT_PRESETS: readonly StatusPreset[] = [
  { id: "meeting", text: "In a meeting", icon: "calendar", clearAfter: "1h" },
  { id: "focus", text: "Focusing", icon: "target", clearAfter: "4h" },
  { id: "holiday", text: "On holiday", icon: "palm-tree", clearAfter: "week" },
  { id: "sick", text: "Out sick", icon: "thermometer", clearAfter: "today" },
  { id: "commute", text: "Commuting", icon: "car", clearAfter: "30m" },
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** The year, month, day, time and weekday a zone's clock shows at an instant. */
function clockIn(ms: number, timeZone: string) {
  const parts: Record<string, string> = {};
  const format = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric", weekday: "short" });
  for (const part of format.formatToParts(new Date(ms))) parts[part.type] = part.value;
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: Number(parts.hour) % 24, minute: Number(parts.minute), second: Number(parts.second), weekday: WEEKDAYS.indexOf(parts.weekday ?? "Mon") };
}

/** How far a zone's clock is ahead of UTC at an instant, in milliseconds. */
function offsetAt(ms: number, timeZone: string): number {
  const clock = clockIn(ms, timeZone);
  return Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute, clock.second) - Math.floor(ms / 1000) * 1000;
}

/** The instant when a zone's clock reads midnight on the given day. A second pass settles the hour a clock change moves. */
function midnightIn(year: number, month: number, day: number, timeZone: string): number {
  const guess = Date.UTC(year, month - 1, day);
  return guess - offsetAt(guess - offsetAt(guess, timeZone), timeZone);
}

/** When a status set at `now` clears, as an ISO timestamp, or null for a status that stays. */
export function resolveClear(option: ClearOption | undefined, now: number, timeZone: string): string | null {
  if (!option) return null;
  if (option.minutes !== undefined) return new Date(now + option.minutes * 60_000).toISOString();
  if (option.until === undefined) return null;
  const clock = clockIn(now, timeZone);
  // Tomorrow's midnight ends today; the coming Monday's midnight ends the week (Monday is 0 here).
  const days = option.until === "today" ? 1 : 7 - clock.weekday;
  return new Date(midnightIn(clock.year, clock.month, clock.day + days, timeZone)).toISOString();
}
