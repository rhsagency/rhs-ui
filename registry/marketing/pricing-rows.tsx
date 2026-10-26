"use client";

import { useId, useMemo, useState, type ComponentProps, type ReactNode } from "react";

import { AnimatedNumber } from "@rhs-ui/application/animated-number";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { Badge } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

export type PricingInterval = "monthly" | "yearly";

/** A value that is the same for every billing interval, or differs per interval. */
type PerInterval<T> = T | Partial<Record<PricingInterval, T>>;

export interface PricingRowPlan {
  /** Stable and unique. */
  id: string;
  /** The plan's name: "Team". */
  name: string;
  /** One line on who it is for: "For teams that ship every week". */
  pitch: string;
  /** The key limits in a line: "Up to 10 seats, 50 GB". */
  limits?: string;
  /** What it costs. A number is written as money in `currency`; text ("Free", "Custom") is shown as written. Give an object to price each interval: { monthly: 24, yearly: 19 }. */
  price: PerInterval<number | string>;
  /** What the price is for: "per seat, per month". Give an object to word each interval differently. */
  period?: PerInterval<string>;
  /** The plan's action: a Button or a link styled as one. The recommended plan usually gets the solid one and the rest the outline. Give each an accessible name that includes the plan, such as aria-label="Start 14-day trial, Team plan", so a list of buttons does not read the same words several times. */
  action: ReactNode;
  /** Marks the recommended plan with a badge and a heavier outline. */
  featured?: boolean;
  /** Replaces the badge's text for this plan. */
  badge?: string;
}

export interface PricingRowsLabels {
  /** The badge on the recommended plan. */
  popular: string;
  /** The accessible name of the billing toggle. */
  interval: string;
  /** The monthly option. */
  monthly: string;
  /** The yearly option. */
  yearly: string;
  /** Said once, out loud, when the toggle changes. {interval} stands for the option's name. */
  announce: string;
}

const LABELS: PricingRowsLabels = {
  popular: "Most popular",
  interval: "Billing interval",
  monthly: "Monthly",
  yearly: "Yearly",
  announce: "Showing {interval} prices.",
};

export interface PricingRowsProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The plans, top to bottom. Four to six read well; they are listed, not compared feature by feature. */
  plans: readonly PricingRowPlan[];
  /** A heading above the list. */
  title?: string;
  /** Controlled: the billing interval. The toggle appears when a plan's price depends on it. */
  interval?: PricingInterval;
  /** Uncontrolled: the interval the toggle starts on. Monthly by default. */
  defaultInterval?: PricingInterval;
  /** Called when the reader switches the interval. */
  onIntervalChange?: (interval: PricingInterval) => void;
  /** Said beside the yearly option: "Save 20%". */
  yearlySaving?: string;
  /** A note under the list: what prices exclude, how billing works. */
  note?: ReactNode;
  /** ISO 4217 code for numeric prices. USD by default. */
  currency?: string;
  /** Locale for numbers. */
  locale?: string;
  /** The level of the title: 2 by default. Each plan's name sits one level below it. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<PricingRowsLabels>;
}

/** The value for an interval, whether it is one value for all of them or one per interval. A plan that gives only one interval keeps it for both. */
function pick<T extends number | string>(value: PerInterval<T> | undefined, interval: PricingInterval): T | undefined {
  return typeof value === "object" && value !== null ? (value[interval] ?? value.monthly ?? value.yearly) : value;
}

/**
 * Plans as stacked rows that read like a menu: the plan's name and one line
 * on who it is for, its key limits, the price with what it is for, and the
 * action, divided by hairlines. The recommended plan carries a badge and a
 * heavier outline. Rows scale to five or six tiers without a wall of bullets
 * and leave the detail to a comparison table or a link. On a phone each row
 * stacks name, price and action in that order. With a price for each billing
 * interval a toggle appears, the prices count to their new value, and the
 * change is announced once.
 */
export function PricingRows({
  plans,
  title,
  interval: controlled,
  defaultInterval = "monthly",
  onIntervalChange,
  yearlySaving,
  note,
  currency = "USD",
  locale = "en-US",
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: PricingRowsProps) {
  const labels = { ...LABELS, ...custom };
  const [own, setOwn] = useState<PricingInterval>(defaultInterval);
  const [announcement, setAnnouncement] = useState("");
  const id = useId();
  const current = controlled ?? own;
  const Title = `h${headingLevel}` as "h2" | "h3";
  const Name = `h${headingLevel + 1}` as "h3" | "h4";
  const toggles = plans.some((plan) => typeof plan.price === "object" || typeof plan.period === "object");
  // Stable objects: a new one on every render would restart the number's count.
  const formats = useMemo(() => ({ whole: { style: "currency", currency, maximumFractionDigits: 0 } as Intl.NumberFormatOptions, cents: { style: "currency", currency } as Intl.NumberFormatOptions }), [currency]);

  function change(next: string) {
    const value: PricingInterval = next === "yearly" ? "yearly" : "monthly";
    if (controlled === undefined) setOwn(value);
    onIntervalChange?.(value);
    setAnnouncement(labels.announce.replace("{interval}", (value === "yearly" ? labels.yearly : labels.monthly).toLowerCase()));
  }

  return (
    <section data-slot="pricing-rows" aria-labelledby={title ? `${id}-title` : undefined} className={cn("w-full break-words", className)} {...props}>
      {title || toggles ? (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          {title ? (
            <Title id={`${id}-title`} className="text-2xl leading-tight font-medium tracking-[-0.03em] text-balance sm:text-3xl">
              {title}
            </Title>
          ) : (
            <span />
          )}
          {toggles ? (
            <SegmentedControl
              label={labels.interval}
              value={current}
              onValueChange={change}
              options={[
                { value: "monthly", label: labels.monthly },
                { value: "yearly", label: yearlySaving ? `${labels.yearly} · ${yearlySaving}` : labels.yearly },
              ]}
            />
          ) : null}
        </div>
      ) : null}
      <p role="status" className="sr-only">
        {announcement}
      </p>

      <div className="@container">
        <ul role="list" className="divide-y divide-border rounded-xl border border-border bg-card">
          {plans.map((plan) => {
            const amount = pick(plan.price, current);
            const period = pick(plan.period, current);
            return (
              <li key={plan.id} data-featured={plan.featured || undefined} className={cn("relative", plan.featured && "z-10 rounded-xl bg-muted/50 outline-2 outline-foreground")}>
                <div className="grid gap-x-8 gap-y-5 px-5 py-6 @xl:grid-cols-[minmax(0,1fr)_auto] @4xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_13.5rem_9.5rem] @4xl:items-center @4xl:px-7">
                  <div className="grid min-w-0 gap-y-3 @4xl:contents">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <Name className="text-lg leading-snug font-semibold tracking-[-0.02em]">{plan.name}</Name>
                        {plan.featured ? <Badge>{plan.badge ?? labels.popular}</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{plan.pitch}</p>
                    </div>
                    {plan.limits ? <p className="text-sm leading-relaxed">{plan.limits}</p> : <span aria-hidden="true" className="hidden @4xl:block" />}
                  </div>
                  <div className="grid min-w-0 gap-y-4 @xl:justify-items-end @4xl:contents">
                    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 @xl:flex-col @xl:items-end @xl:gap-y-1 @4xl:items-end">
                      <span className="text-[1.75rem] leading-none font-medium tracking-[-0.04em] tabular-nums">
                        {typeof amount === "number" ? <AnimatedNumber value={amount} locale={locale} format={Number.isInteger(amount) ? formats.whole : formats.cents} /> : amount}
                      </span>
                      {period ? <span className="text-xs text-muted-foreground">{period}</span> : null}
                    </p>
                    <div className="@max-xl:[&>*]:w-full @4xl:justify-self-stretch @4xl:[&>*]:w-full">{plan.action}</div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      {note ? <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{note}</p> : null}
    </section>
  );
}
