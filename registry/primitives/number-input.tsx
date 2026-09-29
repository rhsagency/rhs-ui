"use client";

import { useState, type ComponentProps } from "react";

import { IconMinus, IconPlus } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface NumberInputProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "min" | "max" | "step"> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Formats the number while the field is not focused, e.g. a currency. */
  format?: Intl.NumberFormatOptions;
  locale?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * A number with minus and plus buttons: quantities, seats, nights. Arrow keys
 * step, Page Up and Down step by ten, Home and End jump to the limits, and
 * typing is checked when the field is left. It is a spinbutton for screen
 * readers, with the value and the limits announced.
 */
export function NumberInput({ value, defaultValue = 0, onValueChange, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, step = 1, format, locale = "en-GB", className, disabled, ...props }: NumberInputProps) {
  const [own, setOwn] = useState(defaultValue);
  const [draft, setDraft] = useState<string | null>(null);
  const current = value ?? own;
  const set = (next: number) => {
    const fixed = clamp(Math.round(next / step) * step, min, max);
    if (value === undefined) setOwn(fixed);
    onValueChange?.(fixed);
  };
  const shown = draft ?? (format ? new Intl.NumberFormat(locale, format).format(current) : String(current));
  const button = "grid h-full w-9 shrink-0 place-items-center text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-40";
  return (
    <div data-slot="number-input" className={cn("flex h-9 w-36 items-stretch overflow-hidden rounded-md border border-input bg-background text-sm shadow-xs has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/40", disabled && "opacity-50", className)}>
      <button type="button" tabIndex={-1} aria-hidden="true" disabled={disabled || current <= min} onClick={() => set(current - step)} className={cn(button, "border-r border-input")}>
        <IconMinus size={14} />
      </button>
      <input
        type="text"
        inputMode="decimal"
        role="spinbutton"
        aria-valuenow={current}
        aria-valuemin={Number.isFinite(min) ? min : undefined}
        aria-valuemax={Number.isFinite(max) ? max : undefined}
        disabled={disabled}
        value={shown}
        suppressHydrationWarning
        onFocus={() => setDraft(String(current))}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          const parsed = Number(String(draft ?? "").replace(",", "."));
          if (draft !== null && Number.isFinite(parsed)) set(parsed);
          setDraft(null);
        }}
        onKeyDown={(event) => {
          const moves: Record<string, number> = { ArrowUp: step, ArrowDown: -step, PageUp: step * 10, PageDown: -step * 10 };
          if (event.key in moves) {
            event.preventDefault();
            set(current + moves[event.key]!);
            setDraft(null);
          } else if (event.key === "Home" && Number.isFinite(min)) set(min);
          else if (event.key === "End" && Number.isFinite(max)) set(max);
          else if (event.key === "Enter") event.currentTarget.blur();
        }}
        className="w-full min-w-0 bg-transparent text-center tabular-nums outline-none"
        {...props}
      />
      <button type="button" tabIndex={-1} aria-hidden="true" disabled={disabled || current >= max} onClick={() => set(current + step)} className={cn(button, "border-l border-input")}>
        <IconPlus size={14} />
      </button>
    </div>
  );
}
