"use client";

import { useState } from "react";

import { IconCheck, IconChevronDown, IconClose } from "@rhs-ui/icons";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@rhs-ui/primitives/command";
import { fieldSurface } from "@rhs-ui/primitives/input";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  options: readonly MultiSelectOption[];
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  /** Names the field for screen readers. */
  label: string;
  placeholder?: string;
  /** Show this many chips, then "+3". */
  maxChips?: number;
  className?: string;
}

/**
 * Pick several from a long list: a searchable listbox with checks, the
 * picks as removable chips in the trigger, and select all or clear at the
 * bottom. Each chip's remove button names what it removes.
 */
export function MultiSelect({ options, value, onValueChange, label, placeholder = "Select…", maxChips = 3, className }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const picked = options.filter((option) => value.includes(option.value));
  const toggle = (item: string) => onValueChange(value.includes(item) ? value.filter((entry) => entry !== item) : [...value, item]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div data-slot="multi-select" className={cn(fieldSurface, "flex min-h-9 w-full items-center gap-1 py-1 pr-1 pl-1.5", className)}>
        <div className="flex min-w-0 flex-1 flex-wrap gap-1">
          {picked.slice(0, maxChips).map((option) => (
            <span key={option.value} className="inline-flex items-center gap-1 rounded-md bg-muted py-0.5 pr-0.5 pl-2 text-xs">
              {option.label}
              <button type="button" aria-label={`Remove ${option.label}`} onClick={() => toggle(option.value)} className="inline-flex size-5 items-center justify-center rounded outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring/40 [&_svg]:size-3"><IconClose /></button>
            </span>
          ))}
          {picked.length > maxChips ? <span className="rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums">+{picked.length - maxChips}</span> : null}
          {picked.length === 0 ? <span className="px-1.5 py-0.5 text-sm text-muted-foreground">{placeholder}</span> : null}
        </div>
        <PopoverTrigger aria-label={`${label}: ${picked.length} selected. Open list`} className="inline-flex size-7 shrink-0 items-center justify-center rounded text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 [&_svg]:size-4"><IconChevronDown /></PopoverTrigger>
      </div>
      <PopoverContent align="start" className="w-64 p-0">
        <Command>
          <CommandInput placeholder={`Search ${label.toLowerCase()}`} />
          <CommandList>
            <CommandEmpty>Nothing matches.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option.value} value={option.label} onSelect={() => toggle(option.value)}>
                  <span className={cn("inline-flex size-4 items-center justify-center rounded-sm border [&_svg]:size-3", value.includes(option.value) ? "border-foreground bg-foreground text-background" : "border-border")}>{value.includes(option.value) ? <IconCheck /> : null}</span>
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <div className="flex justify-between border-t border-border p-1 text-xs">
            <button type="button" className="rounded px-2 py-1 hover:bg-muted" onClick={() => onValueChange(options.map((option) => option.value))}>Select all</button>
            <button type="button" className="rounded px-2 py-1 hover:bg-muted" onClick={() => onValueChange([])}>Clear</button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
