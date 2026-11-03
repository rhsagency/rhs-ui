/**
 * Calendar days for the streak tracker. A day is the string "2026-11-05": a day on the calendar,
 * not a moment, so it never shifts with a time zone. The arithmetic runs in UTC for that reason,
 * and only `todayIn` looks at a clock.
 */

const DAY_MS = 86_400_000;
const PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** 0 for Sunday up to 6 for Saturday. */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Whether the text is a real calendar day, such as "2026-11-05". "2026-02-30" is not. */
export function isDay(value: string | null | undefined): value is string {
  const match = value ? PATTERN.exec(value) : null;
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function toNumber(day: string): number {
  const match = PATTERN.exec(day);
  return Date.UTC(Number(match?.[1]), Number(match?.[2]) - 1, Number(match?.[3])) / DAY_MS;
}

/** The day `count` days after (or, when negative, before) `day`. */
export function addDays(day: string, count: number): string {
  return new Date((toNumber(day) + count) * DAY_MS).toISOString().slice(0, 10);
}

/** 0 for Sunday up to 6 for Saturday. */
export function weekdayOf(day: string): number {
  return new Date(toNumber(day) * DAY_MS).getUTCDay();
}

/** The first day of the week `day` falls in. */
export function startOfWeek(day: string, weekStart: number): string {
  return addDays(day, -((weekdayOf(day) - weekStart + 7) % 7));
}

/** Today's date in the time zone, so the server and the browser agree. An unknown zone falls back to UTC instead of taking the page down. */
export function todayIn(timeZone: string): string {
  const parts = (zone: string) => new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(Date.now());
  let found: Intl.DateTimeFormatPart[];
  try {
    found = parts(timeZone);
  } catch {
    found = parts("UTC");
  }
  const part = (type: string) => found.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** A day written in the reader's language, e.g. `{ weekday: "long" }` or `{ weekday: "narrow" }`. */
export function formatDay(day: string, locale: string, options: Intl.DateTimeFormatOptions): string {
  // Noon, so no zone can tip the day over.
  const at = toNumber(day) * DAY_MS + DAY_MS / 2;
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(at);
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
}

// Where the week starts on Sunday or on Saturday; everywhere else it starts on Monday. From CLDR, for the browsers that cannot say.
const SUNDAY_REGIONS = new Set("AG AS BD BR BS BT BW BZ CA CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW".split(" "));
const SATURDAY_REGIONS = new Set("AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY".split(" "));

/** The first day of the week in a locale: 0 for Sunday, 1 for Monday, 6 for Saturday. The browser's own data when it has it, a table of regions when it does not. */
export function weekStartFor(locale: string): WeekStart {
  try {
    const found = new Intl.Locale(locale) as unknown as { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number }; maximize: () => { region?: string } };
    // The browser counts from 1 (Monday) to 7 (Sunday).
    const first = found.getWeekInfo?.().firstDay ?? found.weekInfo?.firstDay;
    if (typeof first === "number") return (first % 7) as WeekStart;
    const region = found.maximize().region ?? "";
    return SUNDAY_REGIONS.has(region) ? 0 : SATURDAY_REGIONS.has(region) ? 6 : 1;
  } catch {
    return 1;
  }
}

/**
 * How many days in a row are done, counting back from today when today is done and from yesterday when
 * it is not yet: the day is still open, so the streak is still alive. 0 once a whole day was missed.
 */
export function currentStreak(done: ReadonlySet<string>, today: string): number {
  let cursor = done.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (done.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}
