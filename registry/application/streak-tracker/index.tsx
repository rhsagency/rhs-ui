"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ComponentProps } from "react";

import { IconCheck, IconFlame } from "@rhs-ui/icons";
import { addDays, currentStreak, formatDay, isDay, startOfWeek, todayIn, weekStartFor, type WeekStart } from "@rhs-ui/application/streak-tracker/dates";
import { cn } from "@/lib/utils";

/** One day of the week, as the tracker knows it. */
export interface StreakDay {
  /** The day as "2026-11-05". */
  date: string;
  /** Whether it was completed. */
  done: boolean;
  /** Whether it is today. */
  today: boolean;
}

/** The words the tracker uses, for translation. `{count}` is filled in. */
export interface StreakTrackerLabels {
  /** The count, with `{count}` where the number goes, set large. Default "Day {count}". */
  streak?: string;
  /** Said instead of the count when there is no streak. Default "No streak yet". */
  none?: string;
  /** Read out before the count. Default "Current streak". */
  label?: string;
  /** Under the count when today is done. Default "Done for today". */
  doneToday?: string;
  /** Under the count when there is a streak and today is still open. Default "Do it today to keep it going". */
  keepGoing?: string;
  /** Under the message when there is no streak. Default "Complete today to start one". */
  start?: string;
  /** The name of the row of days. Default "This week". */
  week?: string;
  /** After the name of a day that was done. Default "done". */
  done?: string;
  /** After the name of a past day that was not done. Default "missed". */
  missed?: string;
  /** After the name of a day that has not come yet. Default "upcoming". */
  upcoming?: string;
  /** After "today" when it is not done yet. Default "today, not done yet". */
  todayOpen?: string;
  /** After "today" when it is done. Default "today, done". */
  todayDone?: string;
}

export interface StreakTrackerProps extends Omit<ComponentProps<"div">, "children"> {
  /** The days that were completed, as "2026-11-05". Pass every one you have, or at least the last run: the count is the run of days in a row that ends today, or yesterday while today is still open. */
  days: readonly string[];
  /** Today as "2026-11-05". Leave it out to read the browser's clock in `timeZone`, once the page is live; until then the card holds its place with empty circles. Pass it when you render on the server, so the first paint is already right. */
  today?: string;
  /** The first day of the week: 0 for Sunday, 1 for Monday up to 6 for Saturday. Default is the locale's own. */
  weekStartsOn?: WeekStart;
  /** The time zone that decides what today is. Default "UTC". */
  timeZone?: string;
  /** The language of the weekday letters and names. Default "en-US". */
  locale?: string;
  /** Called when a day that has come is pressed. Without it the days are not buttons. */
  onDayClick?: (day: StreakDay) => void;
  /** The words the tracker uses, for translation. */
  labels?: StreakTrackerLabels;
}

const DEFAULT_LABELS = {
  streak: "Day {count}",
  none: "No streak yet",
  label: "Current streak",
  doneToday: "Done for today",
  keepGoing: "Do it today to keep it going",
  start: "Complete today to start one",
  week: "This week",
  done: "done",
  missed: "missed",
  upcoming: "upcoming",
  todayOpen: "today, not done yet",
  todayDone: "today, done",
} satisfies Required<StreakTrackerLabels>;

const subscribeNever = () => () => undefined;

/** Looks at the clock again every minute and when the tab comes back, so a page left open past midnight moves on to the new day. Re-reading the clock changes nothing unless the day changed. */
function subscribeClock(onChange: () => void): () => void {
  const timer = window.setInterval(onChange, 60_000);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onChange);
  };
}

// Any Sunday. The weekday letters do not depend on the date, so the card can draw them before it knows what today is.
const REFERENCE = "2024-01-07";

/** How long the count stays enlarged after today is completed, in ms. */
const BUMP_MS = 380;

/**
 * Seven days with the streak count beside them. A circle is filled with a
 * check for a day done, ringed for today and hollow for a day that was
 * missed; days still to come are dashed. Missed days are neutral on purpose:
 * a streak is something to keep going, not a record of failure, so nothing
 * turns red and the line under the count only says what to do next. The week
 * starts on the locale's first weekday. Every day has a name that says its
 * state in words ("Tuesday, done"), so nothing depends on colour, and the
 * count is a status: it is read out when it changes and swells quietly when
 * today is completed, or not at all under reduced motion. With `onDayClick`
 * the days that have come are buttons. The week and the count are worked out
 * from `days` and today, and today comes from the browser's clock in your
 * time zone unless you pin it; a page left open past midnight moves on to the
 * new day by itself.
 */
export function StreakTracker({ days, today: pinnedToday, weekStartsOn, timeZone = "UTC", locale = "en-US", onDayClick, labels, className, ...props }: StreakTrackerProps) {
  const text: Required<StreakTrackerLabels> = { ...DEFAULT_LABELS, ...labels };
  const pinned = isDay(pinnedToday) ? pinnedToday : undefined;
  // Today is known only in the browser: until it is, the card draws empty circles, so what the server sent is what the browser first draws too.
  const now = useSyncExternalStore(
    pinned ? subscribeNever : subscribeClock,
    () => pinned ?? todayIn(timeZone),
    () => pinned ?? null,
  );
  const first = weekStartsOn ?? weekStartFor(locale);
  const completed = useMemo(() => new Set(days.filter(isDay)), [days]);

  const anchor = startOfWeek(now ?? REFERENCE, first);
  const week = Array.from({ length: 7 }, (_, index) => addDays(anchor, index));
  const streak = now === null ? 0 : currentStreak(completed, now);
  const doneToday = now !== null && completed.has(now);

  // Completing today is the one moment the count celebrates. What was already done when the page loaded is not news.
  const [bump, setBump] = useState(false);
  const wasDone = useRef<boolean | null>(null);
  useEffect(() => {
    // Until today is known there is nothing to compare with; the first answer is only remembered.
    if (now === null) return;
    const before = wasDone.current;
    wasDone.current = doneToday;
    if (before === null || before || !doneToday) return;
    // Under reduced motion the count just changes: no swell, so no timer either.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    setBump(true);
  }, [doneToday, now]);
  useEffect(() => {
    if (!bump) return;
    const timer = window.setTimeout(() => setBump(false), BUMP_MS);
    return () => window.clearTimeout(timer);
  }, [bump]);

  const [before = "", after = ""] = text.streak.split("{count}");
  const message = streak === 0 ? text.start : doneToday ? text.doneToday : text.keepGoing;

  return (
    <div data-slot="streak-tracker" data-state={now === null ? "loading" : undefined} className={cn("@container rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs @lg:p-5", className)} {...props}>
      <div className="grid gap-5 @lg:grid-cols-[auto_minmax(0,1fr)] @lg:items-center @lg:gap-10">
        <div className="flex items-center gap-3.5">
          <span aria-hidden="true" className={cn("grid size-11 shrink-0 place-items-center rounded-xl border transition-colors duration-200 motion-reduce:transition-none", streak > 0 ? "border-foreground bg-foreground text-background" : "border-border bg-muted text-muted-foreground")}>
            <IconFlame className="size-5" />
          </span>
          {now === null ? (
            <div aria-hidden="true" className="h-[66px] w-28 rounded-md bg-muted/60" />
          ) : (
            <div role="status" className="min-w-0">
              <span className="sr-only">{text.label}: </span>
              {streak > 0 ? (
                <p className="leading-none">
                  {before.trim() ? <span className="text-sm font-medium text-muted-foreground">{before.trim()} </span> : null}
                  <span className={cn("inline-block origin-left align-baseline text-4xl font-semibold tracking-[-0.04em] tabular-nums transition-transform duration-200 ease-out motion-reduce:transition-none", bump && "motion-safe:scale-110")}>{streak}</span>
                  {after.trim() ? <span className="text-sm font-medium text-muted-foreground"> {after.trim()}</span> : null}
                </p>
              ) : (
                <p className="text-[1.375rem] leading-9 font-semibold tracking-[-0.03em]">{text.none}</p>
              )}
              <p className="mt-1.5 flex items-center gap-1.5 text-sm leading-5 text-muted-foreground">
                {streak > 0 && doneToday ? <IconCheck aria-hidden="true" size={14} strokeWidth={2.25} className="shrink-0 text-foreground" /> : null}
                {message}
              </p>
            </div>
          )}
        </div>

        <ul aria-label={text.week} className="grid w-full grid-cols-7 gap-1 @lg:max-w-[23rem] @lg:justify-self-end @lg:gap-1.5">
          {week.map((date) => {
            const future = now !== null && date > now;
            const isToday = date === now;
            const done = now !== null && !future && completed.has(date);
            const interactive = Boolean(onDayClick) && now !== null && !future;
            const state = isToday ? (done ? text.todayDone : text.todayOpen) : done ? text.done : future ? text.upcoming : text.missed;
            const content = (
              <>
                {now === null ? null : <span className="sr-only">{`${formatDay(date, locale, { weekday: "long" })}, ${state}`}</span>}
                <span aria-hidden="true" suppressHydrationWarning className={cn("text-[0.6875rem] leading-4 font-medium tracking-wide uppercase", isToday ? "text-foreground" : "text-muted-foreground")}>
                  {formatDay(date, locale, { weekday: "narrow" })}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid aspect-square w-full max-w-10 place-items-center rounded-full transition-[background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none",
                    now === null && "border border-border",
                    done && "bg-foreground text-background",
                    done && isToday && "ring-2 ring-foreground ring-offset-2 ring-offset-card",
                    !done && isToday && "border-2 border-foreground",
                    !done && !isToday && !future && now !== null && "border border-foreground/30",
                    future && "border border-dashed border-foreground/25",
                  )}
                >
                  {done ? <IconCheck size={16} strokeWidth={2.5} /> : null}
                </span>
              </>
            );
            const cell = "flex w-full flex-col items-center gap-1.5 rounded-lg px-0.5 py-1.5";
            return (
              <li key={date} data-day={date} data-state={now === null ? "loading" : done ? "done" : future ? "upcoming" : isToday ? "today" : "missed"}>
                {interactive ? (
                  <button
                    type="button"
                    onClick={() => onDayClick?.({ date, done, today: isToday })}
                    className={cn(cell, "cursor-pointer outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none")}
                  >
                    {content}
                  </button>
                ) : (
                  <div className={cell}>{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
