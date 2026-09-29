"use client";

import { useState } from "react";

import { IconCalendar } from "@rhs-ui/icons";
import { Calendar, type CalendarProps } from "@rhs-ui/primitives/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export interface DatePickerProps extends Omit<CalendarProps, "className"> {
  placeholder?: string;
  /** How the chosen day reads on the trigger. */
  format?: Intl.DateTimeFormatOptions;
  /** The field's name, for a plain form submit: the day as yyyy-mm-dd in a hidden input. */
  name?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/**
 * A day behind a field-like trigger: the calendar opens in a panel, picking a
 * day closes it and returns focus to the trigger, which reads the day in full.
 * Pair it with <Label htmlFor> through `id`.
 */
export function DatePicker({ value, defaultValue = null, onValueChange, placeholder = "Pick a day", format = { day: "numeric", month: "long", year: "numeric" }, locale = "en-GB", name, id, disabled, className, ...calendar }: DatePickerProps) {
  const [own, setOwn] = useState<Date | null>(defaultValue);
  const [open, setOpen] = useState(false);
  const selected = value === undefined ? own : value;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        data-slot="date-picker"
        suppressHydrationWarning
        className={cn(
          "inline-flex h-9 w-full min-w-48 items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50",
          !selected && "text-muted-foreground",
          className,
        )}
      >
        <IconCalendar size={16} className="shrink-0 text-muted-foreground" />
        {selected ? new Intl.DateTimeFormat(locale, format).format(selected) : placeholder}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          {...calendar}
          locale={locale}
          value={selected}
          onValueChange={(date) => {
            if (value === undefined) setOwn(date);
            onValueChange?.(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
      {name ? <input type="hidden" name={name} value={selected ? iso(selected) : ""} /> : null}
    </Popover>
  );
}
