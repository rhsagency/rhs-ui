/** A moment: a Date, an ISO 8601 string or epoch milliseconds. A date-only string such as "2026-10-12" is a calendar day. */
export type SafetyMoment = Date | string | number;

/** A company the shopper can write to: the maker, or the one who answers for the product in the EU. */
export interface SafetyParty {
  /** The company's name. */
  name: string;
  /** The postal address, one string per line, or one string for the whole address. Written in an `<address>` element. */
  address: string | readonly string[];
  /** The electronic address. It becomes a mail link. */
  email?: string;
  /** The phone number, as it should be read. It becomes a call link. */
  phone?: string;
  /** The company's web address, written without the scheme: "northwind.example/contact". It becomes a link. */
  website?: string;
  /** What this party is, when the usual words do not fit: "Importer", "Authorised representative". */
  role?: string;
}

/** One way to recognise this exact product: its model, its batch, its serial number. */
export interface SafetyIdentifier {
  /** What it is: "Model", "Batch". */
  label: string;
  /** The code itself, as it is printed. */
  value: string;
  /** Where it is printed: "On the rating plate under the base". */
  where?: string;
}

/** How serious a warning is. Each has a word of its own, so the severity never depends on colour or on an icon. */
export type SafetySeverity = "danger" | "warning" | "caution" | "notice";

export interface SafetyWarning {
  /** How serious it is. It is written as a word before the warning. */
  severity: SafetySeverity;
  /** A few words that name the risk: "Hot surfaces". */
  title?: string;
  /** What to do or not to do, in a sentence or two. */
  text: string;
}

/** A compliance mark the product carries. */
export interface SafetyMark {
  /** The mark: "CE", "UKCA", "RoHS". */
  name: string;
  /** What it says about the product, in a line. */
  description?: string;
  /** The declaration that backs it. The mark then links to it. */
  href?: string;
}

/** A file the shopper can download. */
export interface SafetyDocument {
  /** What it is: "User manual", "EU declaration of conformity". */
  title: string;
  /** The file. */
  href: string;
  /** The kind of file, as people say it: "PDF". */
  type?: string;
  /** Its size in bytes: 2411724 is written "2.4 MB". */
  size?: number;
  /** The language it is written in: "English". */
  language?: string;
}

export interface ProductSafetyLabels {
  /** The heading when you gave none. */
  title?: string;
  /** After the date of the last check. `{date}`. */
  updated?: string;
  /** The title of each section, and the line under it. */
  warnings?: string;
  warningsHint?: string;
  marks?: string;
  marksHint?: string;
  responsible?: string;
  responsibleHint?: string;
  identifiers?: string;
  identifiersHint?: string;
  documents?: string;
  documentsHint?: string;
  /** What the two parties are called, above their address. */
  manufacturer?: string;
  euContact?: string;
  /** The word for each severity, in front of the warning. */
  severity?: Partial<Record<SafetySeverity, string>>;
  /** The link under a mark that has a declaration. */
  declaration?: string;
  /** The button on a document. */
  download?: string;
  /** What a screen reader hears on that button. `{title}` and `{details}`, which is the type, the size and the language. */
  downloadName?: string;
  /** The same for a document that has no details. `{title}`. */
  downloadNamePlain?: string;
}

export const WORDS = {
  title: "Product safety information",
  updated: "Checked {date}",
  warnings: "Warnings",
  warningsHint: "Read these before you use the product.",
  marks: "Compliance",
  marksHint: "What the product has been declared to meet.",
  responsible: "Who is responsible",
  responsibleHint: "Who makes the product, and who answers for it in the EU.",
  identifiers: "Identification",
  identifiersHint: "Where to find these on your product.",
  documents: "Documents",
  documentsHint: "Manuals and declarations to download.",
  manufacturer: "Manufacturer",
  euContact: "Responsible person in the EU",
  severity: { danger: "Danger", warning: "Warning", caution: "Caution", notice: "Note" },
  declaration: "Declaration of conformity",
  download: "Download",
  downloadName: "Download {title} ({details})",
  downloadNamePlain: "Download {title}",
} satisfies Required<ProductSafetyLabels>;

export const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** The lines of an address, whichever way it was given (a list, or one string with line breaks), without empty ones. */
export function linesOf(address: string | readonly string[]): string[] {
  const lines = typeof address === "string" ? address.split(/\r?\n/) : address;
  return lines.map((line) => line.trim()).filter((line) => line.length > 0);
}

/** A file's size in the reader's words: "340 kB", "2.4 MB". Null for something that is not a size. */
export function sizeText(bytes: number, locale: string): string | null {
  if (!Number.isFinite(bytes) || bytes < 0) return null;
  const megabytes = bytes >= 1_000_000;
  try {
    return new Intl.NumberFormat(locale, { style: "unit", unit: megabytes ? "megabyte" : "kilobyte", unitDisplay: "short", maximumFractionDigits: 1 }).format(megabytes ? bytes / 1_000_000 : Math.max(1, bytes / 1000));
  } catch {
    return megabytes ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1000))} kB`;
  }
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
export function dateText(moment: SafetyMoment, locale: string, timeZone: string): string | null {
  const instant = new Date(moment);
  if (Number.isNaN(instant.getTime())) return null;
  const zone = typeof moment === "string" && DATE_ONLY.test(moment) ? "UTC" : knownZone(timeZone);
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: zone }).format(instant);
}

/** A moment as it goes into a `<time>` element: a plain date stays a plain date, anything else becomes an ISO date-time. */
export function isoOf(moment: SafetyMoment): string | null {
  if (typeof moment === "string" && DATE_ONLY.test(moment)) return moment;
  const instant = new Date(moment);
  return Number.isNaN(instant.getTime()) ? null : instant.toISOString();
}
