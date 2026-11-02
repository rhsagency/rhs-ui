"use client";

import { useId, useState, type ComponentProps } from "react";

import { asList, countText, toggleChoice, type ChoiceOption } from "@rhs-ui/primitives/choice-list/choices";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { RadioGroup, RadioGroupItem } from "@rhs-ui/primitives/radio-group";
import { cn } from "@/lib/utils";

export type { ChoiceOption } from "@rhs-ui/primitives/choice-list/choices";

interface ChoiceListBase extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children" | "dir"> {
  /** The rows, in order. */
  options: readonly ChoiceOption[];
  /** The field's name for a plain form submit. Every row is a real control, so a form sends `name=value` for each chosen row, with no hidden input of ours. */
  name?: string;
  /** Turn the whole list off. */
  disabled?: boolean;
  /** What a screen reader is told after a change when several can be chosen. Default "2 selected". */
  countLabel?: (count: number) => string;
}

export interface ChoiceListSingleProps extends ChoiceListBase {
  /** One choice: the rows are radios, the arrow keys move and choose. This is the default. */
  mode?: "single";
  /** The chosen value, when you control it. */
  value?: string | null;
  /** The value to start with, when you do not control the list. */
  defaultValue?: string | null;
  /** Called with the value of the row that was chosen. */
  onValueChange?: (value: string) => void;
}

export interface ChoiceListMultipleProps extends ChoiceListBase {
  /** Several choices: the rows are checkboxes, Space toggles. */
  mode: "multiple";
  /** The chosen values, when you control them. */
  value?: readonly string[];
  /** The values to start with, when you do not control the list. */
  defaultValue?: readonly string[];
  /** Called with the values of all the chosen rows after every change. */
  onValueChange?: (value: string[]) => void;
}

export type ChoiceListProps = ChoiceListSingleProps | ChoiceListMultipleProps;

/**
 * One list for choosing one or several: every row has a label, a line that says more, something before it
 * (an icon, an avatar) and something after it (a price, a count), and the rows are divided by hairlines
 * inside one bordered surface. Choose one and the rows are radios; choose several and they are checkboxes,
 * with an exclusive row ("None of these") that clears the others. The whole row is the click target and at
 * least 44px high. A chosen row shows the control filled, a heavier label and a tint, so it never relies
 * on colour alone, and the number of picks is announced after each change. A row that cannot be chosen
 * can say why in its description. The controls are real inputs, so names and values submit with a form.
 */
export function ChoiceList(props: ChoiceListProps) {
  const { options, name, disabled, countLabel = countText, className, mode, value, defaultValue, onValueChange, ...rest } = props;
  const base = useId();
  const [own, setOwn] = useState<readonly string[]>(() => asList(defaultValue));
  const chosen = value !== undefined ? asList(value) : own;
  const multiple = mode === "multiple";
  // When some rows have media and some (a "None of these") do not, the rows without it keep its room, so the labels stay in one line.
  const anyMedia = options.some((option) => option.media);

  function change(next: string[]) {
    if (value === undefined) setOwn(next);
    if (props.mode === "multiple") props.onValueChange?.(next);
    else props.onValueChange?.(next[0] ?? "");
  }

  const rows = options.map((option, index) => {
    const checked = chosen.includes(option.value);
    const off = disabled || option.disabled;
    const id = `${base}-${index}`;
    const describedBy = [option.description ? `${id}-description` : null, option.trailing ? `${id}-trailing` : null].filter(Boolean).join(" ") || undefined;
    return (
      <div
        key={option.value}
        data-slot="choice-list-item"
        data-state={checked ? "checked" : "unchecked"}
        data-disabled={off || undefined}
        aria-disabled={off || undefined}
        className={cn(
          "group/row relative flex min-h-14 items-center gap-3 border-t border-border px-4 py-3 transition-colors duration-150 first:border-t-0 motion-reduce:transition-none",
          "has-[:focus-visible]:bg-muted/60 data-[state=checked]:bg-muted data-[state=checked]:has-[:focus-visible]:bg-muted",
          !off && "hover:bg-muted/60 data-[state=checked]:hover:bg-muted",
        )}
      >
        {multiple ? (
          <Checkbox
            id={id}
            name={name}
            value={option.value}
            checked={checked}
            disabled={off}
            aria-describedby={describedBy}
            onCheckedChange={(next) => change(toggleChoice(chosen, options, option.value, next === true))}
            className="relative z-10 group-hover/row:enabled:border-foreground"
          />
        ) : (
          <RadioGroupItem id={id} value={option.value} disabled={off} aria-describedby={describedBy} className="relative z-10 group-hover/row:enabled:border-foreground" />
        )}
        {option.media ? (
          <span aria-hidden="true" className="flex shrink-0 items-center justify-center text-muted-foreground group-data-[state=checked]/row:text-foreground group-data-[disabled]/row:opacity-60 [&>svg:not([class*='size-'])]:size-5">
            {option.media}
          </span>
        ) : anyMedia ? (
          <span aria-hidden="true" className="size-5 shrink-0" />
        ) : null}
        <div className="grid min-w-0 flex-1 gap-0.5">
          {/* The label's ::after covers the whole row, so any part of it chooses the row; the control lifts itself above that cover, so a pointer meets the control itself. The description stays at full strength: for a row that cannot be chosen it says why. */}
          <label
            htmlFor={id}
            className="w-fit max-w-full cursor-pointer text-sm leading-5 font-medium select-none after:absolute after:inset-0 after:content-[''] group-data-[disabled]/row:cursor-not-allowed group-data-[disabled]/row:opacity-60 group-data-[state=checked]/row:font-semibold"
          >
            {option.label}
          </label>
          {option.description ? (
            <p id={`${id}-description`} className="text-[0.8125rem] leading-5 text-muted-foreground">
              {option.description}
            </p>
          ) : null}
        </div>
        {option.trailing ? (
          <span
            id={`${id}-trailing`}
            className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground group-data-[state=checked]/row:text-foreground group-data-[disabled]/row:opacity-60"
          >
            {option.trailing}
          </span>
        ) : null}
      </div>
    );
  });

  const surface = cn("overflow-hidden rounded-xl border border-border bg-card shadow-xs", className);

  if (!multiple) {
    return (
      <RadioGroup
        data-slot="choice-list"
        name={name}
        value={chosen[0] ?? ""}
        onValueChange={(next) => change([next])}
        disabled={disabled}
        className={cn(surface, "gap-0")}
        {...rest}
      >
        {rows}
      </RadioGroup>
    );
  }

  return (
    <div data-slot="choice-list" role="group" className={surface} {...rest}>
      {rows}
      <span role="status" className="sr-only">
        {countLabel(chosen.length)}
      </span>
    </div>
  );
}
