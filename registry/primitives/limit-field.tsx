"use client";

import { useEffect, useId, useRef, useState } from "react";

import { IconInfinity } from "@rhs-ui/icons";
import { NumberInput } from "@rhs-ui/primitives/number-input";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

export interface LimitFieldProps {
  /** The limit, when you control it: a number, or null for no limit. */
  value?: number | null;
  /** The limit to start with, when you do not control it. Null (the default) starts unlimited. */
  defaultValue?: number | null;
  /** Called with the new limit: a number, or null when the switch is turned off. */
  onValueChange?: (value: number | null) => void;
  /** What the switch says. The number is named after it, so "Usage limit" reads as "Usage limit, 100 uses". Default "Limit uses". */
  label?: string;
  /** What is being limited, shown behind the number: "uses", "seats", "GB". Give `{ one, other }` for a word that changes with the number. */
  unit?: string | { one: string; other: string };
  /** The lowest limit. Default 1: a limit of 0 would be no use at all. */
  min?: number;
  /** The highest limit. */
  max?: number;
  /** The number the switch starts at the first time it is turned on. Default 100. */
  defaultLimit?: number;
  /** What the field says while there is no limit. Default "Unlimited". */
  offLabel?: string;
  /** The locale that chooses between the singular and plural of `unit`. Default "en-US". */
  locale?: string;
  /** The field's name for a plain form submit: the limit as a number, or empty while it is unlimited. */
  name?: string;
  /** The id of the number field, so that a form label's `htmlFor` can point at it. */
  id?: string;
  /** Marks the number as not accepted: it gets the error border and says so to assistive technology. Form libraries set it through `FormControl`. */
  "aria-invalid"?: boolean | "true" | "false";
  /** The ids of the elements that describe the number, such as a hint or an error line. */
  "aria-describedby"?: string;
  /** Another name for the number, in place of the switch's label. */
  "aria-label"?: string;
  /** The id of the element that names the number, in place of the switch's label. */
  "aria-labelledby"?: string;
  /** Dim the field and stop it responding. */
  disabled?: boolean;
  /** Classes for the root element. */
  className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * A number that can also be no limit. A switch decides: off, the field says
 * "Unlimited" in muted text; on, a number field with its unit takes its place
 * and the focus. The value is a number or null, never 0 meaning unlimited,
 * which confuses everybody. The last number is remembered, so switching off and
 * on again brings it back. The switch and the number are tied together for
 * assistive technology: the number is named after the switch and read with its
 * unit ("Usage limit, 100 uses"). For usage limits, seats and quotas.
 */
export function LimitField({
  value,
  defaultValue = null,
  onValueChange,
  label = "Limit uses",
  unit,
  min = 1,
  max = Number.POSITIVE_INFINITY,
  defaultLimit = 100,
  offLabel = "Unlimited",
  locale = "en-US",
  name,
  id: numberIdProp,
  "aria-invalid": ariaInvalid,
  "aria-describedby": describedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  disabled,
  className,
}: LimitFieldProps) {
  const id = useId();
  const switchId = `${id}-switch`;
  const labelId = `${id}-label`;
  const numberId = numberIdProp ?? `${id}-number`;
  const offId = `${id}-off`;
  const rejected = ariaInvalid === true || ariaInvalid === "true";
  const [own, setOwn] = useState<number | null>(defaultValue);
  const current = value === undefined ? own : value;
  const limited = current !== null;
  const input = useRef<HTMLInputElement | null>(null);
  // The last number that was a limit, for the next time the switch is turned on.
  const last = useRef(clamp(current ?? defaultLimit, min, max));
  // Only a switch the person turned on takes the focus, not one that starts on.
  const wantsFocus = useRef(false);

  useEffect(() => {
    if (current !== null) last.current = current;
  }, [current]);

  useEffect(() => {
    if (!limited || !wantsFocus.current) return;
    wantsFocus.current = false;
    input.current?.focus({ preventScroll: true });
    input.current?.select();
  }, [limited]);

  function write(next: number | null) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  const word = typeof unit === "string" || unit === undefined ? unit : new Intl.PluralRules(locale).select(current ?? 0) === "one" ? unit.one : unit.other;
  const spoken = limited ? `${current}${word ? ` ${word}` : ""}` : undefined;

  return (
    <div data-slot="limit-field" className={cn("grid w-full min-w-0 grid-cols-1 gap-2", className)}>
      <div className="flex items-center gap-3">
        <Switch
          id={switchId}
          checked={limited}
          disabled={disabled}
          aria-controls={numberId}
          aria-describedby={limited ? undefined : offId}
          onCheckedChange={(on) => {
            wantsFocus.current = on;
            write(on ? clamp(last.current, min, max) : null);
          }}
        />
        <label id={labelId} htmlFor={switchId} className={cn("text-sm font-medium select-none", disabled && "opacity-50")}>
          {label}
        </label>
      </div>
      {/* Both answers share one cell, so the row keeps its height whichever is showing. */}
      <div className="grid pl-14">
        <p
          id={offId}
          aria-hidden={limited || undefined}
          className={cn(
            "col-start-1 row-start-1 flex h-9 items-center gap-2 text-sm text-muted-foreground transition-[opacity,translate] duration-200 motion-reduce:transition-none",
            limited && "pointer-events-none -translate-y-1 opacity-0",
          )}
        >
          <IconInfinity aria-hidden="true" className="size-4" />
          {offLabel}
        </p>
        <div
          inert={!limited}
          className={cn(
            "col-start-1 row-start-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 transition-[opacity,translate] duration-200 motion-reduce:transition-none",
            !limited && "pointer-events-none translate-y-1 opacity-0",
          )}
        >
          <NumberInput
            ref={input}
            id={numberId}
            // Named after the switch, so "Usage limit" reads as "Usage limit, 100 uses", unless the caller names it.
            aria-label={ariaLabel}
            aria-labelledby={labelledBy ?? (ariaLabel ? undefined : labelId)}
            aria-describedby={describedBy}
            aria-invalid={rejected ? true : undefined}
            aria-valuetext={spoken}
            className={cn(rejected && "border-destructive has-[input:focus-visible]:border-destructive has-[input:focus-visible]:ring-destructive/30")}
            disabled={disabled}
            min={min}
            max={max}
            value={current ?? last.current}
            onValueChange={(next) => write(next)}
          />
          {word ? <span className="text-sm text-muted-foreground">{word}</span> : null}
        </div>
      </div>
      {name ? <input type="hidden" name={name} value={current === null ? "" : String(current)} disabled={disabled} /> : null}
    </div>
  );
}
