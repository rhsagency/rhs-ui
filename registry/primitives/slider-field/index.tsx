"use client";

import { useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Slider as SliderPrimitive } from "radix-ui";

import { clamp, DEFAULT_LABELS, markLeft, parseNumber, percentOf, plainNumber, snap, type SliderFieldLabels, type SliderMark } from "@rhs-ui/primitives/slider-field/values";
import { cn } from "@/lib/utils";

export type { SliderFieldLabels, SliderMark } from "@rhs-ui/primitives/slider-field/values";

export interface SliderFieldProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** What the slider sets: "Session length". It names the slider for a screen reader and heads the field. */
  label: string;
  /** The value, when you control it. */
  value?: number;
  /** The value to start with, when you do not control the slider. It is also the default: a tick on the track marks it, and Reset goes back to it. */
  defaultValue?: number;
  /** Called with every new value while the knob moves, and when the number field commits one. */
  onValueChange?: (value: number) => void;
  /** Called once when a drag ends or a key press settles, for a save that should not run on every pixel. */
  onValueCommit?: (value: number) => void;
  /** The lowest value. Default 0. */
  min?: number;
  /** The highest value. Default 100. */
  max?: number;
  /** The distance between values, counted from `min`. Default 1. */
  step?: number;
  /** How a value is written: `(v) => v + " min"`. It is used in the readout, at the ends and in what a screen reader hears. Default the plain number, written in `locale`. */
  formatValue?: (value: number) => string;
  /** The language the number field reads and writes numbers in. It decides which sign is the thousands separator and which the decimal one: with "en-US" "3,000" is three thousand and "3.000" is three, with "nl-NL" the other way round. Default "en-US". */
  locale?: string;
  /** Ticks on the track. A number marks a place; `{ value, label }` also writes the label under it. */
  marks?: readonly (number | SliderMark)[];
  /** A line under the slider that says more. It is read with the slider. */
  description?: ReactNode;
  /** Add a number field beside the track for typing the exact value. It follows the slider, and the slider follows it. */
  showInput?: boolean;
  /** The unit written inside the number field, such as "min". */
  unit?: string;
  /** Replaces the label under the left end of the track. Default the formatted minimum. */
  minLabel?: ReactNode;
  /** Replaces the label under the right end of the track. Default the formatted maximum. */
  maxLabel?: ReactNode;
  /** The field's name for a plain form submit: the value in one hidden input. */
  name?: string;
  /** Turn the slider off. */
  disabled?: boolean;
  /** The words of the buttons and the number field, for another language or your own voice. */
  labels?: Partial<SliderFieldLabels>;
}

/**
 * A slider that is ready for a form: the label and the live value share a line
 * above the track, the ends are written below it, and an optional number field
 * beside it types the exact value, so the two always agree (clamped and stepped
 * when you leave the field). The field reads a number the way `locale` writes
 * it: "3,000" is three thousand in en-US and "3.000" is three thousand in
 * nl-NL. A tick on the track marks the default, and a Reset button appears only
 * once the value has moved away from it. The knob says its value through
 * aria-valuetext in your own unit ("45 min"), the readout uses tabular figures
 * so it does not jitter, and the knob has a 44px target even though the part
 * you see is 20px.
 */
export function SliderField({
  label,
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  formatValue: formatProp,
  locale = "en-US",
  marks,
  description,
  showInput = false,
  unit,
  minLabel,
  maxLabel,
  name,
  disabled,
  labels,
  className,
  ...props
}: SliderFieldProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const formatValue = formatProp ?? ((next: number) => plainNumber(next, locale));
  const base = useId();
  const labelId = `${base}-label`;
  const descriptionId = `${base}-description`;
  const defaultId = `${base}-default`;
  const thumb = useRef<HTMLSpanElement>(null);
  const [own, setOwn] = useState(() => snap(defaultValue ?? min, min, max, step));
  const [draft, setDraft] = useState<string | null>(null);
  const current = snap(value ?? own, min, max, step);
  const initial = defaultValue === undefined ? undefined : snap(defaultValue, min, max, step);
  const moved = initial !== undefined && current !== initial;

  function set(next: number) {
    const fixed = snap(next, min, max, step);
    if (fixed === current) return;
    if (value === undefined) setOwn(fixed);
    onValueChange?.(fixed);
  }

  function commit() {
    const parsed = draft === null ? null : parseNumber(draft, locale);
    if (parsed !== null) {
      set(parsed);
      onValueCommit?.(snap(parsed, min, max, step));
    }
    setDraft(null);
  }

  const items = (marks ?? []).map((mark): SliderMark => (typeof mark === "number" ? { value: mark } : mark));
  // The ends always carry a label; a labelled mark at an end takes its place.
  const spots = new Map<number, ReactNode>([
    [min, minLabel ?? formatValue(min)],
    [max, maxLabel ?? formatValue(max)],
  ]);
  for (const mark of items) if (mark.label !== undefined) spots.set(mark.value, mark.label);
  const written = [...spots].sort((a, b) => a[0] - b[0]);

  const describedBy = [description ? descriptionId : null, initial !== undefined ? defaultId : null].filter(Boolean).join(" ") || undefined;
  const readout = formatValue(current);
  // The number field is as wide as the longest number it can hold, so it never clips and never jumps.
  const digits = Math.max(String(min).length, String(max).length);

  return (
    <div data-slot="slider-field" data-disabled={disabled || undefined} className={cn("grid w-full min-w-0 gap-0.5", className)} {...props}>
      <div className="flex items-baseline justify-between gap-3">
        <span id={labelId} onClick={() => thumb.current?.focus()} className="min-w-0 text-sm font-medium">
          {label}
        </span>
        <span className="flex shrink-0 items-baseline gap-3">
          {initial !== undefined ? (
            <button
              type="button"
              inert={!moved || disabled}
              aria-label={text.resetTo(formatValue(initial))}
              title={text.resetTo(formatValue(initial))}
              onClick={() => {
                set(initial);
                onValueCommit?.(initial);
                thumb.current?.focus();
              }}
              className={cn(
                "rounded-sm text-xs font-medium text-muted-foreground underline-offset-4 outline-none transition-[opacity,color] duration-150 hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
                !moved && "invisible opacity-0",
              )}
            >
              {text.reset}
            </button>
          ) : null}
          <span className="text-sm font-medium tabular-nums">{readout}</span>
        </span>
      </div>

      <div className={cn("grid items-start gap-x-4", showInput ? "grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-1")}>
        <div className="min-w-0">
          <SliderPrimitive.Root
            min={min}
            max={max}
            step={step}
            value={[current]}
            disabled={disabled}
            onValueChange={([next]) => next !== undefined && set(next)}
            onValueCommit={([next]) => next !== undefined && onValueCommit?.(next)}
            className="relative flex h-11 w-full touch-none items-center select-none data-[disabled]:opacity-50"
          >
            <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
              <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary" />
            </SliderPrimitive.Track>
            {items.map((mark) => (
              <span
                key={mark.value}
                aria-hidden="true"
                className={cn("pointer-events-none absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full", mark.value <= current ? "bg-background/70" : "bg-muted-foreground/50")}
                style={{ left: markLeft(percentOf(mark.value, min, max)) }}
              />
            ))}
            {initial !== undefined ? (
              <span
                aria-hidden="true"
                data-slot="slider-field-default"
                className="pointer-events-none absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground"
                style={{ left: markLeft(percentOf(initial, min, max)) }}
              />
            ) : null}
            <SliderPrimitive.Thumb
              ref={thumb}
              aria-labelledby={labelId}
              aria-describedby={describedBy}
              aria-valuetext={readout}
              className={cn(
                "relative block size-5 cursor-grab rounded-full border-2 border-primary bg-background shadow-sm outline-none transition-[box-shadow,transform] duration-150 active:cursor-grabbing motion-reduce:transition-none",
                "focus-visible:ring-[3px] focus-visible:ring-ring/40",
                // The part you see is 20px; the part that answers a finger is 44px.
                "before:absolute before:-inset-3.5 before:content-['']",
              )}
            />
          </SliderPrimitive.Root>
          <div aria-hidden="true" className="pointer-events-none relative -mt-1.5 h-5 text-xs text-muted-foreground tabular-nums">
            {written.map(([at, words]) => {
              const percent = percentOf(at, min, max);
              return (
                <span
                  key={at}
                  className={cn("absolute top-0 whitespace-nowrap", percent > 0 && percent < 100 && "-translate-x-1/2")}
                  style={percent <= 0 ? { left: 0 } : percent >= 100 ? { right: 0 } : { left: markLeft(percent) }}
                >
                  {words}
                </span>
              );
            })}
          </div>
        </div>

        {showInput ? (
          <div
            className={cn(
              "mt-1 inline-flex h-9 min-w-[4.5rem] items-center justify-end gap-1 justify-self-end overflow-hidden rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-[border-color,box-shadow] duration-150 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/40 motion-reduce:transition-none",
              disabled && "opacity-50",
            )}
          >
            <input
              type="text"
              role="spinbutton"
              inputMode={Number.isInteger(step) && min >= 0 ? "numeric" : "decimal"}
              aria-label={text.exactValue(label)}
              aria-valuenow={current}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuetext={readout}
              disabled={disabled}
              value={draft ?? plainNumber(current, locale)}
              style={{ width: `calc(${digits}ch + 2px)` }}
              onFocus={(event) => {
                setDraft(plainNumber(current, locale));
                event.currentTarget.select();
              }}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commit}
              onKeyDown={(event) => {
                const moves: Record<string, number> = { ArrowUp: step, ArrowDown: -step, PageUp: step * 10, PageDown: -step * 10 };
                if (event.key in moves) {
                  event.preventDefault();
                  set(clamp((parseNumber(draft ?? "", locale) ?? current) + moves[event.key]!, min, max));
                  setDraft(null);
                } else if (event.key === "Enter") commit();
                else if (event.key === "Escape") setDraft(null);
              }}
              className="h-full min-w-0 bg-transparent p-0 text-right tabular-nums outline-none"
            />
            {unit ? (
              <span aria-hidden="true" className="text-muted-foreground">
                {unit}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {description ? (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
      {initial !== undefined ? (
        <span id={defaultId} className="sr-only">
          {text.defaultIs(formatValue(initial))}
        </span>
      ) : null}
      {name ? <input type="hidden" name={name} value={current} disabled={disabled} /> : null}
    </div>
  );
}
