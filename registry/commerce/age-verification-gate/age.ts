/** A moment: a Date, an ISO 8601 string or epoch milliseconds. A date-only string such as "2026-10-12" is a calendar day. */
export type AgeMoment = Date | string | number;

/** The three parts of a date of birth, as the customer typed them. */
export type DatePart = "day" | "month" | "year";

export interface BirthdateParts {
  /** The day of the month, one or two digits. */
  day: string;
  /** The month, one or two digits. */
  month: string;
  /** The year, four digits. */
  year: string;
}

/** What is wrong with a date of birth, when something is. */
export type BirthdateProblem = "incomplete" | "impossible" | "year" | "future";

export type BirthdateCheck =
  | { ok: true; /** yyyy-mm-dd */ iso: string; /** Whether the person has reached the minimum age on the day checked. */ adult: boolean }
  | { ok: false; reason: BirthdateProblem; /** The fields to mark: the ones that are empty, or that cannot be right. */ fields: readonly DatePart[] };

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

/** The calendar day a moment falls on in a zone, as yyyy-mm-dd. A date-only string already is a calendar day. Null when the moment is not a date. */
export function todayIn(moment: AgeMoment, timeZone: string): string | null {
  if (typeof moment === "string" && DAY.test(moment)) return moment;
  const instant = new Date(moment);
  if (Number.isNaN(instant.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: knownZone(timeZone), year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  const pick = (type: string): string => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

/** The order the three fields come in for a locale: day, month, year in most of the world, month first in the US, year first in Japan. */
export function orderFor(locale: string): readonly DatePart[] {
  try {
    const found = new Intl.DateTimeFormat(locale, { timeZone: "UTC" })
      .formatToParts(new Date(Date.UTC(2006, 11, 31)))
      .map((part) => part.type)
      .filter((type): type is DatePart => type === "day" || type === "month" || type === "year");
    if (found.length === 3 && new Set(found).size === 3) return found;
  } catch {
    // An unknown locale falls back to the usual order.
  }
  return ["day", "month", "year"];
}

/** Whole years between a birth day and another day, both yyyy-mm-dd. A birthday counts from its own day. */
export function ageOn(birth: string, day: string): number {
  const born = DAY.exec(birth);
  const now = DAY.exec(day);
  if (!born || !now) return 0;
  const years = Number(now[1]) - Number(born[1]);
  const before = Number(now[2]) < Number(born[2]) || (Number(now[2]) === Number(born[2]) && Number(now[3]) < Number(born[3]));
  return years - (before ? 1 : 0);
}

/**
 * Checks a date of birth against a minimum age. Impossible calendar dates (31 February, month 13, day 0) are
 * rejected, a year must have four digits and cannot lie before 1900 or after today, and a birthday counts from its
 * own day. `today` is the shop's calendar day as yyyy-mm-dd.
 */
export function checkBirthdate(parts: BirthdateParts, today: string, minimumAge: number): BirthdateCheck {
  const typed = { day: parts.day.trim(), month: parts.month.trim(), year: parts.year.trim() };
  const empty = (["day", "month", "year"] as const).filter((key) => typed[key] === "");
  if (empty.length > 0) return { ok: false, reason: "incomplete", fields: empty };
  if (!/^\d{1,2}$/.test(typed.day) || !/^\d{1,2}$/.test(typed.month) || !/^\d{4}$/.test(typed.year)) {
    return { ok: false, reason: /^\d{4}$/.test(typed.year) ? "impossible" : "year", fields: /^\d{4}$/.test(typed.year) ? ["day", "month"] : ["year"] };
  }
  const day = Number(typed.day);
  const month = Number(typed.month);
  const year = Number(typed.year);
  if (month < 1 || month > 12) return { ok: false, reason: "impossible", fields: ["month"] };
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (day < 1 || probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return { ok: false, reason: "impossible", fields: ["day"] };
  if (year < 1900) return { ok: false, reason: "year", fields: ["year"] };
  const iso = `${String(year).padStart(4, "0")}-${two(month)}-${two(day)}`;
  if (iso > today) return { ok: false, reason: "future", fields: ["day", "month", "year"] };
  return { ok: true, iso, adult: ageOn(iso, today) >= minimumAge };
}

export interface AgeGateErrors {
  /** One or more fields are empty. */
  incomplete?: string;
  /** A date that does not exist: 31 February, month 13. */
  impossible?: string;
  /** A year that is not four digits, or cannot be right. */
  year?: string;
  /** A date that has not happened yet. */
  future?: string;
}

export interface AgeGateLabels {
  /** The heading when you gave none. */
  title?: string;
  /** Under the heading when the visitor types a date. `{age}`. */
  description?: string;
  /** Under it when the visitor only confirms. `{age}`. */
  descriptionConfirm?: string;
  /** The legend of the three fields. */
  legend?: string;
  /** The name of each field, and what its placeholder shows. */
  day?: string;
  month?: string;
  year?: string;
  dayPlaceholder?: string;
  monthPlaceholder?: string;
  yearPlaceholder?: string;
  /** The button under the date. */
  submit?: string;
  /** The two buttons of the plain choice. `{age}`. */
  confirm?: string;
  under?: string;
  /** The heading and the message when the visitor is not old enough. `{age}`. */
  declinedTitle?: string;
  declinedMessage?: string;
  /** The way out, and the way back to the date. */
  leave?: string;
  retry?: string;
  /** The link to your age policy. */
  help?: string;
  /** What each wrong date says. */
  errors?: AgeGateErrors;
}

export interface AgeGateWords extends Required<Omit<AgeGateLabels, "errors">> {
  errors: Required<AgeGateErrors>;
}

const WORDS: AgeGateWords = {
  title: "Please confirm your age",
  description: "Enter your date of birth. You must be {age} or older to enter.",
  descriptionConfirm: "You must be {age} or older to enter.",
  legend: "Date of birth",
  day: "Day",
  month: "Month",
  year: "Year",
  dayPlaceholder: "DD",
  monthPlaceholder: "MM",
  yearPlaceholder: "YYYY",
  submit: "Enter the shop",
  confirm: "I am {age} or older",
  under: "I am under {age}",
  declinedTitle: "Sorry, we cannot let you in",
  declinedMessage: "You need to be {age} or older to enter this shop. Thank you for being honest.",
  leave: "Leave this site",
  retry: "Typed the wrong date? Try again",
  help: "Why do we ask?",
  errors: {
    incomplete: "Enter the day, the month and the year.",
    impossible: "That date does not exist. Check the day and the month.",
    year: "Enter the year with four digits, like 1992.",
    future: "That date is in the future. Check the year.",
  },
};

/** The default words with the ones you passed on top. */
export function wordsOf(labels: AgeGateLabels | undefined): AgeGateWords {
  return { ...WORDS, ...labels, errors: { ...WORDS.errors, ...labels?.errors } } as AgeGateWords;
}

/** Fills `{name}` placeholders in a sentence. */
export const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
