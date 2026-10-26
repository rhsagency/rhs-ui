"use client";

import { useEffect, useRef, useState } from "react";

import { IconCheck, IconPause, IconPlay, IconRotateCcw, IconTimer } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface StepTimerLabels {
  start: string;
  pause: string;
  resume: string;
  reset: string;
  timeUp: string;
  /** Said once when it starts. {minutes} stands for the length. */
  started: string;
  /** Said once when it runs out. {step} stands for the step number. */
  done: string;
}

export interface StepTimerProps {
  /** How long to wait, in minutes. */
  minutes: number;
  /** The start button's text. The minutes by default. */
  label?: string;
  /** The number of the step the timer belongs to, for the message when it runs out. */
  step: number;
  /** Words for the buttons and the messages. */
  labels: StepTimerLabels;
  className?: string;
}

const pad = (value: number) => String(value).padStart(2, "0");

/** Seconds as a clock: 9:05, or 1:02:09 past an hour. */
function clock(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return hours ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`;
}

type Phase = "idle" | "running" | "paused" | "done";

/**
 * A timer for a step that has to be waited out. One press starts it, the clock
 * counts down in place with a quiet bar under it, and it can be paused and
 * reset. It counts against the clock rather than ticks, so a tab in the
 * background or a phone that sleeps for a moment cannot make it lose time.
 * Starting and finishing are announced once, the seconds are not. Start gives
 * way to Pause when it starts and Reset brings Start back, so focus is handed
 * on with the button and the keyboard keeps its place.
 */
export function StepTimer({ minutes, label, step, labels, className }: StepTimerProps) {
  const total = Math.max(1, Math.round(minutes * 60));
  const [phase, setPhase] = useState<Phase>("idle");
  const [left, setLeft] = useState(total);
  const [announcement, setAnnouncement] = useState("");
  const endsAt = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  const startButton = useRef<HTMLButtonElement>(null);
  const pauseButton = useRef<HTMLButtonElement>(null);
  const resetButton = useRef<HTMLButtonElement>(null);
  /** Which control takes focus once the timer has changed shape, set only when the control that had focus is going away. */
  const handOver = useRef<"start" | "pause" | "reset" | null>(null);

  /** Focus only has to be handed on when it is on one of this timer's own buttons; it is never taken from anywhere else. */
  function keepFocus(next: "start" | "pause" | "reset") {
    if (root.current?.contains(document.activeElement)) handOver.current = next;
  }

  useEffect(() => {
    const next = handOver.current;
    handOver.current = null;
    if (next) ({ start: startButton, pause: pauseButton, reset: resetButton })[next].current?.focus();
  }, [phase]);

  useEffect(() => {
    if (phase !== "running") return;
    const tick = () => {
      const rest = Math.max(0, Math.ceil((endsAt.current - Date.now()) / 1000));
      setLeft(rest);
      if (rest === 0) {
        // The pause button goes when time is up and Reset is what is left, so focus on the one moves to the other.
        if (root.current?.contains(document.activeElement)) handOver.current = "reset";
        setPhase("done");
        setAnnouncement(labels.done.replace("{step}", String(step)));
      }
    };
    const timer = window.setInterval(tick, 250);
    tick();
    return () => window.clearInterval(timer);
  }, [phase, step, labels.done]);

  function start() {
    endsAt.current = Date.now() + left * 1000;
    keepFocus("pause");
    setPhase("running");
    setAnnouncement(labels.started.replace("{minutes}", String(minutes)));
  }

  /** The time spent paused is not counted: the clock goes on from the number that was showing. */
  function resume() {
    endsAt.current = Date.now() + left * 1000;
    setPhase("running");
  }

  function reset() {
    keepFocus("start");
    setLeft(total);
    setPhase("idle");
    setAnnouncement("");
  }

  const elapsed = Math.min(1, 1 - left / total);
  return (
    <div ref={root} data-slot="step-timer" data-phase={phase} className={cn("flex items-center gap-3", className)}>
      {phase === "idle" ? (
        <Button ref={startButton} type="button" variant="outline" size="sm" onClick={start}>
          <IconTimer aria-hidden="true" />
          {label ?? `${minutes} min`}
          <span className="sr-only"> ({labels.start})</span>
        </Button>
      ) : (
        <div className={cn("flex items-center gap-1 rounded-lg border bg-background py-1 pr-1 pl-3", phase === "done" ? "border-foreground" : "border-border")}>
          {phase === "done" ? (
            <span className="flex items-center gap-2 pr-1 text-sm font-medium">
              <IconCheck aria-hidden="true" className="size-4" strokeWidth={2.25} />
              {labels.timeUp}
            </span>
          ) : (
            <span role="timer" className="min-w-[3.25rem] pr-2 text-sm font-medium tabular-nums">
              {clock(left)}
            </span>
          )}
          {phase === "done" ? null : (
            <Button ref={pauseButton} type="button" variant="ghost" size="icon-sm" aria-label={phase === "running" ? labels.pause : labels.resume} onClick={phase === "running" ? () => setPhase("paused") : resume}>
              {phase === "running" ? <IconPause /> : <IconPlay />}
            </Button>
          )}
          <Button ref={resetButton} type="button" variant="ghost" size="icon-sm" aria-label={labels.reset} onClick={reset}>
            <IconRotateCcw />
          </Button>
        </div>
      )}
      {phase === "running" || phase === "paused" ? (
        <span aria-hidden="true" className="h-1 w-20 overflow-hidden rounded-full bg-muted">
          <span className="block h-full rounded-full bg-foreground transition-[width] duration-300 ease-linear motion-reduce:transition-none" style={{ width: `${Math.round(elapsed * 100)}%` }} />
        </span>
      ) : null}
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
