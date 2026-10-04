"use client";

import { useState } from "react";

import { IconCalendar, IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export interface MonthPickerProps {
  /** "yyyy-mm", or null. */
  value: string | null;
  onValueChange: (month: string) => void;
  /** Earliest and latest choosable months, "yyyy-mm". */
  min?: string;
  max?: string;
  locale?: string;
  placeholder?: string;
  /** Submits "yyyy-mm" through a hidden input. */
  name?: string;
  id?: string;
  className?: string;
}

/**
 * Pick a month, not a day: for reports, billing periods and card expiry.
 * A year with arrows and the twelve months as a grid, named by the browser
 * in the reader's language, with months outside min and max disabled. The
 * value is "yyyy-mm", so there is no day or time zone to get wrong.
 */
export function MonthPicker({ value, onValueChange, min, max, locale = "en-GB", placeholder = "Pick a month", name, id, className }: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const initialYear = value ? Number(value.slice(0, 4)) : new Date().getFullYear();
  const [year, setYear] = useState(initialYear);
  const short = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" });
  const long = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" });
  const label = (month: string) => long.format(new Date(`${month}-01T00:00:00Z`));
  const key = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, "0")}`;
  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (next) setYear(initialYear); }}>
      <PopoverTrigger id={id} data-slot="month-picker" className={cn("inline-flex h-9 w-full min-w-44 items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40", !value && "text-muted-foreground", className)}>
        <IconCalendar size={16} className="shrink-0 text-muted-foreground" />
        {value ? label(value) : placeholder}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setYear((y) => y - 1)} disabled={min !== undefined && year <= Number(min.slice(0, 4))} aria-label="Previous year" className="inline-flex size-8 items-center justify-center rounded-md outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-30"><IconChevronLeft className="size-4" /></button>
          <p aria-live="polite" className="text-sm font-medium tabular-nums">{year}</p>
          <button type="button" onClick={() => setYear((y) => y + 1)} disabled={max !== undefined && year >= Number(max.slice(0, 4))} aria-label="Next year" className="inline-flex size-8 items-center justify-center rounded-md outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-30"><IconChevronRight className="size-4" /></button>
        </div>
        <div role="group" aria-label={`Months of ${year}`} className="mt-2 grid grid-cols-3 gap-1">
          {Array.from({ length: 12 }, (_, m) => {
            const month = key(year, m);
            const off = (min !== undefined && month < min) || (max !== undefined && month > max);
            const selected = month === value;
            return (
              <button
                key={month}
                type="button"
                aria-pressed={selected}
                aria-label={label(month)}
                disabled={off}
                onClick={() => { onValueChange(month); setOpen(false); }}
                className="h-9 rounded-md text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-30 aria-pressed:bg-foreground aria-pressed:text-background"
              >
                {short.format(new Date(Date.UTC(year, m, 1)))}
              </button>
            );
          })}
        </div>
      </PopoverContent>
      {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
    </Popover>
  );
}
