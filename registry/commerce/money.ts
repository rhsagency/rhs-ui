/** Money as it travels through the commerce items: an amount in minor units plus its currency. */
export interface Money {
  /** In minor units: 3900 is 39.00. Integers, so sums never drift. */
  amount: number;
  /** ISO 4217 code: "EUR", "USD", "GBP". */
  currency: string;
}

/**
 * Formats money for a locale. The locale is always passed, so the server and
 * the browser render the same text and hydration never trips over it.
 */
export function formatMoney(money: Money, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: money.currency }).format(money.amount / 100);
}

/** Adds amounts of one currency; mixing currencies is a bug, so it throws. */
export function sumMoney(items: readonly Money[], currency: string): Money {
  return {
    currency,
    amount: items.reduce((total, item) => {
      if (item.currency !== currency) throw new Error(`sumMoney: ${item.currency} in a ${currency} sum`);
      return total + item.amount;
    }, 0),
  };
}

/** Multiplies a unit price by a quantity, in minor units. */
export function multiplyMoney(money: Money, quantity: number): Money {
  return { currency: money.currency, amount: Math.round(money.amount * quantity) };
}
