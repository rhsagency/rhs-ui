"use client";

import type { ReactNode } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { formatMoney, type Money } from "@rhs-ui/commerce/money";
import { cn } from "@/lib/utils";

export interface ShippingOption {
  id: string;
  label: string;
  /** "Tomorrow before 18:00", "2 to 4 working days". */
  eta: string;
  price: Money;
  /** A carrier logo or a glyph. */
  icon?: ReactNode;
  disabled?: boolean;
}

export interface ShippingOptionsProps {
  options: readonly ShippingOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  label?: string;
  locale?: string;
  className?: string;
}

/**
 * How the order travels, as cards you choose one of: name, arrival and price
 * on every card, the chosen one outlined. It is a radio group underneath, so
 * arrow keys move and choose and the whole card is the target.
 */
export function ShippingOptions({ options, value, defaultValue, onValueChange, label = "Shipping method", locale = "en-GB", className }: ShippingOptionsProps) {
  return (
    <RadioGroupPrimitive.Root data-slot="shipping-options" aria-label={label} value={value} defaultValue={defaultValue ?? options.find((option) => !option.disabled)?.id} onValueChange={onValueChange} className={cn("grid gap-2", className)}>
      {options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.id}
          value={option.id}
          disabled={option.disabled}
          className="group flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-left text-sm outline-none transition-[border-color,box-shadow] duration-150 hover:border-foreground/40 focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-foreground data-[state=checked]:shadow-[inset_0_0_0_1px_var(--color-foreground)]"
        >
          <span aria-hidden="true" className="grid size-[18px] shrink-0 place-items-center rounded-full border border-muted-foreground group-data-[state=checked]:border-foreground">
            <span className="size-2 scale-0 rounded-full bg-foreground transition-transform duration-150 group-data-[state=checked]:scale-100" />
          </span>
          {option.icon ? <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground [&_svg]:size-4">{option.icon}</span> : null}
          <span className="grid min-w-0 flex-1 gap-0.5">
            <span className="font-medium">{option.label}</span>
            <span className="text-xs text-muted-foreground">{option.disabled ? "Not available for this address" : option.eta}</span>
          </span>
          <span className="shrink-0 font-medium tabular-nums" suppressHydrationWarning>
            {option.price.amount === 0 ? "Free" : formatMoney(option.price, locale)}
          </span>
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
