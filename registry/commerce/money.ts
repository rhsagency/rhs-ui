/** Money as it travels through the commerce items: an amount in minor units plus its currency. */
export interface Money {
  /** In minor units: 3900 is 39.00. Integers, so sums never drift. */
  amount: number;
  currency: string;
}

/**
 * Formats money for the reader's locale. Node and the browser can differ in
 * their number data, so text rendered with it carries suppressHydrationWarning.
 */
export function formatMoney(money: Money, locale = "en-GB"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: money.currency }).format(money.amount / 100);
}
