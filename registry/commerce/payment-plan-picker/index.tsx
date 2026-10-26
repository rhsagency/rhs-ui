"use client";

import { useId, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { IconArrowRight, IconCheck } from "@rhs-ui/icons";
import { AnimatedPrice } from "@rhs-ui/commerce/animated-price";
import { formatMoney } from "@rhs-ui/commerce/money";
import {
  WORDS,
  addMonths,
  amountsOf,
  countOf,
  dayText,
  fill,
  interestOf,
  knownZone,
  monthsAheadText,
  monthsOf,
  todayIn,
  type PaymentPlan,
  type PaymentPlanPickerLabels,
  type PlanMoment,
} from "@rhs-ui/commerce/payment-plan-picker/plans";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { DescriptionList, type DescriptionItem } from "@rhs-ui/primitives/description-list";
import { cn } from "@/lib/utils";

export type { PaymentPlan, PaymentPlanPickerLabels, PlanMoment } from "@rhs-ui/commerce/payment-plan-picker/plans";

export interface PaymentPlanPickerProps extends Omit<ComponentProps<"section">, "children" | "title" | "defaultValue" | "onChange"> {
  /** The price of the order, in minor units: 120000 is 1,200.00. What a plan costs above it is its interest. */
  total: number;
  /** The ways to pay, in the order they are shown. A plan with one payment is "Pay in full". */
  plans: readonly PaymentPlan[];
  /** The chosen plan's id. Pass it with `onValueChange` to control the choice. */
  value?: string;
  /** The plan that starts chosen when you do not control it. Defaults to the first. */
  defaultValue?: string;
  /** Called with the id of the plan that was chosen. */
  onValueChange?: (id: string) => void;
  /** Called by the button under the schedule, with the chosen plan. Without it there is no button. */
  onContinue?: (plan: PaymentPlan) => void;
  /** ISO 4217 code for every amount. */
  currency?: string;
  /** Always pass your application locale, so the server and the browser write the same amounts and dates. */
  locale?: string;
  /** The time zone whose calendar day is "today" for the dates of the schedule. Pass the viewer's, when you know it. Defaults to "UTC". */
  timeZone?: string;
  /** The moment the schedule starts from. Pass it from the server so the first render shows dates; without it the schedule says "In 1 month" until the browser's clock is known, and then turns those into dates. */
  now?: PlanMoment;
  /** What the law makes you say about this credit: a representative example, who provides it, what happens when a payment is missed. It is always on the page, under the schedule, never behind a tooltip. */
  disclosure?: ReactNode;
  /** The heading. Defaults to "Choose how to pay". */
  title?: string;
  /** The line under it. */
  description?: string;
  /** The heading's element: "h2" by default, "h3" inside a section that has its own h2. */
  headingAs?: "h2" | "h3";
  /** The words, for another language. */
  labels?: PaymentPlanPickerLabels;
}

const noSubscription = (): (() => void) => () => undefined;

/** The shop's calendar day: from `now` when you pass it, otherwise the browser's clock once the page has loaded (never on the server, so nothing mismatches). */
function useToday(now: PlanMoment | undefined, zone: string): string | null {
  const given = now === undefined ? null : todayIn(now, zone);
  const clock = useSyncExternalStore(
    noSubscription,
    () => todayIn(Date.now(), zone),
    () => null,
  );
  return given ?? clock;
}

/**
 * Pay in full or in parts, with the cost laid out before anyone commits: every plan is a card with the amount of each
 * payment, the total and whether interest applies, and the schedule of the chosen plan sits beneath it as a real list
 * (today, then one date a month, written in words) that always adds up to the plan's total. The disclosure you pass is
 * on the page, in plain sight, and totals use tabular figures so they line up. It is for shops that offer payments in
 * parts and have to show what they really cost.
 */
export function PaymentPlanPicker({
  total,
  plans,
  value,
  defaultValue,
  onValueChange,
  onContinue,
  currency = "EUR",
  locale = "en-US",
  timeZone = "UTC",
  now,
  disclosure,
  title,
  description,
  headingAs: Heading = "h2",
  labels,
  className,
  ...props
}: PaymentPlanPickerProps) {
  const words = { ...WORDS, ...labels };
  const id = useId();
  const Sub = Heading === "h2" ? "h3" : "h4";
  const zone = knownZone(timeZone);
  const today = useToday(now, zone);
  const [own, setOwn] = useState(defaultValue ?? plans[0]?.id ?? "");
  const chosen = value ?? own;
  const selected = plans.find((plan) => plan.id === chosen) ?? plans[0];

  const numbers = new Intl.NumberFormat(locale);
  const rate = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const money = (amount: number): string => formatMoney({ amount, currency }, locale);

  function choose(next: string) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  /** What a plan is called. */
  const nameOf = (plan: PaymentPlan): string => plan.label ?? (countOf(plan) === 1 ? words.payInFull : fill(words.payments, { count: numbers.format(countOf(plan)) }));

  const header = (
    <header className="grid gap-1.5">
      <Heading id={`${id}-title`} className="text-xl leading-tight font-medium tracking-[-0.03em] text-balance @2xl:text-2xl">
        {title ?? words.title}
      </Heading>
      <p className="max-w-prose text-sm text-pretty text-muted-foreground">{description ?? fill(words.description, { total: money(total) })}</p>
    </header>
  );

  if (!selected) {
    return (
      <section data-slot="payment-plan-picker" aria-labelledby={`${id}-title`} className={cn("@container grid min-w-0 gap-6", className)} {...props}>
        {header}
      </section>
    );
  }

  const count = countOf(selected);
  const amounts = amountsOf(selected);
  const months = monthsOf(selected);
  const interest = interestOf(selected, total);
  const regular = amounts[count - 1] ?? selected.amount;
  const first = amounts[0] ?? regular;
  const hasApr = selected.apr !== undefined && selected.apr > 0;

  const summary: DescriptionItem[] = [
    { term: words.summaryTotal, value: <AnimatedPrice value={selected.total / 100} currency={currency} locale={locale} /> },
    { term: words.summaryInterest, value: interest > 0 ? <span className="tabular-nums">{money(interest)}</span> : words.none },
    ...(hasApr ? [{ term: words.summaryApr, value: <span className="tabular-nums">{rate.format(selected.apr ?? 0)}%</span> }] : []),
  ];

  const status =
    count === 1
      ? fill(words.statusFull, { plan: nameOf(selected), total: money(selected.total) })
      : fill(words.status, { plan: nameOf(selected), amount: money(regular), total: money(selected.total) });

  return (
    <section data-slot="payment-plan-picker" aria-labelledby={`${id}-title`} className={cn("@container grid min-w-0 gap-6", className)} {...props}>
      {header}

      <RadioGroupPrimitive.Root aria-label={words.group} value={selected.id} onValueChange={choose} className="grid gap-2.5">
        {plans.map((plan) => {
          const parts = countOf(plan);
          const cost = interestOf(plan, total);
          const full = parts === 1;
          const planRegular = amountsOf(plan)[parts - 1] ?? plan.amount;
          const badge = full ? null : plan.apr !== undefined && plan.apr > 0 ? fill(words.apr, { apr: rate.format(plan.apr) }) : cost > 0 ? words.interestApplies : words.noInterest;
          const free = badge === words.noInterest;
          return (
            <RadioGroupPrimitive.Item
              key={plan.id}
              value={plan.id}
              className="group/plan grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-4 rounded-xl border border-border bg-card p-4 text-left outline-none transition-[border-color,background-color,box-shadow] duration-150 hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=checked]:border-foreground data-[state=checked]:bg-muted/40 data-[state=checked]:shadow-xs motion-reduce:transition-none @lg:gap-x-5 @lg:p-5"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-muted-foreground bg-background text-background transition-colors duration-150 group-hover/plan:border-foreground group-data-[state=checked]/plan:border-foreground group-data-[state=checked]/plan:bg-foreground motion-reduce:transition-none [&_svg]:size-3"
              >
                <RadioGroupPrimitive.Indicator>
                  <IconCheck />
                </RadioGroupPrimitive.Indicator>
              </span>

              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                  <span className="text-[0.9375rem] leading-snug font-medium">{nameOf(plan)}</span>
                  {badge ? <Badge variant={free ? "default" : "outline"}>{badge}</Badge> : null}
                </span>
                <span className="mt-1 block text-sm leading-snug text-muted-foreground">{full ? words.oneToday : plan.firstPaymentToday === false ? words.firstLater : words.firstToday}</span>
                {!full ? (
                  <span className="mt-1.5 block text-xs text-muted-foreground tabular-nums">
                    {cost > 0 ? fill(words.totalInterestLine, { total: money(plan.total), interest: money(cost) }) : fill(words.totalLine, { total: money(plan.total) })}
                  </span>
                ) : null}
              </span>

              <span className="text-right">
                <span className="block text-lg leading-tight font-medium tracking-[-0.025em] tabular-nums @lg:text-xl">
                  <AnimatedPrice value={(full ? plan.total : planRegular) / 100} currency={currency} locale={locale} />
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{full ? words.today : words.perPayment}</span>
              </span>
            </RadioGroupPrimitive.Item>
          );
        })}
      </RadioGroupPrimitive.Root>

      <div role="group" aria-labelledby={`${id}-schedule`} className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-border px-4 py-3.5 @lg:px-5">
          <Sub id={`${id}-schedule`} className="text-sm font-medium">
            {words.scheduleTitle}
          </Sub>
          {count > 1 ? (
            <p className="text-xs text-muted-foreground tabular-nums">{fill(selected.firstPaymentToday === false ? words.scheduleSummaryLater : words.scheduleSummary, { count: numbers.format(count) })}</p>
          ) : null}
        </header>
        <ol role="list" className="divide-y divide-border">
          {amounts.map((amount, index) => {
            const ahead = months[index] ?? index;
            const day = today && ahead > 0 ? addMonths(today, ahead) : null;
            return (
              <li key={index} className="flex items-center gap-3.5 px-4 py-2.5 text-sm @lg:px-5">
                <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium tabular-nums">
                  {numbers.format(index + 1)}
                </span>
                <span className="min-w-0 flex-1">
                  {ahead === 0 ? words.scheduleToday : day ? <time dateTime={day}>{dayText(day, locale)}</time> : monthsAheadText(ahead, locale)}
                </span>
                <span className="font-medium tabular-nums">{money(amount)}</span>
              </li>
            );
          })}
        </ol>
        {/* The card says "per payment" for the regular amount, so a first payment that is another amount says why, in words, right under the list that shows it. */}
        {count > 1 && first !== regular ? (
          <p className="border-t border-border px-4 py-2.5 text-xs text-pretty text-muted-foreground tabular-nums @lg:px-5">
            {fill(Math.abs(first - regular) < count ? words.firstRounded : words.firstDiffers, { first: money(first), regular: money(regular) })}
          </p>
        ) : null}
        <div className="border-t border-border bg-muted/40 px-4 py-3 @lg:px-5">
          <DescriptionList items={summary} className="divide-y-0 [&>div]:flex [&>div]:items-baseline [&>div]:justify-between [&>div]:gap-4 [&>div]:py-1.5 [&>div]:first:pt-0 [&>div]:last:pb-0" />
        </div>
      </div>

      {onContinue ? (
        <Button type="button" size="lg" onClick={() => onContinue(selected)} className="w-full @lg:w-auto @lg:justify-self-start">
          {words.continue}
          <IconArrowRight />
        </Button>
      ) : null}

      {disclosure ? (
        <div role="note" className="rounded-lg border border-border bg-muted/40 px-4 py-3.5 text-xs leading-relaxed text-pretty text-muted-foreground">
          {disclosure}
        </div>
      ) : null}

      <p role="status" className="sr-only">
        {status}
      </p>
    </section>
  );
}
