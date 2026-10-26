/** A moment: a Date, an ISO 8601 string or epoch milliseconds. A date-only string such as "2026-10-26" is a calendar day. */
export type PlanMoment = Date | string | number;

/** One way to pay: in full, or in parts. */
export interface PaymentPlan {
  /** Identity of the plan: it is what `value` and `onValueChange` carry. */
  id: string;
  /** How many payments. 1 is paying in full. */
  payments: number;
  /** One regular payment, in minor units: 33333 is 333.33. */
  amount: number;
  /** Everything the plan costs, in minor units, interest and fees included. When it is not `payments` times `amount`, the first payment takes the difference. */
  total: number;
  /** The annual percentage rate, as a percentage: 9.9 for 9.9%. Leave it out, or use 0, for a plan without interest. */
  apr?: number;
  /** Whether the first payment is taken today. Defaults to true; with false the first payment is a month from today. */
  firstPaymentToday?: boolean;
  /** The plan's name when "3 payments" is not what you call it. */
  label?: string;
}

export interface PaymentPlanPickerLabels {
  /** The heading. */
  title?: string;
  /** Under it. `{total}` is the price of the order. */
  description?: string;
  /** What a screen reader hears for the group of plans. */
  group?: string;
  /** The name of a plan with one payment, and of the others. `{count}`. */
  payInFull?: string;
  payments?: string;
  /** Under a plan's name. */
  oneToday?: string;
  firstToday?: string;
  firstLater?: string;
  /** Under the amount of a plan. */
  perPayment?: string;
  /** Under the amount of the plan with one payment. */
  today?: string;
  /** The total on a plan. `{total}`. With interest: `{total}` and `{interest}`. */
  totalLine?: string;
  totalInterestLine?: string;
  /** The badge of a plan: without interest, with interest and with a known rate. `{apr}`. */
  noInterest?: string;
  interestApplies?: string;
  apr?: string;
  /** The schedule: its title, its summary and the words for a date that is not known yet. */
  scheduleTitle?: string;
  scheduleSummary?: string;
  scheduleSummaryLater?: string;
  scheduleToday?: string;
  /** The line under the schedule when the first payment is not the same as the others: when only the cents differ, because the total does not divide evenly, and when the first is another amount on purpose. `{first}` and `{regular}`. */
  firstRounded?: string;
  firstDiffers?: string;
  /** The rows under the schedule. */
  summaryTotal?: string;
  summaryInterest?: string;
  summaryApr?: string;
  none?: string;
  /** The button, when you gave `onContinue`. */
  continue?: string;
  /** What a screen reader hears when the plan changes. `{plan}`, `{amount}` and `{total}`. */
  status?: string;
  statusFull?: string;
}

export const WORDS = {
  title: "Choose how to pay",
  description: "Your order comes to {total}. Pay it in one go, or spread it over equal payments.",
  group: "Payment plan",
  payInFull: "Pay in full",
  payments: "{count} payments",
  oneToday: "One payment, today",
  firstToday: "The first one today, then every month",
  firstLater: "The first one in a month, then every month",
  perPayment: "per payment",
  today: "today",
  totalLine: "Total {total}",
  totalInterestLine: "Total {total}, with {interest} interest",
  noInterest: "No interest",
  interestApplies: "Interest applies",
  apr: "{apr}% APR",
  scheduleTitle: "Your payments",
  scheduleSummary: "{count} payments, every month",
  scheduleSummaryLater: "{count} payments, the first in a month",
  scheduleToday: "Today",
  firstRounded: "The first payment is {first} because the cents do not divide evenly. The others are {regular}.",
  firstDiffers: "The first payment is {first}. The others are {regular}.",
  summaryTotal: "Total you pay",
  summaryInterest: "Of which interest",
  summaryApr: "Representative APR",
  none: "None",
  continue: "Continue with this plan",
  status: "{plan} chosen: {amount} per payment, {total} in total.",
  statusFull: "{plan} chosen: {total} today.",
} satisfies Required<PaymentPlanPickerLabels>;

export const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const two = (value: number): string => String(value).padStart(2, "0");

/** A zone name that would throw while rendering falls back to UTC. */
export function knownZone(timeZone: string): string {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

/** The calendar day a moment falls on in a zone, as yyyy-mm-dd. A date-only string already is a calendar day. Null when the moment is not a date. */
export function todayIn(moment: PlanMoment, timeZone: string): string | null {
  if (typeof moment === "string" && DAY.test(moment)) return moment;
  const instant = new Date(moment);
  if (Number.isNaN(instant.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: knownZone(timeZone), year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  const pick = (type: string): string => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

/** The same day some months later, or the last day of that month when it is shorter (31 January plus a month is 28 February). */
export function addMonths(iso: string, months: number): string | null {
  const found = DAY.exec(iso);
  if (!found) return null;
  const year = Number(found[1]);
  const month = Number(found[2]);
  const day = Number(found[3]);
  const index = year * 12 + (month - 1) + Math.trunc(months);
  const nextYear = Math.floor(index / 12);
  const nextMonth = (index % 12) + 1;
  const last = new Date(Date.UTC(nextYear, nextMonth, 0)).getUTCDate();
  return `${String(nextYear).padStart(4, "0")}-${two(nextMonth)}-${two(Math.min(day, last))}`;
}

/** A calendar day in words with its year: "26 November 2026". A day has no time zone, so it is written in UTC. */
export function dayText(iso: string, locale: string): string {
  const found = DAY.exec(iso);
  if (!found) return iso;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(Number(found[1]), Number(found[2]) - 1, Number(found[3]))));
}

/** The words for a payment when the calendar day is not known yet: "In 1 month", "In 2 months". */
export function monthsAheadText(months: number, locale: string): string {
  const text = new Intl.RelativeTimeFormat(locale, { numeric: "always" }).format(months, "month");
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

/** How many payments a plan has: a whole number of at least one. */
export function countOf(plan: PaymentPlan): number {
  return Number.isFinite(plan.payments) ? Math.max(1, Math.round(plan.payments)) : 1;
}

/**
 * What each payment is, in minor units, in the order they are taken. They always add up to the plan's total: the
 * regular amount is paid every time but the first, which takes what is left, so a price that does not divide evenly
 * is never short or over by a cent.
 */
export function amountsOf(plan: PaymentPlan): number[] {
  const count = countOf(plan);
  if (count === 1) return [plan.total];
  const rest = plan.amount * (count - 1);
  const first = plan.total - rest;
  if (plan.amount > 0 && first > 0) return [first, ...Array.from({ length: count - 1 }, () => plan.amount)];
  const even = Math.floor(plan.total / count);
  return [plan.total - even * (count - 1), ...Array.from({ length: count - 1 }, () => even)];
}

/** What the plan costs on top of the price, in minor units. Never below zero. */
export function interestOf(plan: PaymentPlan, price: number): number {
  return Math.max(0, plan.total - price);
}

/** The months from today to each payment: 0, 1, 2 for a plan that starts today, 1, 2, 3 for one that starts in a month. */
export function monthsOf(plan: PaymentPlan): number[] {
  const offset = plan.firstPaymentToday === false ? 1 : 0;
  return Array.from({ length: countOf(plan) }, (_, index) => index + offset);
}
