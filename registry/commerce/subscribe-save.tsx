"use client";

import { useId } from "react";

import { formatMoney, type Money } from "@rhs-ui/commerce/money";
import { cn } from "@/lib/utils";

export interface SubscribeSaveProps {
  /** The one-off price. */
  price: Money;
  /** Discount for subscribing, as a fraction: 0.1 is 10% off. */
  discount: number;
  /** Delivery intervals in weeks. */
  intervals: readonly number[];
  value: { mode: "once" | "subscribe"; every: number };
  onValueChange: (value: { mode: "once" | "subscribe"; every: number }) => void;
  locale?: string;
  className?: string;
}

/**
 * Buy once or subscribe and save, the way coffee and pet food shops do it:
 * two radio cards with the price each, the subscription showing its saving
 * and a delivery interval that only matters when it is chosen. Prices are
 * worked out in cents, so the discount never rounds the wrong way.
 */
export function SubscribeSave({ price, discount, intervals, value, onValueChange, locale = "en-GB", className }: SubscribeSaveProps) {
  const id = useId();
  const subscribed = { amount: Math.round(price.amount * (1 - discount)), currency: price.currency };
  const card = "relative flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-4 has-[:checked]:border-foreground has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40";
  const dot = "mt-0.5 inline-flex size-4.5 shrink-0 items-center justify-center rounded-full border border-border after:size-2 after:rounded-full after:bg-foreground after:opacity-0 group-has-[:checked]/opt:border-foreground group-has-[:checked]/opt:after:opacity-100";
  return (
    <fieldset data-slot="subscribe-save" className={cn("grid gap-2", className)}>
      <legend className="sr-only">Purchase type</legend>
      <label className={cn(card, "group/opt")}>
        <input type="radio" name={`${id}-mode`} checked={value.mode === "once"} onChange={() => onValueChange({ ...value, mode: "once" })} className="sr-only" />
        <span aria-hidden="true" className={dot} />
        <span className="flex flex-1 items-center justify-between gap-4 text-sm">
          <span className="font-medium">One-time purchase</span>
          <span className="tabular-nums" suppressHydrationWarning>{formatMoney(price, locale)}</span>
        </span>
      </label>
      <label className={cn(card, "group/opt flex-wrap")}>
        <input type="radio" name={`${id}-mode`} checked={value.mode === "subscribe"} onChange={() => onValueChange({ ...value, mode: "subscribe" })} className="sr-only" />
        <span aria-hidden="true" className={dot} />
        <span className="flex min-w-0 flex-1 items-start justify-between gap-4 text-sm">
          <span>
            <span className="block font-medium">Subscribe and save {Math.round(discount * 100)}%</span>
            <span className="mt-0.5 block text-muted-foreground">Skip or cancel any time</span>
          </span>
          <span className="text-right tabular-nums">
            <span className="block" suppressHydrationWarning>{formatMoney(subscribed, locale)}</span>
            <span className="block text-xs text-muted-foreground line-through" suppressHydrationWarning><span className="sr-only">was </span>{formatMoney(price, locale)}</span>
          </span>
        </span>
      </label>
      {value.mode === "subscribe" ? (
        <fieldset className="flex flex-wrap items-center gap-3 px-1 pt-1 text-sm">
          <legend className="float-left mr-3 text-muted-foreground">Deliver every</legend>
          <div className="flex gap-1 rounded-lg bg-muted p-0.5">
            {intervals.map((weeks) => (
              <label key={weeks} className="relative cursor-pointer rounded-md px-2.5 py-1 text-xs has-[:checked]:bg-background has-[:checked]:font-medium has-[:checked]:shadow-sm has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40">
                <input type="radio" name={`${id}-every`} checked={value.every === weeks} onChange={() => onValueChange({ ...value, every: weeks })} className="sr-only" />
                {weeks} {weeks === 1 ? "week" : "weeks"}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
    </fieldset>
  );
}
