"use client";

import { useId } from "react";

import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { cn } from "@/lib/utils";

export interface CheckboxGroupOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface CheckboxGroupProps {
  legend: string;
  options: readonly CheckboxGroupOption[];
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  /** Add a "select all" box with a mixed state above the list. */
  selectAll?: boolean;
  className?: string;
}

/**
 * A set of checkboxes under one legend, with an optional select-all that
 * shows a mixed state when some are picked. A real fieldset, so the legend
 * is read before each option.
 */
export function CheckboxGroup({ legend, options, value, onValueChange, selectAll = false, className }: CheckboxGroupProps) {
  const id = useId();
  const enabled = options.filter((option) => !option.disabled).map((option) => option.value);
  const all = enabled.length > 0 && enabled.every((entry) => value.includes(entry));
  const some = enabled.some((entry) => value.includes(entry));
  return (
    <fieldset data-slot="checkbox-group" className={cn("grid gap-3", className)}>
      <legend className="mb-1 text-sm font-medium">{legend}</legend>
      {selectAll ? (
        <label className="flex items-center gap-2.5 border-b border-border pb-3 text-sm">
          <Checkbox checked={all ? true : some ? "indeterminate" : false} onCheckedChange={() => onValueChange(all ? value.filter((entry) => !enabled.includes(entry)) : [...new Set([...value, ...enabled])])} />
          Select all
        </label>
      ) : null}
      {options.map((option) => (
        <div key={option.value} className="flex items-start gap-2.5">
          <Checkbox
            id={`${id}-${option.value}`}
            checked={value.includes(option.value)}
            disabled={option.disabled}
            onCheckedChange={(checked) => onValueChange(checked === true ? [...value, option.value] : value.filter((entry) => entry !== option.value))}
            aria-describedby={option.description ? `${id}-${option.value}-d` : undefined}
            className="mt-0.5"
          />
          <label htmlFor={`${id}-${option.value}`} className={cn("text-sm", option.disabled && "text-muted-foreground")}>
            {option.label}
            {option.description ? <span id={`${id}-${option.value}-d`} className="block text-muted-foreground">{option.description}</span> : null}
          </label>
        </div>
      ))}
    </fieldset>
  );
}
