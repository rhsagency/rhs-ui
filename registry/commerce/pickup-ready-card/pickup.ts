/** A moment: a Date, an ISO 8601 string or epoch milliseconds. A date-only string such as "2026-10-30" is a calendar day. */
export type PickupMoment = Date | string | number;

/** The shop the order waits in. */
export interface PickupStore {
  /** What the shop is called: "Northwind Utrecht". */
  name: string;
  /** The address, one line each: ["Oudegracht 112", "3511 AV Utrecht"]. */
  address: readonly string[];
  /** The number to call, as it should be written. It is also the contact line once the pickup window has ended. */
  phone?: string;
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A zone name that would throw while rendering falls back to UTC. */
export function knownZone(timeZone: string): string {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

/** The calendar day an instant falls on in a zone, as "2026-10-30". Null when it is not a date. */
function dayOf(moment: PickupMoment, timeZone: string): string | null {
  const instant = new Date(moment);
  if (Number.isNaN(instant.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: knownZone(timeZone), year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  const pick = (type: string): string => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

/**
 * Whether the pickup window is over. A date such as "2026-10-30" holds the order through the end of that day in the
 * shop's zone, so it is still open at 23:59 and over a minute later; a date-time holds it until that moment.
 * False when either moment is not a date, so a bad value never shuts a pickup that may still be open.
 */
export function hasEnded(heldUntil: PickupMoment, now: PickupMoment, timeZone: string): boolean {
  if (typeof heldUntil === "string" && DATE_ONLY.test(heldUntil)) {
    const today = dayOf(now, timeZone);
    return today !== null && today > heldUntil;
  }
  const until = new Date(heldUntil).getTime();
  const current = new Date(now).getTime();
  return Number.isFinite(until) && Number.isFinite(current) && current > until;
}

/** The day in words: "Fri 30 October", or with the year and the weekday in full for a tooltip. A date-only string is a calendar day and ignores the zone. Null when it is not a date. */
export function dayWords(moment: PickupMoment, locale: string, timeZone: string, long = false): string | null {
  const instant = new Date(moment);
  if (Number.isNaN(instant.getTime())) return null;
  const zone = typeof moment === "string" && DATE_ONLY.test(moment) ? "UTC" : knownZone(timeZone);
  return new Intl.DateTimeFormat(locale, { weekday: long ? "long" : "short", day: "numeric", month: "long", ...(long ? { year: "numeric" } : {}), timeZone: zone }).format(instant);
}

/** A moment as it goes into a `<time>` element: a plain date stays a plain date, anything else becomes an ISO date-time. Null when it is not a date. */
export function isoOf(moment: PickupMoment): string | null {
  if (typeof moment === "string" && DATE_ONLY.test(moment)) return moment;
  const instant = new Date(moment);
  return Number.isNaN(instant.getTime()) ? null : instant.toISOString();
}

/** A code read out one character at a time, so a screen reader does not try to pronounce it: "K, 7, M, 4, Q, 2". */
export function spelledOut(code: string): string {
  return [...code].filter((char) => /[\p{L}\p{N}]/u.test(char)).join(", ");
}
