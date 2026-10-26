/** A moment: milliseconds since the epoch, an ISO date-time such as "2026-10-20T12:31:00Z", or a Date. */
export type TicketMoment = number | string | Date;

/** How long a ticket has been waiting, in three steps. */
export type TicketLevel = "calm" | "slow" | "late";

export interface TicketThresholds {
  /** Minutes after which the ticket is running slow. Defaults to 8. */
  slow?: number;
  /** Minutes after which the ticket is late. Defaults to 12. */
  late?: number;
}

/** A moment as milliseconds. Anything that is not a moment comes back as NaN. */
export function toMillis(moment: TicketMoment): number {
  return moment instanceof Date ? moment.getTime() : typeof moment === "number" ? moment : Date.parse(moment);
}

/** Whole seconds from `from` to `to`, never negative, so a clock that runs a moment behind shows 0:00 and not -0:01. */
export function secondsBetween(from: TicketMoment, to: number): number {
  const start = toMillis(from);
  return Number.isFinite(start) && Number.isFinite(to) ? Math.max(0, Math.floor((to - start) / 1000)) : 0;
}

/** The two limits in seconds, with the slow limit never above the late one. */
export function limits(thresholds?: TicketThresholds): { slow: number; late: number } {
  const late = Math.max(0, (thresholds?.late ?? 12) * 60);
  return { slow: Math.min(late, Math.max(0, (thresholds?.slow ?? 8) * 60)), late };
}

/** Where a ticket stands after `seconds` of waiting. The limits themselves already count as the next step. */
export function levelOf(seconds: number, thresholds?: TicketThresholds): TicketLevel {
  const { slow, late } = limits(thresholds);
  return seconds >= late ? "late" : seconds >= slow ? "slow" : "calm";
}

const two = (value: number): string => String(value).padStart(2, "0");

/** A length of time as a kitchen clock: "8:42", and "1:04:09" once it passes the hour. */
export function formatElapsed(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = whole % 60;
  return hours > 0 ? `${hours}:${two(minutes)}:${two(rest)}` : `${minutes}:${two(rest)}`;
}

/** The same length as an ISO 8601 duration, for the `datetime` of a `<time>` element: "PT8M42S". */
export function durationOf(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `PT${Math.floor(whole / 3600)}H${Math.floor((whole % 3600) / 60)}M${whole % 60}S`;
}
