"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import { cleanTyping, formatNumber, parseNumber } from "@rhs-ui/application/tiered-rates-editor/tiers";
import { fieldSurface } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

/** How long typing must pause before the number is passed on, in ms. */
const SETTLE = 300;
/** How long it must pause before a number that is not allowed yet is called refused, in ms: a slow typist may be on the way to one that is. */
const PATIENCE = 800;

export interface CellInputProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "prefix"> {
  /** The number, or `null` while the cell is empty. */
  value: number | null;
  /** Called with a number that is accepted once typing pauses, and when the cell is left or Enter is pressed, so what depends on it follows. */
  onValueChange: (value: number | null) => void;
  /**
   * The reason a number is refused, or `null` when it is fine. A refused number is never passed on. `settled` is
   * false while the person is still typing, when only a number that more digits cannot repair should be refused.
   */
  refuse?: (value: number | null, settled: boolean) => string | null;
  /** Told the reason when a number is refused, and `null` when typing is fine again. */
  onRefuse?: (reason: string | null) => void;
  /** Digits after the decimal mark. 0, the default, is whole numbers. */
  decimals?: number;
  locale: string;
  /** A mark after the number: "%". */
  suffix?: string;
}

/**
 * A number in a table cell: quiet text on the field surface, right-aligned in
 * tabular figures. The number is passed on when typing pauses (and when the
 * cell is left or Enter is pressed), so "60" is never passed on as "6" on its
 * way. What was typed is judged by `refuse` only when typing settles, because
 * "7" may be on its way to "75": until then only a number that more digits
 * cannot repair is marked invalid at once, and nothing refused is passed on.
 * Leaving a refused cell shows the last number that was passed on again.
 */
export function CellInput({ value, onValueChange, refuse, onRefuse, decimals = 0, locale, suffix, className, onFocus, onBlur, onKeyDown, ...props }: CellInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [refused, setRefused] = useState(false);
  const pending = useRef<number | undefined>(undefined);
  // The latest callbacks, so a number that waits for typing to pause is judged and passed on by what the editor is now, not by what it was.
  const latest = useRef({ onValueChange, refuse, onRefuse });

  useEffect(() => {
    latest.current = { onValueChange, refuse, onRefuse };
  });
  useEffect(() => () => window.clearTimeout(pending.current), []);

  /** Shows the reason a number is refused, or withdraws it. */
  function say(reason: string | null) {
    setRefused(reason !== null);
    latest.current.onRefuse?.(reason);
  }

  /** Judges a number for good: it is refused with its reason, or passed on. */
  function settle(number: number | null) {
    const reason = latest.current.refuse ? latest.current.refuse(number, true) : null;
    if (reason !== null) {
      say(reason);
    } else {
      say(null);
      latest.current.onValueChange(number);
    }
  }

  function typed(text: string) {
    const clean = cleanTyping(text, decimals);
    const number = parseNumber(clean, decimals);
    const judge = latest.current.refuse;
    setDraft(clean);
    window.clearTimeout(pending.current);
    // Only a number that more digits cannot repair is refused while typing. Anything else is judged when typing pauses, so a valid number never flashes red on its first digits.
    const early = judge ? judge(number, false) : null;
    say(early);
    if (early !== null) return;
    // An emptied cell is judged when it is left: it is most likely about to be typed into.
    if (judge && number === null) return;
    pending.current = window.setTimeout(() => settle(number), judge && judge(number, true) !== null ? PATIENCE : SETTLE);
  }

  return (
    <div
      data-slot="cell-input"
      className={cn(
        fieldSurface,
        "flex h-9 min-w-0 items-center px-3 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40 has-[input[aria-invalid=true]]:border-destructive has-[input:disabled]:opacity-50",
        className,
      )}
    >
      <input
        type="text"
        inputMode={decimals > 0 ? "decimal" : "numeric"}
        autoComplete="off"
        value={draft ?? (value === null ? "" : formatNumber(value, decimals, locale))}
        aria-invalid={refused || undefined}
        onFocus={(event) => {
          const field = event.currentTarget;
          setDraft(value === null ? "" : String(value));
          // After the plain number has replaced the grouped one, so the whole of it is what gets selected.
          requestAnimationFrame(() => field.select());
          onFocus?.(event);
        }}
        onChange={(event) => typed(event.target.value)}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.key !== "Enter" || draft === null) return;
          const number = parseNumber(draft, decimals);
          // Nothing is waiting, so a form around the table may take the Enter. Otherwise Enter settles what was typed, now, and the form does not submit half-way.
          if (number === value && !refused) return;
          event.preventDefault();
          window.clearTimeout(pending.current);
          settle(number);
        }}
        onBlur={(event) => {
          // Leaving the cell judges what was typed if it has not been yet. A refused number is not kept: the cell shows the last good one again, and the reason stays readable.
          window.clearTimeout(pending.current);
          if (draft !== null) {
            const number = parseNumber(draft, decimals);
            if (number !== value) settle(number);
          }
          setDraft(null);
          setRefused(false);
          onBlur?.(event);
        }}
        className="min-w-0 flex-1 bg-transparent text-right tabular-nums outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        {...props}
      />
      {suffix ? (
        <span aria-hidden="true" className="ml-1 text-muted-foreground">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}
