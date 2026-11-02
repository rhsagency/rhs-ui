"use client";

import { useId, useRef, useState, type ComponentProps } from "react";
import { Slider as SliderPrimitive } from "radix-ui";

import { percentOf, spokenStep, stopLeft, thinClasses, type Step } from "@rhs-ui/primitives/step-slider/steps";
import { cn } from "@/lib/utils";

export type { Step } from "@rhs-ui/primitives/step-slider/steps";

export interface StepSliderProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** What the slider sets: "Backup frequency". It names the slider for a screen reader and heads the field. */
  label: string;
  /** Keep the label for screen readers only, when the page already says it. */
  hideLabel?: boolean;
  /** The stops, in order. They sit an equal distance apart, however many there are. */
  steps: readonly Step[];
  /** The `value` of the chosen stop, when you control the slider. */
  value?: string;
  /** The stop to start on, when you do not control the slider. Default the first. */
  defaultValue?: string;
  /** Called with the `value` of the stop the knob has moved to. */
  onValueChange?: (value: string) => void;
  /** Write each stop's label under its tick. With `false` the ticks stand alone and the chosen label is written beside the heading instead. Default true. */
  showLabels?: boolean;
  /** The field's name for a plain form submit: the `value` of the chosen stop in one hidden input. */
  name?: string;
  /** Turn the slider off. */
  disabled?: boolean;
}

/** Everything but the first and the last label, and every other one in between: what is left when the labels do not all fit. */
const thinned = (index: number, count: number): boolean => !(index === 0 || index === count - 1 || (index % 2 === 0 && index < count - 2));

/**
 * A slider for choices that have an order but not a number: delivery speed,
 * backup frequency, text size, a plan tier. The knob snaps to evenly spaced
 * stops, each with a tick and its label beneath it, and the track fills up to
 * the chosen one. A screen reader hears the label instead of an index ("Monthly,
 * 2 of 3"), the arrow keys move one stop, Home and End jump to the ends, and
 * pressing a label chooses its stop. Where the container is too narrow for
 * every label, every other one steps aside and the chosen label always stays.
 * What the chosen stop means shows under the track and is read out politely.
 */
export function StepSlider({ label, hideLabel, steps, value, defaultValue, onValueChange, showLabels = true, name, disabled, className, ...props }: StepSliderProps) {
  const base = useId();
  const labelId = `${base}-label`;
  const statusId = `${base}-status`;
  const thumb = useRef<HTMLSpanElement>(null);
  const [own, setOwn] = useState(defaultValue ?? steps[0]?.value ?? "");
  const count = steps.length;
  const chosen = value ?? own;
  const index = Math.max(0, steps.findIndex((step) => step.value === chosen));
  const step = steps[index];
  const thin = thinClasses(count);
  const described = steps.some((item) => item.description);

  if (!step) return null;

  function choose(next: number) {
    const target = steps[next];
    if (!target || target.value === chosen) return;
    if (value === undefined) setOwn(target.value);
    onValueChange?.(target.value);
  }

  return (
    <div data-slot="step-slider" data-disabled={disabled || undefined} className={cn("@container grid w-full min-w-0 gap-0.5", className)} {...props}>
      <div className="flex items-baseline justify-between gap-3">
        <span id={labelId} onClick={() => thumb.current?.focus()} className={cn("min-w-0 text-sm font-medium", hideLabel && "sr-only")}>
          {label}
        </span>
        {showLabels ? null : <span className="shrink-0 text-sm font-medium">{step.label}</span>}
      </div>

      <SliderPrimitive.Root
        min={0}
        max={Math.max(count - 1, 1)}
        step={1}
        value={[index]}
        disabled={disabled}
        onValueChange={([next]) => next !== undefined && choose(next)}
        className="relative flex h-11 w-full touch-none items-center select-none data-[disabled]:opacity-50"
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary" />
        </SliderPrimitive.Track>
        {steps.map((item, at) => (
          <span
            key={item.value}
            aria-hidden="true"
            className={cn("pointer-events-none absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full", at <= index ? "bg-background/70" : "bg-muted-foreground/50")}
            style={{ left: stopLeft(percentOf(at, count)) }}
          />
        ))}
        <SliderPrimitive.Thumb
          ref={thumb}
          aria-labelledby={labelId}
          aria-describedby={described ? statusId : undefined}
          aria-valuetext={spokenStep(step, index, count)}
          className={cn(
            "relative block size-5 cursor-grab rounded-full border-2 border-primary bg-background shadow-sm outline-none transition-[box-shadow,transform] duration-150 active:cursor-grabbing motion-reduce:transition-none",
            "focus-visible:ring-[3px] focus-visible:ring-ring/40",
            // The part you see is 20px; the part that answers a finger is 44px.
            "before:absolute before:-inset-3.5 before:content-['']",
          )}
        />
      </SliderPrimitive.Root>

      {showLabels ? (
        // The slider already says every stop to a screen reader, so the labels are a second way in for a pointer: they choose their stop.
        <div aria-hidden="true" className="relative -mt-1 h-6">
          {steps.map((item, at) => {
            const active = at === index;
            const percent = percentOf(at, count);
            return (
              <button
                key={item.value}
                type="button"
                tabIndex={-1}
                disabled={disabled}
                data-active={active ? "" : undefined}
                onClick={() => {
                  choose(at);
                  thumb.current?.focus();
                }}
                className={cn(
                  "absolute top-0 cursor-pointer rounded-sm px-1 text-xs whitespace-nowrap outline-none transition-colors duration-150 motion-reduce:transition-none disabled:cursor-not-allowed",
                  percent > 0 && percent < 100 ? "-translate-x-1/2" : "px-0",
                  active ? "font-semibold text-foreground" : cn("text-muted-foreground enabled:hover:text-foreground", at === 0 || at === count - 1 ? thin.besideEnd : thin.beside, thinned(at, count) && thin.every),
                )}
                style={percent <= 0 ? { left: 0 } : percent >= 100 ? { right: 0 } : { left: stopLeft(percent) }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {described ? (
        <>
          {/* What the chosen stop means. Every description sits in the same cell, so the field is as tall as the longest and nothing moves when the knob does. */}
          <div aria-hidden="true" className="mt-1.5 grid text-sm text-muted-foreground">
            {steps.map((item, at) => (
              <p key={item.value} className={cn("col-start-1 row-start-1", at !== index && "invisible")}>
                {item.description}
              </p>
            ))}
          </div>
          <span id={statusId} role="status" aria-live="polite" className="sr-only">
            {step.description ?? ""}
          </span>
        </>
      ) : null}
      {name ? <input type="hidden" name={name} value={step.value} disabled={disabled} /> : null}
    </div>
  );
}
