"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FocusEvent, type KeyboardEvent } from "react";

import { IconAlertCircle, IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";
import { addDays, addMonths, dayKey, daysBetween, isSameDay, monthIndex, monthWeeks, startOfDay, startOfMonth } from "@rhs-ui/marketing/booking-bar/dates";
import type { BookingBarLabels, DraftRange } from "@rhs-ui/marketing/booking-bar/types";

export interface RangeCalendarProps {
  /** The stay as far as it is chosen. */
  value: DraftRange;
  /** Called with every change: a new check-in, a check-out, or both cleared. */
  onValueChange: (range: DraftRange) => void;
  /** Called once both days are chosen, so the panel around the calendar can close. */
  onComplete: () => void;
  /** The first day that can be chosen, at midnight. */
  minDate: Date;
  /** The fewest nights a stay can be. */
  minNights: number;
  /** The language month and weekday names are written in. */
  locale: string;
  /** 1 is Monday, 0 is Sunday. */
  weekStartsOn: 0 | 1;
  /** The words of the calendar. */
  labels: BookingBarLabels;
  /** Move focus to a day when the calendar mounts, so a keyboard opens it ready to use. */
  autoFocus?: boolean;
  className?: string;
}

const WIDE = "(min-width: 640px)";
const subscribeWide = (notify: () => void): (() => void) => {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const readWide = () => window.matchMedia(WIDE).matches;

const text = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (marker, key: string) => String(values[key] ?? marker));

const NAV =
  "grid size-9 place-items-center rounded-md text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-30 motion-reduce:transition-none";

/**
 * A calendar for choosing a stay: check-in and check-out in one picker, two months side by side from 640px and one
 * below. The days between the two are a band, hovering or moving to a day after the check-in previews the stay, days
 * before the first bookable day and days closer to the check-in than the minimum stay cannot be chosen, and trying
 * one says why in words. It is a grid for assistive technology: arrow keys move by day and week, Page Up and Down by
 * month, Home and End to the start and end of the week, Enter chooses. Mount it only while it is shown: it reads the
 * reader's clock.
 */
export function RangeCalendar({ value, onValueChange, onComplete, minDate, minNights, locale, weekStartsOn, labels, autoFocus = false, className }: RangeCalendarProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const wide = useSyncExternalStore(subscribeWide, readWide, () => true);
  const visible = wide ? 2 : 1;
  const today = startOfDay(new Date());
  const { from, to } = value;

  // Open on the check-in, else today, but never before the first bookable day: a picker opens where something can be chosen.
  const [focused, setFocused] = useState(() => {
    const start = startOfDay(from ?? today);
    return start < minDate ? minDate : start;
  });
  const [month, setMonth] = useState(() => startOfMonth(focused));
  const [hover, setHover] = useState<Date | null>(null);
  const [inside, setInside] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  // The day to give focus to once the render that shows it is done.
  const toFocus = useRef<string | null>(autoFocus ? dayKey(focused) : null);

  useEffect(() => {
    if (!toFocus.current) return;
    root.current?.querySelector<HTMLElement>(`[data-day="${toFocus.current}"]`)?.focus({ preventScroll: true });
    toFocus.current = null;
  });

  const months = Array.from({ length: visible }, (_, index) => addMonths(startOfMonth(month), index));
  const showing = (date: Date) => monthIndex(date) >= monthIndex(month) && monthIndex(date) < monthIndex(month) + visible;
  // There is always one day in the tab order: the focused one, or the first bookable day of the first month shown.
  const tabKey = dayKey(showing(focused) ? focused : monthIndex(month) === monthIndex(minDate) ? minDate : startOfMonth(month));

  const nightsWords = (count: number) => text(new Intl.PluralRules(locale).select(count) === "one" ? labels.nightOne : labels.nightOther, { count });
  const preview = hover ?? (inside ? focused : null);
  // Only a day that could end the stay previews it: pointing at one that is too close says nothing, and pressing it says why.
  const previewEnd = from && !to && preview && daysBetween(from, preview) >= Math.max(1, minNights) ? preview : null;
  const end = to ?? previewEnd;
  const stay = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" });
  const title = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
  const weekday = (date: Date, style: "narrow" | "long") => new Intl.DateTimeFormat(locale, { weekday: style }).format(date);
  const full = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  function moveTo(date: Date) {
    const next = date < minDate ? minDate : date;
    setFocused(next);
    if (monthIndex(next) < monthIndex(month)) setMonth(startOfMonth(next));
    else if (monthIndex(next) >= monthIndex(month) + visible) setMonth(startOfMonth(addMonths(next, 1 - visible)));
    toFocus.current = dayKey(next);
  }

  function pick(day: Date) {
    if (day < minDate) return;
    if (!from || to || day <= from) {
      // A first day, a new first day after a finished stay, or an earlier one: the stay starts over from here.
      setProblem(null);
      onValueChange({ from: day, to: null });
      return;
    }
    if (daysBetween(from, day) < minNights) {
      setProblem(text(labels.minStay, { count: minNights }));
      return;
    }
    setProblem(null);
    onValueChange({ from, to: day });
    onComplete();
  }

  function onKey(event: KeyboardEvent<HTMLButtonElement>, date: Date) {
    const column = (date.getDay() - weekStartsOn + 7) % 7;
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(date, -1),
      ArrowRight: () => addDays(date, 1),
      ArrowUp: () => addDays(date, -7),
      ArrowDown: () => addDays(date, 7),
      PageUp: () => addMonths(date, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(date, event.shiftKey ? 12 : 1),
      Home: () => addDays(date, -column),
      End: () => addDays(date, 6 - column),
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      moveTo(move());
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pick(date);
    }
  }

  function leave(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setInside(false);
  }

  const message = to && from ? text(labels.stay, { nights: nightsWords(daysBetween(from, to)), from: stay.format(from), to: stay.format(to) }) : from ? labels.pickOut : labels.pickIn;

  return (
    <div ref={root} data-slot="range-calendar" onMouseLeave={() => setHover(null)} onBlur={leave} className={cn("select-none", className)}>
      {/* A month is 280px wide. On the narrowest phones the sides are 12px instead of 16px, so the month and its panel fit inside a 320px screen with a gutter either side. */}
      <div className="flex justify-center gap-8 p-4 max-[22.5rem]:px-3">
        {months.map((shown, index) => {
          const titleId = `${id}-month-${index}`;
          return (
            <div key={monthIndex(shown)} className="w-full max-w-[17.5rem] min-w-0">
              <div className="relative mb-2 flex h-9 items-center justify-center">
                {index === 0 ? (
                  <button type="button" aria-label={labels.previousMonth} disabled={monthIndex(month) <= monthIndex(minDate)} onClick={() => setMonth(addMonths(month, -1))} className={cn(NAV, "absolute left-0")}>
                    <IconChevronLeft size={16} />
                  </button>
                ) : null}
                <p id={titleId} aria-live="polite" className="text-sm font-medium capitalize">
                  {title.format(shown)}
                </p>
                {index === visible - 1 ? (
                  <button type="button" aria-label={labels.nextMonth} onClick={() => setMonth(addMonths(month, 1))} className={cn(NAV, "absolute right-0")}>
                    <IconChevronRight size={16} />
                  </button>
                ) : null}
              </div>

              <div role="grid" aria-labelledby={titleId}>
                <div role="row" className="grid grid-cols-7">
                  {Array.from({ length: 7 }, (_, column) => {
                    // 1 January 2024 was a Monday.
                    const day = new Date(2024, 0, 1 + ((weekStartsOn + 6 + column) % 7));
                    return (
                      <span key={column} role="columnheader" aria-label={weekday(day, "long")} className="grid h-8 place-items-center text-[0.6875rem] font-medium text-muted-foreground uppercase">
                        {weekday(day, "narrow")}
                      </span>
                    );
                  })}
                </div>
                {monthWeeks(shown, weekStartsOn).map((week) => (
                  <div key={dayKey(week.find((slot) => slot) ?? shown)} role="row" className="grid grid-cols-7">
                    {week.map((day, column) => {
                      if (!day) return <span key={column} role="gridcell" aria-hidden="true" className="h-10" />;
                      const isFrom = from !== null && isSameDay(day, from);
                      const isTo = to !== null && isSameDay(day, to);
                      const isPreview = previewEnd !== null && isSameDay(day, previewEnd);
                      const between = from !== null && end !== null && day > from && day < end;
                      const off = day < minDate;
                      const tooShort = from !== null && !to && day > from && daysBetween(from, day) < minNights;
                      const blocked = off || tooShort;
                      const date = full.format(day);
                      const rowStart = column === 0 || !week[column - 1];
                      const rowEnd = column === 6 || !week[column + 1];
                      return (
                        <span
                          key={dayKey(day)}
                          role="gridcell"
                          aria-selected={isFrom || isTo || between}
                          className={cn(
                            "relative grid h-10 place-items-center",
                            between && cn("bg-muted", rowStart && "rounded-l-lg", rowEnd && "rounded-r-lg"),
                            // The half of the band that joins an end to the days beside it; at the end of a row there is nothing to join.
                            isFrom && end && !rowEnd && "before:absolute before:inset-y-0 before:right-0 before:left-1/2 before:bg-muted",
                            (isTo || isPreview) && from && !rowStart && "before:absolute before:inset-y-0 before:right-1/2 before:left-0 before:bg-muted",
                          )}
                        >
                          <button
                            type="button"
                            data-day={dayKey(day)}
                            tabIndex={dayKey(day) === tabKey ? 0 : -1}
                            aria-disabled={blocked || undefined}
                            aria-current={isSameDay(day, today) ? "date" : undefined}
                            aria-label={isFrom ? `${date}, ${labels.checkIn}` : isTo ? `${date}, ${labels.checkOut}` : date}
                            onClick={() => {
                              setFocused(day);
                              pick(day);
                            }}
                            onKeyDown={(event) => onKey(event, day)}
                            onFocus={() => {
                              setFocused(day);
                              setInside(true);
                            }}
                            onMouseEnter={() => setHover(day)}
                            className={cn(
                              "relative z-10 grid size-10 place-items-center rounded-lg text-sm tabular-nums outline-none transition-colors duration-100 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
                              isFrom || isTo ? "bg-foreground text-background" : between ? "hover:bg-foreground/10" : !blocked && "hover:bg-muted",
                              isPreview && "ring-1 ring-foreground/60 ring-inset",
                              isSameDay(day, today) && !isFrom && !isTo && "font-semibold underline decoration-2 underline-offset-4",
                              off && "cursor-not-allowed text-muted-foreground/40 line-through",
                              tooShort && "cursor-not-allowed text-muted-foreground/50",
                            )}
                          >
                            {day.getDate()}
                          </button>
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3">
        <p aria-live="polite" className="min-w-0 text-sm leading-snug text-pretty">
          {problem ? (
            <span className="flex items-start gap-2 font-medium text-destructive">
              <IconAlertCircle aria-hidden="true" className="mt-px size-4 shrink-0" />
              {problem}
            </span>
          ) : (
            <>
              <span className={cn(to ? "font-medium tabular-nums" : "text-foreground")}>{message}</span>
              {from && !to && minNights > 1 ? <span className="text-muted-foreground"> {text(labels.minStay, { count: minNights })}</span> : null}
            </>
          )}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!from}
          onClick={() => {
            setProblem(null);
            onValueChange({ from: null, to: null });
          }}
          className="shrink-0"
        >
          {labels.clear}
        </Button>
      </div>
    </div>
  );
}
