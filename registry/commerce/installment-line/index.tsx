import type { ComponentProps, ReactNode } from "react";

import { IconInfo } from "@rhs-ui/icons";
import { knownZone, offsetOf, paymentDays, planInstallments, type InstallmentInterval, type InstallmentMoment } from "@rhs-ui/commerce/installment-line/installments";
import { formatMoney } from "@rhs-ui/commerce/money";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export type { InstallmentInterval, InstallmentMoment, InstallmentPlan } from "@rhs-ui/commerce/installment-line/installments";

export interface InstallmentLineLabels {
  /** The line under the price. `{parts}` and `{amount}`: "or pay in 3 × 33.00". */
  line?: string;
  /** The line when the first payment is larger, because the price did not divide evenly. `{first}` is that first payment. */
  lineFirst?: string;
  /** Added to the line when there is a fee. `{fee}`. */
  fee?: string;
  /** What a screen reader hears after the line, as the button that opens the details. */
  details?: string;
  /** The heading of the details. `{parts}`. */
  title?: string;
  /** The first payment, in the details. */
  today?: string;
  total?: string;
  /** Under the total when there is a fee. `{fee}`. */
  feeIncluded?: string;
  /** Under the total when the fee is zero. */
  noFee?: string;
}

const WORDS = {
  line: "or pay in {parts} × {amount}",
  lineFirst: "or pay in {parts} × {amount}, the first {first}",
  fee: "incl. {fee} fee",
  details: "How it works",
  title: "Pay in {parts} parts",
  today: "Today",
  total: "Total",
  feeIncluded: "Includes a {fee} fee.",
  noFee: "No fee.",
} satisfies Required<InstallmentLineLabels>;

export interface InstallmentLineProps extends Omit<ComponentProps<"div">, "children"> {
  /** The price, in minor units: 9900 is 99.00. */
  price: number;
  /** How many payments it is split into. Defaults to 3. */
  parts?: number;
  /** How far apart the payments are: every week, every two weeks or every month. Defaults to "month". */
  interval?: InstallmentInterval;
  /** What paying in parts costs on top, in minor units. It is part of what is split, it is in the line, and the details state it. `0` says there is no fee; leave it out to say nothing. */
  fee?: number;
  /** ISO 4217 code for the amounts. */
  currency?: string;
  /** Always pass your application locale, so the server and the browser print the same text. */
  locale?: string;
  /** The moment the first payment is taken. With it the details give the date of every payment; without it they say how long after the first, and the line stays the same on the server and in the browser. */
  now?: InstallmentMoment;
  /** The time zone the dates are read in. Defaults to "UTC". */
  timeZone?: string;
  /** The lowest price that can be paid in parts. Below it the line is not shown. */
  minPrice?: number;
  /** The highest price that can be paid in parts. Above it the line is not shown. */
  maxPrice?: number;
  /** The small print in the details: who provides the plan, when it is charged, what happens when a payment fails. */
  terms?: ReactNode;
  /** The words, for another language. */
  labels?: InstallmentLineLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
const capitalise = (text: string, locale: string): string => text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);

/**
 * The "or pay in 3 × 33.00" line under a price, and the details behind it. The parts are worked out in minor
 * units so they always add up to the price: what does not divide evenly goes on the first payment, and the line
 * says so. The info button opens the schedule, the total and the small print; a fee is written in the line and in
 * the details, never left out. The line is not shown when the price is outside the range you allow, and it never
 * carries a provider's logo. It has no state of its own, so it renders on the server.
 */
export function InstallmentLine({ price, parts = 3, interval = "month", fee, currency = "EUR", locale = "en-US", now, timeZone = "UTC", minPrice, maxPrice, terms, labels, className, ...props }: InstallmentLineProps) {
  const words = { ...WORDS, ...labels };
  const plan = planInstallments(price, parts, fee ?? 0);
  if (!plan || (minPrice !== undefined && price < minPrice) || (maxPrice !== undefined && price > maxPrice)) return null;

  const money = (amount: number): string => formatMoney({ amount, currency }, locale);
  const figures = { parts: String(parts), amount: money(plan.regular), first: money(plan.first) };
  const hasFee = fee !== undefined && fee > 0;
  const line = `${fill(plan.uneven ? words.lineFirst : words.line, figures)}${hasFee ? `, ${fill(words.fee, { fee: money(fee) })}` : ""}`;
  const heading = fill(words.title, { parts: String(parts) });

  const zone = knownZone(timeZone);
  const days = now === undefined ? null : paymentDays(now, zone, interval, parts);
  const dayFormat = new Intl.DateTimeFormat(locale, { timeZone: "UTC", day: "numeric", month: "short" });
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "always" });
  const when = (index: number): ReactNode => {
    if (index === 0) return words.today;
    const day = days?.[index];
    if (day) return <time dateTime={day.toISOString().slice(0, 10)}>{dayFormat.format(day)}</time>;
    const { unit, value } = offsetOf(interval, index);
    return capitalise(relative.format(value, unit), locale);
  };

  return (
    <div data-slot="installment-line" className={cn("text-sm", className)} {...props}>
      <Popover>
        <PopoverTrigger className="rounded-md py-1 text-left text-muted-foreground tabular-nums outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=open]:text-foreground motion-reduce:transition-none">
          <span className="text-pretty">{line}</span>
          <span className="sr-only"> ({words.details})</span>
          <IconInfo aria-hidden="true" className="ml-1.5 inline size-4 align-[-0.2em]" />
        </PopoverTrigger>
        <PopoverContent align="start" aria-label={heading} className="w-80 max-w-[calc(100vw-2rem)]">
          <p className="text-sm font-medium tracking-[-0.01em]">{heading}</p>
          <ol className="mt-3 divide-y divide-border border-y border-border text-sm">
            {plan.payments.map((amount, index) => (
              <li key={index} className="flex items-center justify-between gap-4 py-2.5">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[0.6875rem] font-medium tabular-nums">
                    {index + 1}
                  </span>
                  <span className="min-w-0">{when(index)}</span>
                </span>
                <span className="font-medium tabular-nums">{money(amount)}</span>
              </li>
            ))}
          </ol>
          <div className="mt-3 flex items-baseline justify-between gap-4 text-sm">
            <span>{words.total}</span>
            <span className="font-semibold tabular-nums">{money(plan.total)}</span>
          </div>
          {hasFee ? <p className="mt-1 text-xs text-muted-foreground">{fill(words.feeIncluded, { fee: money(fee) })}</p> : fee === 0 ? <p className="mt-1 text-xs text-muted-foreground">{words.noFee}</p> : null}
          {terms ? <div className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">{terms}</div> : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
