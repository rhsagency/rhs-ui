/** A count for a tight space: "12.4K". A count under a thousand is written whole. */
export function compactCount(value: number, locale: string): string {
  return value >= 1000 ? new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value) : new Intl.NumberFormat(locale).format(value);
}

/** A count in full, for a screen reader: "12,431". */
export function fullCount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

/** A score with one decimal: "4.8". */
export function oneDecimal(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

/** How long a seller takes to answer, as the nearest promise worth making: 70 minutes becomes "2 hours". */
const STEPS = [
  { limit: 15, value: 15, unit: "minute" },
  { limit: 30, value: 30, unit: "minute" },
  { limit: 60, value: 1, unit: "hour" },
  { limit: 120, value: 2, unit: "hour" },
  { limit: 240, value: 4, unit: "hour" },
  { limit: 720, value: 12, unit: "hour" },
  { limit: 1440, value: 1, unit: "day" },
  { limit: 2880, value: 2, unit: "day" },
  { limit: 4320, value: 3, unit: "day" },
] as const;

export interface ReplyTime {
  /** The promise, written out: "2 hours", "1 day". */
  text: string;
  /** True when the seller is slower than the last step, so it is "more than 3 days" and not "within 3 days". */
  over: boolean;
}

/** The reply time as a length of time in words, rounded up to the next step. */
export function replyTime(minutes: number, locale: string): ReplyTime | undefined {
  if (!Number.isFinite(minutes) || minutes < 0) return undefined;
  const step = STEPS.find((candidate) => minutes <= candidate.limit);
  const last = STEPS[STEPS.length - 1];
  const chosen = step ?? last;
  if (!chosen) return undefined;
  return { text: new Intl.NumberFormat(locale, { style: "unit", unit: chosen.unit, unitDisplay: "long" }).format(chosen.value), over: step === undefined };
}

/**
 * The month and year a seller joined: "Mar 2021". A bare date such as "2021-03-14" is a calendar day, so it reads as
 * that month in every time zone; a date-time is read in `timeZone`.
 */
export function joinedOn(value: string, locale: string, timeZone = "UTC"): string | undefined {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const bare = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Intl.DateTimeFormat(locale, { month: "short", year: "numeric", timeZone: bare ? "UTC" : timeZone }).format(date);
}
