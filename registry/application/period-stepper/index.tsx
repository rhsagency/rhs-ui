"use client";

import { useId, useMemo, useRef, useState, useSyncExternalStore, type ComponentProps, type KeyboardEvent } from "react";

import { IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { DEFAULT_LABELS, describePeriod, endOf, fill, isDay, labelSamples, shift, startOf, todayIn, type PeriodStepperLabels, type PeriodUnit } from "@rhs-ui/application/period-stepper/periods";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export type { PeriodStepperLabels, PeriodUnit } from "@rhs-ui/application/period-stepper/periods";

/** The period that was moved to: its first and last day, as calendar days, and its unit. */
export interface PeriodRange {
  /** The first day, "2026-10-19". */
  start: string;
  /** The last day, "2026-10-25". */
  end: string;
  unit: PeriodUnit;
}

export interface PeriodStepperProps extends Omit<ComponentProps<"div">, "onChange" | "defaultValue" | "children"> {
  /** What a step is: a day, a week, a month or a year. Default "week". */
  unit?: PeriodUnit;
  /** Any day inside the period shown, as "2026-10-21": the stepper shows the period that holds it. A day is a calendar day, never a moment, so it does not shift with a time zone. Controlled: pair it with `onChange`. */
  value?: string;
  /** The day the period is taken from at the start, when you do not control it. Default today. */
  defaultValue?: string;
  /** A different period was moved to, by a button, an arrow key or Today. It receives the period's first day and its range. */
  onChange?: (start: string, range: PeriodRange) => void;
  /** The first day that can be shown, "2026-01-01". The previous button stops at the period that holds it. */
  min?: string;
  /** The last day that can be shown. The next button stops at the period that holds it. */
  max?: string;
  /** The first day of the week: 0 for Sunday, 1 for Monday (the default) up to 6 for Saturday. It also decides how weeks are numbered. */
  weekStart?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** The language the label is written in. Default "en-US". */
  locale?: string;
  /** The time zone that decides what today is, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /**
   * Pins today ("2026-10-26"), for previews and tests. Leave it out to use the browser's clock, read once the page is
   * live. The period first drawn when you pass no `value` still comes from the clock of whoever renders it, so a page
   * that is cached or built ahead of time must pass `value` or `today` (or render the stepper on the client only).
   */
  today?: string;
  /** Draws the Today button while the period shown is not the current one. Default true. */
  showToday?: boolean;
  /** The words the stepper says, for translation. */
  labels?: PeriodStepperLabels;
}

const subscribeNever = () => () => undefined;

/**
 * The least room a label has, so a short one (a year, a weekday) still gives the buttons some air. What keeps the
 * buttons from moving as the label changes is not this, it is the sizer in the label: the widest text the unit and the
 * language can show, drawn invisibly, so the room is the longest label's whatever its font or its language.
 */
const LABEL_WIDTH: Record<PeriodUnit, string> = {
  day: "min-w-32",
  week: "min-w-32",
  month: "min-w-32",
  year: "min-w-20",
};

/**
 * A small control for moving through time in a report or a calendar: a
 * previous button, the period in words ("Week 43, 19 to 25 Oct 2026") and a
 * next button, with a Today button that appears only while the period shown is
 * not the current one. It steps by a day, a week, a month or a year, the
 * buttons switch off at `min` and `max`, and the label is a polite live region
 * that is also a stop of its own: with focus on it the left and right arrow
 * keys step, so a screen reader hears each new period. Days are calendar days
 * written as 2026-10-26, so nothing shifts with a time zone; the label, the
 * first day of the week and the week numbers follow the locale. The control
 * keeps the width of the widest label its unit can show in that language, so
 * the Next button does not move under the pointer while you step through it.
 */
export function PeriodStepper({
  unit = "week",
  value,
  defaultValue,
  onChange,
  min,
  max,
  weekStart = 1,
  locale = "en-US",
  timeZone = "UTC",
  today: pinnedToday,
  showToday = true,
  labels,
  className,
  ...props
}: PeriodStepperProps) {
  const text: Required<PeriodStepperLabels> = { ...DEFAULT_LABELS, ...labels, units: { ...DEFAULT_LABELS.units, ...labels?.units } };
  const hintId = useId();
  const label = useRef<HTMLDivElement>(null);
  const [own, setOwn] = useState(() => (isDay(defaultValue) ? defaultValue : (pinnedToday ?? todayIn(timeZone))));
  // Today is known only in the browser: the server draws no Today button, so it cannot mismatch. A pinned day is known everywhere.
  const today = useSyncExternalStore(
    subscribeNever,
    () => pinnedToday ?? todayIn(timeZone),
    () => pinnedToday ?? null,
  );

  const anchor = isDay(value) ? value : own;
  // The period that holds the day; one that lies wholly outside the limits gives way to the one that holds the limit.
  let start = startOf(unit, anchor, weekStart);
  if (isDay(min) && endOf(unit, start) < min) start = startOf(unit, min, weekStart);
  if (isDay(max) && start > max) start = startOf(unit, max, weekStart);

  const lowest = isDay(min) ? min : null;
  const highest = isDay(max) ? max : null;
  const before = (from: string) => lowest !== null && endOf(unit, shift(unit, from, -1)) < lowest;
  const after = (from: string) => highest !== null && shift(unit, from, 1) > highest;
  const previousBlocked = before(start);
  const nextBlocked = after(start);

  const current = today === null ? null : startOf(unit, today, weekStart);
  const outside = current !== null && ((lowest !== null && endOf(unit, current) < lowest) || (highest !== null && current > highest));
  const canJump = showToday && current !== null && current !== start && !outside;

  function go(next: string, focusLabel: boolean) {
    if (value === undefined) setOwn(next);
    onChange?.(next, { start: next, end: endOf(unit, next), unit });
    // The button that was pressed may be off now, or gone: the label is where focus waits.
    if (focusLabel) label.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const forward = (event.key === "ArrowRight") !== rtl;
    event.preventDefault();
    if (forward ? nextBlocked : previousBlocked) return;
    go(shift(unit, start, forward ? 1 : -1), false);
  }

  const period = describePeriod(unit, start, { locale, weekStart, text });
  const word = text.units[unit] ?? DEFAULT_LABELS.units[unit];
  // The widest label this unit and language can show: it holds the room, so the buttons stay put while the label changes.
  const samples = useMemo(() => labelSamples(unit, { locale, weekStart, week: text.week, to: text.to }), [unit, locale, weekStart, text.week, text.to]);

  return (
    <div data-slot="period-stepper" data-unit={unit} className={cn("flex flex-wrap items-center gap-2", className)} {...props}>
      <div role="group" aria-label={text.group} className="inline-flex h-10 max-w-full min-w-0 items-stretch rounded-lg border border-border bg-background shadow-xs">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={fill(text.previous, { unit: word })}
          disabled={previousBlocked}
          onClick={() => go(shift(unit, start, -1), before(shift(unit, start, -1)))}
          className="h-full w-9 shrink-0 rounded-none rounded-s-[7px] text-muted-foreground hover:text-foreground focus-visible:ring-inset"
        >
          <IconChevronLeft className="rtl:rotate-180" />
        </Button>
        {/* Two things in one cell of a grid: the label, and under it the sizer, which is never seen. The cell is as wide as the wider of the two, and it clips, so in a container too narrow for it the label shrinks and its lines end in an ellipsis instead of widening the page. */}
        <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)] overflow-hidden border-x border-border">
          <span
            aria-hidden="true"
            data-slot="period-stepper-sizer"
            suppressHydrationWarning
            className={cn("invisible col-start-1 row-start-1 flex flex-col items-center justify-center px-2 text-center whitespace-nowrap tabular-nums", LABEL_WIDTH[unit])}
          >
            <span suppressHydrationWarning className="grid text-sm leading-5 font-medium">
              {samples.primary.map((sample, index) => (
                <span key={index} suppressHydrationWarning className="col-start-1 row-start-1 first-letter:uppercase">
                  {sample}
                </span>
              ))}
            </span>
            {samples.secondary.length ? (
              <span suppressHydrationWarning className="grid text-xs leading-4">
                {samples.secondary.map((sample, index) => (
                  <span key={index} suppressHydrationWarning className="col-start-1 row-start-1">
                    {sample}
                  </span>
                ))}
              </span>
            ) : null}
          </span>
          <div
            ref={label}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            aria-describedby={hintId}
            aria-keyshortcuts="ArrowLeft ArrowRight"
            tabIndex={0}
            onKeyDown={onKeyDown}
            suppressHydrationWarning
            className="col-start-1 row-start-1 flex min-w-0 flex-col items-center justify-center px-2 text-center tabular-nums outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset"
          >
            <span suppressHydrationWarning className="max-w-full truncate text-sm leading-5 font-medium text-foreground first-letter:uppercase">
              {period.primary}
            </span>
            {period.secondary ? (
              <>
                <span className="sr-only">, </span>
                <span suppressHydrationWarning className="max-w-full truncate text-xs leading-4 text-muted-foreground">
                  {period.secondary}
                </span>
              </>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={fill(text.next, { unit: word })}
          disabled={nextBlocked}
          onClick={() => go(shift(unit, start, 1), after(shift(unit, start, 1)))}
          className="h-full w-9 shrink-0 rounded-none rounded-e-[7px] text-muted-foreground hover:text-foreground focus-visible:ring-inset"
        >
          <IconChevronRight className="rtl:rotate-180" />
        </Button>
      </div>
      {canJump && current !== null ? (
        <Button type="button" variant="outline" className="h-10 px-3" onClick={() => go(current, true)}>
          {text.today}
        </Button>
      ) : null}
      <span id={hintId} className="sr-only">
        {text.hint}
      </span>
    </div>
  );
}
