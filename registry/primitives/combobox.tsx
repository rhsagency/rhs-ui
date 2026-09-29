"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { IconCheck, IconChevronsUpDown } from "@rhs-ui/icons";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@rhs-ui/primitives/command";
import { fieldSurface } from "@rhs-ui/primitives/input";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Extra words the search matches: a country code, a former name. */
  keywords?: readonly string[];
  /** A second line under the option. */
  description?: ReactNode;
  /** Options with the same group are listed under that heading, in order of first appearance. */
  group?: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: readonly ComboboxOption[];
  /** Controlled value. Pair with onValueChange. */
  value?: string | null;
  /** Uncontrolled starting value; restored when the surrounding form resets. */
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  /** Names the list for assistive technology, like "Country". */
  label: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Submits the value through a hidden input, so FormData and server actions see it. */
  name?: string;
  /** For <Label htmlFor>. */
  id?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/**
 * A field that opens a searchable list: for choices too long to scan, like
 * countries or time zones. Typing filters on the label and the keywords,
 * arrow keys move, Enter chooses, Escape closes and returns focus to the
 * field. Never a native select. With `name`, a hidden input carries the
 * value; validate `required` in your form schema, a hidden input has no
 * native constraint check.
 */
export function Combobox({
  options,
  value,
  defaultValue = null,
  onValueChange,
  label,
  placeholder = "Choose an option",
  searchPlaceholder = "Search...",
  emptyText = "Nothing matches that.",
  name,
  id,
  disabled,
  required,
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [uncontrolled, setUncontrolled] = useState<string | null>(defaultValue);
  const hidden = useRef<HTMLInputElement>(null);
  const selected = value !== undefined ? value : uncontrolled;
  const current = options.find((option) => option.value === selected);

  useEffect(() => {
    const form = hidden.current?.form;
    if (!form || value !== undefined) return;
    const reset = () => setUncontrolled(defaultValue);
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [defaultValue, value]);

  const groups = new Map<string, ComboboxOption[]>();
  for (const option of options) groups.set(option.group ?? "", [...(groups.get(option.group ?? "") ?? []), option]);

  function choose(next: string) {
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        aria-required={required || undefined}
        data-slot="combobox-trigger"
        data-placeholder={current ? undefined : ""}
        className={cn(
          fieldSurface,
          "flex h-9 w-full min-w-0 items-center justify-between gap-2 px-3 text-left whitespace-nowrap data-[placeholder]:text-muted-foreground",
          className,
        )}
      >
        <span className="truncate">{current?.label ?? placeholder}</span>
        <IconChevronsUpDown size={16} className="shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      {name ? <input ref={hidden} type="hidden" name={name} value={selected ?? ""} /> : null}
      <PopoverContent align="start" aria-label={label} className="w-(--radix-popover-trigger-width) min-w-56 overflow-hidden p-0">
        <Command loop className="rounded-none bg-transparent">
          <CommandInput placeholder={searchPlaceholder} aria-label={`Search ${label.toLowerCase()}`} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {[...groups].map(([group, items]) => (
              <CommandGroup key={group || "options"} heading={group || undefined}>
                {items.map((option) => {
                  const chosen = option.value === selected;
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      keywords={[option.label, ...(option.keywords ?? [])]}
                      disabled={option.disabled}
                      data-checked={chosen || undefined}
                      onSelect={() => choose(option.value)}
                      className="pr-8"
                    >
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate text-foreground">{option.label}</span>
                        {option.description ? <span className="text-xs text-muted-foreground">{option.description}</span> : null}
                      </span>
                      {chosen ? (
                        <>
                          <IconCheck size={14} className="absolute right-2" />
                          <span className="sr-only">, selected</span>
                        </>
                      ) : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
