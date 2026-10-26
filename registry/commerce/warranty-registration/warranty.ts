/** A moment: a Date, an ISO 8601 string or epoch milliseconds. A date-only string such as "2026-10-05" is a calendar day. */
export type WarrantyMoment = Date | string | number;

/** The product that is being registered. */
export interface WarrantyProduct {
  /** What it is called: "Halcyon Aria air purifier". */
  name: string;
  /** The model or article number, as it is printed: "HX-200". It is written on a second line as "Model HX-200" and on the confirmation. */
  model?: string;
  /** A picture: a URL or a data URI. It is decorative, the name sits beside it. */
  image?: string;
}

/** What the customer filled in. It is what `onSubmit` receives. */
export interface WarrantyValues {
  /** The product's name: the one you passed, or what the customer typed when you passed none. */
  product: string;
  /** The serial number, trimmed and in capitals. */
  serial: string;
  /** The day it was bought, as yyyy-mm-dd. */
  purchaseDate: string;
  /** The shop's name, or the number of the order. */
  store: string;
  /** The receipt or invoice, or null when none was attached. */
  proof: File | null;
  /** True once the consent line was ticked: the form cannot be sent without it. */
  consent: boolean;
  /** The last day of the cover as yyyy-mm-dd: the purchase date plus `warrantyMonths`. */
  coveredUntil: string;
}

/** What `onSubmit` may hand back besides an error message: the reference of the registration, shown on the confirmation. */
export interface WarrantyReceipt {
  /** The registration's own number, as the shop's system knows it. */
  reference?: string;
}

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const two = (value: number): string => String(value).padStart(2, "0");

/** A zone name that would throw while rendering falls back to UTC. */
export function knownZone(timeZone: string): string {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

/** The parts of a calendar day written yyyy-mm-dd, or null when it is not a real day (31 February). */
export function parseDay(iso: string): [year: number, month: number, day: number] | null {
  const found = DAY.exec(iso);
  if (!found) return null;
  const year = Number(found[1]);
  const month = Number(found[2]);
  const day = Number(found[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day ? [year, month, day] : null;
}

/** A calendar day as yyyy-mm-dd. */
export function isoOfParts(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${two(month)}-${two(day)}`;
}

/** The calendar day a Date shows on the reader's own wall clock, which is what a calendar picker hands back. */
export function isoOfDate(date: Date): string {
  return isoOfParts(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** A calendar day as a Date at local midnight, which is what a calendar picker takes. Null for something that is not a day. */
export function dateOfIso(iso: string): Date | null {
  const parts = parseDay(iso);
  return parts ? new Date(parts[0], parts[1] - 1, parts[2]) : null;
}

/** The same day some months later, or the last day of that month when it is shorter (31 January plus a month is 28 February). */
export function addMonths(iso: string, months: number): string | null {
  const parts = parseDay(iso);
  if (!parts) return null;
  const [year, month, day] = parts;
  const index = year * 12 + (month - 1) + Math.trunc(months);
  const nextYear = Math.floor(index / 12);
  const nextMonth = (index % 12) + 1;
  const last = new Date(Date.UTC(nextYear, nextMonth, 0)).getUTCDate();
  return isoOfParts(nextYear, nextMonth, Math.min(day, last));
}

/**
 * The calendar day a moment falls on in a zone, as yyyy-mm-dd. A date-only string already is a calendar day.
 * Null when the moment is not a date.
 */
export function todayIn(moment: WarrantyMoment, timeZone: string): string | null {
  if (typeof moment === "string" && DAY.test(moment)) return moment;
  const instant = new Date(moment);
  if (Number.isNaN(instant.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: knownZone(timeZone), year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  const pick = (type: string): string => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

/** A calendar day in words with its year: "14 March 2028". A day has no time zone, so it is written in UTC whatever the reader's zone. */
export function dayText(iso: string, locale: string): string {
  const parts = parseDay(iso);
  if (!parts) return iso;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])));
}

/** A length of cover in the reader's words: whole years when it comes out even ("2 years"), months otherwise ("18 months"). */
export function durationText(months: number, locale: string): string {
  const whole = months >= 12 && months % 12 === 0;
  const value = whole ? months / 12 : months;
  try {
    return new Intl.NumberFormat(locale, { style: "unit", unit: whole ? "year" : "month", unitDisplay: "long" }).format(value);
  } catch {
    return `${value} ${whole ? "years" : "months"}`;
  }
}

/** A serial number as it is sent: trimmed, single spaces, capitals. */
export function tidySerial(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

/**
 * A pattern as a RegExp that is safe to test repeatedly. A string is a regular expression's source and matches
 * without regard to case; a RegExp keeps its own flags, minus the ones that make `test` remember where it was.
 * Null when there is none, or when the string is not a valid expression.
 */
export function compilePattern(pattern: RegExp | string | undefined): RegExp | null {
  if (pattern === undefined) return null;
  try {
    return typeof pattern === "string" ? new RegExp(pattern, "i") : new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, ""));
  } catch {
    return null;
  }
}

/** Whether a serial number fits the pattern. It is tried as typed and in capitals, since that is how it is sent. */
export function serialFits(pattern: RegExp | null, value: string): boolean {
  if (!pattern) return true;
  const typed = value.trim();
  return pattern.test(typed) || pattern.test(typed.toUpperCase());
}

/** The fields that can have an error, in the order they are on the page. */
export const FIELD_ORDER = ["product", "serial", "purchaseDate", "store", "proof", "consent"] as const;

export type FieldKey = (typeof FIELD_ORDER)[number];

export type FieldErrors = Partial<Record<FieldKey, string>>;

/** What a check needs to know besides the answers. */
export interface WarrantyRules {
  /** Whether the form asks for the product, because none was passed. */
  asksProduct: boolean;
  pattern: RegExp | null;
  /** The example of a serial number, for the message when the pattern is not met. Empty when there is none. */
  example: string;
  months: number;
  proofRequired: boolean;
  /** Today in the shop's zone as yyyy-mm-dd, or null when the clock is not known (then nothing is checked against it). */
  today: string | null;
  locale: string;
  errors: Required<WarrantyErrorWords>;
}

/** The answers as the form holds them. */
export interface WarrantyAnswers {
  product: string;
  serial: string;
  /** yyyy-mm-dd, or null when no day was chosen. */
  purchaseDate: string | null;
  store: string;
  proof: File | null;
  consent: boolean;
}

/** The words of each error, so every message stands alone. `{date}` and `{example}` are filled in by the check. */
export interface WarrantyErrorWords {
  product?: string;
  serial?: string;
  /** A serial number that does not fit the pattern. */
  serialMismatch?: string;
  /** Added to it when there is an example. `{example}`. */
  serialExample?: string;
  purchaseDate?: string;
  /** A day that has not happened yet. */
  purchaseDateFuture?: string;
  /** A day so long ago that the cover has ended. `{date}` is the last day of the cover. */
  purchaseDateEnded?: string;
  store?: string;
  proof?: string;
  consent?: string;
}

const fillIn = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** The message for one field, or undefined when the field is fine. */
export function checkField(key: FieldKey, answers: WarrantyAnswers, rules: WarrantyRules): string | undefined {
  const { errors } = rules;
  switch (key) {
    case "product":
      return !rules.asksProduct || answers.product.trim() ? undefined : errors.product;
    case "serial": {
      if (!answers.serial.trim()) return errors.serial;
      if (serialFits(rules.pattern, answers.serial)) return undefined;
      return `${errors.serialMismatch}${rules.example ? ` ${fillIn(errors.serialExample, { example: rules.example })}` : ""}`;
    }
    case "purchaseDate": {
      const day = answers.purchaseDate;
      if (!day || !parseDay(day)) return errors.purchaseDate;
      if (rules.today && day > rules.today) return errors.purchaseDateFuture;
      const end = addMonths(day, rules.months);
      if (rules.today && end && end < rules.today) return fillIn(errors.purchaseDateEnded, { date: dayText(end, rules.locale) });
      return undefined;
    }
    case "store":
      return answers.store.trim() ? undefined : errors.store;
    case "proof":
      return !rules.proofRequired || answers.proof ? undefined : errors.proof;
    case "consent":
      return answers.consent ? undefined : errors.consent;
  }
}

/** Every problem in the form, by field. An empty object means it can be sent. */
export function validate(answers: WarrantyAnswers, rules: WarrantyRules): FieldErrors {
  const found: FieldErrors = {};
  for (const key of FIELD_ORDER) {
    const message = checkField(key, answers, rules);
    if (message) found[key] = message;
  }
  return found;
}
