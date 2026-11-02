"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type CSSProperties, type KeyboardEvent } from "react";

import { addDays, addMonths, dayNumber, daySet, daysInMonth, dayText, fill, monthStart, todayIn, weekdayOf, type Day, type DayRange, type DaySpec } from "@rhs-ui/application/availability-calendar/dates";
import { IconChevronLeft, IconChevronRight, IconMoon } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export type { Day, DayRange, DaySpec };

/** The words the calendar uses, for translation. `{count}` is filled in. */
export interface AvailabilityCalendarLabels {
  /** The word for a free day, in the legend and (in lower case) in a day's name. Default "Available". */
  available?: string;
  /** The word for a booked day. Default "Booked". */
  booked?: string;
  /** The word for a day that is free only if you ask. Default "On request". */
  onRequest?: string;
  /** Added to the name of a day that has passed. Default "past". */
  past?: string;
  /** The word for today, in the legend and in a day's name. Default "Today". */
  today?: string;
  /** The name of the legend. Default "Legend". */
  legend?: string;
  /** The name of the arrow that goes back a month. Default "Previous month". */
  previous?: string;
  /** The name of the arrow that goes forward a month. Default "Next month". */
  next?: string;
  /** The minimum stay when it is one night. Default "Minimum stay: {count} night". */
  minStayOne?: string;
  /** The minimum stay when it is more. Default "Minimum stay: {count} nights". */
  minStayOther?: string;
}

export interface AvailabilityCalendarProps extends Omit<ComponentProps<"section">, "children" | "title" | "ref"> {
  /** How many months to show side by side (they stack on a phone). Default 1. */
  months?: 1 | 2;
  /** Days that are booked: single days ("2026-03-14") and runs (`{ start, end }`, both included). A booked day wins over a day on request. */
  booked?: readonly DaySpec[];
  /** Days that are free only if the guest asks first. */
  onRequest?: readonly DaySpec[];
  /** The fewest nights a stay can be. Written under the calendar; it does not change the days. */
  minStay?: number;
  /**
   * Today, as "2026-03-09", for days that have passed to go quiet and for the dot under today. Leave it out to use the
   * browser's clock in `timeZone`, read once the page is live, so the server and the browser agree: until then nothing
   * is marked as past, and unless `defaultMonth` or `month` says which month to show, the calendar only holds its place
   * (a fixed height) and the grid appears once the page is live.
   */
  today?: Day;
  /** The month that is shown first, as any day in it ("2026-03-01"). Defaults to the month of today. A page that is built ahead of time (static, cached) should pass it, so the grid is in the HTML and does not wait for the browser's clock. */
  defaultMonth?: Day;
  /** The first month of the view, controlled: pair it with `onMonthChange`. */
  month?: Day;
  /** The arrows (or a key) moved the view. It receives the first day of the first month shown. */
  onMonthChange?: (month: Day) => void;
  /** The first day of the week: 1 is Monday (the default), 0 is Sunday. */
  weekStartsOn?: 0 | 1;
  /** Show the legend that names every pattern in words. Colour and pattern never carry the meaning alone, so leave it on unless the page explains them. Default true. */
  legend?: boolean;
  /** The language of the month and day names. Default "en-GB". */
  locale?: string;
  /** The time zone that decides what today is. Default "UTC". */
  timeZone?: string;
  /** Heading level of the month title. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The words the calendar uses, for translation. */
  labels?: AvailabilityCalendarLabels;
}

const DEFAULT_LABELS = {
  available: "Available",
  booked: "Booked",
  onRequest: "On request",
  past: "past",
  today: "Today",
  legend: "Legend",
  previous: "Previous month",
  next: "Next month",
  minStayOne: "Minimum stay: {count} night",
  minStayOther: "Minimum stay: {count} nights",
};

type Status = "available" | "booked" | "request" | "past";

/**
 * Each state has a pattern of its own, so none depends on colour: a free day is
 * blank, a booked day is hatched on the diagonal, a day on request is dotted
 * and dashed. The lines and dots are the foreground at low strength, so they
 * hold in both themes.
 */
const PATTERNS: Record<Status, CSSProperties | undefined> = {
  available: undefined,
  booked: { backgroundImage: "repeating-linear-gradient(135deg, color-mix(in oklch, var(--foreground) 24%, transparent) 0 1.25px, transparent 1.25px 6px)" },
  request: { backgroundImage: "radial-gradient(circle, color-mix(in oklch, var(--foreground) 38%, transparent) 1px, transparent 1.5px)", backgroundSize: "7px 7px", backgroundPosition: "center" },
  past: undefined,
};

const SURFACE: Record<Status, string> = {
  available: "border border-border bg-card font-medium text-foreground",
  booked: "border border-border/60 bg-muted text-muted-foreground",
  request: "border border-dashed border-foreground/35 bg-card text-foreground",
  past: "border border-transparent text-muted-foreground/80",
};

/** The number sits on a small chip of the cell's own colour, so a hatch or a dot never runs through it. */
const NUMBER: Record<Status, string> = {
  available: "",
  booked: "bg-muted",
  request: "bg-card",
  past: "",
};

const subscribeNever = (): (() => void) => () => undefined;

/** A swatch of one state, at the size of a day in the legend. */
function Swatch({ status }: { status: Status | "today" }) {
  if (status === "today") {
    return (
      <span aria-hidden="true" className="relative size-5 shrink-0 rounded-md border border-border bg-card">
        <span className="absolute bottom-[3px] left-1/2 size-1 -translate-x-1/2 rounded-full bg-foreground" />
      </span>
    );
  }
  return <span aria-hidden="true" className={cn("size-5 shrink-0 rounded-md", SURFACE[status])} style={PATTERNS[status]} />;
}

/**
 * A read-only calendar for the days of a rental, a venue or a room: every day
 * is free, booked or on request, and each state has a pattern of its own (blank,
 * a diagonal hatch, dots) with a legend in words, so colour never carries the
 * meaning. A day is named in full ("Friday 14 March, available"); the grid is
 * a keyboard grid, so the arrow keys move across days, Home and End to the ends
 * of the week, Page Up and Down by month. Days that have passed are muted and
 * today has a dot. It only displays: pair it with the date range picker when
 * people have to choose their dates.
 */
export function AvailabilityCalendar({
  months = 1,
  booked,
  onRequest,
  minStay,
  today: pinned,
  defaultMonth,
  month: controlledMonth,
  onMonthChange,
  weekStartsOn = 1,
  legend = true,
  locale = "en-GB",
  timeZone = "UTC",
  headingLevel = 3,
  labels,
  className,
  ...props
}: AvailabilityCalendarProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const root = useRef<HTMLElement>(null);
  const refocus = useRef(false);
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const count = months === 2 ? 2 : 1;
  // "Today" is the reader's today: known only in the browser (null on the server and while hydrating), so the server marks none and nothing mismatches.
  const clock = useSyncExternalStore(subscribeNever, () => todayIn(timeZone), () => null);
  const pinnedDay = pinned !== undefined && dayNumber(pinned) !== null ? pinned : null;
  const today = pinnedDay ?? clock;
  // The month is never worked out from the clock in an initialiser: the server and the first render in the browser would each read their own clock, and a page built last month would hydrate into another month.
  // So it is the controlled month, the one the reader paged to, the one you gave, or this month once the clock is known; until then there is none and the calendar holds its place.
  const [own, setOwn] = useState<Day | null>(null);
  const given = controlledMonth !== undefined && dayNumber(controlledMonth) !== null ? monthStart(controlledMonth) : null;
  const first = defaultMonth !== undefined && dayNumber(defaultMonth) !== null ? monthStart(defaultMonth) : today !== null ? monthStart(today) : null;
  const start = given ?? own ?? first;
  const [focused, setFocused] = useState<Day | null>(null);

  const end = start === null ? null : addMonths(start, count);
  const stop =
    start === null || end === null
      ? null
      : focused !== null && focused >= start && focused < end
        ? focused
        : today !== null && today >= start && today < end
          ? today
          : start;

  // After a key has moved the focus to a day that was not on the page yet, the day has to be drawn before it can be focused.
  useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    if (stop !== null) root.current?.querySelector<HTMLElement>(`[data-day="${stop}"]`)?.focus();
  });

  // No month is known yet (no `today`, `defaultMonth` or `month`, and the browser's clock is not read until the page is live): the section holds its place at a fixed height and the grid follows.
  if (start === null || end === null || stop === null) {
    return <section ref={root} data-slot="availability-calendar" aria-busy="true" className={cn("@container min-h-[25rem] w-full", className)} {...props} />;
  }

  const bookedDays = daySet(booked);
  const requestDays = daySet(onRequest);
  const statusOf = (day: Day): Status => (today !== null && day < today ? "past" : bookedDays.has(day) ? "booked" : requestDays.has(day) ? "request" : "available");

  const setMonth = (next: Day) => {
    if (controlledMonth === undefined) setOwn(next);
    onMonthChange?.(next);
  };
  const goTo = (day: Day) => {
    refocus.current = true;
    setFocused(day);
    if (day < start) setMonth(monthStart(day));
    else if (day >= end) setMonth(addMonths(monthStart(day), -(count - 1)));
  };

  const onKey = (event: KeyboardEvent<HTMLElement>, day: Day) => {
    const offset = (weekdayOf(day) - weekStartsOn + 7) % 7;
    const moves: Record<string, () => Day> = {
      ArrowLeft: () => addDays(day, -1),
      ArrowRight: () => addDays(day, 1),
      ArrowUp: () => addDays(day, -7),
      ArrowDown: () => addDays(day, 7),
      Home: () => addDays(day, -offset),
      End: () => addDays(day, 6 - offset),
      PageUp: () => addMonths(day, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(day, event.shiftKey ? 12 : 1),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    goTo(move());
  };

  const weekdays = Array.from({ length: 7 }, (_, index) => {
    const sample = addDays("2023-01-01", weekStartsOn + index);
    return { short: dayText(sample, locale, { weekday: "narrow" }), long: dayText(sample, locale, { weekday: "long" }) };
  });
  const shown = Array.from({ length: count }, (_, index) => addMonths(start, index));
  const title = shown.length === 1
    ? dayText(start, locale, { month: "long", year: "numeric" })
    : `${dayText(shown[0]!, locale, { month: "long", ...(shown[0]!.slice(0, 4) === shown[1]!.slice(0, 4) ? {} : { year: "numeric" }) })} – ${dayText(shown[1]!, locale, { month: "long", year: "numeric" })}`;
  const word = (status: Status) => (status === "past" ? text.past : status === "booked" ? text.booked : status === "request" ? text.onRequest : text.available).toLocaleLowerCase(locale);

  const previous = (className?: string) => (
    <Button type="button" variant="outline" size="icon-sm" aria-label={text.previous} onClick={() => setMonth(addMonths(start, -1))} className={className}>
      <IconChevronLeft />
    </Button>
  );
  const next = (className?: string) => (
    <Button type="button" variant="outline" size="icon-sm" aria-label={text.next} onClick={() => setMonth(addMonths(start, 1))} className={className}>
      <IconChevronRight />
    </Button>
  );
  // Two months side by side once the calendar itself is wide enough (a container query, so it works in a sidebar as well as a page).
  // Then each month has its own title with an arrow at the outer edge, and the toolbar is only a name for screen readers.
  const pair = count === 2;

  return (
    <section ref={root} data-slot="availability-calendar" aria-labelledby={`${id}-title`} className={cn("@container w-full", className)} {...props}>
      <div className={cn("mb-5 flex items-center justify-between gap-3", pair && "@xl:mb-0")}>
        <Heading
          id={`${id}-title`}
          aria-live="polite"
          className={cn("text-base leading-tight font-semibold tracking-[-0.02em] capitalize", pair && "@xl:sr-only")}
          suppressHydrationWarning
        >
          {title}
        </Heading>
        <div className={cn("flex items-center gap-1.5", pair && "@xl:hidden")}>
          {previous()}
          {next()}
        </div>
      </div>

      <div className={cn("grid gap-x-10 gap-y-8", pair && "@xl:grid-cols-2")}>
        {shown.map((first, position) => {
          const offset = (weekdayOf(first) - weekStartsOn + 7) % 7;
          const total = daysInMonth(first);
          const cells = Array.from({ length: Math.ceil((offset + total) / 7) * 7 }, (_, index) => (index >= offset && index < offset + total ? addDays(first, index - offset) : null));
          const weeks = Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
          const name = dayText(first, locale, { month: "long", year: "numeric" });
          return (
            <div key={first} className="min-w-0">
              {pair ? (
                <div aria-hidden="false" className="mb-3 flex h-8 items-center @xl:grid @xl:grid-cols-[2rem_minmax(0,1fr)_2rem]">
                  {position === 0 ? previous("hidden @xl:inline-flex") : <span className="hidden @xl:block" />}
                  <p aria-hidden="true" className="text-sm font-semibold capitalize @xl:text-center" suppressHydrationWarning>
                    {name}
                  </p>
                  {position === count - 1 ? next("hidden @xl:ml-auto @xl:inline-flex") : <span className="hidden @xl:block" />}
                </div>
              ) : null}
              <div role="grid" aria-readonly="true" aria-label={name} className="grid gap-1">
                <div role="row" className="grid grid-cols-7 gap-1">
                  {weekdays.map((day) => (
                    <span key={day.long} role="columnheader" aria-label={day.long} suppressHydrationWarning className="grid h-7 place-items-center text-[0.6875rem] font-medium tracking-[0.04em] text-muted-foreground uppercase">
                      {day.short}
                    </span>
                  ))}
                </div>
                {weeks.map((week) => (
                  <div key={week.find(Boolean) ?? first} role="row" className="grid grid-cols-7 gap-1">
                    {week.map((day, index) => {
                      if (!day) return <span key={`blank-${index}`} role="gridcell" aria-hidden="true" />;
                      const status = statusOf(day);
                      const isToday = today === day;
                      const label = `${dayText(day, locale, { weekday: "long", day: "numeric", month: "long" })}, ${isToday ? `${text.today.toLocaleLowerCase(locale)}, ` : ""}${word(status)}`;
                      return (
                        <div
                          key={day}
                          role="gridcell"
                          data-day={day}
                          data-status={status}
                          tabIndex={day === stop ? 0 : -1}
                          aria-label={label}
                          aria-current={isToday ? "date" : undefined}
                          suppressHydrationWarning
                          onFocus={() => setFocused(day)}
                          onKeyDown={(event) => onKey(event, day)}
                          style={PATTERNS[status]}
                          className={cn(
                            "relative grid aspect-square min-h-8 w-full place-items-center rounded-lg text-sm tabular-nums outline-none select-none",
                            "transition-shadow duration-150 focus-visible:z-10 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
                            SURFACE[status],
                            isToday && "font-semibold",
                          )}
                        >
                          <span aria-hidden="true" className={cn("rounded-[4px] px-1 leading-5", NUMBER[status])}>
                            {Number(day.slice(8))}
                          </span>
                          {isToday ? <span aria-hidden="true" className="absolute bottom-[clamp(3px,calc(50%_-_14px),5px)] left-1/2 size-1 -translate-x-1/2 rounded-full bg-foreground" /> : null}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {legend || minStay !== undefined ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border pt-4 text-[0.8125rem] text-muted-foreground">
          {legend ? (
            <ul aria-label={text.legend} className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {(["available", "booked", "request"] as const).map((status) => (
                <li key={status} className="flex items-center gap-2">
                  <Swatch status={status} />
                  <span className="text-foreground">{status === "available" ? text.available : status === "booked" ? text.booked : text.onRequest}</span>
                </li>
              ))}
              {today !== null ? (
                <li className="flex items-center gap-2">
                  <Swatch status="today" />
                  <span className="text-foreground">{text.today}</span>
                </li>
              ) : null}
            </ul>
          ) : (
            <span />
          )}
          {minStay !== undefined ? (
            <p className="flex items-center gap-1.5 tabular-nums">
              <IconMoon className="size-4 shrink-0" />
              {fill(minStay === 1 ? text.minStayOne : text.minStayOther, { count: minStay })}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
