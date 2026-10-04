"use client";

import { useId } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface Swatch {
  value: string;
  /** The colour's name, read out and shown in the tooltip: "Forest green". */
  label: string;
  /** Any CSS colour. */
  color: string;
}

export interface ColorSwatchesProps {
  swatches: readonly Swatch[];
  value: string | null;
  onValueChange: (value: string) => void;
  /** Names the group: "Label colour". */
  label: string;
  size?: "sm" | "md";
  name?: string;
  className?: string;
}

/**
 * A fixed palette to pick from: label colours, theme accents, product
 * finishes. A radio group of round swatches, each with its colour's name for
 * screen readers and in a tooltip, and a check that contrasts with the
 * colour underneath so the choice never relies on a ring alone.
 */
export function ColorSwatches({ swatches, value, onValueChange, label, size = "md", name, className }: ColorSwatchesProps) {
  const id = useId();
  return (
    <fieldset data-slot="color-swatches" className={cn("grid gap-2", className)}>
      <legend className="text-sm font-medium">{label}{value ? <span className="ml-2 font-normal text-muted-foreground">{swatches.find((s) => s.value === value)?.label}</span> : null}</legend>
      <div className="flex flex-wrap gap-2">
        {swatches.map((swatch) => (
          <label key={swatch.value} title={swatch.label} className={cn("relative inline-flex cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-background has-[:checked]:ring-2 has-[:checked]:ring-foreground has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring", size === "sm" ? "size-6" : "size-8")}>
            <input type="radio" name={name ?? id} value={swatch.value} checked={value === swatch.value} onChange={() => onValueChange(swatch.value)} className="sr-only" aria-label={swatch.label} />
            <span aria-hidden="true" className="absolute inset-0 rounded-full border border-black/10" style={{ background: swatch.color }} />
            {value === swatch.value ? <IconCheck aria-hidden="true" className="relative size-3.5 text-white mix-blend-difference" /> : null}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
