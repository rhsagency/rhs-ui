/** The periods a rental can be priced by. */
export type RentalPeriod = "day" | "weekend" | "week" | "month";

/** The rates of one rental, each the price of one whole period in minor units: 9000 is 90.00. Leave out the periods you do not offer. */
export type RentalPrices = Partial<Record<RentalPeriod, number>>;

/** The periods from the shortest to the longest, which is also the order they are shown in. */
export const PERIODS: readonly RentalPeriod[] = ["day", "weekend", "week", "month"];

/** How many days a whole period covers. A weekend is Friday to Sunday, a month is thirty days. */
export const PERIOD_DAYS: Record<RentalPeriod, number> = { day: 1, weekend: 3, week: 7, month: 30 };

const DAY_MS = 86_400_000;

/**
 * A calendar day as a number: whole days since 1970-01-01. Days are counted in UTC, so adding a day or
 * comparing two days never meets a time zone or a clock change.
 */
export function dayNumber(year: number, month: number, date: number): number {
  return Math.round(Date.UTC(year, month, date) / DAY_MS);
}

/** The day a Date falls on in the reader's own calendar, the way the house Calendar reads it. */
export function dayOfDate(date: Date): number {
  return dayNumber(date.getFullYear(), date.getMonth(), date.getDate());
}

/** A Date, or a plain "2026-11-14" that is the same day everywhere, as a day number. Null when it is not a date. */
export function dayOfInput(value: Date | string): number | null {
  if (typeof value === "string") {
    const plain = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (plain) return dayNumber(Number(plain[1]), Number(plain[2]) - 1, Number(plain[3]));
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : dayOfDate(date);
}

/** The day as a Date at midnight in the reader's own time zone: what the house date pickers hand out. */
export function dateOfDay(day: number): Date {
  const utc = new Date(day * DAY_MS);
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
}

/** The day as a Date at UTC midnight. Write it with an Intl formatter that has timeZone "UTC". */
export function utcDateOf(day: number): Date {
  return new Date(day * DAY_MS);
}

/** 0 is Sunday, 6 is Saturday. */
export function weekdayOf(day: number): number {
  return (((day + 4) % 7) + 7) % 7;
}

/** How many days a rate covers when it starts on `day`. A weekend only starts on a Friday or a Saturday; 0 means it cannot start there. */
export function coverOf(period: RentalPeriod, day: number): number {
  if (period === "weekend") {
    const weekday = weekdayOf(day);
    return weekday === 5 ? 3 : weekday === 6 ? 2 : 0;
  }
  return PERIOD_DAYS[period];
}

/** One line of a quote: a rate, how many times it was used and how many days it paid for. */
export interface RentalLine {
  /** The rate this line is bought at: day, weekend, week or month. */
  period: RentalPeriod;
  /** How many whole periods of this rate were bought. */
  blocks: number;
  /** How many of the rental's days they cover. A week bought for five days covers five. */
  days: number;
  /** In minor units. */
  amount: number;
}

export interface RentalQuote {
  /** Days from pick-up to return, both included. */
  days: number;
  /** The cheapest way to cover them, longest rate first. */
  lines: RentalLine[];
  /** What the lines add up to, in minor units. */
  total: number;
  /** What the same days cost at the day rate alone. Null when there is no day rate. */
  dayRateTotal: number | null;
  /** What the cheapest combination saves against the day rate. 0 when it saves nothing. */
  saving: number;
}

/**
 * The cheapest way to rent from `from` to `to`, both days included. A rate may be bought for fewer days than
 * it covers (a week for five days) when that is the cheaper way; a weekend only starts on a Friday or a
 * Saturday. It is a shortest path over the days, so the answer is the true minimum, and on a tie the plan
 * with the fewest purchases wins. Null when no combination of the rates covers the days.
 */
export function quoteRental(rates: RentalPrices, from: number, to: number): RentalQuote | null {
  const days = to - from + 1;
  if (days < 1) return null;
  const cost = Array.from({ length: days + 1 }, () => Number.POSITIVE_INFINITY);
  const count = Array.from({ length: days + 1 }, () => 0);
  const step: ({ period: RentalPeriod; start: number } | null)[] = Array.from({ length: days + 1 }, () => null);
  cost[0] = 0;
  for (let start = 0; start < days; start++) {
    const here = cost[start] ?? Number.POSITIVE_INFINITY;
    if (here === Number.POSITIVE_INFINITY) continue;
    for (const period of [...PERIODS].reverse()) {
      const price = rates[period];
      const cover = coverOf(period, from + start);
      if (price === undefined || cover === 0) continue;
      const end = Math.min(days, start + cover);
      const next = here + price;
      const blocks = (count[start] ?? 0) + 1;
      if (next < (cost[end] ?? Number.POSITIVE_INFINITY) || (next === cost[end] && blocks < (count[end] ?? 0))) {
        cost[end] = next;
        count[end] = blocks;
        step[end] = { period, start };
      }
    }
  }
  const total = cost[days] ?? Number.POSITIVE_INFINITY;
  if (!Number.isFinite(total)) return null;

  const byPeriod = new Map<RentalPeriod, RentalLine>();
  for (let end = days; end > 0; ) {
    const taken = step[end];
    if (!taken) return null;
    const line = byPeriod.get(taken.period) ?? { period: taken.period, blocks: 0, days: 0, amount: 0 };
    line.blocks += 1;
    line.days += end - taken.start;
    line.amount += rates[taken.period] ?? 0;
    byPeriod.set(taken.period, line);
    end = taken.start;
  }
  const lines = [...byPeriod.values()].sort((a, b) => PERIODS.indexOf(b.period) - PERIODS.indexOf(a.period));
  const dayRateTotal = rates.day === undefined ? null : rates.day * days;
  return { days, lines, total, dayRateTotal, saving: dayRateTotal === null ? 0 : Math.max(0, dayRateTotal - total) };
}

/**
 * The first stretch of days a period fits in, from `start` on, with no blocked day in it. A weekend starts on
 * the first Friday (or the Saturday, when `start` is one); the others start on `start` itself. Looks a year ahead.
 */
export function windowFor(period: RentalPeriod, start: number, blocked: (day: number) => boolean): { from: number; to: number } | null {
  let from = start;
  if (period === "weekend") {
    const weekday = weekdayOf(from);
    if (weekday !== 5 && weekday !== 6) from += (5 - weekday + 7) % 7;
  }
  for (let tries = 0; tries < 370; tries++) {
    const length = coverOf(period, from);
    if (length > 0) {
      let free = true;
      for (let offset = 0; offset < length; offset++) {
        if (blocked(from + offset)) {
          free = false;
          break;
        }
      }
      if (free) return { from, to: from + length - 1 };
    }
    from += period === "weekend" ? 7 : 1;
  }
  return null;
}

/** Groups days that follow each other into runs: [3, 4, 5, 9] becomes [[3, 5], [9, 9]]. */
export function runsOf(days: readonly number[]): [number, number][] {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  const runs: [number, number][] = [];
  for (const day of sorted) {
    const last = runs[runs.length - 1];
    if (last && last[1] === day - 1) last[1] = day;
    else runs.push([day, day]);
  }
  return runs;
}
