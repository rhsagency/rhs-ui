/** A moment: milliseconds since the epoch, an ISO date-time such as "2026-10-20T09:30:00Z", a bare date such as "2026-10-20", or a Date. */
export type RefundMoment = number | string | Date;

/** The four steps of a refund, in the order they happen. */
export type RefundStepId = "requested" | "received" | "approved" | "paid";

export const STEP_ORDER: readonly RefundStepId[] = ["requested", "received", "approved", "paid"];

/** Where one step stands. */
export type StepState = "done" | "current" | "pending" | "failed";

const DAY = 86_400_000;

const isBareDate = (moment: RefundMoment): moment is string => typeof moment === "string" && /^\d{4}-\d{2}-\d{2}$/.test(moment);

/** A moment as milliseconds. Anything that is not a moment comes back as NaN. */
export function toMillis(moment: RefundMoment): number {
  return moment instanceof Date ? moment.getTime() : typeof moment === "number" ? moment : Date.parse(moment);
}

/** The furthest step that has a date, as an index into STEP_ORDER, or -1 when none has. */
export function reachedIndex(steps: Partial<Record<RefundStepId, RefundMoment>>): number {
  let reached = -1;
  STEP_ORDER.forEach((id, index) => {
    const moment = steps[id];
    if (moment !== undefined && Number.isFinite(toMillis(moment))) reached = index;
  });
  return reached;
}

/** The step a failed refund stopped at: the one after the last that was reached, and never past the last. */
export function failedIndexOf(reached: number): number {
  return Math.min(Math.max(reached + 1, 0), STEP_ORDER.length - 1);
}

/** The state of one step. Steps before the furthest one are done even if nobody wrote down when. A failed refund has stopped at its step: everything before it is done and that step is the one that matters. */
export function stateOf(index: number, reached: number, failedAt?: number): StepState {
  if (failedAt !== undefined) return index < failedAt ? "done" : index === failedAt ? "failed" : "pending";
  if (index < reached) return "done";
  return index === reached ? "current" : "pending";
}

/** Whether the money should have arrived by now. A bare date counts to the end of that day. Without a `now` nothing is late. */
export function isLate(expectedBy: RefundMoment, now: RefundMoment | undefined): boolean {
  if (now === undefined) return false;
  const limit = isBareDate(expectedBy) ? Date.parse(expectedBy) + DAY : toMillis(expectedBy);
  const present = toMillis(now);
  return Number.isFinite(limit) && Number.isFinite(present) && present > limit;
}

/**
 * A day written out. A bare date such as "2026-10-24" is a calendar day, so it reads as that day in every time zone;
 * a date-time is read in `timeZone`. Something that is not a date comes back as written.
 */
export function writeDay(moment: RefundMoment, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): { text: string; iso: string | undefined } {
  const millis = toMillis(moment);
  if (!Number.isFinite(millis)) return { text: String(moment), iso: undefined };
  const text = new Intl.DateTimeFormat(locale, { ...options, timeZone: isBareDate(moment) ? "UTC" : timeZone }).format(millis);
  return { text, iso: isBareDate(moment) ? moment : new Date(millis).toISOString() };
}
