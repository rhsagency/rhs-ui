"use client";

import { useState } from "react";

import { IconCalendar } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Calendar } from "@rhs-ui/primitives/calendar";
import { fieldSurface } from "@rhs-ui/primitives/input";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface DateRangePreset {
  label: string;
  /** Builds the range from today. */
  range: (today: Date) => DateRange;
}

const day = (date: Date, offset: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);

export const DEFAULT_RANGE_PRESETS: readonly DateRangePreset[] = [
  { label: "Last 7 days", range: (today) => ({ from: day(today, -6), to: today }) },
  { label: "Last 30 days", range: (today) => ({ from: day(today, -29), to: today }) },
  { label: "This month", range: (today) => ({ from: new Date(today.getFullYear(), today.getMonth(), 1), to: today }) },
  { label: "Last month", range: (today) => ({ from: new Date(today.getFullYear(), today.getMonth() - 1, 1), to: new Date(today.getFullYear(), today.getMonth(), 0) }) },
];

export interface DateRangePickerProps {
  value: DateRange;
  onValueChange: (range: DateRange) => void;
  presets?: readonly DateRangePreset[];
  placeholder?: string;
  /** Fixed, so the server and the browser print the same dates. */
  locale?: string;
  className?: string;
}

/**
 * Two dates in one field: quick presets on the left, a start and an end
 * calendar beside them, and the end can never fall before the start. The
 * trigger reads the range back in words.
 */
export function DateRangePicker({ value, onValueChange, presets = DEFAULT_RANGE_PRESETS, placeholder = "Pick a range", locale = "en-GB", className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const print = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" });
  const label = value.from && value.to ? `${print.format(value.from)} – ${print.format(value.to)}` : value.from ? `${print.format(value.from)} – …` : placeholder;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger data-slot="date-range-picker" className={cn(fieldSurface, "inline-flex h-9 items-center gap-2 px-3 text-left", !value.from && "text-muted-foreground", className)}>
        <IconCalendar className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate tabular-nums">{label}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex flex-col sm:flex-row">
          <ul className="relative flex gap-1 overflow-x-auto border-b border-border p-2 sm:flex-col sm:border-r sm:border-b-0">
            {presets.map((preset) => (
              <li key={preset.label}>
                <Button variant="ghost" size="sm" className="w-full justify-start whitespace-nowrap" onClick={() => { onValueChange(preset.range(new Date())); setOpen(false); }}>{preset.label}</Button>
              </li>
            ))}
          </ul>
          <div className="grid gap-2 p-3 sm:grid-cols-2">
            <div>
              <p className="px-1 pb-1 text-xs text-muted-foreground">From</p>
              <Calendar value={value.from} locale={locale} onValueChange={(from) => onValueChange({ from, to: value.to && value.to < from ? null : value.to })} />
            </div>
            <div>
              <p className="px-1 pb-1 text-xs text-muted-foreground">To</p>
              <Calendar value={value.to} locale={locale} min={value.from ?? undefined} onValueChange={(to) => { onValueChange({ from: value.from ?? to, to }); setOpen(false); }} />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
