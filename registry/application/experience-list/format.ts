/**
 * The dates behind ExperienceList, as plain functions: they hold no state and
 * call no hook, so a Server Component can use them too. A CV is written in
 * months, so a date may be as coarse as "2022-03", and none of it depends on
 * the clock of whoever renders it.
 */

/** A moment: a Date, an ISO string or a timestamp in ms. A string such as "2022-03" or "2022-03-14" is a calendar date, not an instant. */
export type DateInput = Date | string | number;

const MONTH_ONLY = /^(\d{4})-(\d{2})$/;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A date read once: when it is, how it is written in a `time` element and how coarse it was. */
export interface Moment {
  /** Milliseconds since 1970. A calendar date is midnight UTC of that day. */
  at: number;
  /** A calendar date ("2022-03", "2022-03-14"): written in UTC, so it never shifts with a time zone. */
  calendar: boolean;
  /** Only the month was given: "2022-03". */
  monthOnly: boolean;
  /** What a `time` element's datetime holds. */
  iso: string;
}

/** A date from any accepted form, or null when it is not a date at all. */
export function toMoment(input: DateInput): Moment | null {
  if (typeof input === "string") {
    const month = MONTH_ONLY.exec(input.trim());
    if (month) return { at: Date.UTC(Number(month[1]), Number(month[2]) - 1, 1), calendar: true, monthOnly: true, iso: input.trim() };
    if (DATE_ONLY.test(input.trim())) {
      const at = new Date(`${input.trim()}T00:00:00Z`).getTime();
      return Number.isNaN(at) ? null : { at, calendar: true, monthOnly: false, iso: input.trim() };
    }
  }
  const at = new Date(input).getTime();
  return Number.isNaN(at) ? null : { at, calendar: false, monthOnly: false, iso: new Date(at).toISOString() };
}

const formatters = new Map<string, Intl.DateTimeFormat>();

/** A formatter for the locale and zone, kept for the next call. An unknown locale or zone falls back to US English and UTC: a typo must not take the page down. */
function formatter(locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${timeZone}|${JSON.stringify(options)}`;
  let found = formatters.get(key);
  if (!found) {
    try {
      found = new Intl.DateTimeFormat(locale, { ...options, timeZone });
    } catch {
      found = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
    }
    formatters.set(key, found);
  }
  return found;
}

/**
 * A date written in the locale, in the zone ("Mar 2022"). A calendar date is
 * written in UTC whatever the zone. Intl writes some spaces as thin or narrow
 * no-break spaces, and the version of the Unicode data decides which: a plain
 * space looks the same and every engine agrees on it.
 */
export function dateIn(moment: Moment, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  return formatter(locale, moment.calendar ? "UTC" : timeZone, options).format(moment.at).replace(/[\u00a0\u2009\u202f]/g, " ");
}

/** The year, month and day of a date in the zone. */
function dayOf(moment: Moment, timeZone: string): { year: number; month: number; day: number } {
  const parts = formatter("en-US", moment.calendar ? "UTC" : timeZone, { year: "numeric", month: "numeric", day: "numeric" }).formatToParts(moment.at);
  const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value);
  return { year: part("year"), month: part("month"), day: part("day") };
}

/**
 * How many whole months lie between two dates. A month that is only named
 * ("2023-03") as the end counts as worked through, so "Jan 2019 to Mar 2023"
 * is four years and three months, the way a CV reads; between two exact days
 * a month counts once its day has come.
 */
export function monthsBetween(start: Moment, end: Moment, timeZone: string): number {
  const from = dayOf(start, timeZone);
  const to = dayOf(end, timeZone);
  const whole = (to.year - from.year) * 12 + (to.month - from.month);
  return Math.max(0, end.monthOnly ? whole + 1 : whole - (to.day < from.day ? 1 : 0));
}

/** "{count}" and friends in a template, filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

/** The words of a length of time, from templates: "4 yrs 7 mos", "2 yrs", "5 mos", "1 yr 1 mo". Under a month it says `less`. */
export function lengthText(months: number, words: { year: string; years: string; month: string; months: string; less: string }): string {
  if (months < 1) return words.less;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years > 0 ? fill(years === 1 ? words.year : words.years, { count: years }) : "", rest > 0 ? fill(rest === 1 ? words.month : words.months, { count: rest }) : ""].filter(Boolean).join(" ");
}
