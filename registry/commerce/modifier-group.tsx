"use client";

import { useId, useRef, useState, type ReactNode } from "react";

import { IconAlertCircle, IconCheck } from "@rhs-ui/icons";
import { formatMoney } from "@rhs-ui/commerce/money";
import { Badge } from "@rhs-ui/primitives/badge";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { RadioGroup, RadioGroupItem } from "@rhs-ui/primitives/radio-group";
import { cn } from "@/lib/utils";

export interface ModifierOption {
  /** Identity, handed back in `value` and `onChange`. */
  id: string;
  /** The option's name: "Oat milk". */
  label: string;
  /** A second line under the label: "Contains nuts". */
  description?: string;
  /** The extra price in minor units: 150 is +1.50. Zero or nothing shows no price. */
  price?: number;
  /** An option that cannot be picked, for example because it is sold out. */
  disabled?: boolean;
  /** Why it is disabled, shown in place of the price: "Sold out". */
  note?: string;
}

export interface ModifierGroupProps {
  /** The group's name: "Choose your crust". It also names the group for a screen reader. */
  title: string;
  /** The choices, in the order they are shown. */
  options: readonly ModifierOption[];
  /** The chosen ids. Controlled: pair it with `onChange`. */
  value?: readonly string[];
  /** The ids chosen to start with. */
  defaultValue?: readonly string[];
  /** The fewest choices. 1 or more makes the group required. Defaults to 0. */
  min?: number;
  /** The most choices. 1 (the default) draws radios; more draws checkboxes that stop at the maximum. Pass `Infinity` for no limit. */
  max?: number;
  /** Called with the chosen ids, in the order of `options`. */
  onChange?: (value: string[]) => void;
  /** ISO 4217 code for the prices. */
  currency?: string;
  /** Locale for the prices. Always passed, so server and browser agree. */
  locale?: string;
  /** Shows the "Choose at least 1" message now, for example after a failed "Add to cart". It also shows after the first change. */
  invalid?: boolean;
  /** Submits the choice with a form: the radio group's name, or the name of every checkbox. */
  name?: string;
  /** Classes for the group's frame, for example a width. */
  className?: string;
}

/** The rule in words: "Choose 1", "Choose up to 2", "Choose 1 to 3", "Choose at least 2". */
function ruleText(min: number, max: number): string {
  if (!Number.isFinite(max)) return min > 0 ? `Choose at least ${min}` : "Choose any";
  if (max === 1) return "Choose 1";
  if (min === max) return `Choose ${max}`;
  return min > 0 ? `Choose ${min} to ${max}` : `Choose up to ${max}`;
}

const row = "flex items-center gap-3 px-4 py-3 transition-colors duration-150 motion-reduce:transition-none";

/**
 * A set of options with rules, for a configurable product or a menu item: a
 * title marked Required or Optional, the rule in words, and options with
 * their extra price. One choice draws radios; more draws checkboxes that
 * disable at the maximum and say why. The running count ("1 of 2") is a
 * polite status, a missing choice reads "Choose at least 1", and a required
 * group shows a check once it is satisfied. It is a real fieldset (a radio
 * group when there is one choice), so the title is read before every option.
 */
export function ModifierGroup({ title, options, value, defaultValue = [], min = 0, max = 1, onChange, currency = "EUR", locale = "en-US", invalid = false, name, className }: ModifierGroupProps) {
  const id = useId();
  const list = useRef<HTMLDivElement>(null);
  const [own, setOwn] = useState<readonly string[]>(defaultValue);
  const [touched, setTouched] = useState(false);
  const chosen = new Set(value ?? own);
  const count = options.filter((option) => chosen.has(option.id)).length;
  const single = max === 1;
  const required = min > 0;
  const atMax = !single && Number.isFinite(max) && count >= max;
  const blockedByMax = atMax && options.some((option) => !chosen.has(option.id) && !option.disabled);
  const showError = (invalid || touched) && (count < min || count > max);
  const ids = { title: `${id}-title`, rule: `${id}-rule`, error: `${id}-error`, note: `${id}-note` };
  const describedBy = [ids.rule, showError ? ids.error : null, blockedByMax ? ids.note : null].filter(Boolean).join(" ");

  function update(next: readonly string[]) {
    const ordered = options.map((option) => option.id).filter((optionId) => next.includes(optionId));
    if (value === undefined) setOwn(ordered);
    setTouched(true);
    onChange?.(ordered);
  }

  /** Clear goes away with the choice, and would take the focus with it: keep the focus in the group, on the option that was just cleared (or the first one that can be picked). */
  function clear() {
    const radios = list.current;
    const target = radios?.querySelector<HTMLElement>('[role="radio"][data-state="checked"]:not(:disabled)') ?? radios?.querySelector<HTMLElement>('[role="radio"]:not(:disabled)');
    update([]);
    target?.focus();
  }

  const price = (option: ModifierOption): ReactNode => {
    if (option.disabled && option.note) return option.note;
    if (!option.price) return null;
    return `${option.price > 0 ? "+" : ""}${formatMoney({ amount: option.price, currency }, locale)}`;
  };

  const surface = cn("m-0 block min-w-0 gap-0 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs [overflow-wrap:anywhere]", showError ? "border-destructive/50" : "border-border", className);

  const content = (
    <>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <p id={ids.title} className="min-w-0 text-[0.9375rem] leading-snug font-semibold tracking-[-0.02em]">
            {title}
          </p>
          {required ? (
            count >= min ? (
              <Badge variant="secondary" className="shrink-0">
                <IconCheck />
                Required
                <span className="sr-only">, done</span>
              </Badge>
            ) : (
              <Badge className="shrink-0">Required</Badge>
            )
          ) : (
            <Badge variant="outline" className="shrink-0">
              Optional
            </Badge>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <p id={ids.rule}>{ruleText(min, max)}</p>
          {single && !required && count > 0 ? (
            <button type="button" onClick={clear} className="rounded-sm underline underline-offset-2 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
              Clear
            </button>
          ) : null}
          {!single ? (
            <p role="status" aria-live="polite" className="tabular-nums">
              {Number.isFinite(max) ? `${count} of ${max}` : `${count} chosen`}
              <span className="sr-only">
                {Number.isFinite(max) ? " chosen" : ""}
                {atMax ? ". Maximum reached." : ""}
              </span>
            </p>
          ) : null}
        </div>
      </div>

      <div ref={list} className="divide-y divide-border border-t border-border">
        {options.map((option) => {
          const key = `${id}-${option.id}`;
          const checked = chosen.has(option.id);
          const blocked = Boolean(option.disabled) || (atMax && !checked);
          const extra = price(option);
          const control = single ? (
            <RadioGroupItem id={key} value={option.id} disabled={option.disabled} aria-labelledby={`${key}-label`} aria-describedby={extra ? `${key}-price` : undefined} />
          ) : (
            <Checkbox
              id={key}
              name={name}
              value={option.id}
              checked={checked}
              disabled={blocked}
              onCheckedChange={(next) => update(next === true ? [...chosen, option.id] : [...chosen].filter((entry) => entry !== option.id))}
              aria-labelledby={`${key}-label`}
              aria-describedby={[extra ? `${key}-price` : null, atMax && !checked && !option.disabled ? ids.note : null].filter(Boolean).join(" ") || undefined}
            />
          );
          return (
            <label key={option.id} htmlFor={key} className={cn(row, blocked ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer hover:bg-muted/50", "has-[[data-state=checked]]:bg-muted/40")}>
              {control}
              <span className="min-w-0 flex-1">
                <span id={`${key}-label`} className="block text-sm leading-snug">
                  {option.label}
                </span>
                {option.description ? <span className="mt-0.5 block text-xs text-muted-foreground">{option.description}</span> : null}
              </span>
              {extra ? (
                <span id={`${key}-price`} className="max-w-[40%] shrink-0 text-right text-sm text-muted-foreground tabular-nums">
                  {extra}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>

      {showError || blockedByMax ? (
        <div className={cn("border-t px-4 py-3 text-xs", showError ? "border-destructive/30" : "border-border bg-muted/40")}>
          {showError ? (
            <p id={ids.error} role="alert" className="flex items-center gap-1.5 font-medium text-destructive">
              <IconAlertCircle size={14} className="shrink-0" />
              {count > max ? `Choose no more than ${max}` : `Choose at least ${min}`}
            </p>
          ) : (
            <p id={ids.note} className="text-muted-foreground">
              That is the most you can choose: {max}. Untick one to pick another.
            </p>
          )}
        </div>
      ) : null}
    </>
  );

  if (single) {
    return (
      // The radio group becomes the fieldset itself, so there is one group to announce, not two nested ones.
      <RadioGroup
        asChild
        data-slot="modifier-group"
        className={surface}
        value={[...chosen][0] ?? ""}
        onValueChange={(next) => update(next ? [next] : [])}
        name={name}
        required={required}
        aria-labelledby={ids.title}
        aria-describedby={describedBy}
        aria-invalid={showError || undefined}
      >
        <fieldset>{content}</fieldset>
      </RadioGroup>
    );
  }
  return (
    <fieldset data-slot="modifier-group" aria-labelledby={ids.title} aria-describedby={describedBy} className={surface}>
      {content}
    </fieldset>
  );
}
