import type { ReactNode } from "react";

/** A moment: a Date, an ISO 8601 string or epoch milliseconds. A date-only string such as "2026-10-12" is a calendar day. */
export type PassportMoment = Date | string | number;

/** One material of the product and how much of it there is. */
export interface PassportMaterial {
  /** What it is: "Organic cotton". */
  name: string;
  /** Its share of the product in percent: 80 is 80%. The shares are drawn in proportion, so they do not have to add up to 100 (see `other`). */
  share: number;
  /** One short line about it: "Certified organic, grown in Turkey". */
  note?: string;
}

/** Where the product was made. */
export interface PassportOrigin {
  /** The place, as it reads on the label: "Porto, Portugal". */
  place: string;
  /** The factory that made it. */
  factory?: string;
  /** The year it was made. */
  year?: number | string;
  /** A line more: "Cut and sewn in one workshop, 40 people". */
  note?: string;
}

/** A certification and the page that proves it. */
export interface PassportCertificate {
  /** The standard or label: "GOTS 7.0". */
  name: string;
  /** Who issued or audits it: "Control Union". */
  issuer?: string;
  /** The licence or certificate number, in the issuer's own form. */
  number?: string;
  /** Where the certificate can be checked. Every certificate is a link. */
  href: string;
}

/** One short line of care, repair or end-of-life advice. */
export interface PassportRow {
  /** What to do, in a few words: "Wash cold, 30 °C". */
  title: string;
  /** One line more: "Gentle cycle, with similar colours." */
  detail?: string;
  /** A drawing for the line. It is decorative: the words carry the meaning. Without one the section's own is used. */
  icon?: ReactNode;
  /** A page that helps: the repair booking, the return label. */
  href?: string;
  /** The words of that link. Defaults to the line's title. */
  linkLabel?: string;
}

/** The product's footprint: one figure and how it was worked out. */
export interface PassportFootprint {
  /** The figure with its unit: "8.4 kg CO₂e". */
  value: string;
  /** What it is for: "per jumper". */
  label?: string;
  /** How it was worked out, in one line: "Cradle to gate, Higg MSI 2026". */
  method?: string;
}

/** The sections that are in the accordion. */
export type PassportGroup = "care" | "repair" | "end-of-life";

export interface ProductPassportLabels {
  /** The small label above the heading when you gave one. */
  eyebrow?: string;
  /** The heading when you gave none. */
  title?: string;
  /** After the date of the last check. `{date}`. */
  updated?: string;
  /** The title of each section. */
  materials?: string;
  origin?: string;
  footprint?: string;
  certificates?: string;
  care?: string;
  repair?: string;
  endOfLife?: string;
  /** What a screen reader hears for the list under the bar. */
  materialsList?: string;
  /** The part of the bar that is not accounted for. */
  other?: string;
  /** The names of the facts about the origin. */
  factory?: string;
  year?: string;
  /** For a screen reader, after a link that opens a new tab. */
  newTab?: string;
}

export const WORDS = {
  eyebrow: "Product passport",
  title: "Product passport",
  updated: "Updated {date}",
  materials: "Materials",
  origin: "Origin",
  footprint: "Footprint",
  certificates: "Certifications",
  care: "Care",
  repair: "Repair",
  endOfLife: "End of life",
  materialsList: "Materials by share",
  other: "Other materials",
  factory: "Factory",
  year: "Made in",
  newTab: "opens in a new tab",
} satisfies Required<ProductPassportLabels>;

export const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** One part of the bar, with the tone it is drawn in. */
export interface PassportSegment {
  /** The material's name. */
  name: string;
  /** The line about it, if there is one. */
  note?: string;
  /** The share in percent, as given (or the remainder, for the part that is not accounted for). */
  share: number;
  /** An index into the tones. */
  tone: number;
  /** True for the remainder, which is drawn hatched and without a name of its own. */
  other: boolean;
}

/**
 * The bar's parts: the materials with a share above zero, in the order given, and, when they come to less than
 * 100%, one more part for what is left, so the bar never claims more than it knows. Shares above 100 in all are
 * drawn in proportion.
 */
export function segmentsOf(materials: readonly PassportMaterial[], otherName: string): PassportSegment[] {
  const parts: PassportSegment[] = materials
    .filter((material) => Number.isFinite(material.share) && material.share > 0)
    .map((material, tone) => ({ name: material.name, note: material.note, share: material.share, tone, other: false }));
  const total = parts.reduce((sum, part) => sum + part.share, 0);
  if (parts.length > 0 && total < 99.5) parts.push({ name: otherName, share: Math.round((100 - total) * 10) / 10, tone: parts.length, other: true });
  return parts;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** A zone name that would throw while rendering falls back to UTC. */
export function knownZone(timeZone: string): string {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

/** A date in words with its year. A date-only string is a calendar day and ignores the zone. Null when it is not a date. */
export function dateText(moment: PassportMoment, locale: string, timeZone: string): string | null {
  const instant = new Date(moment);
  if (Number.isNaN(instant.getTime())) return null;
  const zone = typeof moment === "string" && DATE_ONLY.test(moment) ? "UTC" : knownZone(timeZone);
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: zone }).format(instant);
}

/** A moment as it goes into a `<time>` element: a plain date stays a plain date, anything else becomes an ISO date-time. */
export function isoOf(moment: PassportMoment): string | null {
  if (typeof moment === "string" && DATE_ONLY.test(moment)) return moment;
  const instant = new Date(moment);
  return Number.isNaN(instant.getTime()) ? null : instant.toISOString();
}
