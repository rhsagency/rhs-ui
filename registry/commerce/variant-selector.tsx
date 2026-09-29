"use client";

import { useId } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

export interface VariantOption {
  /** "Colour", "Size". */
  name: string;
  values: readonly { value: string; label?: string; swatch?: string }[];
}

export interface VariantSelectorProps {
  options: readonly VariantOption[];
  /** The chosen value per option name. */
  value: Readonly<Record<string, string>>;
  onValueChange: (value: Record<string, string>) => void;
  /** Whether a combination can be bought. Values that lead nowhere are struck through but stay choosable. */
  isAvailable?: (selection: Readonly<Record<string, string>>) => boolean;
  className?: string;
}

/**
 * Colour, size and the like: one radio group per option, swatches for
 * colours and chips for the rest, the chosen value named beside the option.
 * A value that is sold out with the rest of the choice is struck through
 * and says so, but can still be chosen, so the reader can find what is.
 */
export function VariantSelector({ options, value, onValueChange, isAvailable, className }: VariantSelectorProps) {
  const id = useId();
  return (
    <div data-slot="variant-selector" className={cn("grid gap-5", className)}>
      {options.map((option) => {
        const chosen = option.values.find((entry) => entry.value === value[option.name]);
        return (
          <div key={option.name} className="grid gap-2">
            <p id={`${id}-${option.name}`} className="text-sm">
              <span className="font-medium">{option.name}</span>
              {chosen ? <span className="text-muted-foreground">: {chosen.label ?? chosen.value}</span> : null}
            </p>
            <RadioGroupPrimitive.Root aria-labelledby={`${id}-${option.name}`} value={value[option.name] ?? ""} onValueChange={(next) => onValueChange({ ...value, [option.name]: next })} className="flex flex-wrap gap-2">
              {option.values.map((entry) => {
                const available = isAvailable ? isAvailable({ ...value, [option.name]: entry.value }) : true;
                const label = entry.label ?? entry.value;
                return entry.swatch ? (
                  <RadioGroupPrimitive.Item
                    key={entry.value}
                    value={entry.value}
                    aria-label={available ? label : `${label}, sold out`}
                    className="relative grid size-9 place-items-center rounded-full border border-border outline-none transition-[box-shadow] duration-150 hover:border-foreground/50 focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=checked]:shadow-[0_0_0_2px_var(--color-background),0_0_0_4px_var(--color-foreground)]"
                  >
                    <span className="size-7 rounded-full shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-foreground)_18%,transparent)]" style={{ background: entry.swatch }} />
                    {!available ? <span aria-hidden="true" className="absolute h-px w-10 -rotate-45 bg-foreground/70" /> : null}
                  </RadioGroupPrimitive.Item>
                ) : (
                  <RadioGroupPrimitive.Item
                    key={entry.value}
                    value={entry.value}
                    aria-label={available ? undefined : `${label}, sold out`}
                    className={cn(
                      "h-9 min-w-12 rounded-md border border-border px-3 text-sm outline-none transition-[border-color,background-color,color] duration-150 hover:border-foreground/50 focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=checked]:border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background",
                      !available && "text-muted-foreground line-through",
                    )}
                  >
                    {label}
                  </RadioGroupPrimitive.Item>
                );
              })}
            </RadioGroupPrimitive.Root>
          </div>
        );
      })}
    </div>
  );
}
