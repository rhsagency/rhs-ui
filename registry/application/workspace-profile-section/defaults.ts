/** A language someone can pick: its code and its name in that language. */
export interface WorkspaceLanguage {
  value: string;
  label: string;
}

/** IANA time zones for the picker when you pass none: the places most workspaces are in, UTC first and then the cities in alphabetical order. A list you pass is shown in the order you give it. */
export const DEFAULT_TIME_ZONES: readonly string[] = [
  "UTC",
  "Europe/Amsterdam",
  "America/Anchorage",
  "Europe/Athens",
  "Pacific/Auckland",
  "Asia/Bangkok",
  "Europe/Berlin",
  "America/Bogota",
  "Australia/Brisbane",
  "Europe/Brussels",
  "America/Argentina/Buenos_Aires",
  "Africa/Cairo",
  "Africa/Casablanca",
  "America/Chicago",
  "America/Denver",
  "Asia/Dubai",
  "Europe/Dublin",
  "America/Halifax",
  "Europe/Helsinki",
  "Asia/Hong_Kong",
  "Pacific/Honolulu",
  "Europe/Istanbul",
  "Asia/Jakarta",
  "Asia/Jerusalem",
  "Africa/Johannesburg",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Africa/Lagos",
  "Europe/Lisbon",
  "Europe/London",
  "America/Los_Angeles",
  "Europe/Madrid",
  "Australia/Melbourne",
  "America/Mexico_City",
  "Europe/Moscow",
  "Africa/Nairobi",
  "America/New_York",
  "Europe/Oslo",
  "Europe/Paris",
  "Australia/Perth",
  "America/Phoenix",
  "Europe/Prague",
  "Europe/Rome",
  "America/Sao_Paulo",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Europe/Stockholm",
  "Australia/Sydney",
  "Asia/Tokyo",
  "America/Toronto",
  "America/Vancouver",
  "Europe/Vienna",
  "Europe/Warsaw",
  "Europe/Zurich",
];

/** How a few cities are written when the IANA name drops the accents. Every other zone is named by the last part of its IANA name. */
export const TIME_ZONE_NAMES: Readonly<Record<string, string>> = {
  "America/Bogota": "Bogotá",
  "America/Sao_Paulo": "São Paulo",
  "Europe/Zurich": "Zürich",
};

/** Languages for the picker when you pass none, each named in its own language. */
export const DEFAULT_LANGUAGES: readonly WorkspaceLanguage[] = [
  { value: "en", label: "English" },
  { value: "nl", label: "Nederlands" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "it", label: "Italiano" },
  { value: "pt", label: "Português" },
  { value: "sv", label: "Svenska" },
  { value: "pl", label: "Polski" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "zh", label: "中文" },
];
