/**
 * The words and numbers behind DonationHero, as plain functions: they hold no
 * state and call no hook, so a Server Component can use them too. Every
 * function takes the locale, so the same input gives the same text on the
 * server and in the browser.
 */

/** The words the hero says. `{amount}`, `{minimum}`, `{raised}`, `{goal}`, `{count}` and `{percent}` are filled in. */
export interface DonationHeroLabels {
  /** Names the form for assistive technology. */
  form: string;
  /** Names the one-off or monthly choice for assistive technology. */
  frequency: string;
  /** The one-off option. */
  oneOff: string;
  /** The monthly option. */
  monthly: string;
  /** The heading over the amount chips. */
  chooseAmount: string;
  /** The label of the field for any other amount. */
  otherAmount: string;
  /** The small line over the amount on the picture. */
  yourGift: string;
  /** What the picture says before an amount is chosen. */
  impactEmpty: string;
  /** The name of the campaign bar when the campaign has no label of its own. */
  campaign: string;
  /** What the bar says in words, next to its name: "Raised so far  $41,200 of $60,000". */
  raised: string;
  /** The share of the goal, beside the donor count. */
  percentOfGoal: string;
  /** The donor count, singular and plural. */
  donors: { one: string; other: string };
  /** An amount of your own is under the minimum. */
  minimum: string;
  /** An amount of your own is zero or less. */
  positive: string;
  /** The live summary of a one-off gift. */
  summaryOneOff: string;
  /** The live summary of a monthly gift. */
  summaryMonthly: string;
  /** The live summary before there is an amount. */
  summaryEmpty: string;
  /** The button for a one-off gift. */
  giveOneOff: string;
  /** The button for a monthly gift. */
  giveMonthly: string;
  /** The button before there is an amount. It is disabled and says why. */
  giveEmpty: string;
}

export const LABELS: DonationHeroLabels = {
  form: "Make a donation",
  frequency: "How often",
  oneOff: "One-off",
  monthly: "Monthly",
  chooseAmount: "Choose an amount",
  otherAmount: "Other amount",
  yourGift: "Your gift",
  impactEmpty: "Choose an amount to see what it pays for.",
  campaign: "Raised so far",
  raised: "{raised} of {goal}",
  percentOfGoal: "{percent} of the goal",
  donors: { one: "{count} donor", other: "{count} donors" },
  minimum: "The minimum gift is {minimum}.",
  positive: "Enter an amount above zero.",
  summaryOneOff: "You give {amount} once",
  summaryMonthly: "You give {amount} every month",
  summaryEmpty: "Choose an amount to give",
  giveOneOff: "Give {amount} once",
  giveMonthly: "Give {amount} monthly",
  giveEmpty: "Choose an amount",
};

/** "{count}" and friends in a template, filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

/**
 * An amount in minor units (hundredths of the currency's unit) in the
 * currency and locale you name. A whole amount drops its cents ("$25"), one
 * with cents keeps both ("$12.50"). A currency code Intl does not know is
 * written next to the number instead of taking the page down. Intl writes some
 * spaces as no-break spaces; a plain space looks the same and every engine
 * agrees on it.
 */
export function moneyText(minor: number, currency: string, locale: string): string {
  const whole = minor % 100 === 0;
  const digits = whole ? 0 : 2;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(minor / 100).replace(/\s/g, " ");
  } catch {
    return `${new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(minor / 100)} ${currency}`;
  }
}

/** A count with the locale's separators: "1,284". */
export function countText(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

/** A share as a whole percent: "69%". */
export function percentText(share: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(share).replace(/\s/g, " ");
}

/** The words for this many: the singular form for exactly one, the plural for anything else (the locale decides what counts as one). */
export function plural(forms: { one: string; other: string }, count: number, locale: string): string {
  return new Intl.PluralRules(locale).select(count) === "one" ? forms.one : forms.other;
}
