/** How often a payment falls due. */
export type InstallmentInterval = "week" | "two-weeks" | "month";

/** A moment: a Date, an ISO 8601 string or epoch milliseconds. */
export type InstallmentMoment = Date | string | number;

/** What paying in parts comes to, in minor units. */
export interface InstallmentPlan {
  /** Every payment in order. They always add up to `total`, with any remainder on the first. */
  payments: readonly number[];
  /** The price plus the fee. */
  total: number;
  /** The first payment. */
  first: number;
  /** Every payment after the first. */
  regular: number;
  /** True when the first payment is larger than the rest, because the total did not divide evenly. */
  uneven: boolean;
}

/**
 * Splits a price into equal parts, in minor units, so the parts always add up to exactly the price: 14999 in
 * four is 3752, 3749, 3749 and 3749. The remainder goes on the first payment. A fee is part of what is paid
 * and is split the same way. Null when the numbers cannot make a plan: the price must be above zero and there
 * must be at least two parts.
 */
export function planInstallments(price: number, parts: number, fee = 0): InstallmentPlan | null {
  if (!Number.isSafeInteger(price) || !Number.isSafeInteger(parts) || !Number.isSafeInteger(fee) || price <= 0 || parts < 2 || fee < 0) return null;
  const total = price + fee;
  const regular = Math.floor(total / parts);
  if (regular < 1) return null;
  const first = total - regular * (parts - 1);
  return { payments: [first, ...Array.from({ length: parts - 1 }, () => regular)], total, first, regular, uneven: first !== regular };
}

/** The unit and the number of units between today and a payment: the third payment of a monthly plan is 2 months away. */
export function offsetOf(interval: InstallmentInterval, index: number): { unit: "week" | "month"; value: number } {
  if (interval === "month") return { unit: "month", value: index };
  return { unit: "week", value: index * (interval === "two-weeks" ? 2 : 1) };
}

const DAY = 86_400_000;

/** The calendar day a moment falls on in a zone, as a UTC date at midnight, so it can be moved and written without the zone getting in the way. */
function calendarDay(moment: InstallmentMoment, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date(moment));
  const pick = (type: string): number => Number(parts.find((part) => part.type === type)?.value);
  return new Date(Date.UTC(pick("year"), pick("month") - 1, pick("day")));
}

/** A zone name that would throw while rendering falls back to UTC. */
export function knownZone(timeZone: string): string {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

/**
 * The days the payments fall due, as UTC midnights: the first is the day of `from` in the zone, and a monthly
 * plan keeps the day of the month where it can (31 January, then 28 or 29 February, then 31 March).
 */
export function paymentDays(from: InstallmentMoment, timeZone: string, interval: InstallmentInterval, parts: number): Date[] {
  const start = calendarDay(from, knownZone(timeZone));
  return Array.from({ length: parts }, (_, index) => {
    const { unit, value } = offsetOf(interval, index);
    if (unit === "week") return new Date(start.getTime() + value * 7 * DAY);
    const month = start.getUTCMonth() + value;
    const year = start.getUTCFullYear() + Math.floor(month / 12);
    const target = ((month % 12) + 12) % 12;
    const last = new Date(Date.UTC(year, target + 1, 0)).getUTCDate();
    return new Date(Date.UTC(year, target, Math.min(start.getUTCDate(), last)));
  });
}
