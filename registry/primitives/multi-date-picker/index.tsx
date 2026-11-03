"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type KeyboardEvent } from "react";

import { IconChevronLeft, IconChevronRight, IconInfo } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Chip } from "@rhs-ui/primitives/chip";
import {
  addDays,
  addMonths,
  clampDay,
  DEFAULT_LABELS,
  formatDay,
  isoInZone,
  monthGrid,
  parseIso,
  runBetween,
  sortedUnique,
  weekday,
  weekdayNames,
  type MultiDateLabels,
  type WeekStart,
} from "@rhs-ui/primitives/multi-date-picker/dates";
import { cn } from "@/lib/utils";

export type { MultiDateLabels, WeekStart } from "@rhs-ui/primitives/multi-date-picker/dates";

export interface MultiDatePickerProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The chosen days as ISO dates ("2026-10-27"), in any order. Use it to control the picker. */
  value?: readonly string[];
  /** The days to start with, when you do not control the picker. */
  defaultValue?: readonly string[];
  /** Called with every pick, as ISO dates in date order, each once. */
  onValueChange?: (value: string[]) => void;
  /** The first day that can be picked, as an ISO date. Earlier days are struck through. */
  min?: string;
  /** The last day that can be picked, as an ISO date. */
  max?: string;
  /** The most days that can be picked. At the limit the days that are not picked turn off, and the line under the calendar says why. */
  maxDates?: number;
  /** Days that cannot be picked: a list of ISO dates, or a function that answers for one ("2026-10-31"). Weekends, holidays, sold-out days. */
  disabledDates?: readonly string[] | ((date: string) => boolean);
  /** The language the month, the weekdays and the chips are written in. Default "en-US". */
  locale?: string;
  /** The time zone that decides what today is, for the marker on today. The days themselves are calendar dates and have none. Default "UTC". */
  timeZone?: string;
  /** The first day of the week, 0 (Sunday) to 6 (Saturday). Default 1, Monday. */
  weekStartsOn?: WeekStart;
  /** The month to open on while nothing is picked: "2026-11" or any day in it. Default the month of the first pick, then today. */
  defaultMonth?: string;
  /** The field's name for a plain form submit: one hidden input per day, so `formData.getAll(name)` returns the list. */
  name?: string;
  /** Turn the whole picker off. */
  disabled?: boolean;
  /** The words the picker says, for another language or your own voice. */
  labels?: Partial<MultiDateLabels>;
}

const noSubscription = (): (() => void) => () => undefined;

/** Today in the time zone, from the browser's clock. The server has no reader's clock, so it gets null and nothing mismatches. */
function useToday(timeZone: string): string | null {
  return useSyncExternalStore(
    noSubscription,
    () => isoInZone(new Date(), timeZone),
    () => null,
  );
}

/** A neutral month for a grid that has nothing to look at yet; it stays invisible until the real one is known. */
const NO_ANCHOR = "2026-01-01";

const MONTH_BUTTON =
  "grid size-8 place-items-center rounded-md text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none";

const DAY_LONG: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" };

/**
 * A calendar for a set of days that are not one range: blackout dates, event
 * days, days off. A click adds a day or takes it away, Shift-click adds every
 * day between the last pick and this one, and the keyboard works as in the
 * house Calendar (arrows by day and week, Page keys by month, Home and End to
 * the ends of the week, Enter or Space picks, with Shift for a run). The picks
 * are listed under the grid as chips in date order, each with a remove button,
 * and one polite line counts them ("3 dates selected, up to 5"). With a
 * limit, the days that are not picked turn off once it is reached and the
 * reason is written out; Clear removes everything in one step. Days are ISO
 * dates, so no time zone gets in between what is picked and what is stored.
 */
export function MultiDatePicker({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  maxDates,
  disabledDates,
  locale = "en-US",
  timeZone = "UTC",
  weekStartsOn = 1,
  defaultMonth,
  name,
  disabled,
  labels: labelOverrides,
  className,
  ...props
}: MultiDatePickerProps) {
  const labels: MultiDateLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const base = useId();
  const titleId = `${base}-title`;
  const limitId = `${base}-limit`;
  const root = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  const [own, setOwn] = useState(() => sortedUnique(defaultValue));
  const [anchor, setAnchor] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const selected = value === undefined ? own : sortedUnique(value);
  const chosen = new Set(selected);
  const today = useToday(timeZone);
  const seedDay = defaultMonth ? (defaultMonth.length === 7 ? `${defaultMonth}-01` : defaultMonth) : null;
  const seed = seedDay && parseIso(seedDay) ? seedDay : null;
  const known = anchor !== null || selected.length > 0 || seed !== null || today !== null || min !== undefined || max !== undefined;
  const focused = anchor ?? selected[0] ?? seed ?? (today ? clampDay(today, min, max) : (min ?? max ?? NO_ANCHOR));
  const atLimit = maxDates !== undefined && selected.length >= maxDates;
  const listed = Array.isArray(disabledDates) ? new Set<string>(disabledDates) : null;
  const refused = (day: string) => (min !== undefined && day < min) || (max !== undefined && day > max) || Boolean(listed?.has(day)) || (typeof disabledDates === "function" && disabledDates(day));

  // After a key moved the day, the new day takes the focus once the grid has been drawn around it. It is never taken from another control.
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    const active = document.activeElement;
    if (active && active !== document.body && !root.current?.contains(active)) return;
    root.current?.querySelector<HTMLElement>(`[data-day="${focused}"]`)?.focus({ preventScroll: true });
  });

  function commit(next: readonly string[]) {
    const clean = sortedUnique(next);
    if (value === undefined) setOwn(clean);
    onValueChange?.(clean);
  }

  function focusDay() {
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(`[data-day="${focused}"]`)?.focus({ preventScroll: true }));
  }

  function pick(day: string, run: boolean) {
    if (disabled || refused(day)) return;
    setAnchor(day);
    setNote("");
    if (run && last && last !== day) {
      // The run is added from the last pick outwards, so when the limit cuts it short, the days nearest the last pick are the ones that stay.
      const days = last < day ? runBetween(last, day) : runBetween(day, last).reverse();
      const fresh = days.filter((entry) => !chosen.has(entry) && !refused(entry));
      const room = maxDates === undefined ? fresh.length : Math.max(0, maxDates - selected.length);
      const added = fresh.slice(0, room);
      if (added.length < fresh.length && maxDates !== undefined) setNote(labels.truncated(added.length, fresh.length, maxDates));
      if (added.length) commit([...selected, ...added]);
      setLast(day);
      return;
    }
    if (chosen.has(day)) {
      commit(selected.filter((entry) => entry !== day));
      setLast(day);
      return;
    }
    if (atLimit) return;
    commit([...selected, day]);
    setLast(day);
  }

  function go(day: string) {
    if (day === focused) return;
    moved.current = true;
    setAnchor(day);
  }

  function onKey(event: KeyboardEvent<HTMLButtonElement>, day: string) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pick(day, event.shiftKey);
      return;
    }
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
  const month = here ? `${focused.slice(0, 7)}-01` : focused;
  const monthKey = month.slice(0, 7);
  const names = weekdayNames(locale, weekStartsOn);
  const weeks = monthGrid(month, weekStartsOn);
  const years = new Set(selected.map((day) => day.slice(0, 4)));
  const chipFormat: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", ...(years.size > 1 ? { year: "numeric" } : {}) };

  return (
    <div ref={root} role="group" data-slot="multi-date-picker" data-disabled={disabled || undefined} className={cn("w-full max-w-[19.5rem] min-w-0 p-3", !known && "invisible", className)} {...props}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <button type="button" aria-label={labels.previousMonth} disabled={disabled} onClick={() => setAnchor(addMonths(focused, -1))} className={MONTH_BUTTON}>
          <IconChevronLeft aria-hidden="true" className="size-4" />
        </button>
        <p id={titleId} aria-live="polite" suppressHydrationWarning className="text-sm font-medium capitalize">
          {formatDay(focused, locale, { month: "long", year: "numeric" })}
        </p>
        <button type="button" aria-label={labels.nextMonth} disabled={disabled} onClick={() => setAnchor(addMonths(focused, 1))} className={MONTH_BUTTON}>
          <IconChevronRight aria-hidden="true" className="size-4" />
        </button>
      </div>

      <div role="grid" aria-labelledby={titleId} aria-multiselectable="true" className="select-none">
        <div role="row" className="grid grid-cols-7">
          {names.map((entry) => (
            <span
              key={entry.long}
              role="columnheader"
              aria-label={entry.long}
              suppressHydrationWarning
              className="grid h-8 place-items-center text-[0.6875rem] font-medium text-muted-foreground uppercase"
            >
              {entry.short}
            </span>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={week[0]} role="row" className="grid grid-cols-7">
            {week.map((day) => {
              const inMonth = day.startsWith(monthKey);
              const on = chosen.has(day);
              const blocked = refused(day);
              const full = !on && !blocked && atLimit;
              return (
                <span key={day} role="gridcell" aria-selected={on} className="grid p-0.5">
                  <button
                    type="button"
                    data-day={day}
                    suppressHydrationWarning
                    disabled={disabled}
                    tabIndex={day === focused ? 0 : -1}
                    aria-disabled={blocked || full || undefined}
                    aria-current={day === today ? "date" : undefined}
                    aria-describedby={full ? limitId : undefined}
                    aria-label={formatDay(day, locale, DAY_LONG)}
                    onClick={(event) => pick(day, event.shiftKey)}
                    onKeyDown={(event) => onKey(event, day)}
                    className={cn(
                      "grid h-9 w-full place-items-center rounded-md text-sm tabular-nums outline-none transition-colors duration-100 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
                      inMonth ? "text-foreground" : "text-muted-foreground/60",
                      !on && !blocked && !full && "hover:bg-muted",
                      on && "bg-foreground font-medium text-background hover:bg-foreground/90",
                      day === today && !on && "font-semibold underline decoration-2 underline-offset-4",
                      // A day that is out of reach is struck through only inside the month: the grey days of the neighbouring months are quiet enough.
                      blocked && cn("cursor-not-allowed text-muted-foreground/40", inMonth && "line-through"),
                      full && "cursor-not-allowed opacity-40",
                      disabled && "cursor-not-allowed opacity-50",
                    )}
                  >
                    {Number(day.slice(8))}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-2 grid gap-2.5 border-t border-border pt-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3">
          <p role="status" aria-live="polite" className="min-h-8 min-w-0 content-center text-xs leading-5 text-muted-foreground tabular-nums">
            {labels.count(selected.length, maxDates)}
          </p>
          {selected.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="-mr-1.5 shrink-0"
              onClick={() => {
                commit([]);
                setLast(null);
                setNote("");
                focusDay();
              }}
            >
              {labels.clear}
            </Button>
          ) : null}
          {/* The reason and any one-off note have the whole width. They stay in the page when empty, at no height: a live region that appears together with its message is often never read. */}
          <div role="status" aria-live="polite" className="col-span-2 grid gap-1 text-xs leading-5 not-empty:mt-1 empty:h-0 empty:overflow-hidden">
            {note ? <p className="text-foreground">{note}</p> : null}
            {atLimit && maxDates !== undefined ? (
              <p id={limitId} className="flex items-start gap-1.5 font-medium text-foreground">
                <IconInfo aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                <span>{labels.limitReached(maxDates)}</span>
              </p>
            ) : null}
          </div>
        </div>

        {selected.length > 0 ? (
          // The chips are direct children of the list, so a chip removed from the keyboard hands its focus to the one beside it.
          <div role="list" aria-label={labels.listLabel} className="flex min-h-8 flex-wrap gap-1.5">
            {selected.map((day) => (
              <Chip
                key={day}
                role="listitem"
                variant="input"
                size="md"
                disabled={disabled}
                removeLabel={labels.remove(formatDay(day, locale, DAY_LONG))}
                onRemove={() => {
                  commit(selected.filter((entry) => entry !== day));
                  setNote("");
                  if (selected.length === 1) focusDay();
                }}
              >
                <span suppressHydrationWarning>{formatDay(day, locale, chipFormat)}</span>
              </Chip>
            ))}
          </div>
        ) : (
          <p className="flex min-h-8 items-center text-xs text-muted-foreground">{labels.empty}</p>
        )}
      </div>

      {name ? selected.map((day) => <input key={day} type="hidden" name={name} value={day} disabled={disabled} />) : null}
    </div>
  );
}
