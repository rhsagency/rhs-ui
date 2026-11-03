/** The ways to repeat that the select offers, in the order it lists them. */
export type RepeatKind = "none" | "daily" | "weekly" | "monthly" | "yearly" | "weekdays";

/** What a value turns out to be: one of the kinds, or a rule that none of them describes. */
export type RepeatMatch = RepeatKind | "custom";

export const REPEAT_KINDS: readonly RepeatKind[] = ["none", "daily", "weekly", "monthly", "yearly", "weekdays"];

/** The words the select says, for another language or your own voice. The parts that come from the date are written for you by Intl. */
export interface RepeatLabels {
  /** The name of the field when it has no label of its own. */
  field: string;
  /** What the trigger says while there is no value at all (`undefined`). */
  placeholder: string;
  /** No repeat. */
  none: string;
  /** Every day. */
  daily: string;
  /** Every week, given the weekday: "Tuesday" gives "Every week on Tuesday". */
  weekly: (weekday: string) => string;
  /** Every month on a day number, given the ordinal ("27th"): "Every month on the 27th". */
  monthlyDay: (ordinal: string) => string;
  /** Every month on the last of a weekday, in the last week of the month: "Every month on the last Tuesday". */
  monthlyLast: (weekday: string) => string;
  /** Every year, given the day and month as the locale writes them: "Every year on 27 October". */
  yearly: (date: string) => string;
  /** Monday to Friday, given the first and last weekday: "Every weekday (Monday to Friday)". */
  weekdays: (first: string, last: string) => string;
  /** The choice that opens your own editor. */
  custom: string;
  /** The name of a rule that none of the choices describes. */
  customRule: string;
  /** Said when the start date moved the rule with it: "Now repeats every week on Thursday". */
  updated: (label: string) => string;
}

/** The English ordinal of a number: 1st, 2nd, 3rd, 27th. */
export function ordinal(value: number, locale: string): string {
  const english = /^en(-|$)/i.test(locale);
  if (!english) return String(value);
  let rule = "other";
  try {
    rule = new Intl.PluralRules(locale, { type: "ordinal" }).select(value);
  } catch {
    /* an unknown locale reads as plain numbers */
  }
  const suffix = rule === "one" ? "st" : rule === "two" ? "nd" : rule === "few" ? "rd" : "th";
  return `${value}${suffix}`;
}

export const DEFAULT_LABELS: RepeatLabels = {
  field: "Repeat",
  placeholder: "Choose how often",
  none: "Does not repeat",
  daily: "Every day",
  weekly: (weekday) => `Every week on ${weekday}`,
  monthlyDay: (day) => `Every month on the ${day}`,
  monthlyLast: (weekday) => `Every month on the last ${weekday}`,
  yearly: (date) => `Every year on ${date}`,
  weekdays: (first, last) => `Every weekday (${first} to ${last})`,
  custom: "Custom…",
  customRule: "Custom",
  updated: (label) => `Now repeats: ${label}`,
};

const DAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;
const WEEKDAYS = ["MO", "TU", "WE", "TH", "FR"] as const;
const noon = (year: number, month: number, day: number) => Date.UTC(year, month - 1, day, 12);

/** The numbers in an ISO date, or null when it is not one or the day does not exist. */
export function parseStart(iso: string | null | undefined): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso ?? "").trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(noon(year, month, day));
  return year >= 1000 && check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day ? { year, month, day } : null;
}

/** What a start date means for the rules: its weekday (0 is Sunday), its day of the month, and whether it falls in the last week of its month. */
export function facts(start: string): { weekday: number; day: number; month: number; last: boolean } | null {
  const parts = parseStart(start);
  if (!parts) return null;
  const weekday = new Date(noon(parts.year, parts.month, parts.day)).getUTCDay();
  const length = new Date(Date.UTC(parts.year, parts.month, 0)).getUTCDate();
  return { weekday, day: parts.day, month: parts.month, last: parts.day > length - 7 };
}

/** The recurrence rule (RFC 5545) for a kind of repeat that starts on a date, as the line a calendar file carries, or null for no repeat. */
export function ruleFor(kind: RepeatKind, start: string): string | null {
  if (kind === "none") return null;
  const f = facts(start);
  if (kind === "daily") return "RRULE:FREQ=DAILY";
  if (kind === "weekdays") return `RRULE:FREQ=WEEKLY;BYDAY=${WEEKDAYS.join(",")}`;
  if (!f) return kind === "weekly" ? "RRULE:FREQ=WEEKLY" : kind === "monthly" ? "RRULE:FREQ=MONTHLY" : "RRULE:FREQ=YEARLY";
  const code = DAY_CODES[f.weekday];
  if (kind === "weekly") return `RRULE:FREQ=WEEKLY;BYDAY=${code}`;
  if (kind === "monthly") return f.last ? `RRULE:FREQ=MONTHLY;BYDAY=-1${code}` : `RRULE:FREQ=MONTHLY;BYMONTHDAY=${f.day}`;
  return `RRULE:FREQ=YEARLY;BYMONTH=${f.month};BYMONTHDAY=${f.day}`;
}

/** A rule split into its parts, upper case, with the "RRULE:" in front removed. Null for text that is not a rule. */
export function parseRule(rule: string | null | undefined): Map<string, string> | null {
  const text = (rule ?? "").trim().replace(/^RRULE:/i, "");
  if (!text) return null;
  const parts = new Map<string, string>();
  for (const piece of text.split(";")) {
    const [key, ...rest] = piece.split("=");
    const value = rest.join("=");
    if (!key || !value) return null;
    parts.set(key.trim().toUpperCase(), value.trim().toUpperCase());
  }
  return parts.has("FREQ") ? parts : null;
}

/**
 * A rule in one fixed form, so two ways of writing the same repeat compare equal: the parts in the same order, the default interval left
 * out, and whatever the start date implies filled in ("FREQ=WEEKLY" on a Tuesday is "FREQ=WEEKLY;BYDAY=TU").
 */
function canonical(rule: string | null | undefined, start: string): string | null {
  const parts = parseRule(rule);
  if (!parts) return null;
  const f = facts(start);
  if (parts.get("INTERVAL") === "1") parts.delete("INTERVAL");
  const freq = parts.get("FREQ");
  // The last weekday of the month has two spellings: BYDAY=-1TU, and BYDAY=TU with BYSETPOS=-1.
  if (freq === "MONTHLY" && parts.get("BYSETPOS") === "-1" && /^[A-Z]{2}$/.test(parts.get("BYDAY") ?? "")) {
    parts.set("BYDAY", `-1${parts.get("BYDAY")}`);
    parts.delete("BYSETPOS");
  }
  if (f) {
    if (freq === "WEEKLY" && !parts.has("BYDAY")) parts.set("BYDAY", DAY_CODES[f.weekday] ?? "");
    if (freq === "MONTHLY" && !parts.has("BYDAY") && !parts.has("BYMONTHDAY")) parts.set("BYMONTHDAY", String(f.day));
    if (freq === "YEARLY") {
      if (!parts.has("BYMONTH")) parts.set("BYMONTH", String(f.month));
      if (!parts.has("BYMONTHDAY") && !parts.has("BYDAY")) parts.set("BYMONTHDAY", String(f.day));
    }
  }
  if (parts.has("BYDAY")) parts.set("BYDAY", (parts.get("BYDAY") ?? "").split(",").sort().join(","));
  return [...parts.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([key, value]) => `${key}=${value}`)
    .join(";");
}

/** Which of the choices a rule is, for a start date: `none` for no rule at all, `custom` for a rule that none of the others describes (an interval, a count, an end date). */
export function kindOf(rule: string | null | undefined, start: string): RepeatMatch {
  if (rule === null || rule === undefined || rule.trim() === "") return "none";
  const wanted = canonical(rule, start);
  if (wanted === null) return "custom";
  for (const kind of REPEAT_KINDS) {
    if (kind !== "none" && canonical(ruleFor(kind, start), start) === wanted) return kind;
  }
  return "custom";
}

const formats = new Map<string, Intl.DateTimeFormat>();

function format(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let found = formats.get(key);
  if (!found) {
    try {
      found = new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" });
    } catch {
      found = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
    }
    formats.set(key, found);
  }
  return found;
}

/** The name of a weekday (0 is Sunday) in the locale. */
export const weekdayName = (weekday: number, locale: string): string => format(locale, { weekday: "long" }).format(noon(2023, 1, 1 + weekday));

/** One choice of the select: what it is, how it reads and the rule it stands for. */
export interface RepeatOption {
  kind: RepeatKind;
  label: string;
  rule: string | null;
}

/** The label of a kind of repeat for a start date, written in the locale. */
export function labelOf(kind: RepeatKind, start: string, locale: string, labels: RepeatLabels): string {
  const f = facts(start);
  const parts = parseStart(start);
  if (kind === "none") return labels.none;
  if (kind === "daily") return labels.daily;
  if (kind === "weekdays") return labels.weekdays(weekdayName(1, locale), weekdayName(5, locale));
  if (!f || !parts) return "";
  if (kind === "weekly") return labels.weekly(weekdayName(f.weekday, locale));
  if (kind === "monthly") return f.last ? labels.monthlyLast(weekdayName(f.weekday, locale)) : labels.monthlyDay(ordinal(f.day, locale));
  return labels.yearly(format(locale, { day: "numeric", month: "long" }).format(noon(parts.year, parts.month, parts.day)));
}

/** The choices for a start date, in the order of `include`. Without a valid start date the choices that need one (week, month, year) cannot be worded and are left out. */
export function repeatOptions(start: string, locale: string, labels: RepeatLabels, include: readonly RepeatKind[] = REPEAT_KINDS): RepeatOption[] {
  const dated = facts(start) !== null;
  return REPEAT_KINDS.filter((kind) => include.includes(kind) && (dated || kind === "none" || kind === "daily" || kind === "weekdays")).map((kind) => ({
    kind,
    label: labelOf(kind, start, locale, labels),
    rule: ruleFor(kind, start),
  }));
}
