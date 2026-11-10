"use client";

import { Fragment, useMemo, useState } from "react";

import { groupStatuses, type StatusOption } from "@rhs-ui/application/status-select/kinds";
import { StatusMarker } from "@rhs-ui/application/status-select/marker";
import { Kbd } from "@rhs-ui/primitives/kbd";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue, type SelectTriggerProps } from "@rhs-ui/primitives/select";
import { cn } from "@/lib/utils";

export type { StatusKind, StatusOption } from "@rhs-ui/application/status-select/kinds";
export { StatusMarker, type StatusMarkerProps } from "@rhs-ui/application/status-select/marker";

export interface StatusSelectProps extends Omit<SelectTriggerProps, "value" | "defaultValue" | "onChange" | "children" | "size"> {
  /** The options, in order. Give each a `kind` for its marker and, to group them, a `group`. */
  statuses: readonly StatusOption[];
  /** The chosen status, when you control the select. */
  value?: string;
  /** The status to begin with, when the select keeps it itself. */
  defaultValue?: string;
  /** Called with the `value` of the status that was chosen. */
  onValueChange?: (value: string) => void;
  /** `sm` is the compact trigger, 32px with 13px type, for a table cell or a detail panel. Default `default`, 36px. */
  size?: "sm" | "default";
  /** `outline` is a field with a border. `ghost` has none until you hover or open it, so a column of them reads as a list. Default `outline`. */
  variant?: "outline" | "ghost";
  /** Show a number beside each of the first nine options and let the number keys pick them while the list is open. */
  showShortcuts?: boolean;
  /** Shown while nothing is chosen. Default "Set status". */
  placeholder?: string;
  /** The field's name for a plain form submit: the `value` of the chosen status. */
  name?: string;
  /** Turn the select off. */
  disabled?: boolean;
  /** An answer is needed before a form submits. */
  required?: boolean;
}

/**
 * Pick a status, a stage or a priority where the shape tells the state and the
 * colour does not: every option has a small marker (a ring, a half ring, a
 * check, a cross) and a word, in monochrome, so a column of them reads for
 * people who do not see colour. The list is the house Select, with quiet
 * headings for groups such as Open and Closed, arrow keys, Home and End, and
 * typeahead on the words; with `showShortcuts` the number keys pick an option
 * while the list is open. The trigger shows only the marker and the word, so
 * it fits a table cell or a detail panel, and a screen reader hears the
 * chosen status with its group ("In progress, Open"). Pass `marker` on an
 * option for a drawing of your own.
 */
export function StatusSelect({ statuses, value, defaultValue, onValueChange, size = "default", variant = "outline", showShortcuts = false, placeholder = "Set status", name, disabled, required, className, ...props }: StatusSelectProps) {
  const [own, setOwn] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const current = value ?? own;
  const groups = useMemo(() => groupStatuses(statuses), [statuses]);
  const flat = groups.flatMap((group) => group.options.map((entry) => ({ ...entry, group: group.name })));
  const selected = flat.find((entry) => entry.option.value === current);

  function pick(next: string) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  const marker = (option: StatusOption) => option.marker ?? <StatusMarker kind={option.kind ?? "todo"} />;

  return (
    <Select value={current} onValueChange={pick} open={open} onOpenChange={setOpen} name={name} disabled={disabled} required={required}>
      <SelectTrigger
        size={size}
        data-slot="status-select"
        data-variant={variant}
        className={cn(variant === "ghost" && "w-fit border-transparent bg-transparent shadow-none hover:bg-muted data-[state=open]:bg-muted", className)}
        {...props}
      >
        <SelectValue placeholder={placeholder}>
          {selected ? (
            <>
              {marker(selected.option)}
              <span className="truncate">{selected.option.label}</span>
              {/* The group is part of what the status means (in progress is open work), so a screen reader hears it with the word. */}
              {selected.group ? <span className="sr-only">, {selected.group}</span> : null}
            </>
          ) : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        align="start"
        className="min-w-56"
        onKeyDown={(event) => {
          if (!showShortcuts || event.metaKey || event.ctrlKey || event.altKey) return;
          const entry = flat.find((candidate) => String(candidate.shortcut) === event.key && candidate.shortcut <= 9);
          if (!entry) return;
          event.preventDefault();
          pick(entry.option.value);
          setOpen(false);
        }}
      >
        {groups.map((group, index) => (
          <Fragment key={group.name ?? "ungrouped"}>
            {index > 0 ? <SelectSeparator /> : null}
            <SelectGroup>
              {group.name ? <SelectLabel>{group.name}</SelectLabel> : null}
              {group.options.map(({ option, shortcut }) => (
                <SelectItem key={option.value} value={option.value} textValue={option.label} aria-keyshortcuts={showShortcuts && shortcut <= 9 ? String(shortcut) : undefined} className="py-1.5">
                  <span className="flex items-center gap-2.5">
                    {marker(option)}
                    {option.label}
                  </span>
                  {showShortcuts && shortcut <= 9 ? (
                    <Kbd aria-hidden="true" className="absolute top-1/2 right-8 -translate-y-1/2">
                      {shortcut}
                    </Kbd>
                  ) : null}
                </SelectItem>
              ))}
            </SelectGroup>
          </Fragment>
        ))}
      </SelectContent>
    </Select>
  );
}
