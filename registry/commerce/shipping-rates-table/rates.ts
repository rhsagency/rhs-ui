/** How long a delivery takes, in working days: a number, a range from the fastest to the slowest, or a sentence of your own. */
export type ShippingDays = number | readonly [number, number] | string;

export interface ShippingMethod {
  /** "Standard", "Express", "Pick-up point". */
  name: string;
  /** The price in minor units: 495 is 4.95. 0 is free. */
  price: number;
  /** How long it takes, in working days. */
  days: ShippingDays;
  /** The order amount, in minor units, from which this method is free. Leave it out when it never is. */
  freeFrom?: number;
}

export interface ShippingZone {
  /** The name of the region: "Netherlands", "Benelux", "Rest of Europe". It is also the zone's identity. */
  region: string;
  /** The countries in it. They fill the country picker; without them the picker lists the regions. */
  countries?: readonly string[];
  /** What it costs to ship there, one entry per method. */
  methods: readonly ShippingMethod[];
}

export interface ShippingWords {
  /** "{count} working day" */
  daysOne: string;
  /** "{count} working days" */
  daysOther: string;
  /** "{from} to {to} working days" */
  daysRange: string;
}

/** The delivery time as people say it: "1 working day", "2 to 4 working days", or your own words. */
export function daysText(days: ShippingDays, locale: string, words: ShippingWords): string {
  if (typeof days === "string") return days;
  const numbers = new Intl.NumberFormat(locale);
  if (typeof days === "number") return (new Intl.PluralRules(locale).select(days) === "one" ? words.daysOne : words.daysOther).replace("{count}", numbers.format(days));
  const [from, to] = days;
  return from === to ? daysText(from, locale, words) : words.daysRange.replace("{from}", numbers.format(from)).replace("{to}", numbers.format(to));
}

/** The index of the zone a country, or failing that a region, belongs to. -1 when it is neither. */
export function zoneIndexOf(zones: readonly ShippingZone[], key: string | null | undefined): number {
  if (!key) return -1;
  const byCountry = zones.findIndex((zone) => zone.countries?.includes(key));
  return byCountry >= 0 ? byCountry : zones.findIndex((zone) => zone.region === key);
}
