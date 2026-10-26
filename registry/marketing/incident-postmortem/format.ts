/** Time helpers of the postmortem. They hold no hooks, so a Server Component can use them. */

export interface DurationWords {
  day: string;
  hour: string;
  minute: string;
  underMinute: string;
}

/** The time of an ISO 8601 string in milliseconds, or null when it is not a time. */
export function timeOf(value: string): number | null {
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

/** A calendar day as an ISO date, in a time zone: "2026-10-14". Two times on the same day share it. */
export function dayKey(time: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).formatToParts(new Date(time));
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** "2 h 14 min", "45 min", "3 d 4 h": two units at most, so a duration is read at a glance. */
export function formatDuration(milliseconds: number, words: DurationWords, number: Intl.NumberFormat): string {
  const total = Math.max(0, Math.round(milliseconds / 60000));
  if (total < 1) return words.underMinute;
  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const minutes = total % 60;
  const parts: string[] = [];
  if (days) parts.push(`${number.format(days)} ${words.day}`);
  if (hours) parts.push(`${number.format(hours)} ${words.hour}`);
  // Past a day, minutes are noise.
  if (minutes && !days) parts.push(`${number.format(minutes)} ${words.minute}`);
  return parts.join(" ");
}

/** The anchor of a section: "timeline", or "inc-timeline" with a prefix. */
export function anchorOf(prefix: string | undefined, section: string): string {
  return prefix ? `${prefix}-${section}` : section;
}
