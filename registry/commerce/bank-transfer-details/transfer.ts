/** A moment: milliseconds since the epoch, an ISO date-time such as "2026-10-24T21:59:00Z", or a Date. */
export type TransferMoment = number | string | Date;

/** A moment as milliseconds. Anything that is not a moment comes back as NaN. */
export function toMillis(moment: TransferMoment): number {
  return moment instanceof Date ? moment.getTime() : typeof moment === "number" ? moment : Date.parse(moment);
}

/** An IBAN as a bank wants it: capitals, no spaces. This is what lands on the clipboard. */
export function compactIban(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

/** An IBAN as people read it: groups of four, "NL65 MRDN 0417 1643 00". */
export function groupIban(value: string): string {
  return compactIban(value).replace(/(.{4})(?=.)/g, "$1 ");
}

/** A BIC as a bank wants it: capitals, no spaces. */
export function compactBic(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

/**
 * The amount as a banking app takes it: no currency symbol, no thousands separator, two decimals and the
 * decimal mark of the locale. 129 euros is "129.00" in English and "129,00" in Dutch.
 */
export function plainAmount(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false }).format(amount / 100);
}

/** Whether the deadline has passed at `now`. Without a `now`, or with something that is not a date, nothing has lapsed. */
export function hasLapsed(deadline: TransferMoment, now: TransferMoment | undefined): boolean {
  if (now === undefined) return false;
  const limit = toMillis(deadline);
  const present = toMillis(now);
  return Number.isFinite(limit) && Number.isFinite(present) && present > limit;
}
