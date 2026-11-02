"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { IconAlertCircle, IconCheck } from "@rhs-ui/icons";
import { asList, DEFAULT_LABELS, inOrder, type ChipOption, type ChipSelectLabels } from "@rhs-ui/primitives/chip-select/choices";
import { cn } from "@/lib/utils";

export type { ChipCounts, ChipOption, ChipSelectLabels } from "@rhs-ui/primitives/chip-select/choices";

interface ChipSelectBase extends Omit<ComponentProps<"fieldset">, "value" | "defaultValue" | "onChange" | "children" | "name" | "dir" | "disabled"> {
  /** The chips, in the order they are shown. They never reorder, whatever is chosen. */
  options: readonly ChipOption[];
  /** What is being chosen: "Topics you follow". It is the legend of the group and names it for a screen reader. */
  legend: string;
  /** Keep the legend for screen readers only, when the page already says it. */
  hideLegend?: boolean;
  /** A line under the legend that says more. */
  description?: ReactNode;
  /** The fewest that must be chosen. The line under the chips says so ("Pick at least 3"); once the group has been left, or a form with it is submitted, a shortfall becomes an error. Default none. */
  min?: number;
  /** The field's name for a plain form submit: one hidden input per chosen value, in the order of the chips. */
  name?: string;
  /** An error from outside, such as a server answer. It replaces the line under the chips and marks the group invalid. */
  error?: string;
  /** Turn every chip off. */
  disabled?: boolean;
  /** The words under the chips, for another language or your own voice. */
  labels?: Partial<ChipSelectLabels>;
}

export interface ChipSelectSingleProps extends ChipSelectBase {
  /** One chip: the group is a radio group, so Tab enters it once and the arrow keys move and choose. This is the default. */
  mode?: "single";
  /** A single choice has no limit to reach: use `mode="multiple"` for one. */
  max?: never;
  /** The chosen value, when you control it. `null` is no choice. */
  value?: string | null;
  /** The value to start with, when you do not control the group. */
  defaultValue?: string | null;
  /** Called with the value of the chip that was chosen. */
  onValueChange?: (value: string) => void;
}

export interface ChipSelectMultipleProps extends ChipSelectBase {
  /** Several chips: each one is a toggle button that says whether it is pressed. */
  mode: "multiple";
  /** The most that can be chosen. Once it is reached the chips that are not chosen turn off, beside a line that says why. Default no limit. */
  max?: number;
  /** The chosen values, when you control them. */
  value?: readonly string[];
  /** The values to start with, when you do not control the group. */
  defaultValue?: readonly string[];
  /** Called with every chosen value, in the order of the chips, whenever a chip is pressed. */
  onValueChange?: (value: string[]) => void;
}

export type ChipSelectProps = ChipSelectSingleProps | ChipSelectMultipleProps;

const CHIP = [
  "relative inline-flex h-9 max-w-full shrink-0 items-center justify-center gap-1.5 rounded-full border border-border bg-background px-3.5 text-sm font-medium whitespace-nowrap text-foreground select-none",
  "cursor-pointer outline-none transition-[background-color,border-color,color,box-shadow,transform] duration-150 motion-reduce:transition-none",
  "enabled:hover:bg-muted enabled:active:translate-y-px",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
  "data-[selected]:border-foreground data-[selected]:bg-foreground data-[selected]:text-background data-[selected]:enabled:hover:bg-foreground/90 data-[selected]:focus-visible:border-foreground",
  "disabled:cursor-not-allowed disabled:opacity-50",
  // On a touch screen the target grows to 44px without moving anything: the chip is 36px and the rows are 8px apart.
  "[@media(pointer:coarse)]:before:absolute [@media(pointer:coarse)]:before:inset-x-0 [@media(pointer:coarse)]:before:-inset-y-[5px] [@media(pointer:coarse)]:before:content-['']",
].join(" ");

/** What is inside a chip: a slot that holds the icon, or opens up for the check, and the label. */
function Face({ option, selected }: { option: ChipOption; selected: boolean }): React.JSX.Element {
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "relative grid h-4 shrink-0 place-items-center overflow-hidden transition-[width,margin] duration-200 ease-out motion-reduce:transition-none",
          option.icon || selected ? "w-4" : "-mr-1.5 w-0",
        )}
      >
        {option.icon ? (
          <span className={cn("col-start-1 row-start-1 grid size-full place-items-center transition-[opacity,scale] duration-200 motion-reduce:transition-none [&>svg]:size-full", selected && "scale-50 opacity-0")}>{option.icon}</span>
        ) : null}
        <IconCheck className={cn("col-start-1 row-start-1 size-full transition-[opacity,scale] duration-200 motion-reduce:transition-none", selected ? "opacity-100" : "scale-50 opacity-0")} />
      </span>
      <span className="min-w-0 truncate">{option.label}</span>
    </>
  );
}

/**
 * A wrapping set of pill chips to choose from: interests, skills, allergens,
 * topics. Choose one and the group is a radio group (Tab enters it once, the
 * arrow keys move and choose); choose several and every chip is a toggle button
 * that says whether it is pressed. A chosen chip draws a check inside it, so the
 * state never rests on the fill alone. With `max`, the chips that are not chosen
 * turn off once the limit is reached, beside a polite line that says so ("Pick up
 * to 5, 5 chosen"); with `min`, the same line states the rule, and a shortfall
 * becomes an error when the group is left or a form with it is submitted. Chips
 * are 36px tall with a 44px touch target and keep the order you pass them.
 */
export function ChipSelect(props: ChipSelectProps) {
  const { options, legend, hideLegend, description, min, max, name, error, disabled, labels, className, mode, value, defaultValue, onValueChange, onBlur, ...rest } = props;
  const text = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const legendId = `${base}-legend`;
  const descriptionId = `${base}-description`;
  const hintId = `${base}-hint`;
  const gate = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLFieldSetElement>(null);
  const [own, setOwn] = useState<readonly string[]>(() => asList(defaultValue));
  const [touched, setTouched] = useState(false);
  const multiple = mode === "multiple";
  // Only values that are still a chip count: a value left over from other options is not a choice.
  const known = new Set(options.map((option) => option.value));
  const chosen = (value !== undefined ? asList(value) : own).filter((item) => known.has(item));
  const count = chosen.length;
  const full = max !== undefined && count >= max;

  const line = text.hint({ mode: multiple ? "multiple" : "single", count, min, max });
  const short = min !== undefined && count < min;
  const failed = Boolean(error) || (touched && short);
  const message = error || line;

  // The browser asks every control in a form whether it is valid when the form is submitted. A group that is short of its minimum says no, and
  // refuses in its own words: the browser's bubble is cancelled and the line under the chips becomes the error.
  useEffect(() => {
    gate.current?.setCustomValidity(short ? line : "");
  }, [short, line]);

  function write(next: readonly string[]) {
    if (value === undefined) setOwn(next);
    if (props.mode === "multiple") props.onValueChange?.(inOrder(options, next));
    else props.onValueChange?.(next[0] ?? "");
  }

  function toggle(optionValue: string) {
    const on = chosen.includes(optionValue);
    if (!on && full) return;
    write(on ? chosen.filter((item) => item !== optionValue) : [...chosen, optionValue]);
  }

  const group = (
    <fieldset
      ref={root}
      data-slot="chip-select"
      data-mode={multiple ? "multiple" : "single"}
      data-invalid={failed || undefined}
      aria-invalid={failed || undefined}
      aria-describedby={[description ? descriptionId : null, message ? hintId : null].filter(Boolean).join(" ") || undefined}
      aria-labelledby={multiple ? undefined : legendId}
      onBlur={(event) => {
        onBlur?.(event);
        if (!event.currentTarget.contains(event.relatedTarget)) setTouched(true);
      }}
      className={cn("relative m-0 min-w-0 border-0 p-0", className)}
      {...rest}
    >
      <legend id={legendId} className={cn("p-0 text-sm font-medium", hideLegend ? "sr-only" : description ? "mb-1" : "mb-3")}>
        {legend}
      </legend>
      {description ? (
        <p id={descriptionId} className={cn("mb-3 text-xs text-muted-foreground", hideLegend && "sr-only")}>
          {description}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const on = chosen.includes(option.value);
          if (!multiple) {
            return (
              <RadioGroupPrimitive.Item key={option.value} value={option.value} disabled={option.disabled} data-slot="chip-select-item" data-selected={on ? "" : undefined} className={CHIP}>
                <Face option={option} selected={on} />
              </RadioGroupPrimitive.Item>
            );
          }
          return (
            <button
              key={option.value}
              type="button"
              data-slot="chip-select-item"
              data-selected={on ? "" : undefined}
              aria-pressed={on}
              disabled={disabled || option.disabled || (!on && full)}
              onClick={() => toggle(option.value)}
              className={CHIP}
            >
              <Face option={option} selected={on} />
            </button>
          );
        })}
      </div>
      <p id={hintId} role="status" aria-live="polite" className={cn("mt-3 flex min-h-5 items-start gap-1.5 text-xs leading-5 empty:hidden", failed ? "font-medium text-destructive" : "text-muted-foreground")}>
        {message ? (
          <>
            {failed ? <IconAlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" /> : null}
            {failed ? <span className="sr-only">{text.errorPrefix}</span> : null}
            <span className="tabular-nums">{message}</span>
          </>
        ) : null}
      </p>
      {multiple && name ? inOrder(options, chosen).map((item) => <input key={item} type="hidden" name={name} value={item} disabled={disabled} />) : null}
      <input
        ref={gate}
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
        disabled={disabled}
        className="sr-only"
        onInvalid={(event) => {
          event.preventDefault();
          setTouched(true);
          root.current?.querySelector<HTMLElement>("button:not(:disabled)")?.focus();
        }}
      />
    </fieldset>
  );

  if (multiple) return group;
  return (
    <RadioGroupPrimitive.Root asChild name={name} value={chosen[0] ?? ""} disabled={disabled} onValueChange={(next) => write([next])}>
      {group}
    </RadioGroupPrimitive.Root>
  );
}
