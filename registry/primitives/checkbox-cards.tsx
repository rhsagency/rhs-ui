"use client";

import { useId, type ReactNode } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface CheckboxCardOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface CheckboxCardsProps {
  legend: string;
  options: readonly CheckboxCardOption[];
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  /** Most that can be picked; the rest disable once it is reached, and the hint says so. */
  max?: number;
  columns?: 1 | 2 | 3;
  name?: string;
  className?: string;
}

/**
 * Pick several from a few rich options: interests, add-ons, integrations
 * to install. Real checkboxes under one legend, cards that outline and
 * check when chosen, and an optional maximum that is explained in words
 * when it is reached instead of silently refusing the click.
 */
export function CheckboxCards({ legend, options, value, onValueChange, max, columns = 2, name, className }: CheckboxCardsProps) {
  const id = useId();
  const full = max !== undefined && value.length >= max;
  const toggle = (option: string) => onValueChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);
  return (
    <fieldset data-slot="checkbox-cards" aria-describedby={max !== undefined ? `${id}-hint` : undefined} className={cn("grid gap-3", className)}>
      <legend className="text-sm font-medium">{legend}</legend>
      {max !== undefined ? <p id={`${id}-hint`} className="-mt-1 text-xs text-muted-foreground" aria-live="polite">{full ? `You picked ${max}, the most for this plan.` : `Pick up to ${max}.`}</p> : null}
      <div className={cn("grid gap-2", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-3")}>
        {options.map((option) => {
          const checked = value.includes(option.value);
          const disabled = option.disabled || (full && !checked);
          return (
            <label key={option.value} className={cn("relative flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-4 transition-colors has-[:checked]:border-foreground has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40", disabled ? "cursor-not-allowed opacity-50" : "hover:bg-muted/50")}>
              <input type="checkbox" name={name} value={option.value} checked={checked} disabled={disabled} onChange={() => toggle(option.value)} className="sr-only" />
              {option.icon ? <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted [&_svg]:size-4.5">{option.icon}</span> : null}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{option.label}</span>
                {option.description ? <span className="mt-0.5 block text-sm text-muted-foreground">{option.description}</span> : null}
              </span>
              <span aria-hidden="true" className={cn("inline-flex size-5 shrink-0 items-center justify-center rounded-md border border-border [&_svg]:size-3.5", checked && "border-foreground bg-foreground text-background")}>{checked ? <IconCheck /> : null}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
