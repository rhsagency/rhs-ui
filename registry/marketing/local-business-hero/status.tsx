"use client";

import { useSyncExternalStore } from "react";

import { describeStatus, statusAt, toTimestamp, zonedClock, type LocalBusinessLabels, type OpeningDay } from "@rhs-ui/marketing/local-business-hero/hours";
import { Badge } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

/* One clock for every part of the block: a shared timer that ticks while any of them is on the page. */
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  timer ??= setInterval(() => listeners.forEach((notify) => notify()), 30_000);
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** The visitor's clock, rounded down to the minute so it only changes when the answer can. */
const readMinute = (): number | null => Math.floor(Date.now() / 60_000) * 60_000;
/** The server has no visitor and no clock to trust: it renders the hours and leaves the status to the browser. */
const readNothing = (): number | null => null;

export interface BusinessClockProps {
  days: readonly OpeningDay[];
  timeZone: string;
  weekStartsOn: 0 | 1;
  /** A fixed moment, for previews and tests. Without it the visitor's own clock is read, after hydration. */
  now?: Date | string | number;
  labels: LocalBusinessLabels;
  className?: string;
}

function useBusinessClock({ days, timeZone, weekStartsOn, now }: Pick<BusinessClockProps, "days" | "timeZone" | "weekStartsOn" | "now">) {
  const minute = useSyncExternalStore<number | null>(subscribe, readMinute, readNothing);
  const at = now === undefined ? minute : (toTimestamp(now) ?? null);
  const clock = at === null ? null : zonedClock(at, timeZone, weekStartsOn);
  return { clock, status: clock ? statusAt(days, clock) : null };
}

/**
 * The open-or-closed line. It is worked out in the business's time zone in
 * the browser, so the server never prints a stale "Open"; until then the pill
 * holds its place, empty and hidden from assistive technology, and fades in.
 */
export function OpenStatus({ labels, className, ...clock }: BusinessClockProps) {
  const { status } = useBusinessClock(clock);
  const text = status ? describeStatus(status, labels) : null;
  return (
    <p data-slot="local-business-hero-status" className={className}>
      <Badge variant="outline" aria-hidden={text ? undefined : true} className={cn("h-8 gap-2.5 px-3.5 text-sm transition-opacity duration-300 motion-reduce:transition-none", text ? "opacity-100" : "opacity-0")}>
        <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", status?.state === "open" ? "bg-foreground" : "border border-muted-foreground")} />
        {text ?? "\u00a0"}
      </Badge>
    </p>
  );
}

/** Today's hours in the card: the word "Today" and the day's opening text, again only once the browser knows the day. */
export function TodayHours({ days, labels, className, ...clock }: BusinessClockProps) {
  const today = useBusinessClock({ days, ...clock }).clock?.today;
  const day = today === undefined ? undefined : days[today];
  return (
    <p data-slot="local-business-hero-today" className={cn("flex flex-wrap items-baseline gap-x-3 text-sm", className)}>
      <span className="font-medium">{labels.today}</span>
      <span className={cn("tabular-nums transition-opacity duration-300 motion-reduce:transition-none", day ? "opacity-100" : "opacity-0", !day?.hours && "text-muted-foreground")}>
        {day ? (day.hours ?? labels.closedDay) : "\u00a0"}
      </span>
    </p>
  );
}

/**
 * The whole week, with today marked once the browser knows which day it is.
 * It is the block's own list rather than the OpeningHours primitive, whose
 * "Closed", "(today)" and landmark name are fixed English: here every word is
 * one of the block's labels, and the details element above it is the only name.
 */
export function WeekHours({ days, labels, ...clock }: BusinessClockProps) {
  const today = useBusinessClock({ days, ...clock }).clock?.today;
  return (
    <dl data-slot="local-business-hero-week" className="-mx-2 mt-4 grid gap-1.5 text-sm">
      {days.map((day, index) => (
        <div key={day.day} className={cn("flex justify-between gap-4 rounded-md px-2 py-1", index === today && "bg-muted font-medium")}>
          <dt>
            {day.day}
            {index === today ? <span className="sr-only"> ({labels.today})</span> : null}
          </dt>
          <dd className={cn("tabular-nums", !day.hours && "text-muted-foreground")}>{day.hours ?? labels.closedDay}</dd>
        </div>
      ))}
    </dl>
  );
}
