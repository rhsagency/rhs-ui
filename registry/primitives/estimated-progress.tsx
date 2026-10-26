"use client";

import { useEffect, useId, useState, type ComponentProps } from "react";

import { IconAlertCircle, IconCheck } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

/** Where the work stands: it is running, it finished, or it failed. */
export type EstimatedStatus = "running" | "done" | "failed";

/** The words of the line under the bar. */
export interface EstimatedProgressLabels {
  /** While the expected time has not passed. {time} is the expected time in words. Default "About {time}". */
  expected: string;
  /** Once it has. Default "Still working". */
  overtime: string;
  /** When the work is done. Default "Done". */
  done: string;
  /** When it failed. Default "Failed". */
  failed: string;
}

export interface EstimatedProgressProps extends Omit<ComponentProps<"div">, "children"> {
  /** How long the work usually takes, in ms. The bar is paced by it and the first line says it in words. */
  expectedMs: number;
  /** `running` while the work goes on, `done` when it has finished, `failed` when it has not. Default "running". */
  status?: EstimatedStatus;
  /** What is being worked on, written above the bar and used as its name: "Generating the summary". */
  label?: string;
  /** When the work began, when that was before this component mounted (a page reload, a job found running). Default: now. */
  startedAt?: number | Date;
  /** The words of the line under the bar, for another language or your own wording. */
  labels?: Partial<EstimatedProgressLabels>;
  /** The locale the expected time is written in. Default "en-US". */
  locale?: string;
}

const LABELS: EstimatedProgressLabels = { expected: "About {time}", overtime: "Still working", done: "Done", failed: "Failed" };

/**
 * How far unmeasured work is taken to be after `t` times its expected
 * duration. It eases out to 80 percent at t = 1, then keeps creeping toward
 * 90 and never gets there, so a slow job neither looks frozen nor claims it is
 * nearly done.
 */
function curve(t: number): number {
  if (t <= 0) return 0;
  if (t <= 1) return 0.8 * (1 - (1 - t) * (1 - t));
  return 0.8 + 0.1 * (1 - 1 / (1 + (t - 1) / 1.5));
}

/** "30 seconds", "2 minutes", "1 hour": the expected time in the nearest friendly unit. */
function inWords(ms: number, locale: string): string {
  const seconds = ms / 1000;
  const [amount, unit] = seconds < 57.5 ? [Math.max(5, Math.round(seconds / 5) * 5), "second"] : seconds < 3570 ? [Math.round(seconds / 60), "minute"] : [Math.round(seconds / 3600), "hour"];
  return new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "long" }).format(amount);
}

/**
 * A progress bar for work that cannot say how far along it is: an AI
 * generation, an export, a report build. It is paced by how long the work
 * usually takes: the fill eases out toward 90 percent and never reaches it on
 * its own, so a slow job neither looks frozen nor lies about being nearly done.
 * Set `done` and the rest fills quickly; set `failed` and the bar stays where it
 * stopped, in the destructive tone. The line under the bar says "About 30
 * seconds" at first and "Still working" once that time has passed, and the
 * word "about" keeps it honest. It is a progressbar with no value for screen
 * readers, because the value is a guess, and the line is its value text. Under
 * reduced motion the fill moves in steps of 10 percent instead of gliding.
 */
export function EstimatedProgress({ expectedMs, status = "running", label, startedAt, labels, locale = "en-US", className, ...props }: EstimatedProgressProps) {
  const id = useId();
  const words = { ...LABELS, ...labels };
  const began = startedAt === undefined ? undefined : new Date(startedAt).getTime();
  // A bar that arrives already failed rests where a job at 80 percent of its time would be.
  const [progress, setProgress] = useState(() => (status === "done" ? 1 : status === "failed" ? curve(0.8) : 0));
  const [overdue, setOverdue] = useState(false);

  useEffect(() => {
    if (status !== "running") return;
    const origin = performance.now() - (began === undefined ? 0 : Math.max(0, Date.now() - began));
    const tick = () => {
      const t = (performance.now() - origin) / Math.max(1, expectedMs);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const next = curve(t);
      setProgress(reduced ? Math.floor(next * 10) / 10 : next);
      setOverdue(t >= 1);
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [status, expectedMs, began]);

  useEffect(() => {
    if (status === "done") setProgress(1);
  }, [status]);

  const text = status === "done" ? words.done : status === "failed" ? words.failed : overdue ? words.overtime : words.expected.replace("{time}", inWords(expectedMs, locale));

  return (
    <div data-slot="estimated-progress" data-status={status} className={cn("grid gap-2", className)} {...props}>
      {label ? (
        <span id={`${id}-label`} className="text-sm font-medium">
          {label}
        </span>
      ) : null}
      <div
        role="progressbar"
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-label={label ? undefined : "Progress"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={status === "done" ? 100 : undefined}
        aria-valuetext={text}
        aria-busy={status === "running" || undefined}
        className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          data-slot="estimated-progress-fill"
          className={cn(
            "h-full w-full rounded-full transition-transform duration-300 ease-linear motion-reduce:transition-none",
            status === "failed" ? "bg-destructive" : "bg-primary",
            status === "done" && "duration-500 ease-out",
          )}
          style={{ transform: `translateX(${(progress - 1) * 100}%)` }}
        />
      </div>
      <p role="status" className={cn("flex min-h-5 items-center gap-1.5 text-[0.8125rem]", status === "failed" ? "text-destructive" : status === "done" ? "font-medium text-foreground" : "text-muted-foreground")}>
        {status === "done" ? <IconCheck size={14} strokeWidth={2.5} aria-hidden="true" /> : null}
        {status === "failed" ? <IconAlertCircle size={14} aria-hidden="true" /> : null}
        <span key={text} className="motion-safe:animate-rhs-fade-in">
          {text}
        </span>
      </p>
    </div>
  );
}
