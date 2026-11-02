"use client";

import { useEffect, useId, useState, type ChangeEvent, type ComponentProps, type KeyboardEvent } from "react";

import { IconAlertCircle, IconInfo } from "@rhs-ui/icons";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { trackPress, whenReleased } from "@rhs-ui/primitives/number-range-field/blur-guard";
import {
  clamp,
  DEFAULT_LABELS,
  decimalsOf,
  formatNumber,
  isInverted,
  parseNumber,
  roundTo,
  tidyTyping,
  type NumberRange,
  type NumberRangeLabels,
} from "@rhs-ui/primitives/number-range-field/numbers";
import { cn } from "@/lib/utils";

export type { NumberRange, NumberRangeLabels } from "@rhs-ui/primitives/number-range-field/numbers";

type End = "min" | "max";

/**
 * Where the two ends give way to a column: when the group is too narrow for a
 * number and its unit in each end, which is a matter of the group's own width
 * and not of the screen's (a card on a phone is narrower than the phone). The
 * unit takes room in both ends, so the longer it is the sooner the group
 * stacks: a currency code or "km" at 17rem, "months" at 21rem, "kilometres" at
 * 26rem, and no unit at 13rem. Written out in full, because Tailwind reads the
 * class names as they are.
 */
const STACKED = {
  bare: { grid: "@max-[13rem]:grid-cols-1 @max-[13rem]:gap-1.5", to: "@max-[13rem]:justify-self-start @max-[13rem]:pl-1 @max-[13rem]:text-xs" },
  short: { grid: "@max-[17rem]:grid-cols-1 @max-[17rem]:gap-1.5", to: "@max-[17rem]:justify-self-start @max-[17rem]:pl-1 @max-[17rem]:text-xs" },
  medium: { grid: "@max-[21rem]:grid-cols-1 @max-[21rem]:gap-1.5", to: "@max-[21rem]:justify-self-start @max-[21rem]:pl-1 @max-[21rem]:text-xs" },
  long: { grid: "@max-[26rem]:grid-cols-1 @max-[26rem]:gap-1.5", to: "@max-[26rem]:justify-self-start @max-[26rem]:pl-1 @max-[26rem]:text-xs" },
} as const;

/** Which of the `STACKED` widths a unit asks for, by its length. */
const stackFor = (unit: string | undefined) => (!unit ? STACKED.bare : unit.length <= 4 ? STACKED.short : unit.length <= 8 ? STACKED.medium : STACKED.long);

export interface NumberRangeFieldProps extends Omit<ComponentProps<"fieldset">, "defaultValue" | "onChange" | "children" | "name"> {
  /** The range, when you control it. An end that is left open is null. */
  value?: NumberRange;
  /** The range to start with, when you do not control it. */
  defaultValue?: Partial<NumberRange>;
  /** Called with the range whenever it changes and is allowed: an open end is null, and a range whose end is below its start is not reported until it is put right. */
  onValueChange?: (value: NumberRange) => void;
  /** The lowest number either end can hold. Typing below it is brought up when the field is left. */
  min?: number;
  /** The highest number either end can hold. */
  max?: number;
  /** How much an arrow key adds or takes away; with Shift it is ten times as much. Default 1. */
  step?: number;
  /** A unit or currency shown at the end of both fields: "km", "EUR", "kg". */
  unit?: string;
  /** The name of the group, shown above it as its legend: "Mileage". */
  label: string;
  /** Keep `label` for assistive technology only. */
  hideLabel?: boolean;
  /** The locale that writes the numbers and decides what a decimal sign is. Default "en-US". */
  locale?: string;
  /** Write thousands apart (60,000). Turn it off for numbers that are not amounts, such as a year. Default true. */
  grouping?: boolean;
  /** The field's name for a plain form submit: `<name>-min` and `<name>-max`, each a number or empty. */
  name?: string;
  /** The words the field says, for another language or your own voice. */
  labels?: Partial<NumberRangeLabels>;
}

/**
 * From and To for a filter, where either end can stay open. An empty end is
 * valid and reported as null, with a placeholder that says what it means
 * ("No min", "No max"); a number is kept between `min` and `max`, and the
 * arrow keys step it by `step` (ten times as much with Shift) without ever
 * taking the end below the start. An end typed below the start is explained in
 * words when the field is left, and the later field is marked `aria-invalid`
 * until it is right; such a range is never reported. The two fields are one
 * group named by its legend. It is for marketplace and report filters, where a
 * slider would force a minimum and a maximum nobody asked for.
 */
export function NumberRangeField({
  value,
  defaultValue,
  onValueChange,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  unit,
  label,
  hideLabel = false,
  locale = "en-US",
  grouping = true,
  name,
  labels: labelOverrides,
  disabled,
  className,
  ...props
}: NumberRangeFieldProps) {
  const messageId = useId();
  const labels: NumberRangeLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const digits = Math.max(2, decimalsOf(step));
  const allowNegative = min < 0;
  const settle = (parsed: number | null): number | null => (parsed === null ? null : clamp(roundTo(parsed, digits), min, max));
  const show = (number: number) => formatNumber(number, locale, digits, grouping);
  const written = (number: number) => (unit ? `${show(number)} ${unit}` : show(number));

  const [own, setOwn] = useState<NumberRange>({ min: defaultValue?.min ?? null, max: defaultValue?.max ?? null });
  const current = value ?? own;
  const [drafts, setDrafts] = useState<Record<End, string>>(() => ({
    min: current.min === null ? "" : show(current.min),
    max: current.max === null ? "" : show(current.max),
  }));
  const [synced, setSynced] = useState(value ? `${value.min}|${value.max}` : "");
  // Whether the "end below start" message is showing: it appears when a field is left, and goes once the range is right.
  const [flagged, setFlagged] = useState(() => isInverted(current));
  const [note, setNote] = useState<string | null>(null);

  const draftRange = (from: Record<End, string>): NumberRange => ({ min: settle(parseNumber(from.min, locale)), max: settle(parseNumber(from.max, locale)) });
  const typed = draftRange(drafts);
  const inverted = isInverted(typed);

  // A range that arrives from outside replaces what is typed, unless it is only what the typing already means.
  const key = value ? `${value.min}|${value.max}` : "";
  if (value && key !== synced) {
    setSynced(key);
    const replaced = { ...drafts };
    for (const end of ["min", "max"] as const) {
      if (value[end] !== typed[end]) replaced[end] = value[end] === null ? "" : show(value[end]);
    }
    if (replaced.min !== drafts.min || replaced.max !== drafts.max) setDrafts(replaced);
  }

  useEffect(trackPress, []);

  function write(next: NumberRange) {
    if (next.min === current.min && next.max === current.max) return;
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  function change(end: End, event: ChangeEvent<HTMLInputElement>) {
    const text = tidyTyping(event.target.value, allowNegative);
    const next = { ...drafts, [end]: text };
    const range = draftRange(next);
    setDrafts(next);
    setNote(null);
    if (!isInverted(range)) {
      setFlagged(false);
      write(range);
    }
  }

  /** The number is settled: written the locale's way, and a message if it was brought into range or the end is below the start. */
  function commit(end: End) {
    const parsed = parseNumber(drafts[end], locale);
    const settled = settle(parsed);
    const rounded = parsed === null ? null : roundTo(parsed, digits);
    const brought = settled !== null && rounded !== null && rounded !== settled ? (rounded > settled ? labels.capped(written(settled)) : labels.raised(written(settled))) : null;
    const next = { ...drafts, [end]: settled === null ? "" : show(settled) };
    const range = draftRange(next);
    setDrafts(next);
    if (!isInverted(range)) write(range);
    whenReleased(() => {
      setNote(brought);
      setFlagged(isInverted(range));
    });
  }

  function keyDown(end: End, event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    const { key: pressed } = event;
    // The arrow keys never take the end below the start; only typing can.
    const other = end === "min" ? typed.max : typed.min;
    const lo = end === "max" && other !== null ? Math.max(min, other) : min;
    const hi = end === "min" && other !== null ? Math.min(max, other) : max;
    let next: number | undefined;
    if (pressed === "ArrowUp" || pressed === "ArrowDown" || pressed === "PageUp" || pressed === "PageDown") {
      const size = step * (event.shiftKey || pressed.startsWith("Page") ? 10 : 1);
      const from = typed[end] ?? 0;
      next = clamp(roundTo(from + (pressed === "ArrowUp" || pressed === "PageUp" ? size : -size), digits), lo, hi);
    } else if (pressed === "Home" && Number.isFinite(lo)) next = lo;
    else if (pressed === "End" && Number.isFinite(hi)) next = hi;
    else if (pressed === "Enter") commit(end);
    if (next === undefined) return;
    event.preventDefault();
    const range = draftRange({ ...drafts, [end]: show(next) });
    setDrafts({ ...drafts, [end]: show(next) });
    setNote(null);
    setFlagged(false);
    write(range);
  }

  const explained = flagged && inverted ? labels.inverted(written(typed.min ?? 0)) : null;
  const message = explained ?? note;
  const stacked = stackFor(unit);

  function renderEnd(end: End) {
    const settled = typed[end];
    return (
      <InputGroup>
        <InputGroupInput
          type="text"
          role="spinbutton"
          inputMode={digits > 0 ? "decimal" : "numeric"}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={disabled}
          placeholder={end === "min" ? labels.noMin : labels.noMax}
          aria-label={end === "min" ? labels.minName : labels.maxName}
          aria-valuenow={settled ?? undefined}
          aria-valuemin={Number.isFinite(min) ? min : undefined}
          aria-valuemax={Number.isFinite(max) ? max : undefined}
          aria-valuetext={settled === null ? (end === "min" ? labels.noMin : labels.noMax) : written(settled)}
          aria-invalid={end === "max" && explained ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          value={drafts[end]}
          onChange={(event) => change(end, event)}
          onBlur={() => commit(end)}
          onKeyDown={(event) => keyDown(end, event)}
          className="tabular-nums"
        />
        {unit ? <InputGroupAddon aria-hidden="true">{unit}</InputGroupAddon> : null}
      </InputGroup>
    );
  }

  return (
    <fieldset data-slot="number-range-field" disabled={disabled} className={cn("block w-full min-w-0 border-0 p-0", className)} {...props}>
      <legend className={cn("mb-2 p-0 text-sm leading-none font-medium", hideLabel && "sr-only")}>{label}</legend>
      <div className="@container">
        <div className={cn("grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2.5", stacked.grid)}>
          {renderEnd("min")}
          <span aria-hidden="true" className={cn("text-sm text-muted-foreground", stacked.to)}>
            {labels.to}
          </span>
          {renderEnd("max")}
        </div>
      </div>
      <div role="status">
        {message ? (
          <p id={messageId} className={cn("mt-2 flex items-start gap-1.5 text-xs", explained ? "text-destructive" : "text-muted-foreground")}>
            {explained ? <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" /> : <IconInfo aria-hidden="true" className="mt-px size-3.5 shrink-0" />}
            {message}
          </p>
        ) : null}
      </div>
      {name ? (
        <>
          <input type="hidden" name={`${name}-min`} value={current.min === null ? "" : String(current.min)} disabled={disabled} />
          <input type="hidden" name={`${name}-max`} value={current.max === null ? "" : String(current.max)} disabled={disabled} />
        </>
      ) : null}
    </fieldset>
  );
}
