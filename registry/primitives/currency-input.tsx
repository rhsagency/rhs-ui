"use client";

import { useEffect, useState, type ComponentProps } from "react";

import { fieldSurface } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type"> {
  /** The amount in minor units (cents), or null when empty. */
  value: number | null;
  onValueChange: (minor: number | null) => void;
  currency?: string;
  /** Fixed, so the server and the browser format the same. */
  locale?: string;
}

/**
 * A money field that thinks in cents: type "12,5" or "12.50" and it reports
 * 1250. The currency symbol sits in the field, and on blur the amount is
 * shown formatted for the locale; while typing it stays out of the way.
 */
export function CurrencyInput({ value, onValueChange, currency = "EUR", locale = "nl-NL", className, onBlur, onFocus, ...props }: CurrencyInputProps) {
  const parts = new Intl.NumberFormat(locale, { style: "currency", currency }).formatToParts(0);
  const symbol = parts.find((part) => part.type === "currency")?.value ?? currency;
  const decimal = parts.find((part) => part.type === "decimal")?.value ?? ".";
  const format = (minor: number | null) => (minor === null ? "" : new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(minor / 100));
  const [text, setText] = useState(format(value));
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setText(format(value));
    // Reformat when the value changes from outside, or when editing ends.
  }, [value, editing, locale]);
  function parse(raw: string): number | null {
    const cleaned = raw.replace(/[^\d.,-]/g, "");
    if (!cleaned) return null;
    // The last separator is the decimal one, whichever the person used.
    const lastSep = Math.max(cleaned.lastIndexOf(","), cleaned.lastIndexOf("."));
    const whole = lastSep === -1 ? cleaned : cleaned.slice(0, lastSep).replace(/[.,]/g, "");
    const fraction = lastSep === -1 ? "" : cleaned.slice(lastSep + 1, lastSep + 3);
    const number = Number(`${whole || "0"}.${fraction.padEnd(2, "0")}`);
    return Number.isFinite(number) ? Math.round(number * 100) : null;
  }
  return (
    <div data-slot="currency-input" className={cn(fieldSurface, "flex h-9 items-center px-3 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40", className)}>
      <span aria-hidden="true" className="mr-2 text-muted-foreground">{symbol}</span>
      <input
        inputMode="decimal"
        autoComplete="off"
        value={text}
        placeholder={`0${decimal}00`}
        onFocus={(event) => { setEditing(true); onFocus?.(event); }}
        onBlur={(event) => { setEditing(false); setText(format(value)); onBlur?.(event); }}
        onChange={(event) => { setText(event.target.value); onValueChange(parse(event.target.value)); }}
        className="min-w-0 flex-1 bg-transparent text-right tabular-nums outline-none placeholder:text-muted-foreground"
        {...props}
      />
      <span className="sr-only">{currency}</span>
    </div>
  );
}
