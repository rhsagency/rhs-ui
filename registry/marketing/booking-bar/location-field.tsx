"use client";

import { useState } from "react";

import { IconCheck, IconChevronsUpDown } from "@rhs-ui/icons";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@rhs-ui/primitives/command";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import type { BookingBarLabels, BookingLocation } from "@rhs-ui/marketing/booking-bar/types";

export interface LocationFieldProps {
  /** Where the reader can go. */
  locations: readonly BookingLocation[];
  /** The `value` of the chosen location, or null while none is chosen. */
  value: string | null;
  /** Called with the `value` of the location the reader chooses. */
  onValueChange: (value: string) => void;
  /** The words of the field: its placeholder, the search, the empty list and the names assistive technology reads. */
  labels: BookingBarLabels;
}

/**
 * The location of the booking bar: a trigger that opens a searchable list, with the keyboard of a combobox (type to
 * filter, arrow keys move, Enter chooses, Escape closes and returns focus). It is written out here, on the same
 * popover and command primitives as the Combobox, so that every word it says to assistive technology (the name of the
 * search, of the list and of the chosen option) comes from the bar's labels instead of from English.
 */
export function LocationField({ locations, value, onValueChange, labels }: LocationFieldProps) {
  const [open, setOpen] = useState(false);
  const current = locations.find((location) => location.value === value);

  function choose(next: string) {
    onValueChange(next);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        data-placeholder={current ? undefined : ""}
        className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl px-3.5 pt-0.5 pb-2.5 text-left text-sm font-medium whitespace-nowrap outline-none data-[placeholder]:font-normal data-[placeholder]:text-muted-foreground"
      >
        <span className="truncate">{current?.label ?? labels.wherePlaceholder}</span>
        <IconChevronsUpDown aria-hidden="true" size={16} className="shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" collisionPadding={8} aria-label={labels.where} className="w-(--radix-popover-trigger-width) min-w-56 overflow-hidden p-0">
        <Command loop className="rounded-none bg-transparent">
          <CommandInput placeholder={labels.whereSearch} aria-label={labels.whereSearch} />
          <CommandList label={labels.suggestions}>
            <CommandEmpty>{labels.whereEmpty}</CommandEmpty>
            <CommandGroup>
              {locations.map((location) => {
                const chosen = location.value === value;
                return (
                  <CommandItem key={location.value} value={location.value} keywords={[location.label]} data-checked={chosen || undefined} onSelect={() => choose(location.value)} className="pr-8">
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-foreground">{location.label}</span>
                      {location.description ? <span className="text-xs text-muted-foreground">{location.description}</span> : null}
                    </span>
                    {chosen ? (
                      <>
                        <IconCheck aria-hidden="true" size={14} className="absolute right-2" />
                        <span className="sr-only">, {labels.selected}</span>
                      </>
                    ) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
