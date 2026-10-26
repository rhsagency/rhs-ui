import type { ReactNode } from "react";

/** A moment: a Date, an ISO 8601 string or epoch milliseconds. A date-only string such as "2026-11-06" is a calendar day. */
export type CreditMoment = Date | string | number;

/** The next invoice that has to be paid. */
export interface CreditDue {
  /** The day it is due. */
  date: CreditMoment;
  /** What it comes to, in minor units. */
  amount?: number;
}

/** What is overdue. The line only exists while something is. */
export interface CreditOverdue {
  /** The sum of the invoices that are late, in minor units. */
  amount: number;
  /** How many invoices that is. */
  count?: number;
  /** The due date of the oldest of them. */
  since?: CreditMoment;
}

/** Why the account cannot order, and who can help. */
export interface CreditBlock {
  /** In words: "Two invoices are more than 30 days late." */
  reason: string;
  /** Who to call or write to, as text or a link: "Call Marta at Northwind Trade on +31 20 555 0187". */
  contact?: ReactNode;
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

/** The day in words: "Fri 6 November", or with the year and the weekday in full for a tooltip. A date-only string is a calendar day and ignores the zone. Null when it is not a date. */
export function dayWords(moment: CreditMoment, locale: string, timeZone: string, long = false): string | null {
  const instant = new Date(moment);
  if (Number.isNaN(instant.getTime())) return null;
  const zone = typeof moment === "string" && DATE_ONLY.test(moment) ? "UTC" : knownZone(timeZone);
  return new Intl.DateTimeFormat(locale, { weekday: long ? "long" : "short", day: "numeric", month: "long", ...(long ? { year: "numeric" } : {}), timeZone: zone }).format(instant);
}

/** A moment as it goes into a `<time>` element: a plain date stays a plain date, anything else becomes an ISO date-time. Null when it is not a date. */
export function isoOf(moment: CreditMoment): string | null {
  if (typeof moment === "string" && DATE_ONLY.test(moment)) return moment;
  const instant = new Date(moment);
  return Number.isNaN(instant.getTime()) ? null : instant.toISOString();
}

/** How much of the limit is used, as a whole percentage. A limit of nothing counts as used up. */
export function percentUsed(used: number, limit: number): number {
  if (!(limit > 0)) return 100;
  return Math.max(0, Math.round((used / limit) * 100));
}
