"use client";

import type { ReactNode } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { IconCheck } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface RadioCardOption {
  value: string;
  title: string;
  description?: string;
  /** A price, a badge or an icon on the right. */
  aside?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface RadioCardsProps {
  /** Names the group for screen readers. */
  label: string;
  options: readonly RadioCardOption[];
  value: string;
  onValueChange: (value: string) => void;
  columns?: 1 | 2 | 3;
  className?: string;
}

/**
 * One choice from a few rich options, as cards: a plan, a shipping speed, a
 * workspace type. A real radio group (arrow keys move, one tab stop), with
 * the chosen card outlined and checked.
 */
export function RadioCards({ label, options, value, onValueChange, columns = 1, className }: RadioCardsProps) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-cards"
      aria-label={label}
      value={value}
      onValueChange={onValueChange}
      className={cn("grid gap-2", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-3", className)}
    >
      {options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          className="group/card relative flex items-start gap-3 rounded-xl border border-border p-4 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50 data-[state=checked]:border-foreground data-[state=checked]:bg-muted/40"
        >
          {option.icon ? <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background [&_svg]:size-4">{option.icon}</span> : null}
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{option.title}</span>
            {option.description ? <span className="mt-0.5 block text-sm text-muted-foreground">{option.description}</span> : null}
          </span>
          {option.aside ? <span className="text-sm">{option.aside}</span> : null}
          <span aria-hidden="true" className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-background group-data-[state=checked]/card:border-foreground group-data-[state=checked]/card:bg-foreground [&_svg]:size-3">
            <RadioGroupPrimitive.Indicator><IconCheck /></RadioGroupPrimitive.Indicator>
          </span>
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
