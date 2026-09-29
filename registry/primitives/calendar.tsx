"use client";

import { useId, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";

import { IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface CalendarProps {
  /** The selected day, or null for none. */
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (date: Date) => void;
  /** The first and last day that can be chosen. */
  min?: Date;
  max?: Date;
  /** Any other day that cannot be chosen, such as weekends or booked dates. */
  isDisabled?: (date: Date) => boolean;
  /** 1 is Monday (the default), 0 is Sunday. */
  weekStartsOn?: 0 | 1;
  locale?: string;
  className?: string;
}

const noSubscription = (): (() => void) => () => undefined;
const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const addMonths = (date: Date, months: number) => {
  const next = new Date(date.getFullYear(), date.getMonth() + months, 1);
  return new Date(next.getFullYear(), next.getMonth(), Math.min(date.getDate(), new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
};

/**
 * A month to pick a day from. It is a grid for assistive technology: arrow
 * keys move by day and week, Page Up and Down by month, Home and End to the
 * start and end of the week, Enter picks. Only the focused day is in the tab
 * order. Days outside min and max, or refused by isDisabled, cannot be
 * picked. Month and weekday names come from the locale.
 */
export function Calendar({ value, defaultValue = null, onValueChange, min, max, isDisabled, weekStartsOn = 1, locale = "en-GB", className }: CalendarProps) {
  const id = useId();
  const [own, setOwn] = useState<Date | null>(defaultValue);
  const selected = value === undefined ? own : value;
  // Open on the selected day, else today, but never outside min and max: a picker should open where something can be picked.
  const [focused, setFocused] = useState(() => {
    const start = startOfDay(selected ?? new Date());
    if (min && start < startOfDay(min)) return startOfDay(min);
    if (max && start > startOfDay(max)) return startOfDay(max);
    return start;
  });
  const grid = useRef<HTMLDivElement>(null);
  const month = new Date(focused.getFullYear(), focused.getMonth(), 1);
  const blocked = (date: Date) => Boolean((min && date < startOfDay(min)) || (max && date > startOfDay(max)) || isDisabled?.(date));
  const weekdays = useMemo(() => {
    const base = new Date(2024, 0, 1 + ((weekStartsOn + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => {
      const day = addDays(base, index);
      return { short: new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(day), long: new Intl.DateTimeFormat(locale, { weekday: "long" }).format(day) };
    });
  }, [locale, weekStartsOn]);
  const offset = (month.getDay() - weekStartsOn + 7) % 7;
  const days = Array.from({ length: 42 }, (_, index) => addDays(month, index - offset));
  const weeks = Array.from({ length: 6 }, (_, index) => days.slice(index * 7, index * 7 + 7)).filter((week) => week.some((day) => day.getMonth() === month.getMonth()));
  const moveTo = (date: Date) => {
    setFocused(date);
    requestAnimationFrame(() => (grid.current?.querySelector(`[data-day="${dayKey(date)}"]`) as HTMLButtonElement | null)?.focus());
  };
  const pick = (date: Date) => {
    if (blocked(date)) return;
    if (value === undefined) setOwn(date);
    onValueChange?.(date);
  };
  const onKey = (event: KeyboardEvent<HTMLButtonElement>, date: Date) => {
    const weekday = (date.getDay() - weekStartsOn + 7) % 7;
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(date, -1),
      ArrowRight: () => addDays(date, 1),
      ArrowUp: () => addDays(date, -7),
      ArrowDown: () => addDays(date, 7),
      PageUp: () => addMonths(date, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(date, event.shiftKey ? 12 : 1),
      Home: () => addDays(date, -weekday),
      End: () => addDays(date, 6 - weekday),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    moveTo(move());
  };
  const title = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(month);
  // "Today" is the reader's today: known only in the browser, so the server marks none and nothing mismatches.
  const today = useSyncExternalStore(noSubscription, () => dayKey(new Date()), () => null);
  return (
    <div data-slot="calendar" className={cn("w-fit select-none p-3", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <button type="button" aria-label="Previous month" onClick={() => setFocused(addMonths(focused, -1))} className="grid size-8 place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
          <IconChevronLeft size={16} />
        </button>
        <p id={`${id}-title`} aria-live="polite" className="text-sm font-medium capitalize">
          {title}
        </p>
        <button type="button" aria-label="Next month" onClick={() => setFocused(addMonths(focused, 1))} className="grid size-8 place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
          <IconChevronRight size={16} />
        </button>
      </div>
      <div ref={grid} role="grid" aria-labelledby={`${id}-title`}>
        <div role="row" className="grid grid-cols-7">
          {weekdays.map((day) => (
            <span key={day.long} role="columnheader" aria-label={day.long} className="grid h-8 place-items-center text-[0.6875rem] font-medium text-muted-foreground uppercase">
              {day.short}
            </span>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={dayKey(week[0]!)} role="row" className="grid grid-cols-7">
            {week.map((date) => {
              const inMonth = date.getMonth() === month.getMonth();
              const isSelected = Boolean(selected && dayKey(selected) === dayKey(date));
              const isFocused = dayKey(date) === dayKey(focused);
              const off = blocked(date);
              return (
                <span key={dayKey(date)} role="gridcell" aria-selected={isSelected}>
                  <button
                    type="button"
                    data-day={dayKey(date)}
                    tabIndex={isFocused ? 0 : -1}
                    aria-disabled={off || undefined}
                    aria-current={dayKey(date) === today ? "date" : undefined}
                    aria-label={new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date)}
                    onClick={() => {
                      setFocused(date);
                      pick(date);
                    }}
                    onKeyDown={(event) => (event.key === "Enter" || event.key === " " ? (event.preventDefault(), pick(date)) : onKey(event, date))}
                    className={cn(
                      "grid size-9 place-items-center rounded-md text-sm tabular-nums outline-none transition-colors duration-100 focus-visible:ring-[3px] focus-visible:ring-ring/40",
                      inMonth ? "text-foreground" : "text-muted-foreground/50",
                      !isSelected && !off && "hover:bg-muted",
                      dayKey(date) === today && !isSelected && "font-semibold underline decoration-2 underline-offset-4",
                      isSelected && "bg-foreground text-background",
                      off && "cursor-not-allowed text-muted-foreground/40 line-through",
                    )}
                  >
                    {date.getDate()}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
