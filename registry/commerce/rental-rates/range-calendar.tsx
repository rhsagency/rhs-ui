"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { IconCalendar, IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { dayNumber, runsOf, utcDateOf, weekdayOf } from "@rhs-ui/commerce/rental-rates/pricing";
import { cn } from "@/lib/utils";

export interface RangeCalendarLabels {
  /** The name of the button that goes to the previous month. */
  previous: string;
  /** The name of the button that goes to the next month. */
  next: string;
  /** Added to the name of the first day of the rental. */
  pickUp: string;
  /** Added to the name of the last day of the rental. */
  returnDay: string;
  /** Added to the name of a day that is booked. */
  booked: string;
  /** Added to the name of a day that cannot be picked for another reason. */
  unavailable: string;
  /** The booked days of the month in words. `{dates}` is the list: "20 to 22 Nov and 4 Dec". */
  bookedList: string;
  /** Said when nothing is booked in the month. `{month}` is its name. */
  nothingBooked: string;
  /** Two ends of a run of days. `{from}` and `{to}`. */
  range: string;
}

export interface RangeCalendarProps {
  /** The first day of the rental as a day number (days since 1970-01-01), or null. */
  from: number | null;
  /** The last day of the rental, or null while it is being chosen. */
  to: number | null;
  /** Called with the day that was picked. */
  onPick: (day: number) => void;
  /** Days that are booked. They are struck through and cannot be picked. */
  booked: ReadonlySet<number>;
  /** The first day that can be picked; earlier days are dimmed. */
  min: number | null;
  /** The last day that can be picked right now. While the return date is chosen it is the day before the next booking. */
  max: number | null;
  /** Locale for the month and day names. */
  locale: string;
  /** 1 is Monday, 0 is Sunday. */
  weekStartsOn?: 0 | 1;
  /** The words the calendar says and the names it gives its buttons. */
  labels: RangeCalendarLabels;
  /** Merged onto the calendar's root. */
  className?: string;
}

const monthIndexOf = (day: number): number => {
  const date = utcDateOf(day);
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
};
const firstOfMonth = (index: number): number => dayNumber(Math.floor(index / 12), index % 12, 1);
/** The month the reader is in now: only asked when nothing else says which month to open on. */
const thisMonth = (): number => {
  const now = new Date();
  return now.getFullYear() * 12 + now.getMonth();
};

/**
 * One month to pick a rental from: first the pick-up day, then the return day, with the days in between
 * drawn as a band. Booked days are struck through and refused, and while the return day is being chosen the
 * days after the next booking are refused too. It is a grid for assistive technology: arrow keys move by day
 * and week, Page Up and Down by month, Home and End to the start and end of the week, Enter picks.
 */
export function RangeCalendar({ from, to, onPick, booked, min, max, locale, weekStartsOn = 1, labels, className }: RangeCalendarProps) {
  const id = useId();
  const grid = useRef<HTMLDivElement>(null);
  const [month, setMonth] = useState(() => (from ?? min) !== null ? monthIndexOf((from ?? min) as number) : thisMonth());
  const [focus, setFocus] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  // A rental that jumps to another month (a rate chosen, a new pick-up day) brings the calendar along.
  useEffect(() => {
    if (from !== null) setMonth(monthIndexOf(from));
  }, [from]);

  const first = firstOfMonth(month);
  const offset = (weekdayOf(first) - weekStartsOn + 7) % 7;
  const length = firstOfMonth(month + 1) - first;
  const cells = Array.from({ length: Math.ceil((offset + length) / 7) * 7 }, (_, index) => first - offset + index);
  const weeks = Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
  const weekdays = Array.from({ length: 7 }, (_, index) => {
    const day = first - offset + index;
    return {
      short: new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" }).format(utcDateOf(day)),
      long: new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(utcDateOf(day)),
    };
  });
  const title = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(utcDateOf(first));
  const full = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  const refusedReason = (day: number): "booked" | "unavailable" | null => {
    if (booked.has(day)) return "booked";
    if ((min !== null && day < min) || (max !== null && to === null && from !== null && day > from && day > max)) return "unavailable";
    return null;
  };
  // While the return day is being chosen, the band follows the pointer or the focus.
  const end = to ?? (from !== null && hover !== null && hover >= from && refusedReason(hover) === null ? hover : null);

  const goTo = (day: number) => {
    setFocus(day);
    const index = monthIndexOf(day);
    if (index !== month) setMonth(index);
    requestAnimationFrame(() => grid.current?.querySelector<HTMLButtonElement>(`[data-day="${day}"]`)?.focus());
  };
  const onKey = (event: KeyboardEvent<HTMLButtonElement>, day: number) => {
    const weekday = (weekdayOf(day) - weekStartsOn + 7) % 7;
    const sameDayNextMonth = (step: number): number => {
      const date = utcDateOf(day);
      const target = date.getUTCFullYear() * 12 + date.getUTCMonth() + step;
      const last = firstOfMonth(target + 1) - 1;
      return Math.min(firstOfMonth(target) + date.getUTCDate() - 1, last);
    };
    const moves: Record<string, number> = { ArrowLeft: day - 1, ArrowRight: day + 1, ArrowUp: day - 7, ArrowDown: day + 7, Home: day - weekday, End: day + 6 - weekday, PageUp: sameDayNextMonth(-1), PageDown: sameDayNextMonth(1) };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    goTo(next);
  };

  // The bookings of the month on show, in words: what is struck through in the grid, said aloud as well.
  const monthEnd = first + length - 1;
  const dayOnly = new Intl.DateTimeFormat(locale, { day: "numeric", timeZone: "UTC" });
  const dayAndMonth = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" });
  const runs = runsOf([...booked].filter((day) => day >= first && day <= monthEnd)).map(([start, last]) =>
    start === last ? dayAndMonth.format(utcDateOf(start)) : labels.range.replace("{from}", dayOnly.format(utcDateOf(start))).replace("{to}", dayAndMonth.format(utcDateOf(last))),
  );
  const monthName = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(utcDateOf(first));
  const bookedNote = runs.length ? labels.bookedList.replace("{dates}", new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(runs)) : labels.nothingBooked.replace("{month}", monthName);

  const rovingDay = focus !== null && monthIndexOf(focus) === month ? focus : from !== null && monthIndexOf(from) === month ? from : (cells.find((day) => monthIndexOf(day) === month && refusedReason(day) === null) ?? first);
  const step = "grid size-8 place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-40";

  return (
    <div data-slot="range-calendar" className={cn("w-full min-w-0 select-none", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <button type="button" aria-label={labels.previous} disabled={min !== null && month <= monthIndexOf(min)} onClick={() => setMonth(month - 1)} className={step}>
          <IconChevronLeft size={16} />
        </button>
        <p id={`${id}-title`} aria-live="polite" className="text-sm font-medium capitalize">
          {title}
        </p>
        <button type="button" aria-label={labels.next} onClick={() => setMonth(month + 1)} className={step}>
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
          <div key={week[0]} role="row" className="grid grid-cols-7">
            {week.map((day) => {
              const inMonth = monthIndexOf(day) === month;
              const reason = refusedReason(day);
              const isFrom = from === day;
              const isTo = to === day;
              const inBand = from !== null && end !== null && day >= from && day <= end && from !== end;
              const bandStart = inBand && day === from;
              const bandEnd = inBand && day === end;
              const picked = isFrom || isTo;
              const name = [full.format(utcDateOf(day)), isFrom ? labels.pickUp : null, isTo ? labels.returnDay : null, reason === "booked" ? labels.booked : reason === "unavailable" ? labels.unavailable : null].filter(Boolean).join(", ");
              return (
                <span key={day} role="gridcell" aria-selected={picked || (to !== null && inBand) || undefined} className="relative grid h-9 place-items-center">
                  {inBand && inMonth ? <span aria-hidden="true" className={cn("absolute inset-y-0.5 bg-muted", bandStart ? "right-0 left-1/2" : bandEnd ? "right-1/2 left-0" : "inset-x-0")} /> : null}
                  {inMonth ? (
                    <button
                      type="button"
                      data-day={day}
                      tabIndex={day === rovingDay ? 0 : -1}
                      aria-disabled={reason !== null || undefined}
                      aria-label={name}
                      onClick={() => {
                        setFocus(day);
                        if (reason === null) onPick(day);
                      }}
                      onKeyDown={(event) => (event.key === "Enter" || event.key === " " ? (event.preventDefault(), reason === null && onPick(day)) : onKey(event, day))}
                      onPointerEnter={() => setHover(day)}
                      onPointerLeave={() => setHover(null)}
                      onFocus={() => setHover(day)}
                      onBlur={() => setHover(null)}
                      className={cn(
                        "relative grid size-9 place-items-center rounded-full text-sm tabular-nums outline-none transition-colors duration-100 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
                        picked ? "bg-foreground font-medium text-background" : reason === null ? "text-foreground hover:bg-muted" : "cursor-not-allowed",
                        !picked && reason === "booked" && "text-muted-foreground line-through decoration-muted-foreground/70",
                        !picked && reason === "unavailable" && "text-muted-foreground/45",
                        !picked && inBand && reason === null && "hover:bg-background/60",
                      )}
                    >
                      {utcDateOf(day).getUTCDate()}
                    </button>
                  ) : null}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <p aria-live="polite" className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <IconCalendar aria-hidden="true" className="mt-px size-3.5 shrink-0" />
        <span className="min-w-0">{bookedNote}</span>
      </p>
    </div>
  );
}
