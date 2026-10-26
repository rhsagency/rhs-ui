"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps } from "react";

import { IconPause, IconPlay, IconStop } from "@rhs-ui/icons";
import { clockParts, elapsedAt, formatWords, momentOf, type Moment } from "@rhs-ui/application/time-tracker/time";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

/** The words the tracker uses, for translation. `{time}` is filled in. */
export interface TimeTrackerLabels {
  /** The button that starts the timer. Default "Start". */
  start?: string;
  /** The button that pauses it. Default "Pause". */
  pause?: string;
  /** The button that continues a paused timer. Default "Resume". */
  resume?: string;
  /** The button that stops it. Default "Stop". */
  stop?: string;
  /** The state of a timer that has not started. Default "Ready". */
  idle?: string;
  /** The state of a timer that is running. Default "Running". */
  running?: string;
  /** The state of a paused timer. Default "Paused". */
  paused?: string;
  /** Under "Running", when it began, with `{time}` as the clock time. Default "since {time}". */
  since?: string;
  /** Said when it starts. Default "Timer started". */
  started?: string;
  /** Said when it pauses, with `{time}` as "12 minutes". Default "Timer paused at {time}". */
  pausedAt?: string;
  /** Said when it stops. Default "Timer stopped. {time} recorded." */
  stopped?: string;
}

export interface TimeTrackerProps extends Omit<ComponentProps<"div">, "children" | "onStart" | "onPause" | "onStop"> {
  /** Whether the timer is running. */
  running: boolean;
  /** When the current run began: a Date, a timestamp in ms or an ISO string. Keep it when the page reloads and the time stays right. Needed while `running`. */
  startedAt?: Moment | null;
  /** Milliseconds tracked before the current run: what pausing saved. Default 0. */
  accumulated?: number;
  /** Start or resume was pressed, with the moment to store as `startedAt`. Set `running` and `startedAt`. */
  onStart?: (startedAt: number) => void;
  /** Pause was pressed, with the total so far in ms to store as `accumulated`. Clear `startedAt` and set `running` to false. */
  onPause?: (accumulated: number) => void;
  /** Stop was pressed, with the total in ms and the description. Record it and reset `accumulated` and `running`. */
  onStop?: (total: number, description: string) => void;
  /** What is being tracked: "Checkout redesign". It names the tracker. */
  label?: string;
  /** Shows a field for what you are doing, with this as its name and placeholder: "What are you working on?". Leave it out for no field. */
  descriptionLabel?: string;
  /** The text of the field, when you keep it yourself. */
  description?: string;
  /** The text at the start, when you do not. */
  defaultDescription?: string;
  /** The text of the field changed. */
  onDescriptionChange?: (description: string) => void;
  /** The language of the clock time and of the spoken durations. Default "en-US". */
  locale?: string;
  /** The time zone the start time is written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the tracker uses, for translation. */
  labels?: TimeTrackerLabels;
}

const DEFAULT_LABELS = {
  start: "Start",
  pause: "Pause",
  resume: "Resume",
  stop: "Stop",
  idle: "Ready",
  running: "Running",
  paused: "Paused",
  since: "since {time}",
  started: "Timer started",
  pausedAt: "Timer paused at {time}",
  stopped: "Timer stopped. {time} recorded.",
} satisfies Required<TimeTrackerLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** A clock time in the zone. An unknown locale or zone falls back to US English and UTC instead of taking the page down. */
function timeIn(at: number, locale: string, timeZone: string): string {
  const options = { hour: "numeric", minute: "2-digit" } as const;
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(at);
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
}

/**
 * A timer for tracking time on a task: the elapsed time as 00:12:41, one
 * button that starts, pauses and resumes, and Stop, which hands the total to
 * you. The time is read from timestamps and never counted, so it is right
 * after a tab slept, a laptop was closed or the page reloaded, as long as you
 * keep `startedAt` and `accumulated`. The digits are tabular, so nothing
 * jumps. Screen readers are told about changes of state ("Timer started",
 * "Timer paused at 12 minutes") and never about the seconds ticking by.
 */
export function TimeTracker({
  running,
  startedAt,
  accumulated = 0,
  onStart,
  onPause,
  onStop,
  label = "Time tracker",
  descriptionLabel,
  description,
  defaultDescription = "",
  onDescriptionChange,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: TimeTrackerProps) {
  const text: Required<TimeTrackerLabels> = { ...DEFAULT_LABELS, ...labels };
  const labelId = useId();
  const primary = useRef<HTMLButtonElement>(null);
  const started = momentOf(startedAt);
  // Null on the server and until the browser's clock is read, so both draw the same time: what was saved, plus nothing.
  const [now, setNow] = useState<number | null>(null);
  const [own, setOwn] = useState(defaultDescription);
  const [said, setSaid] = useState("");
  const stoppedAt = useRef(0);
  const before = useRef(running);

  const elapsed = elapsedAt(now ?? started ?? 0, running, started, accumulated);
  const [hours, minutes, seconds] = clockParts(elapsed);
  const idle = !running && elapsed === 0;
  const field = description ?? own;

  // The clock is read from the system, not counted: a tick only asks what time it is. Ticks fall on the second of the elapsed time, and a tab that becomes visible asks at once.
  useBrowserLayoutEffect(() => {
    setNow(Date.now());
    if (!running || started === null) return;
    let timer: number | undefined;
    const tick = () => {
      const current = Date.now();
      setNow(current);
      timer = window.setTimeout(tick, 1000 - (elapsedAt(current, true, started, accumulated) % 1000) + 15);
    };
    const wake = () => {
      window.clearTimeout(timer);
      if (document.visibilityState === "visible") tick();
    };
    timer = window.setTimeout(tick, 1000 - (elapsedAt(Date.now(), true, started, accumulated) % 1000) + 15);
    document.addEventListener("visibilitychange", wake);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [running, started, accumulated]);

  // What changed is said once: started, paused. The seconds are never said, and a stop speaks for itself.
  useEffect(() => {
    if (before.current === running) return;
    before.current = running;
    if (Date.now() - stoppedAt.current < 600) return;
    setSaid(running ? text.started : fill(text.pausedAt, { time: formatWords(accumulated, locale) }));
    const timer = window.setTimeout(() => setSaid(""), 5000);
    return () => window.clearTimeout(timer);
  }, [running, accumulated, locale, text.started, text.pausedAt]);

  function toggle() {
    if (running) onPause?.(elapsedAt(Date.now(), true, started, accumulated));
    else onStart?.(Date.now());
  }

  function stop() {
    const total = elapsedAt(Date.now(), running, started, accumulated);
    stoppedAt.current = Date.now();
    setSaid(fill(text.stopped, { time: formatWords(total, locale) }));
    onStop?.(total, field);
    // Stop leaves with the state it ends: focus stays on the button that remains, not on the top of the page.
    requestAnimationFrame(() => primary.current?.focus());
  }

  const state = running ? text.running : idle ? text.idle : text.paused;

  return (
    <div
      data-slot="time-tracker"
      data-state={running ? "running" : idle ? "idle" : "paused"}
      role="group"
      aria-labelledby={labelId}
      className={cn("@container grid gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs", className)}
      {...props}
    >
      {/* The name and the state share a line while they fit; on a narrow tracker the state drops under the name, so the name is not cut to make room for "since 3:19 PM". */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
        <p id={labelId} className="min-w-0 truncate text-sm font-medium tracking-[-0.01em]">
          {label}
        </p>
        <p className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          {running ? <span aria-hidden="true" className="size-1.5 rounded-full bg-foreground motion-safe:animate-pulse" /> : null}
          {!running && !idle ? <IconPause aria-hidden="true" className="size-3" /> : null}
          <span className={cn(running && "font-medium text-foreground")}>{state}</span>
          {running && started !== null ? (
            <span suppressHydrationWarning className="tabular-nums">
              {fill(text.since, { time: timeIn(started, locale, timeZone) })}
            </span>
          ) : null}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p role="timer" aria-live="off" suppressHydrationWarning className={cn("text-[2.5rem] leading-none font-medium tracking-[-0.03em] tabular-nums", idle && "text-muted-foreground")}>
          <span aria-hidden="true" suppressHydrationWarning>
            {hours}
            <span className="text-muted-foreground/60">:</span>
            {minutes}
            <span className="text-muted-foreground/60">:</span>
            {seconds}
          </span>
          <span className="sr-only" suppressHydrationWarning>
            {formatWords(elapsed, locale)}
          </span>
        </p>
        <div className="flex w-full gap-2 @sm:w-auto">
          <Button ref={primary} type="button" className="min-w-28 flex-1 @sm:flex-none" onClick={toggle}>
            {running ? <IconPause /> : <IconPlay />}
            {running ? text.pause : idle ? text.start : text.resume}
          </Button>
          {idle ? null : (
            <Button type="button" variant="outline" className="flex-1 @sm:flex-none" onClick={stop}>
              <IconStop />
              {text.stop}
            </Button>
          )}
        </div>
      </div>

      {descriptionLabel ? (
        <Input
          aria-label={descriptionLabel}
          placeholder={descriptionLabel}
          value={field}
          onChange={(event) => {
            if (description === undefined) setOwn(event.target.value);
            onDescriptionChange?.(event.target.value);
          }}
        />
      ) : null}
      <p role="status" className="sr-only">
        {said}
      </p>
    </div>
  );
}
