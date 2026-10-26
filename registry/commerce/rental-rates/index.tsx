"use client";

import { useId, useState, type ComponentProps } from "react";

import { IconCheck, IconShieldCheck } from "@rhs-ui/icons";
import { formatMoney } from "@rhs-ui/commerce/money";
import {
  PERIODS,
  PERIOD_DAYS,
  dateOfDay,
  dayOfDate,
  dayOfInput,
  quoteRental,
  utcDateOf,
  windowFor,
  type RentalLine,
  type RentalPeriod,
  type RentalPrices,
} from "@rhs-ui/commerce/rental-rates/pricing";
import { RangeCalendar } from "@rhs-ui/commerce/rental-rates/range-calendar";
import { cn } from "@/lib/utils";

export type { RentalPeriod, RentalPrices } from "@rhs-ui/commerce/rental-rates/pricing";

/** The days of a rental, the way the house date pickers hand them out: Dates at midnight in the reader's time zone. */
export interface RentalRange {
  /** The pick-up day, or null. */
  from: Date | null;
  /** The return day, or null while it is being chosen. */
  to: Date | null;
}

/** The same range as it can be passed in: a Date, or a plain "2026-11-20" that is the same day everywhere. */
export interface RentalRangeInput {
  /** The pick-up day: a Date, a plain "2026-11-20" or null while nothing is picked. */
  from: Date | string | null;
  /** The return day: a Date, a plain "2026-11-20" or null while it is being chosen. */
  to: Date | string | null;
}

export interface RentalRatesLabels {
  /** The heading. */
  title?: string;
  /** The caption of the rate tiles. */
  rates?: string;
  /** The names of the four rates. */
  periods?: Partial<Record<RentalPeriod, string>>;
  /** What each rate covers, under its price. */
  covers?: Partial<Record<RentalPeriod, string>>;
  /** The price of one day of a rate. `{amount}`: "€25.71 / day". */
  perDay?: string;
  /** Said to a screen reader on the rates that are in the total. */
  inTotal?: string;
  /** The caption of the chosen dates. */
  dates?: string;
  /** Before any day is picked. */
  pickDates?: string;
  /** After the pick-up day, when any later day can be the return day. */
  pickReturn?: string;
  /** After the pick-up day, when a booking ends the choice. `{date}` is the last day that can be picked. */
  pickReturnUntil?: string;
  /** Two days. `{from}` and `{to}`. */
  range?: string;
  /** A number of days, for one day. `{count}`. */
  daysOne?: string;
  /** A number of days, for any other number. `{count}`. */
  daysOther?: string;
  /** A line of the breakdown. `{period}`: "Weekend rate". */
  rateName?: string;
  /** A rate in a sentence. `{days}` and `{period}`: "3 days at the weekend rate". */
  atRate?: string;
  /** What the cheapest combination saves. `{what}` and `{amount}`. */
  saves?: string;
  /** Said when no rate covers the days. */
  noRate?: string;
  /** The total row. */
  total?: string;
  /** Said in place of the total until both days are picked. */
  noTotal?: string;
  /** The deposit row. */
  deposit?: string;
  /** Under the deposit: that it is refundable, and not part of the total. */
  depositHint?: string;
  /** Said under the chosen dates when picking a rate moved them to a free stretch. `{from}` and `{to}` are the new days, `{period}` the rate: "Your dates moved to Fri 13 Nov – Sun 15 Nov: the next free stretch for a weekend." */
  moved?: string;
  /** The button to the previous month. */
  previousMonth?: string;
  /** The button to the next month. */
  nextMonth?: string;
  /** Added to the name of the pick-up day in the calendar. */
  pickUp?: string;
  /** Added to the name of the return day in the calendar. */
  returnDay?: string;
  /** Added to the name of a booked day in the calendar. */
  bookedDay?: string;
  /** Added to the name of a day that cannot be picked for another reason. */
  unavailableDay?: string;
  /** The booked days of the month. `{dates}`. */
  bookedList?: string;
  /** Said when nothing is booked in the month on show. `{month}`. */
  nothingBooked?: string;
}

const WORDS = {
  title: "Rental rates",
  rates: "Rates",
  periods: { day: "Day", weekend: "Weekend", week: "Week", month: "Month" },
  covers: { day: "1 day", weekend: "Friday to Sunday", week: "7 days", month: "30 days" },
  perDay: "{amount} / day",
  inTotal: "In your total",
  dates: "Your dates",
  pickDates: "Pick a pick-up day and a return day.",
  pickReturn: "Now pick the return day. Pick the same day to rent for one day.",
  pickReturnUntil: "Now pick the return day. The last day you can pick is {date}, because the day after it is booked.",
  range: "{from} to {to}",
  daysOne: "{count} day",
  daysOther: "{count} days",
  rateName: "{period} rate",
  atRate: "{days} at the {period} rate",
  saves: "{what} saves {amount}.",
  noRate: "None of the rates covers these days.",
  total: "Rental total",
  noTotal: "Pick your dates to see the total.",
  deposit: "Refundable deposit",
  depositHint: "Held when you pick it up and released in full when it comes back undamaged. It is not part of the total.",
  moved: "Your dates moved to {from} – {to}: the next free stretch for a {period}.",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  pickUp: "pick-up day",
  returnDay: "return day",
  bookedDay: "booked",
  unavailableDay: "not available",
  bookedList: "Booked: {dates}.",
  nothingBooked: "Nothing is booked in {month}.",
} satisfies Required<RentalRatesLabels>;

export interface RentalRatesProps extends Omit<ComponentProps<"div">, "children" | "title" | "onChange"> {
  /** The price of one whole period in minor units: `{ day: 3500, weekend: 9000, week: 18000, month: 52000 }`. Leave out the periods you do not offer. */
  rates: RentalPrices;
  /** The chosen days. Pass it, with `onRangeChange`, to control them; without it the component keeps them itself. Days that come from a server are safest as plain "2026-11-20" strings. */
  range?: RentalRangeInput;
  /** The days to start with when the component keeps them itself. */
  defaultRange?: RentalRangeInput;
  /** Called with the new days whenever a day is picked or a rate is chosen. */
  onRangeChange?: (range: RentalRange) => void;
  /** The deposit in minor units. It is shown apart from the total and described as refundable. */
  deposit?: number;
  /** ISO 4217 code for every amount. */
  currency?: string;
  /** Locale for the amounts, the dates and the month names. Always passed, so server and browser agree. */
  locale?: string;
  /** The days that are booked, as Dates or plain "2026-11-20" strings. They are struck through, cannot be picked and are named under the calendar. */
  unavailable?: readonly (Date | string)[];
  /** The first day that can be rented, usually today in the shop's time zone. Earlier days are dimmed and refused. The calendar opens on its month, so pass it from the server and both sides agree. */
  min?: Date | string;
  /** What is rented, under the heading: "Hilti TE 70 rotary hammer". */
  description?: string;
  /** 1 starts the calendar's weeks on a Monday (the default), 0 on a Sunday. */
  weekStartsOn?: 0 | 1;
  /** The words, for another language. */
  labels?: RentalRatesLabels;
}

const fill = (template: string, values: Record<string, string | number>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

/**
 * The prices of a rental, by the day, the weekend, the week and the month, and what the dates a customer picked
 * come to. It finds the cheapest combination of the rates for exactly those days ("3 days at the weekend rate
 * saves €15.00"), shows every rate with what a day costs on it, and keeps the deposit apart from the total and
 * says it is refundable. Booked days are struck through in the calendar, cannot be picked, and are named in
 * words under it; choosing a rate moves the dates to the next stretch where it is free. The total is a polite
 * status, so it is read out whenever the dates change.
 */
export function RentalRates({
  rates,
  range,
  defaultRange,
  onRangeChange,
  deposit,
  currency = "EUR",
  locale = "en-US",
  unavailable = [],
  min,
  description,
  weekStartsOn = 1,
  labels,
  className,
  ...props
}: RentalRatesProps) {
  const words = { ...WORDS, ...labels, periods: { ...WORDS.periods, ...labels?.periods }, covers: { ...WORDS.covers, ...labels?.covers } };
  const id = useId();
  const [own, setOwn] = useState<RentalRangeInput>(defaultRange ?? { from: null, to: null });
  const [notice, setNotice] = useState("");

  const source = range ?? own;
  const fromDay = source.from === null ? null : dayOfInput(source.from);
  const endDay = source.to === null ? null : dayOfInput(source.to);
  const toDay = fromDay !== null && endDay !== null && endDay >= fromDay ? endDay : null;
  const minDay = min === undefined ? null : dayOfInput(min);
  const booked = new Set(unavailable.map(dayOfInput).filter((day): day is number => day !== null));
  const blocked = (day: number) => booked.has(day) || (minDay !== null && day < minDay);
  // While the return day is being chosen, the next booking ends the choice.
  const nextBooked = fromDay !== null && toDay === null ? Math.min(Number.POSITIVE_INFINITY, ...[...booked].filter((day) => day > fromDay)) : Number.POSITIVE_INFINITY;
  const lastPickable = Number.isFinite(nextBooked) ? nextBooked - 1 : null;

  const money = (amount: number) => formatMoney({ amount, currency }, locale);
  const numbers = new Intl.NumberFormat(locale);
  const plural = new Intl.PluralRules(locale);
  const list = new Intl.ListFormat(locale, { style: "long", type: "conjunction" });
  const dayFormat = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  const dayText = (day: number) => dayFormat.format(utcDateOf(day));
  const daysText = (count: number) => fill(plural.select(count) === "one" ? words.daysOne : words.daysOther, { count: numbers.format(count) });
  const periodWord = (period: RentalPeriod) => words.periods[period].toLocaleLowerCase(locale);
  const atRate = (line: RentalLine) => fill(words.atRate, { days: daysText(line.days), period: periodWord(line.period) });

  const quote = fromDay !== null && toDay !== null ? quoteRental(rates, fromDay, toDay) : null;
  const applied = new Set(quote?.lines.map((line) => line.period));
  const selected = quote && quote.lines.length === 1 && quote.lines[0]?.blocks === 1 ? quote.lines[0].period : "";
  const offered = PERIODS.filter((period) => rates[period] !== undefined);
  const saving = quote && quote.saving > 0 ? fill(words.saves, { what: list.format(quote.lines.map(atRate)), amount: money(quote.saving) }) : null;

  const commit = (next: { from: number | null; to: number | null }) => {
    const out: RentalRange = { from: next.from === null ? null : dateOfDay(next.from), to: next.to === null ? null : dateOfDay(next.to) };
    if (range === undefined) setOwn(out);
    onRangeChange?.(out);
  };
  const pick = (day: number) => {
    setNotice("");
    if (fromDay === null || toDay !== null || day < fromDay) return commit({ from: day, to: null });
    if (lastPickable !== null && day > lastPickable) return;
    commit({ from: fromDay, to: day });
  };
  // A rate fills in the dates for one whole period, from the pick-up day if there is one.
  const choose = (period: RentalPeriod) => {
    const today = dayOfDate(new Date());
    const start = Math.max(fromDay ?? today, minDay ?? today);
    const found = windowFor(period, start, blocked);
    if (!found) return;
    commit(found);
    setNotice(fromDay !== null && found.from !== fromDay ? fill(words.moved, { from: dayText(found.from), to: dayText(found.to), period: periodWord(period) }) : "");
  };

  const caption = "text-xs font-medium text-muted-foreground";
  const groupName = `${id}-rate`;

  return (
    <div data-slot="rental-rates" role="group" aria-labelledby={`${id}-title`} className={cn("@container w-full min-w-0 rounded-xl border border-border bg-card text-card-foreground shadow-xs", className)} {...props}>
      <div className="px-5 pt-5">
        <h3 id={`${id}-title`} className="text-base leading-snug font-semibold tracking-[-0.01em]">
          {words.title}
        </h3>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>

      <fieldset className="grid gap-2.5 px-5 pt-4 pb-5">
        <legend className="sr-only">{words.rates}</legend>
        <div className="grid grid-cols-2 gap-2.5 @[34rem]:grid-cols-4">
          {offered.map((period) => {
            const price = rates[period] ?? 0;
            const on = applied.has(period);
            return (
              <label
                key={period}
                className={cn(
                  "relative flex min-w-0 cursor-pointer flex-col gap-0.5 rounded-xl border bg-background p-3.5 transition-[border-color,background-color] duration-150 hover:bg-muted/50 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40 motion-reduce:transition-none",
                  on ? "border-foreground bg-muted/50" : "border-border",
                )}
              >
                <input type="radio" name={groupName} value={period} checked={selected === period} onChange={() => choose(period)} className="sr-only" />
                <span className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
                  {words.periods[period]}
                  {on ? (
                    <span className="text-foreground">
                      <IconCheck aria-hidden="true" className="size-4" />
                      <span className="sr-only">{words.inTotal}</span>
                    </span>
                  ) : null}
                </span>
                <span className="text-xl leading-tight font-semibold tracking-[-0.03em] tabular-nums">{money(price)}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{fill(words.perDay, { amount: money(Math.round(price / PERIOD_DAYS[period])) })}</span>
                <span className="text-xs text-muted-foreground">{words.covers[period]}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-6 border-t border-border p-5 @[42rem]:grid-cols-[auto_minmax(0,1fr)] @[42rem]:gap-8">
        <RangeCalendar
          className="@[42rem]:w-[19.5rem]"
          from={fromDay}
          to={toDay}
          onPick={pick}
          booked={booked}
          min={minDay}
          max={lastPickable}
          locale={locale}
          weekStartsOn={weekStartsOn}
          labels={{
            previous: words.previousMonth,
            next: words.nextMonth,
            pickUp: words.pickUp,
            returnDay: words.returnDay,
            booked: words.bookedDay,
            unavailable: words.unavailableDay,
            bookedList: words.bookedList,
            nothingBooked: words.nothingBooked,
            range: words.range,
          }}
        />

        <div className="grid min-w-0 content-start gap-4 rounded-xl border border-border bg-muted/30 p-4">
          <div>
            <p className={caption}>{words.dates}</p>
            {fromDay === null ? (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{words.pickDates}</p>
            ) : toDay === null ? (
              <>
                <p className="mt-1 text-base font-semibold tracking-[-0.01em]">{dayText(fromDay)}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{lastPickable !== null ? fill(words.pickReturnUntil, { date: dayText(lastPickable) }) : words.pickReturn}</p>
              </>
            ) : (
              <>
                <p className="mt-1 text-base font-semibold tracking-[-0.01em]">{fill(words.range, { from: dayText(fromDay), to: dayText(toDay) })}</p>
                <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">{daysText(toDay - fromDay + 1)}</p>
              </>
            )}
            {/* Beside the dates it explains, not above the calendar: when it appears, nothing the person is looking at moves. The region is always there, empty and without height, so a screen reader is already listening when the words arrive. */}
            <p role="status" className="text-xs leading-relaxed text-muted-foreground [&:not(:empty)]:mt-2">
              {notice}
            </p>
          </div>

          {quote ? (
            <ul className="grid gap-2.5 border-t border-border pt-4">
              {quote.lines.map((line) => (
                <li key={line.period} className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="block font-medium">{fill(words.rateName, { period: words.periods[line.period] })}</span>
                    <span className="block text-xs text-muted-foreground tabular-nums">
                      {daysText(line.days)}
                      {line.blocks > 1 ? ` · ${numbers.format(line.blocks)} × ${money(rates[line.period] ?? 0)}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums">{money(line.amount)}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div role="status" aria-atomic="true" className="grid gap-3 border-t border-border pt-4">
            {saving ? (
              <p className="flex items-start gap-2 text-sm leading-relaxed font-medium">
                <IconCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span className="min-w-0">{saving}</span>
              </p>
            ) : null}
            {fromDay !== null && toDay !== null && !quote ? <p className="text-sm text-muted-foreground">{words.noRate}</p> : null}
            <p className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium">{words.total}</span>
              <span className="text-2xl leading-tight font-semibold tracking-[-0.03em] tabular-nums">
                {quote ? (
                  money(quote.total)
                ) : (
                  <>
                    <span aria-hidden="true">–</span>
                    <span className="sr-only">{words.noTotal}</span>
                  </>
                )}
              </span>
            </p>
          </div>

          {deposit !== undefined && deposit > 0 ? (
            <div className="grid gap-1 border-t border-border pt-4">
              <p className="flex items-baseline justify-between gap-3 text-sm">
                <span className="inline-flex items-center gap-2 font-medium">
                  <IconShieldCheck aria-hidden="true" className="size-4 text-muted-foreground" />
                  {words.deposit}
                </span>
                <span className="tabular-nums">{money(deposit)}</span>
              </p>
              <p className="pl-6 text-xs leading-relaxed text-muted-foreground">{words.depositHint}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
