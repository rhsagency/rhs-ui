/** A moment: a Date, an ISO 8601 string or epoch milliseconds. A date-only string such as "2026-10-05" is a calendar day. */
export type ReorderMoment = Date | string | number;

/** A product the customer has bought before. */
export interface ReorderItem {
  /** Identity of the product in your shop: it is what `onAdd` receives. */
  id: string;
  /** What it is called: "Espresso beans". */
  name: string;
  /** The variant, size or pack, on a second line: "Whole bean, 1 kg". */
  variant?: string;
  /** A picture: a URL or a data URI. Without one the line shows a parcel. */
  image?: string;
  /** The product page. The name becomes a link. */
  href?: string;
  /** The price of one unit, in minor units: 1450 is 14.50. */
  price: number;
  /** What the price is for, after it: "each", "per kg". Defaults to the label `each`. */
  per?: string;
  /** When it was last ordered: an ISO date or date-time. */
  lastOrderedAt: ReorderMoment;
  /** How many were bought then. The quantity starts there. Defaults to 1. */
  lastQuantity?: number;
  /** The most that can be ordered at once. */
  max?: number;
  /** Set when the product cannot be bought right now, and say why in words: "Out of stock until 3 November". The line stays in the list, switched off. */
  unavailable?: string;
}

/** One line that goes to the bag. */
export interface ReorderLine {
  /** The product's id. */
  id: string;
  /** How many to add. */
  quantity: number;
  /** The price of one unit, in minor units. */
  price: number;
  /** quantity times price, in minor units. */
  total: number;
}

const DAY = 86_400_000;
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

/**
 * The calendar day a moment falls on in a zone, as a UTC midnight, so days can be counted and written without the
 * zone getting in the way. A date-only string already is a calendar day. Null when the moment is not a date.
 */
export function calendarDay(moment: ReorderMoment, timeZone: string): Date | null {
  if (typeof moment === "string") {
    const plain = DATE_ONLY.exec(moment);
    if (plain) return new Date(Date.UTC(Number(plain[1]), Number(plain[2]) - 1, Number(plain[3])));
  }
  const instant = new Date(moment);
  if (Number.isNaN(instant.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: knownZone(timeZone), year: "numeric", month: "numeric", day: "numeric" }).formatToParts(instant);
  const pick = (type: string): number => Number(parts.find((part) => part.type === type)?.value);
  return new Date(Date.UTC(pick("year"), pick("month") - 1, pick("day")));
}

/** Whole calendar days from one moment to another in a zone. Null when either is not a date. */
export function daysBetween(from: ReorderMoment, to: ReorderMoment, timeZone: string): number | null {
  const start = calendarDay(from, timeZone);
  const end = calendarDay(to, timeZone);
  return start && end ? Math.round((end.getTime() - start.getTime()) / DAY) : null;
}

/**
 * How long ago, in the reader's words: today, yesterday, 4 days ago, last week, 3 weeks ago, 2 months ago,
 * last year. Whole days under a week, then weeks up to two months, then months, then years.
 */
export function agoText(days: number, locale: string): string {
  const words = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const past = Math.max(0, Math.floor(days));
  if (past < 7) return words.format(-past, "day");
  if (past < 60) return words.format(-Math.floor(past / 7), "week");
  if (past < 365) return words.format(-Math.round(past / 30.44), "month");
  return words.format(-Math.floor(past / 365), "year");
}

/** A date in words with its year, for before the clock is known and for the tooltip. A date-only string is a calendar day and ignores the zone. */
export function dateText(moment: ReorderMoment, locale: string, timeZone: string, long = false): string | null {
  const instant = new Date(moment);
  if (Number.isNaN(instant.getTime())) return null;
  const zone = typeof moment === "string" && DATE_ONLY.test(moment) ? "UTC" : knownZone(timeZone);
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: long ? "long" : "short", year: "numeric", timeZone: zone }).format(instant);
}

/** A moment as it goes into a `<time>` element: a plain date stays a plain date, anything else becomes an ISO date-time. Null when it is not a date. */
export function isoOf(moment: ReorderMoment): string | null {
  if (typeof moment === "string" && DATE_ONLY.test(moment)) return moment;
  const instant = new Date(moment);
  return Number.isNaN(instant.getTime()) ? null : instant.toISOString();
}

/** The quantity a line starts on, kept inside what can be ordered. */
export function startQuantity(item: ReorderItem): number {
  const wanted = Math.max(1, Math.floor(item.lastQuantity ?? 1));
  return item.max !== undefined ? Math.max(1, Math.min(item.max, wanted)) : wanted;
}
