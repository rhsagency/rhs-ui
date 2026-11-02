/** A weekday as `Date.prototype.getDay()` numbers it: 0 is Sunday, 1 is Monday, up to 6 for Saturday. */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Ready-made groups of days for the preset chips. */
export type WeekdayPresetKey = "weekdays" | "weekend" | "everyday";

/** A preset chip: one of the three ready-made ones, or your own label and days. */
export type WeekdayPreset = WeekdayPresetKey | { label: string; days: readonly number[] };

/** The words the picker says. The names of the days are never in here: they come from Intl, in the language of the locale. */
export interface WeekdayWords {
  /** The summary when no day is chosen. */
  none: string;
  /** The summary when all seven are chosen. */
  everyDay: string;
  /** The summary for Saturday and Sunday. */
  weekends: string;
  /** Between the first and the last day of a run of three or more: "Monday to Friday". */
  to: string;
  /** The label of the Weekdays preset chip. */
  presetWeekdays: string;
  /** The label of the Weekend preset chip. */
  presetWeekend: string;
  /** The label of the Every day preset chip. */
  presetEveryDay: string;
  /** Said when the last chosen day refuses to turn off. */
  requireOne: string;
}

const ENGLISH: WeekdayWords = {
  none: "No days selected",
  everyDay: "Every day",
  weekends: "Weekends",
  to: "to",
  presetWeekdays: "Weekdays",
  presetWeekend: "Weekend",
  presetEveryDay: "Every day",
  requireOne: "Keep at least one day selected",
};

/** What the picker says in a few languages, so the sentence under the days agrees with the names of the days. Anything else reads in English: pass `labels`. */
const WORDS: Readonly<Record<string, WeekdayWords>> = {
  en: ENGLISH,
  nl: { none: "Geen dagen gekozen", everyDay: "Elke dag", weekends: "In het weekend", to: "tot en met", presetWeekdays: "Werkdagen", presetWeekend: "Weekend", presetEveryDay: "Elke dag", requireOne: "Houd minstens één dag geselecteerd" },
  de: { none: "Keine Tage ausgewählt", everyDay: "Jeden Tag", weekends: "Am Wochenende", to: "bis", presetWeekdays: "Werktage", presetWeekend: "Wochenende", presetEveryDay: "Jeden Tag", requireOne: "Mindestens ein Tag muss ausgewählt bleiben" },
  fr: { none: "Aucun jour sélectionné", everyDay: "Tous les jours", weekends: "Le week-end", to: "au", presetWeekdays: "Semaine", presetWeekend: "Week-end", presetEveryDay: "Tous les jours", requireOne: "Gardez au moins un jour sélectionné" },
  es: { none: "Ningún día seleccionado", everyDay: "Todos los días", weekends: "Fines de semana", to: "a", presetWeekdays: "Entre semana", presetWeekend: "Fin de semana", presetEveryDay: "Todos los días", requireOne: "Deja al menos un día seleccionado" },
};

function languageOf(locale: string): string {
  try {
    return new Intl.Locale(locale).language;
  } catch {
    return "en";
  }
}

/** The words for a locale, with anything in `labels` on top. */
export function wordsFor(locale: string, labels?: Partial<WeekdayWords>): WeekdayWords {
  return { ...(WORDS[languageOf(locale)] ?? ENGLISH), ...labels };
}

interface WeekInfoLocale {
  getWeekInfo?: () => { firstDay: number };
  weekInfo?: { firstDay: number };
  maximize: () => { region?: string };
}

const SUNDAY_FIRST = new Set(["US", "CA", "MX", "BR", "JP", "IL", "IN", "ZA", "PH", "KR", "TW", "HK", "CO", "PE", "VE", "SG"]);
const SATURDAY_FIRST = new Set(["AE", "AF", "BH", "DJ", "DZ", "EG", "IQ", "IR", "JO", "KW", "LY", "OM", "QA", "SD", "SY"]);

/** The day a week starts on in a locale: the browser's own answer where it has one, and a short list of regions where it has not. */
export function firstDayOf(locale: string): WeekStart {
  try {
    const info = new Intl.Locale(locale) as unknown as WeekInfoLocale;
    const week = typeof info.getWeekInfo === "function" ? info.getWeekInfo() : info.weekInfo;
    // The platform counts 1 (Monday) to 7 (Sunday).
    if (week && week.firstDay >= 1 && week.firstDay <= 7) return (week.firstDay % 7) as WeekStart;
    const region = info.maximize().region ?? "";
    return SUNDAY_FIRST.has(region) ? 0 : SATURDAY_FIRST.has(region) ? 6 : 1;
  } catch {
    return 1;
  }
}

export interface DayNames {
  /** Indexed by weekday number: "Monday". */
  long: readonly string[];
  /** "Mon". */
  short: readonly string[];
  /** "M". */
  narrow: readonly string[];
}

/** The names of the seven days in a locale. Formatted from fixed dates in UTC, so the server and the browser agree. */
export function dayNames(locale: string): DayNames {
  const sunday = Date.UTC(2024, 0, 7);
  const name = (weekday: "long" | "short" | "narrow") => {
    const format = new Intl.DateTimeFormat(locale, { weekday, timeZone: "UTC" });
    return Array.from({ length: 7 }, (_, day) => format.format(new Date(sunday + day * 86_400_000)));
  };
  return { long: name("long"), short: name("short"), narrow: name("narrow") };
}

/** The days a preset chooses. */
export const PRESET_DAYS: Readonly<Record<WeekdayPresetKey, readonly number[]>> = {
  weekdays: [1, 2, 3, 4, 5],
  weekend: [6, 0],
  everyday: [0, 1, 2, 3, 4, 5, 6],
};

/** The days as a clean, ascending list: whole numbers from 0 to 6, each once. */
export function normalise(days: readonly number[] | undefined): number[] {
  return [...new Set((days ?? []).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))].sort((a, b) => a - b);
}

export const sameDays = (a: readonly number[], b: readonly number[]): boolean => {
  const left = normalise(a);
  const right = normalise(b);
  return left.length === right.length && left.every((day, index) => day === right[index]);
};

const upperFirst = (text: string, locale: string): string => (text ? text.charAt(0).toLocaleUpperCase(locale) + text.slice(1) : text);

/** Monday first, the order a sentence about days is written in whatever day the week starts on. */
const READING_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

/**
 * The days as a sentence: "Monday to Friday", "Weekends", "Every day",
 * "Tuesday and Thursday", "Monday, Wednesday to Friday and Sunday". A run of
 * three or more days is written as its first and last; the rest are named.
 */
export function describeDays(days: readonly number[], locale: string, words: WeekdayWords, names: DayNames = dayNames(locale)): string {
  const chosen = normalise(days);
  if (chosen.length === 0) return words.none;
  if (chosen.length === 7) return words.everyDay;
  if (sameDays(chosen, PRESET_DAYS.weekend)) return upperFirst(words.weekends, locale);
  const parts: string[] = [];
  let run: number[] = [];
  const flush = () => {
    if (run.length >= 3) parts.push(`${names.long[run[0]!]} ${words.to} ${names.long[run[run.length - 1]!]}`);
    else for (const day of run) parts.push(names.long[day]!);
    run = [];
  };
  for (const day of READING_ORDER) {
    if (chosen.includes(day)) run.push(day);
    else flush();
  }
  flush();
  return upperFirst(new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(parts), locale);
}
