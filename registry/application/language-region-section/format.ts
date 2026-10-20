import type { ComboboxOption } from "@rhs-ui/primitives/combobox";

export type DateOrder = "dmy" | "mdy" | "ymd";
export type FirstDay = "monday" | "sunday" | "saturday";

export interface LanguageOption {
  /** BCP 47 language code: "nl", "pt". */
  code: string;
  /** The language written in itself: "Nederlands". */
  name: string;
  /** The English name, shown as a second line and matched by search: "Dutch". */
  english?: string;
}

export interface LanguageRegionValue {
  /** Language code, as in LanguageOption.code. */
  language: string;
  /** ISO 3166-1 alpha-2 country or region code: "NL". */
  country: string;
  /** IANA time zone id: "Europe/Amsterdam". */
  timeZone: string;
  dateOrder: DateOrder;
  firstDay: FirstDay;
  /** Show 14:30 instead of 2:30 PM. */
  hour24: boolean;
}

/** A dozen languages, each in its own name. Pass your own list for the languages you ship. */
export const DEFAULT_LANGUAGES: readonly LanguageOption[] = [
  { code: "en", name: "English" },
  { code: "nl", name: "Nederlands", english: "Dutch" },
  { code: "de", name: "Deutsch", english: "German" },
  { code: "fr", name: "Français", english: "French" },
  { code: "es", name: "Español", english: "Spanish" },
  { code: "it", name: "Italiano", english: "Italian" },
  { code: "pt", name: "Português", english: "Portuguese" },
  { code: "sv", name: "Svenska", english: "Swedish" },
  { code: "da", name: "Dansk", english: "Danish" },
  { code: "pl", name: "Polski", english: "Polish" },
  { code: "tr", name: "Türkçe", english: "Turkish" },
  { code: "ja", name: "日本語", english: "Japanese" },
];

/** Forty zones that cover the world's offsets. Pass Intl.supportedValuesOf("timeZone") for the full list. */
export const DEFAULT_TIME_ZONES: readonly string[] = [
  "Pacific/Honolulu",
  "America/Anchorage",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Halifax",
  "America/Sao_Paulo",
  "Atlantic/Azores",
  "UTC",
  "Europe/London",
  "Europe/Lisbon",
  "Europe/Amsterdam",
  "Europe/Berlin",
  "Europe/Paris",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Stockholm",
  "Europe/Warsaw",
  "Europe/Athens",
  "Europe/Helsinki",
  "Europe/Istanbul",
  "Europe/Moscow",
  "Africa/Cairo",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Jakarta",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Perth",
  "Australia/Sydney",
  "Pacific/Auckland",
];

/** The moment the preview is formatted at: a Friday afternoon in UTC, before most daylight saving changes. */
export const SAMPLE_MOMENT = "2026-03-20T14:30:00Z";

const DAY = 86_400_000;

/** A language and a country as one locale tag ("nl" + "NL" -> "nl-NL"), falling back to the language alone. */
export function localeTag(language: string, country: string): string {
  const tag = `${language}-${country}`;
  try {
    new Intl.NumberFormat(tag);
    return tag;
  } catch {
    return language;
  }
}

/** Minutes a zone is ahead of UTC at a moment, or null for a zone this browser does not know. */
export function offsetMinutes(timeZone: string, at: Date): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).formatToParts(at);
    const part = (type: string) => Number(parts.find((item) => item.type === type)?.value);
    const local = Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"), part("second"));
    return Math.round((local - Math.floor(at.getTime() / 1000) * 1000) / 60_000);
  } catch {
    return null;
  }
}

/** 60 -> "UTC+01:00", -210 -> "UTC-03:30". */
export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? "-" : "+";
  const total = Math.abs(minutes);
  return `UTC${sign}${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** "America/Argentina/Buenos_Aires" -> "Buenos Aires". */
export const cityOf = (timeZone: string) => (timeZone.split("/").pop() ?? timeZone).replace(/_/g, " ");

/** Time zones as combobox options, grouped by their offset at a moment, the earliest offset first. Unknown ids are left out. */
export function zoneOptions(zones: readonly string[], at: Date): ComboboxOption[] {
  return zones
    .map((zone) => ({ zone, offset: offsetMinutes(zone, at) }))
    .filter((item): item is { zone: string; offset: number } => item.offset !== null)
    .sort((a, b) => a.offset - b.offset || cityOf(a.zone).localeCompare(cityOf(b.zone), "en"))
    .map(({ zone, offset }) => ({
      value: zone,
      label: cityOf(zone),
      description: zone.includes("/") ? zone.split("/")[0] : undefined,
      keywords: [zone, formatOffset(offset)],
      group: formatOffset(offset),
    }));
}

/** 20/03/2026, 03/20/2026 or 2026-03-20: the order you chose, the separator of the language. */
export function formatDate(at: Date, tag: string, order: DateOrder, timeZone: string): string {
  const parts = new Intl.DateTimeFormat(tag, { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).formatToParts(at);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  const literal = parts.find((item) => item.type === "literal")?.value.trim() || "/";
  const day = part("day");
  const month = part("month");
  const year = part("year");
  if (order === "ymd") return [year, month, day].join("-");
  return (order === "dmy" ? [day, month, year] : [month, day, year]).join(literal);
}

/** 14:30 or 2:30 PM, in a zone, with the zone's short name when the browser has one. */
export function formatTime(at: Date, tag: string, hour24: boolean, timeZone: string, withZone = false): string {
  return new Intl.DateTimeFormat(tag, {
    hour: hour24 ? "2-digit" : "numeric",
    minute: "2-digit",
    hourCycle: hour24 ? "h23" : "h12",
    timeZone,
    ...(withZone ? { timeZoneName: "short" as const } : {}),
  }).format(at);
}

/** 1.234.567,89 or 1,234,567.89: the grouping and decimal marks of the language and country. */
export function formatNumber(tag: string): string {
  return new Intl.NumberFormat(tag, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(1234567.891);
}

/** The seven weekday names of a language, starting on the chosen first day. */
export function weekdayNames(tag: string, first: FirstDay): string[] {
  const format = new Intl.DateTimeFormat(tag, { weekday: "short", timeZone: "UTC" });
  // 2 March 2026 is a Monday.
  const monday = Date.UTC(2026, 2, 2);
  const names = Array.from({ length: 7 }, (_, index) => format.format(new Date(monday + index * DAY)));
  const shift = first === "monday" ? 0 : first === "sunday" ? 6 : 5;
  return [...names.slice(shift), ...names.slice(0, shift)];
}
