/** A moment: a Date, an ISO 8601 string or epoch milliseconds. A date-only string such as "2026-10-12" is a calendar day. */
export type ReviewMoment = Date | string | number;

/** A delivered product that has not been reviewed. */
export interface ReviewItem {
  /** Identity of the product (or of the order line) in your shop: it is what the callbacks receive. */
  id: string;
  /** What it is called: "Linen bib apron". */
  name: string;
  /** The variant, size or colour, on a second line: "Stone, M". */
  variant?: string;
  /** A picture: a URL or a data URI. Without one the line shows a parcel. */
  image?: string;
  /** The product page. The name becomes a link. */
  href?: string;
  /** When it was delivered: an ISO date or date-time. */
  deliveredAt: ReviewMoment;
  /** A rating the customer already gave somewhere else, such as an email or the app. The line starts as a thank-you and offers to add words. */
  rating?: number;
  /** Where "Write a review" goes, when the form is a page. Without it the link is a button that calls `onWrite`. */
  reviewHref?: string;
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

/** A date in words: "12 May", or with the year and the month in full for a tooltip. A date-only string is a calendar day and ignores the zone. Null when it is not a date. */
export function dateWords(moment: ReviewMoment, locale: string, timeZone: string, long = false): string | null {
  const instant = new Date(moment);
  if (Number.isNaN(instant.getTime())) return null;
  const zone = typeof moment === "string" && DATE_ONLY.test(moment) ? "UTC" : knownZone(timeZone);
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", ...(long ? { year: "numeric" } : {}), timeZone: zone }).format(instant);
}

/** A moment as it goes into a `<time>` element: a plain date stays a plain date, anything else becomes an ISO date-time. Null when it is not a date. */
export function isoOf(moment: ReviewMoment): string | null {
  if (typeof moment === "string" && DATE_ONLY.test(moment)) return moment;
  const instant = new Date(moment);
  return Number.isNaN(instant.getTime()) ? null : instant.toISOString();
}

/** A rating kept to a whole star between 1 and 5. */
export function wholeStars(value: number, max = 5): number {
  return Math.min(max, Math.max(1, Math.round(value)));
}
