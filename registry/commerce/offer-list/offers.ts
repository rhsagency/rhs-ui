/** How worn a second-hand item is, from unused to heavily used. */
export type OfferCondition = "new" | "like-new" | "very-good" | "good" | "acceptable";

/** When an offer is expected to arrive: one day, or a stretch of days. */
export interface OfferDelivery {
  /** The earliest day, as an ISO date: "2026-11-05". A date with no time of day reads the same in every time zone. */
  from: string;
  /** The latest day, when it is a range. */
  to?: string;
}

export interface Offer {
  /** Identifies the offer. Keep it stable between renders. */
  id: string;
  /** Who is selling. */
  seller: string;
  /** The seller's average rating, from 0 to 5. */
  rating?: number;
  /** How many ratings the average rests on. */
  ratingCount?: number;
  condition: OfferCondition;
  /** What the item costs, in minor units: 1840 is 18.40. */
  price: number;
  /** What delivery costs, in minor units. 0 is free. */
  shipping: number;
  delivery: OfferDelivery;
  /** One line from the seller about this copy: "Dust jacket with a small crease". */
  note?: string;
}

export type OfferSortKey = "price" | "delivery" | "condition" | "rating";
export type OfferSortDirection = "ascending" | "descending";

export interface OfferSort {
  key: OfferSortKey;
  direction: OfferSortDirection;
}

export interface OfferListLabels {
  /** The heading. */
  title?: string;
  /** The line under the heading, for one offer. `{count}`. */
  summaryOne?: string;
  /** The line under the heading, for several offers. `{count}`. */
  summaryOther?: string;
  /** The column heads. The seller head sorts by the seller's rating, so it is named after it. */
  columns?: { seller?: string; condition?: string; delivery?: string; price?: string };
  /** The head of the column with the buttons, read out to a screen reader only. */
  actions?: string;
  /** The button. */
  add?: string;
  /** What a screen reader hears on a button: the name of the button, then which offer. `{action}`, `{seller}`, `{condition}` and `{total}`. */
  addNamed?: string;
  /** The button for a moment after an offer was added. */
  added?: string;
  /** Said once an offer is added. `{seller}`. */
  addedStatus?: string;
  /** The words on the cheapest offer. */
  bestPrice?: string;
  /** Under the price when shipping costs something. `{price}` and `{shipping}`. */
  breakdownPaid?: string;
  /** Under the price when shipping is free. `{price}`. */
  breakdownFree?: string;
  /** What a screen reader hears for a rating that does not say how many ratings it rests on. `{rating}`. */
  rated?: string;
  /** What a screen reader hears for a rating, for one rating. `{rating}` and `{count}`. */
  ratedOne?: string;
  /** What a screen reader hears for a rating, for several. `{rating}` and `{count}`. */
  ratedOther?: string;
  /** Joins the two ends of a delivery that takes several days. `{from}` and `{to}`: "Thu 5 Nov – Sat 7 Nov". */
  range?: string;
  /** What each condition is called and what it means. The meaning is the tooltip. */
  conditions?: Partial<Record<OfferCondition, { label?: string; hint?: string }>>;
  /** The label of the sort control on a phone. */
  sortBy?: string;
  /** What the sort control on a phone shows while no order is chosen and the offers are in the order you gave them. */
  defaultOrder?: string;
  /** Said after the order changes. `{order}`, one of `orders` below. */
  sorted?: string;
  /** How each order is called, in lower case: it follows "Sorted by" and, with a capital, fills the sort control. */
  orders?: Record<OfferSortKey, { ascending: string; descending: string }>;
  /** Where the table goes when there are no offers. */
  empty?: string;
}

export const WORDS = {
  title: "Other offers",
  summaryOne: "{count} offer. Prices include shipping.",
  summaryOther: "{count} offers. Prices include shipping.",
  columns: { seller: "Seller rating", condition: "Condition", delivery: "Delivery", price: "Price with shipping" },
  actions: "Add to cart",
  add: "Add to cart",
  addNamed: "{action}: {seller}, {condition}, {total}",
  added: "Added",
  addedStatus: "Added the offer from {seller} to your cart.",
  bestPrice: "Best price",
  breakdownPaid: "{price} + {shipping} shipping",
  breakdownFree: "{price} + free shipping",
  rated: "Rated {rating} out of 5",
  ratedOne: "Rated {rating} out of 5, from {count} rating",
  ratedOther: "Rated {rating} out of 5, from {count} ratings",
  conditions: {
    new: { label: "New", hint: "Unused and in its original packaging." },
    "like-new": { label: "Like new", hint: "Opened or used once. No marks, nothing missing." },
    "very-good": { label: "Very good", hint: "Light signs of use. Complete and fully working." },
    good: { label: "Good", hint: "Visible wear such as scuffs or creases. Complete and fully working." },
    acceptable: { label: "Acceptable", hint: "Heavy wear, but complete and fully working." },
  },
  range: "{from} – {to}",
  sortBy: "Sort by",
  defaultOrder: "Default order",
  sorted: "Sorted by {order}.",
  orders: {
    price: { ascending: "price, lowest first", descending: "price, highest first" },
    delivery: { ascending: "delivery, soonest first", descending: "delivery, latest first" },
    condition: { ascending: "condition, best first", descending: "condition, worst first" },
    rating: { ascending: "seller rating, lowest first", descending: "seller rating, highest first" },
  },
  empty: "There are no other offers for this product yet.",
} satisfies Required<Omit<OfferListLabels, "conditions" | "columns">> & { columns: Required<NonNullable<OfferListLabels["columns"]>>; conditions: Record<OfferCondition, { label: string; hint: string }> };

export const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** Conditions from the best to the worst. The place in this list is the rank, and it fills the dots. */
export const CONDITIONS: readonly OfferCondition[] = ["new", "like-new", "very-good", "good", "acceptable"];

/** The direction a column is sorted in the first time it is chosen: lowest, soonest, best, then the highest rated. */
export const FIRST_DIRECTION: Record<OfferSortKey, OfferSortDirection> = { price: "ascending", delivery: "ascending", condition: "ascending", rating: "descending" };

export const SORT_KEYS: readonly OfferSortKey[] = ["price", "delivery", "condition", "rating"];

/** What the shopper pays: the item and its shipping, in minor units. */
export const totalOf = (offer: Offer): number => offer.price + offer.shipping;

/** The cheapest total among the offers, or undefined when there are fewer than two offers to compare. */
export function bestTotalOf(offers: readonly Offer[]): number | undefined {
  return offers.length > 1 ? Math.min(...offers.map(totalOf)) : undefined;
}

const valueOf = (offer: Offer, key: OfferSortKey): number | null => {
  if (key === "price") return totalOf(offer);
  if (key === "condition") return CONDITIONS.indexOf(offer.condition);
  if (key === "rating") return offer.rating ?? null;
  const day = Date.parse(offer.delivery.from);
  return Number.isNaN(day) ? null : day;
};

/**
 * The offers in the order asked for. The sort is stable: offers that tie on the column are put cheapest first, and
 * then in the order they came in. An offer with nothing to compare (no rating) goes last whichever way the column runs.
 */
export function sortOffers(offers: readonly Offer[], sort: OfferSort | undefined): Offer[] {
  if (!sort) return [...offers];
  const sign = sort.direction === "ascending" ? 1 : -1;
  return offers
    .map((offer, index) => ({ offer, index }))
    .sort((a, b) => {
      const x = valueOf(a.offer, sort.key);
      const y = valueOf(b.offer, sort.key);
      if (x === null && y !== null) return 1;
      if (y === null && x !== null) return -1;
      if (x !== null && y !== null && x !== y) return (x - y) * sign;
      return totalOf(a.offer) - totalOf(b.offer) || a.index - b.index;
    })
    .map((entry) => entry.offer);
}

/** A date without a time of day: "2026-11-05". */
const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The delivery as people read it: "Thu 5 Nov", or "Thu 5 Nov – Sat 7 Nov". Both ends are formatted on their own and
 * joined with `range`, not with formatRange: engines disagree on the spaces it puts around the dash, and a server
 * and a browser that disagree make React throw the server's HTML away. A date-only day ("2026-11-05") is a calendar
 * day, not a moment, so it reads the same in every time zone; `timeZone` only places an end that carries a time of
 * day. It is always passed, so the day is the same on the server and in the browser.
 */
export function deliveryText(delivery: OfferDelivery, locale: string, timeZone: string, range: string = WORDS.range): string {
  const from = new Date(delivery.from);
  if (Number.isNaN(from.getTime())) return delivery.from;
  const options: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };
  let zoned: Intl.DateTimeFormat | undefined;
  let calendar: Intl.DateTimeFormat | undefined;
  // "2026-11-05" parses as midnight UTC. Read in New York that is the evening before, so a day is always read in UTC.
  const day = (iso: string, date: Date): string => {
    if (CALENDAR_DAY.test(iso)) return (calendar ??= new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" })).format(date);
    return (zoned ??= new Intl.DateTimeFormat(locale, { ...options, timeZone })).format(date);
  };
  const to = delivery.to ? new Date(delivery.to) : null;
  if (!delivery.to || !to || Number.isNaN(to.getTime()) || delivery.to === delivery.from) return day(delivery.from, from);
  return fill(range, { from: day(delivery.from, from), to: day(delivery.to, to) });
}

/** "price, lowest first" becomes "Price, lowest first". */
export const capitalise = (text: string, locale: string): string => text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
