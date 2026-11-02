"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";

import { Collapsible, CollapsibleContent } from "@rhs-ui/primitives/collapsible";
import { Label } from "@rhs-ui/primitives/label";
import { RadioGroup, RadioGroupItem } from "@rhs-ui/primitives/radio-group";
import { cn } from "@/lib/utils";

export interface RadioAccordionOption {
  /** What `value` and `onValueChange` carry, and the identity of the row. */
  value: string;
  /** The name of the option: it is also the name of its radio and of its panel. */
  label: string;
  /** One quiet line under the name: what it is, or what it needs. */
  description?: ReactNode;
  /** Short text at the end of the row, in words: "Free", "Instant", "4.95". It is read out after the description. */
  trailing?: ReactNode;
  /** A small picture in front of the name. Decoration: the name carries the meaning. */
  icon?: ReactNode;
  /** What opens under the row while this option is the chosen one: a form, instructions, a select. A row without content opens nothing. */
  content?: ReactNode;
  /** Turns the option off: its row dims and its radio cannot be chosen. */
  disabled?: boolean;
}

export interface RadioAccordionProps extends Omit<ComponentProps<typeof RadioGroup>, "children" | "value" | "defaultValue" | "onValueChange"> {
  /** The rows, in the order they are shown. Each is a radio and, when it has `content`, a panel that opens beneath it while it is the chosen one. */
  options: readonly RadioAccordionOption[];
  /** The chosen option's value, to control the group. An empty string or a value that is not in `options` means none is chosen. */
  value?: string;
  /** The option chosen to start with, when you do not control the group. */
  defaultValue?: string;
  /** Called with the `value` of the option that was chosen. */
  onValueChange?: (value: string) => void;
  /** Names the group for a screen reader: "Payment method". Or name it with `aria-labelledby`. */
  label?: string;
}

/**
 * Methods to choose between, as radio rows where the chosen one opens its own panel underneath and the others stay
 * shut: pay by card (the card fields), pay by bank transfer (the instructions), collect in store (a store select).
 * It is one radio group, so arrow keys choose and move the focus, Tab leaves the group, and each panel is a region
 * labelled by its row. A closed panel is not in the page, so its fields cannot be reached with Tab and a required
 * field in it never blocks a form; keep what is typed in state of your own, as the demo does. The height animates
 * and is instant under reduced motion, and the focus never moves into a panel by itself.
 */
export function RadioAccordion({ options, value, defaultValue = "", onValueChange, label, className, ...props }: RadioAccordionProps) {
  const id = useId();
  const [own, setOwn] = useState(defaultValue);
  const current = value ?? own;

  return (
    <RadioGroup
      data-slot="radio-accordion"
      aria-label={label}
      value={current}
      onValueChange={(next) => {
        if (value === undefined) setOwn(next);
        onValueChange?.(next);
      }}
      className={cn("@container min-w-0 gap-0 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs", className)}
      {...props}
    >
      {options.map((option, index) => {
        const chosen = option.value === current;
        const base = `${id}-${index}`;
        const describedBy = [option.description ? `${base}-description` : null, option.trailing ? `${base}-trailing` : null].filter(Boolean).join(" ") || undefined;
        return (
          <Collapsible key={option.value} open={chosen} data-slot="radio-accordion-item" className="group/option border-b border-border last:border-b-0">
            <div className="relative flex items-center gap-3.5 px-4 py-3.5 transition-colors duration-150 hover:bg-muted/50 has-[[data-slot=radio-group-item]:focus-visible]:bg-muted/50 has-[[data-slot=radio-group-item]:disabled]:opacity-60 has-[[data-slot=radio-group-item]:disabled]:hover:bg-transparent motion-reduce:transition-none">
              <RadioGroupItem
                id={`${base}-radio`}
                value={option.value}
                disabled={option.disabled}
                aria-labelledby={`${base}-label`}
                aria-describedby={describedBy}
                aria-controls={chosen && option.content ? `${base}-panel` : undefined}
                className="relative z-10"
              />
              {option.icon ? (
                <span aria-hidden="true" className="hidden size-8 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground @[20rem]:grid [&_svg]:size-4">
                  {option.icon}
                </span>
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  {/* The label stretches over the whole row, so the row is one target; the radio keeps the focus ring. */}
                  <Label id={`${base}-label`} htmlFor={`${base}-radio`} className="cursor-pointer leading-snug font-medium group-data-[state=open]/option:font-semibold after:absolute after:inset-0">
                    {option.label}
                  </Label>
                  {option.trailing ? (
                    <span id={`${base}-trailing`} className="shrink-0 text-sm font-medium text-muted-foreground tabular-nums">
                      {option.trailing}
                    </span>
                  ) : null}
                </div>
                {option.description ? (
                  <p id={`${base}-description`} className="mt-1 text-xs leading-snug text-pretty text-muted-foreground">
                    {option.description}
                  </p>
                ) : null}
              </div>
            </div>
            {option.content ? (
              <CollapsibleContent id={`${base}-panel`} role="region" aria-labelledby={`${base}-label`}>
                <div className="border-t border-border bg-muted/40 px-4 py-4">{option.content}</div>
              </CollapsibleContent>
            ) : null}
          </Collapsible>
        );
      })}
    </RadioGroup>
  );
}
