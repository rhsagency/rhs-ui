"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type KeyboardEvent } from "react";

import { IconCalendar, IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import {
  addDays,
  addMonths,
  clampDay,
  DEFAULT_LABELS,
  formatDay,
  formatSpan,
  isoInZone,
  monthGrid,
  normaliseWeek,
  parseIso,
  toIso,
  weekAllowed,
  weekday,
  weekdayNames,
  weekOf,
  type WeekLabels,
  type WeekNumbering,
  type WeekOptions,
  type WeekStart,
  type WeekValue,
} from "@rhs-ui/primitives/week-picker/weeks";
import { cn } from "@/lib/utils";

export type { WeekLabels, WeekNumbering, WeekStart, WeekValue } from "@rhs-ui/primitives/week-picker/weeks";

/** What decides which week a day is in, how it is written and which weeks can be picked. */
interface WeekRules {
  /** The first day of the week, 0 (Sunday) to 6 (Saturday). Default 1 (Monday), or 0 with US numbering. */
  weekStartsOn?: WeekStart;
  /** "iso" counts week 1 as the week with the first Thursday (ISO 8601); "us" as the week with 1 January. Default "iso". */
  numbering?: WeekNumbering;
  /** The locale that names the days and months and writes the span of a week. Default "en-US". */
  locale?: string;
  /** The time zone that decides what today is. Default "UTC". The days themselves are calendar dates and have none. */
  timeZone?: string;
  /** The earliest day that can be used, as 2026-03-14. A week is available when any of its days is on or after it. */
  min?: string;
  /** The latest day that can be used. A week is available when any of its days is on or before it. */
  max?: string;
  /** What "now" is, as a Date, a timestamp or an ISO string, for the marker on today. Without it the browser's clock is read, so the server renders no marker. */
  now?: Date | string | number;
  /** The words the picker says, for another language or your own voice. */
  labels?: Partial<WeekLabels>;
}

export interface WeekCalendarProps extends WeekRules, Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children" | "ref"> {
  /** The chosen week, when you control it. Only its `start` is read, so any day of the week would do. */
  value?: WeekValue | null;
  /** The week to start with, when you do not control it. */
  defaultValue?: WeekValue | null;
  /** Called with the week when a day in its row is picked. */
  onValueChange?: (value: WeekValue) => void;
  /** Move the focus into the grid when it appears, onto the day the grid is looking at. For a grid that opens in a panel. */
  autoFocusDay?: boolean;
}

export interface WeekPickerProps extends WeekRules, Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The chosen week, when you control it, or null for none. Only its `start` is read, so any day of the week would do. */
  value?: WeekValue | null;
  /** The week to start with, when you do not control it. */
  defaultValue?: WeekValue | null;
  /** Called with `{ start, end, week, year }` whenever a week is picked or stepped to. */
  onValueChange?: (value: WeekValue) => void;
  /** The field's name for a plain form submit: the first day of the week as an ISO date, in a hidden input. */
  name?: string;
  /** Turn the whole control off. */
  disabled?: boolean;
  /** Put on the button that opens the grid, so a <label htmlFor> reaches it. Or name the group with aria-labelledby. */
  id?: string;
}

const noSubscription = (): (() => void) => () => undefined;

/** Today in the time zone: from `now` when it is given, else from the browser's clock, which the server does not have, so it renders null and nothing mismatches. */
function useToday(now: WeekRules["now"], timeZone: string): string | null {
  const fixed = now === undefined ? null : isoInZone(now, timeZone);
  const live = useSyncExternalStore(
    noSubscription,
    () => isoInZone(new Date(), timeZone),
    () => null,
  );
  return fixed ?? live;
}

/** A neutral month for a grid that has nothing to look at yet; it is drawn invisible until the real one is known. */
const NO_ANCHOR = "2026-01-01";

// The week number and seven days: each column is at most the width of a fingertip and gives way when the space is narrower.
const COLUMNS = "grid grid-cols-[repeat(8,minmax(0,2.25rem))] justify-center";
const MONTH_BUTTON =
  "grid size-8 place-items-center rounded-md text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-35 motion-reduce:transition-none";

/**
 * A month where every row is a week: the number on the left, seven days next to
 * it, and a click on any day takes the whole row. The row under the pointer is
 * shaded, and so is the row of the day that has the keyboard focus, so you see
 * which week you are about to choose; the chosen week is a solid band. Arrow
 * keys move by day and week, Page Up and Down by month (Shift by year), Home
 * and End to the ends of the row, Enter picks. It is the grid inside Week
 * picker, and works on its own where a week should always be in view, such as
 * the side of a timesheet.
 */
export function WeekCalendar({
  value,
  defaultValue = null,
  onValueChange,
  weekStartsOn: startsOn,
  numbering = "iso",
  locale = "en-US",
  timeZone = "UTC",
  min,
  max,
  now,
  labels: labelOverrides,
  autoFocusDay = false,
  className,
  ...props
}: WeekCalendarProps) {
  const labels: WeekLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const weekStartsOn: WeekStart = startsOn ?? (numbering === "us" ? 0 : 1);
  const rules: WeekOptions = { weekStartsOn, numbering };
  const titleId = useId();
  const root = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  const [own, setOwn] = useState<WeekValue | null>(defaultValue);
  const selected = normaliseWeek(value === undefined ? own : value, rules);
  const today = useToday(now, timeZone);
  // Where the grid looks. It stays null until the person moves, so it follows the chosen week; then today; then the edge of the range.
  const [anchor, setAnchor] = useState<string | null>(null);
  const [seen, setSeen] = useState(selected?.start ?? null);
  if ((selected?.start ?? null) !== seen) {
    setSeen(selected?.start ?? null);
    setAnchor(null);
  }
  const known = anchor !== null || selected !== null || today !== null || min !== undefined || max !== undefined;
  const focused = anchor ?? selected?.start ?? (today ? clampDay(today, min, max) : (min ?? max ?? NO_ANCHOR));

  // After a key moved the day, the new day takes the focus once the grid has been drawn around it. The day that had it may be gone (another month), which leaves the focus on the page; but it is never taken from another control.
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    const active = document.activeElement;
    if (active && active !== document.body && !root.current?.contains(active)) return;
    root.current?.querySelector<HTMLElement>(`[data-day="${focused}"]`)?.focus({ preventScroll: true });
  });
  useEffect(() => {
    if (autoFocusDay) root.current?.querySelector<HTMLElement>('[data-day][tabindex="0"]')?.focus({ preventScroll: true });
  }, [autoFocusDay]);

  function choose(week: WeekValue) {
    if (!weekAllowed(week, min, max)) return;
    if (value === undefined) setOwn(week);
    onValueChange?.(week);
  }

  function go(day: string) {
    if (day === focused) return;
    moved.current = true;
    setAnchor(day);
  }

  function onKey(event: KeyboardEvent<HTMLButtonElement>, day: string) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const offset = (weekday(day) - weekStartsOn + 7) % 7;
    const moves: Record<string, string> = {
      ArrowLeft: addDays(day, -1),
      ArrowRight: addDays(day, 1),
      ArrowUp: addDays(day, -7),
      ArrowDown: addDays(day, 7),
      PageUp: addMonths(day, event.shiftKey ? -12 : -1),
      PageDown: addMonths(day, event.shiftKey ? 12 : 1),
      Home: addDays(day, -offset),
      End: addDays(day, 6 - offset),
    };
    const target = moves[event.key];
    if (!target) return;
    event.preventDefault();
    go(target);
  }

  const here = parseIso(focused);
  const month = here ? toIso(here.year, here.month, 1) : focused;
  const monthKey = month.slice(0, 7);
  const canGoBack = min === undefined || addDays(month, -1) >= min;
  const canGoOn = max === undefined || addMonths(month, 1) <= max;
  const names = weekdayNames(locale, weekStartsOn);
  const weeks = monthGrid(month, weekStartsOn).map((days) => ({ days, week: weekOf(days[0] ?? month, rules) }));
  const looking = weekOf(focused, rules);
  const current = today ? weekOf(today, rules) : null;
  const dayLabel: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" };

  return (
    <div ref={root} data-slot="week-calendar" className={cn("w-fit max-w-full select-none p-3", !known && "invisible", className)} {...props}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <button type="button" aria-label={labels.previousMonth} disabled={!canGoBack} onClick={() => setAnchor(addMonths(focused, -1))} className={MONTH_BUTTON}>
          <IconChevronLeft aria-hidden="true" className="size-4" />
        </button>
        <p id={titleId} aria-live="polite" suppressHydrationWarning className="text-sm font-medium capitalize">
          {formatDay(focused, locale, { month: "long", year: "numeric" })}
        </p>
        <button type="button" aria-label={labels.nextMonth} disabled={!canGoOn} onClick={() => setAnchor(addMonths(focused, 1))} className={MONTH_BUTTON}>
          <IconChevronRight aria-hidden="true" className="size-4" />
        </button>
      </div>
      <div role="grid" aria-labelledby={titleId} className="grid gap-y-0.5">
        <div role="row" className={COLUMNS}>
          <span role="columnheader" aria-label={labels.weekNumber} className="grid h-8 place-items-center text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
            {labels.weekShort}
          </span>
          {names.map((name) => (
            <span key={name.long} role="columnheader" aria-label={name.long} suppressHydrationWarning className="grid h-8 place-items-center text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
              {name.short}
            </span>
          ))}
        </div>
        {weeks.map(({ days, week }) => {
          const chosen = selected?.start === week.start;
          const open = weekAllowed(week, min, max);
          return (
            <div
              key={week.start}
              role="row"
              aria-selected={chosen}
              aria-disabled={!open || undefined}
              onClick={() => choose(week)}
              className={cn(
                COLUMNS,
                "group/week rounded-md transition-colors duration-100 motion-reduce:transition-none",
                open ? "cursor-pointer" : "cursor-not-allowed",
                chosen ? "bg-foreground text-background" : open && "hover:bg-muted has-[button:focus-visible]:bg-muted",
              )}
            >
              <span role="rowheader" aria-label={labels.week(week.week)} className={cn("grid h-9 place-items-center text-xs tabular-nums", chosen ? "text-background/70" : "text-muted-foreground", !open && "opacity-50")}>
                {week.week}
              </span>
              {days.map((day) => {
                const inMonth = day.startsWith(monthKey);
                const inRange = (min === undefined || day >= min) && (max === undefined || day <= max);
                return (
                  <span key={day} role="gridcell" className="grid">
                    <button
                      type="button"
                      data-day={day}
                      suppressHydrationWarning
                      tabIndex={day === focused ? 0 : -1}
                      aria-disabled={!open || undefined}
                      aria-current={day === today ? "date" : undefined}
                      aria-label={`${formatDay(day, locale, dayLabel)}, ${labels.week(week.week)}`}
                      onKeyDown={(event) => onKey(event, day)}
                      className={cn(
                        "grid h-9 w-full place-items-center rounded-md text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset group-aria-selected/week:focus-visible:ring-background",
                        chosen ? "text-background" : "text-foreground",
                        !inMonth && (chosen ? "text-background/55" : "text-muted-foreground/85"),
                        open && !inRange && "opacity-45",
                        !open && "pointer-events-none text-muted-foreground/40 line-through",
                        day === today && "font-semibold underline decoration-2 underline-offset-4",
                        !open && "cursor-not-allowed",
                      )}
                    >
                      {Number(day.slice(8))}
                    </button>
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border pt-2">
        <Button type="button" variant="ghost" size="sm" disabled={!current || !weekAllowed(current, min, max)} onClick={() => current && choose(current)}>
          {labels.thisWeek}
        </Button>
        <p suppressHydrationWarning className="min-w-0 text-xs text-muted-foreground tabular-nums">
          <span className="font-medium text-foreground">{labels.week(looking.week)}</span>
          <span aria-hidden="true" className="px-1.5 text-muted-foreground/60">
            &middot;
          </span>
          {formatSpan(looking.start, looking.end, locale, "short")}
        </p>
      </div>
    </div>
  );
}

// The picker draws one surface and the buttons inside it share its ring, like the other grouped fields.
const GROUP =
  "@container flex h-9 w-full min-w-0 items-stretch rounded-md border border-input bg-background text-sm shadow-xs transition-[border-color,box-shadow] duration-150 has-[button:focus-visible]:border-ring has-[button:focus-visible]:ring-[3px] has-[button:focus-visible]:ring-ring/40 data-[disabled=true]:opacity-50 motion-reduce:transition-none";
const STEP =
  "grid w-9 shrink-0 place-items-center text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none";

/**
 * A whole week for timesheets, reports and schedules: "Week 43" with the days
 * it covers, an arrow each side to step a week, and a grid in a panel where
 * every row is a week. It reports `{ start, end, week, year }` with ISO dates,
 * so a server never has to count weeks. The first day of the week and the
 * numbering (ISO 8601 or US) are props, and the names of days and months, and
 * the way a span is written, come from the locale. A week can be picked while
 * any of its days is inside `min` and `max`. Stepping is said to a screen
 * reader; the grid takes arrow keys by day and Page keys by month. Pair it with
 * <Label htmlFor> through `id`.
 */
export function WeekPicker({
  value,
  defaultValue = null,
  onValueChange,
  weekStartsOn: startsOn,
  numbering = "iso",
  locale = "en-US",
  timeZone = "UTC",
  min,
  max,
  now,
  labels: labelOverrides,
  name,
  disabled,
  id,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  ...props
}: WeekPickerProps) {
  const labels: WeekLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const weekStartsOn: WeekStart = startsOn ?? (numbering === "us" ? 0 : 1);
  const rules: WeekOptions = { weekStartsOn, numbering };
  const textId = useId();
  const [open, setOpen] = useState(false);
  const [own, setOwn] = useState<WeekValue | null>(defaultValue);
  const [said, setSaid] = useState("");
  const current = normaliseWeek(value === undefined ? own : value, rules);

  // What a screen reader was told stays only while it is news; left in the live region it would be read again with the next message.
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 5000);
    return () => window.clearTimeout(timer);
  }, [said]);

  const nameOf = (week: WeekValue) => `${labels.week(week.week)}, ${formatSpan(week.start, week.end, locale, "long")}`;
  const before = current ? weekOf(addDays(current.start, -7), rules) : null;
  const after = current ? weekOf(addDays(current.start, 7), rules) : null;

  function write(next: WeekValue) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  function step(to: WeekValue | null) {
    if (!to || !weekAllowed(to, min, max)) return;
    write(to);
    setSaid(nameOf(to));
  }

  return (
    <div
      data-slot="week-picker"
      data-disabled={disabled || undefined}
      role="group"
      aria-label={labelledBy ? undefined : (ariaLabel ?? labels.field)}
      aria-labelledby={labelledBy}
      className={cn(GROUP, className)}
      {...props}
    >
      <button type="button" aria-label={labels.previous} disabled={disabled || !before || !weekAllowed(before, min, max)} onClick={() => step(before)} className={cn(STEP, "rounded-l-[inherit]")}>
        <IconChevronLeft aria-hidden="true" className="size-4" />
      </button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={id}
          disabled={disabled}
          // With an id there is a <label> outside, and its text becomes the name: the week is then said as the description.
          aria-describedby={id && current ? textId : undefined}
          className="flex min-w-0 flex-1 items-center gap-1.5 border-x border-input px-2.5 text-left outline-none transition-colors duration-150 hover:bg-muted/60 focus-visible:bg-muted disabled:pointer-events-none motion-reduce:transition-none"
        >
          <IconCalendar aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          {current ? (
            <>
              <span aria-hidden="true" className="shrink-0 font-medium tabular-nums">
                {labels.week(current.week)}
              </span>
              {/* In a narrow space the year is left out, and in a very narrow one the dates too: the week number is what is left. */}
              <span aria-hidden="true" suppressHydrationWarning className="min-w-0 truncate text-muted-foreground tabular-nums @max-[20rem]:hidden">
                {formatSpan(current.start, current.end, locale, "short")}
              </span>
              <span aria-hidden="true" suppressHydrationWarning className="hidden min-w-0 truncate text-muted-foreground tabular-nums @max-[20rem]:inline @max-[17rem]:hidden">
                {formatSpan(current.start, current.end, locale, "short", false)}
              </span>
              <span id={textId} suppressHydrationWarning className="sr-only">
                {nameOf(current)}
              </span>
            </>
          ) : (
            <span className="truncate text-muted-foreground">{labels.placeholder}</span>
          )}
        </PopoverTrigger>
        <PopoverContent align="start" collisionPadding={8} aria-label={labels.field} className="w-auto max-w-[calc(100vw-1rem)] p-0" onOpenAutoFocus={(event) => event.preventDefault()}>
          <WeekCalendar
            autoFocusDay
            value={current}
            onValueChange={(week) => {
              write(week);
              setOpen(false);
            }}
            weekStartsOn={weekStartsOn}
            numbering={numbering}
            locale={locale}
            timeZone={timeZone}
            min={min}
            max={max}
            now={now}
            labels={labelOverrides}
          />
        </PopoverContent>
      </Popover>
      <button type="button" aria-label={labels.next} disabled={disabled || !after || !weekAllowed(after, min, max)} onClick={() => step(after)} className={cn(STEP, "rounded-r-[inherit]")}>
        <IconChevronRight aria-hidden="true" className="size-4" />
      </button>
      <span role="status" className="sr-only">
        {said}
      </span>
      {name ? <input type="hidden" name={name} value={current?.start ?? ""} disabled={disabled} /> : null}
    </div>
  );
}
