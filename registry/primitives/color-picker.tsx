"use client";

import { useId, useState } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export interface ColorPickerProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (hex: string) => void;
  /** The swatches on offer, as #rrggbb. */
  swatches?: readonly string[];
  label?: string;
  name?: string;
  className?: string;
}

const DEFAULT_SWATCHES = ["#111111", "#6b7280", "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0d9488", "#2563eb", "#7c3aed", "#db2777"];
const HEX = /^#([\da-f]{6})$/i;

/**
 * A colour from a set of swatches or typed as a hex code, behind a trigger
 * that shows the current colour. The swatches are a radio group (arrow keys
 * move) and the hex field accepts #rrggbb, checked when you leave it.
 */
export function ColorPicker({ value, defaultValue = DEFAULT_SWATCHES[7]!, onValueChange, swatches = DEFAULT_SWATCHES, label = "Colour", name, className }: ColorPickerProps) {
  const id = useId();
  const [own, setOwn] = useState(defaultValue);
  const current = (value ?? own).toLowerCase();
  const [draft, setDraft] = useState<string | null>(null);
  const set = (hex: string) => {
    const next = hex.toLowerCase();
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };
  return (
    <Popover>
      <PopoverTrigger
        data-slot="color-picker"
        aria-label={`${label}: ${current}`}
        className={cn("inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-2.5 font-mono text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40", className)}
      >
        <span className="size-5 rounded-sm border border-foreground/10" style={{ background: current }} />
        {current}
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3" align="start">
        <div role="radiogroup" aria-label={label} className="grid grid-cols-5 gap-2">
          {swatches.map((hex) => {
            const selected = hex.toLowerCase() === current;
            return (
              <button
                key={hex}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={hex}
                tabIndex={selected || (!swatches.some((s) => s.toLowerCase() === current) && hex === swatches[0]) ? 0 : -1}
                onClick={() => set(hex)}
                onKeyDown={(event) => {
                  const index = swatches.indexOf(hex);
                  const step = { ArrowRight: 1, ArrowDown: 5, ArrowLeft: -1, ArrowUp: -5 }[event.key];
                  if (step === undefined) return;
                  event.preventDefault();
                  const next = swatches[(index + step + swatches.length) % swatches.length]!;
                  set(next);
                  (event.currentTarget.parentElement?.querySelector(`[aria-label="${next}"]`) as HTMLButtonElement | null)?.focus();
                }}
                className="grid aspect-square place-items-center rounded-md border border-foreground/10 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                style={{ background: hex }}
              >
                {selected ? <IconCheck size={14} className="text-white mix-blend-difference" /> : null}
              </button>
            );
          })}
        </div>
        <label htmlFor={`${id}-hex`} className="mt-3 block text-xs text-muted-foreground">
          Hex code
        </label>
        <input
          id={`${id}-hex`}
          value={draft ?? current}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            const typed = (draft ?? "").trim();
            const hex = typed.startsWith("#") ? typed : `#${typed}`;
            if (draft !== null && HEX.test(hex)) set(hex);
            setDraft(null);
          }}
          onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
          spellCheck={false}
          aria-invalid={draft !== null && !HEX.test(draft.startsWith("#") ? draft : `#${draft}`) ? true : undefined}
          className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive"
        />
      </PopoverContent>
      {name ? <input type="hidden" name={name} value={current} /> : null}
    </Popover>
  );
}
