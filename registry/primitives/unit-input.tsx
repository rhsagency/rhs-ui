"use client";

import { useId } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { cn } from "@/lib/utils";

export interface UnitInputProps {
  value: string;
  onValueChange: (value: string) => void;
  unit: string;
  onUnitChange: (unit: string) => void;
  /** The units to choose from: [{ value: "kg", label: "kg" }, ...]. */
  units: readonly { value: string; label: string }[];
  label: string;
  /** Numeric keyboard and the decimal sign of the locale. */
  inputMode?: "decimal" | "numeric";
  placeholder?: string;
  className?: string;
}

/**
 * A number with its unit as one field: weight in kg or lb, size in px or %,
 * a timeout in seconds or minutes. The unit picker is the house select (no
 * native dropdown) joined to the input, and both share one label so a
 * screen reader hears "Weight, 12, kilograms".
 */
export function UnitInput({ value, onValueChange, unit, onUnitChange, units, label, inputMode = "decimal", placeholder, className }: UnitInputProps) {
  const id = useId();
  return (
    <div data-slot="unit-input" className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} id={`${id}-label`} className="text-sm font-medium">{label}</label>
      <div className="flex rounded-md border border-input bg-background shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40">
        <input id={id} value={value} onChange={(event) => onValueChange(event.target.value)} inputMode={inputMode} placeholder={placeholder} className="h-9 min-w-0 flex-1 bg-transparent px-3 text-sm tabular-nums outline-none" />
        <Select value={unit} onValueChange={onUnitChange}>
          <SelectTrigger aria-labelledby={`${id}-label`} aria-label={`${label} unit`} className="h-9 w-auto gap-1 rounded-l-none border-0 border-l border-border bg-muted/40 shadow-none focus-visible:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {units.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
