"use client";

import { useId, useRef, useState, useSyncExternalStore, type ComponentProps, type KeyboardEvent } from "react";

import { IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { addDays, countOn, formatDay, formatDays, isDay, startOfWeek, todayIn } from "@rhs-ui/application/week-strip/dates";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** The words the strip uses, for translation. `{date}` and `{count}` are filled in. */
export interface WeekStripLabels {
  /** The name of the row of days. Default "Week of {date}". */
  week?: string;
  /** The name of the arrow that goes back a week. Default "Previous week". */
  previous?: string;
  /** The name of the arrow that goes forward. Default "Next week". */
  next?: string;
  /** The button that brings today back. Default "Today". */
  today?: string;
  /** Added to a day's name when it has one event. Default "has 1 event". */
  oneEvent?: string;
  /** Added when it has several. Default "has {count} events". */
  events?: string;
  /** Added when you only said that it has something, without a count. Default "has events". */
  marked?: string;
}

export interface WeekStripProps extends Omit<ComponentProps<"div">, "onChange" | "defaultValue" | "children"> {
  /** The chosen day as "2026-10-26", or null for none. A day is a calendar day, never a moment, so it does not shift with a time zone. Controlled: pair it with `onChange`. */
  value?: string | null;
  /** The day chosen at the start, when you do not control it. */
  defaultValue?: string | null;
  /** A day was chosen, by tap, click, Enter, Space or an arrow key (the choice follows the focus). */
  onChange?: (day: string) => void;
  /** The first day of the week: 0 for Sunday, 1 for Monday (the default) up to 6 for Saturday. */
  weekStart?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Days that have something on them. A list of days gives each one dot; an object maps each day to how many events it has, up to three dots, said in words. */
  marked?: readonly string[] | Readonly<Record<string, number>>;
  /** The first day that can be chosen. Earlier days are dimmed and out of reach, and the arrow stops at their week. */
  min?: string;
  /** The last day that can be chosen. */
  max?: string;
  /** A different week came into view, by Page Up or Page Down, an arrow key at the edge, the arrows or Today. It receives the week's first day. */
  onWeekChange?: (start: string) => void;
  /** The language of the weekday names, the month and the full dates. Default "en-US". */
  locale?: string;
  /** The time zone that decides what today is, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /**
   * Pins today ("2026-10-26"), for previews and tests. Leave it out to use the browser's clock, read once the page is
   * live: the ring waits for it, so nothing mismatches. The week first drawn still comes from the clock of whoever
   * renders it, so a page that is cached or built ahead of time must pass `today` (or render the strip on the client
   * only), or a visitor after the week turned hydrates with a different week than the HTML holds.
   */
  today?: string;
  /** Hides the month and the week arrows, for a strip that sits under a header of your own. Page Up and Page Down still change the week. */
  hideNav?: boolean;
  /** The words the strip uses, for translation. */
  labels?: WeekStripLabels;
}

const DEFAULT_LABELS = {
  week: "Week of {date}",
  previous: "Previous week",
  next: "Next week",
  today: "Today",
  oneEvent: "has 1 event",
  events: "has {count} events",
  marked: "has events",
} satisfies Required<WeekStripLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const subscribeNever = () => () => undefined;

/**
 * Seven days in a row for choosing one on a phone, the way a phone calendar
 * does: the weekday, the date, today ringed and the chosen day filled, with
 * one to three dots under a day that has events. The row is a single tab stop;
 * arrow keys move between days and choose as they go, Home and End go to the
 * ends of the week, and Page Up and Page Down change the week. Every day has a
 * full-date name ("Monday, 26 October 2026, has 3 events"), the weekday
 * names, the month and the first day of the week come from the locale, and
 * days outside `min` and `max` cannot be reached. Put it above an agenda list.
 */
export function WeekStrip({
  value,
  defaultValue = null,
  onChange,
  weekStart = 1,
  marked,
  min,
  max,
  onWeekChange,
  locale = "en-US",
  timeZone = "UTC",
  today: pinnedToday,
  hideNav = false,
  labels,
  className,
  ...props
}: WeekStripProps) {
  const text: Required<WeekStripLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  // The day a key press has moved to, until focus lands on it: a second press in the same frame starts from here and not from the old button.
  const pending = useRef<string | null>(null);
  const [own, setOwn] = useState<string | null>(defaultValue);
  const chosen = value === undefined ? own : value;
  const selected = isDay(chosen) ? chosen : null;
  // Today is known only in the browser: the server draws no ring, so the ring cannot mismatch. A pinned day is known everywhere.
  const today = useSyncExternalStore(
    subscribeNever,
    () => pinnedToday ?? todayIn(timeZone),
    () => pinnedToday ?? null,
  );
  // The week in view is where the chosen day, or else today, is. A day chosen from outside brings its own week into view.
  const [anchor, setAnchor] = useState(() => selected ?? pinnedToday ?? todayIn(timeZone));
  const [seen, setSeen] = useState(selected);
  if (selected !== seen) {
    setSeen(selected);
    if (selected) setAnchor(selected);
  }

  const start = startOfWeek(anchor, weekStart);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const last = addDays(start, 6);
  const blocked = (day: string) => Boolean((min && day < min) || (max && day > max));
  const todayInView = today !== null && days.includes(today);
  const stop = [selected, today].find((day) => day !== null && days.includes(day) && !blocked(day)) ?? days.find((day) => !blocked(day)) ?? start;

  const title =
    start.slice(0, 7) === last.slice(0, 7)
      ? formatDay(start, locale, { month: "long", year: "numeric" })
      : formatDays(start, last, locale, { month: "short", year: "numeric" });

  function choose(day: string) {
    if (value === undefined) setOwn(day);
    onChange?.(day);
  }

  function show(week: string) {
    setAnchor(week);
    onWeekChange?.(startOfWeek(week, weekStart));
  }

  /** Chooses a day, brings its week into view and, from the keyboard, moves focus to it. */
  function go(target: string, focus: boolean) {
    const day = min && target < min ? min : max && target > max ? max : target;
    if (day !== selected) choose(day);
    if (startOfWeek(day, weekStart) !== start) show(day);
    if (focus) {
      pending.current = day;
      requestAnimationFrame(() => {
        root.current?.querySelector<HTMLElement>(`[data-day="${day}"]`)?.focus();
        if (pending.current === day) pending.current = null;
      });
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const from = pending.current ?? (event.target as HTMLElement).closest<HTMLElement>("[data-day]")?.dataset.day;
    if (!from || event.altKey || event.ctrlKey || event.metaKey) return;
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const first = startOfWeek(from, weekStart);
    const moves: Record<string, string> = {
      ArrowRight: addDays(from, rtl ? -1 : 1),
      ArrowLeft: addDays(from, rtl ? 1 : -1),
      ArrowDown: addDays(from, 1),
      ArrowUp: addDays(from, -1),
      PageDown: addDays(from, 7),
      PageUp: addDays(from, -7),
      Home: first,
      End: addDays(first, 6),
    };
    const next = moves[event.key];
    if (!next) return;
    event.preventDefault();
    go(next, true);
  }

  const previousBlocked = Boolean(min && addDays(start, -1) < min);
  const nextBlocked = Boolean(max && addDays(start, 7) > max);
  const canJump = today !== null && !todayInView && !blocked(today);

  return (
    <div ref={root} data-slot="week-strip" className={cn("@container grid gap-2", className)} {...props}>
      {hideNav ? null : (
        <div className="flex items-center gap-1">
          <p id={`${id}-title`} aria-live="polite" suppressHydrationWarning className="me-auto min-w-0 truncate text-sm font-semibold tracking-[-0.01em] first-letter:uppercase">
            {title}
          </p>
          {canJump ? (
            <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => go(today, true)}>
              {text.today}
            </Button>
          ) : null}
          <Button type="button" variant="ghost" size="icon-sm" aria-label={text.previous} disabled={previousBlocked} onClick={() => show(addDays(start, -7))} className="text-muted-foreground hover:text-foreground">
            <IconChevronLeft className="rtl:rotate-180" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={text.next} disabled={nextBlocked} onClick={() => show(addDays(start, 7))} className="text-muted-foreground hover:text-foreground">
            <IconChevronRight className="rtl:rotate-180" />
          </Button>
        </div>
      )}
      <div role="radiogroup" aria-label={fill(text.week, { date: formatDay(start, locale, { day: "numeric", month: "short", year: "numeric" }) })} onKeyDown={onKeyDown} className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isSelected = day === selected;
          const isToday = day === today;
          const off = blocked(day);
          const count = countOn(marked, day);
          const counted = !Array.isArray(marked);
          const said = count === 0 ? "" : counted ? (count === 1 ? text.oneEvent : fill(text.events, { count: String(count) })) : text.marked;
          const full = formatDay(day, locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
          return (
            <button
              key={day}
              type="button"
              role="radio"
              data-day={day}
              data-today={isToday ? "" : undefined}
              aria-checked={isSelected}
              aria-current={isToday ? "date" : undefined}
              aria-label={said ? `${full}, ${said}` : full}
              disabled={off}
              tabIndex={day === stop ? 0 : -1}
              onClick={() => go(day, false)}
              suppressHydrationWarning
              className={cn(
                "flex min-w-0 flex-col items-center gap-2 rounded-xl px-0.5 pt-2 pb-1.5 outline-none select-none",
                "transition-colors duration-150 motion-reduce:transition-none",
                "focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-40",
                !isSelected && !off && "hover:bg-muted/70",
              )}
            >
              <span aria-hidden="true" className={cn("text-[0.6875rem] leading-4 font-medium tracking-wide uppercase", isToday || isSelected ? "text-foreground" : "text-muted-foreground")}>
                <span suppressHydrationWarning className="@sm:hidden">
                  {formatDay(day, locale, { weekday: "narrow" })}
                </span>
                <span suppressHydrationWarning className="hidden @sm:inline">
                  {formatDay(day, locale, { weekday: "short" })}
                </span>
              </span>
              <span
                aria-hidden="true"
                suppressHydrationWarning
                className={cn(
                  "grid size-9 place-items-center rounded-full text-sm font-medium tabular-nums transition-[background-color,color,box-shadow] duration-150 motion-reduce:transition-none",
                  isSelected ? "bg-foreground text-background" : "text-foreground",
                  isToday && (isSelected ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "ring-1 ring-foreground ring-inset"),
                )}
              >
                {formatDay(day, locale, { day: "numeric" })}
              </span>
              <span aria-hidden="true" className="flex h-1.5 items-center justify-center gap-[3px]">
                {Array.from({ length: Math.min(count, 3) }, (_, index) => (
                  <span key={index} className="size-1 rounded-full bg-muted-foreground" />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
