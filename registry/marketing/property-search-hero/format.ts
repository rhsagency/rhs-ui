/**
 * The words and numbers behind PropertySearchHero, as plain functions: they
 * hold no state and call no hook, so a Server Component can use them too.
 * Every function takes the locale, so the same input gives the same text on
 * the server and in the browser.
 */

/** The words the hero says. `{mode}`, `{price}` and `{count}` are filled in. */
export interface PropertySearchHeroLabels {
  /** Names the Buy, Rent and Sold tabs for assistive technology. */
  mode: string;
  /** Names the search form for assistive technology. */
  form: string;
  /** The label over the place. */
  where: string;
  /** The name of the list of places, for assistive technology. */
  place: string;
  /** The place field when nothing is chosen, and the first option in the list: the search is not limited to a place. */
  anywhere: string;
  /** The second line under that first option. */
  anywhereHint: string;
  /** The placeholder of the search inside the list of places. */
  searchPlaces: string;
  /** What the list says when no place matches. */
  noPlace: string;
  /** The label over the price when the mode has no `priceLabel` of its own. */
  price: string;
  /** The name of the lowest price, for assistive technology. */
  minPrice: string;
  /** The name of the highest price, for assistive technology. */
  maxPrice: string;
  /** The lowest price field when nothing is chosen, and its first option. */
  noMin: string;
  /** The highest price field when nothing is chosen, and its first option. */
  noMax: string;
  /** The label over the bedrooms. */
  bedrooms: string;
  /** The bedrooms field when nothing is chosen, and its first option. */
  anyBedrooms: string;
  /** An option of the bedrooms: "2+". */
  bedsAtLeast: string;
  /** The button with a place chosen. */
  search: string;
  /** The button with no place chosen: it still searches. */
  searchEverywhere: string;
  /** The words in front of the popular places. */
  popular: string;
  /** The count of listings behind a popular place, said to screen readers after its name. */
  listings: { one: string; other: string };
  /** What is announced when the tab changes. `{price}` is the name of the price in the new mode: "Rent per month". */
  modeChanged: string;
  /** Added to that announcement when the chosen prices do not exist in the new mode and were cleared. */
  priceReset: string;
}

export const LABELS: PropertySearchHeroLabels = {
  mode: "What are you looking for",
  form: "Search homes",
  where: "Where",
  place: "Place",
  anywhere: "Anywhere",
  anywhereHint: "Do not limit the search to a place",
  searchPlaces: "Search places",
  noPlace: "No place matches that.",
  price: "Price",
  minPrice: "Lowest price",
  maxPrice: "Highest price",
  noMin: "No min",
  noMax: "No max",
  bedrooms: "Bedrooms",
  anyBedrooms: "Any",
  bedsAtLeast: "{count}+",
  search: "Search",
  searchEverywhere: "Search everywhere",
  popular: "Popular places",
  listings: { one: "{count} listing", other: "{count} listings" },
  modeChanged: "{mode} selected. {price} range updated.",
  priceReset: "Your earlier prices were cleared.",
};

/** "{count}" and friends in a template, filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

/**
 * A price in whole units of the currency and locale you name, with no cents
 * ("€250,000"). A currency code Intl does not know is written next to the
 * number instead of taking the page down. Intl writes some spaces as no-break
 * spaces; a plain space looks the same and every engine agrees on it.
 */
export function moneyText(value: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(value).replace(/\s/g, " ");
  } catch {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)} ${currency}`;
  }
}

/** A count with the locale's separators: "2,314". */
export function countText(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

/** The words for this many: the singular form for exactly one, the plural for anything else (the locale decides what counts as one). */
export function plural(forms: { one: string; other: string }, count: number, locale: string): string {
  return new Intl.PluralRules(locale).select(count) === "one" ? forms.one : forms.other;
}
