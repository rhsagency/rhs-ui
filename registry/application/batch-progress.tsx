"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Progress } from "@rhs-ui/primitives/progress";
import { cn } from "@/lib/utils";

/** The words the panel uses, for translation. `{done}`, `{failed}`, `{waiting}`, `{total}`, `{label}`, `{percent}` and `{counts}` are filled in. */
export interface BatchProgressLabels {
  /** The count of finished items. Default "{done} of {total} done". */
  done?: string;
  /** The count of failed items, shown while there are any. Default "{failed} failed". */
  failed?: string;
  /** The count of items not started, shown while there are any. Default "{waiting} waiting". */
  waiting?: string;
  /** The same count when the batch is over and those items were never started. Default "{waiting} not started". */
  notStarted?: string;
  /** The button. Default "Cancel". */
  cancel?: string;
  /** The button while the batch stops. Default "Cancelling…". */
  cancelling?: string;
  /** Shown in place of the button when it is over. Default "Done". */
  finished?: string;
  /** Said at each tenth of the way. Default "{label}: {percent} complete. {counts}." */
  progressSpoken?: string;
  /** Said when the batch stops. Default "{label}: cancelling. {counts}." */
  cancellingSpoken?: string;
  /** Said when the batch ends. Default "{label}: done. {counts}." */
  doneSpoken?: string;
}

export interface BatchProgressProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** How many items the batch holds. */
  total: number;
  /** How many finished well. Failed items are counted apart, so done plus failed is how far it has got. */
  done: number;
  /** How many finished badly. They fill the end of the bar with a hatch, so they differ in pattern and not only in colour. Default 0. */
  failed?: number;
  /** What the batch is doing, as a short line above the bar: "Importing contacts". It also names the progress bar. */
  label: string;
  /** `running` shows Cancel, `cancelling` shows it busy, `complete` shows "Done" and no button. You own it: change it as the work changes. Default `running`. */
  status?: "running" | "cancelling" | "complete";
  /** Called when Cancel is pressed. Stop starting new items, then set `status` to `cancelling` and, once the running ones settle, to `complete`. Leave it out and there is no button. */
  onCancel?: () => void;
  /** The language of the numbers. Default "en-US". */
  locale?: string;
  /** The words the panel uses, for translation. */
  labels?: BatchProgressLabels;
}

const DEFAULT_LABELS = {
  done: "{done} of {total} done",
  failed: "{failed} failed",
  waiting: "{waiting} waiting",
  notStarted: "{waiting} not started",
  cancel: "Cancel",
  cancelling: "Cancelling…",
  finished: "Done",
  progressSpoken: "{label}: {percent} complete. {counts}.",
  cancellingSpoken: "{label}: cancelling. {counts}.",
  doneSpoken: "{label}: done. {counts}.",
} satisfies Required<BatchProgressLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** Diagonal lines in the current colour on hard stops, so the failed share reads in greyscale and in print. */
const HATCH: CSSProperties = { backgroundImage: "repeating-linear-gradient(135deg, currentColor 0 1.5px, transparent 1.5px 4.5px)" };

const SWATCH_HATCH: CSSProperties = { backgroundImage: "repeating-linear-gradient(135deg, currentColor 0 1.25px, transparent 1.25px 3px)" };

/** The least width, in px, that the hatched part of the bar is drawn with, so that two failures among a thousand items still show as hatch. */
const HATCH_MIN = 6;

/** A small square that matches the part of the bar the count belongs to. */
function Swatch({ kind }: { kind: "done" | "failed" | "waiting" }) {
  return (
    <span
      aria-hidden="true"
      style={kind === "failed" ? SWATCH_HATCH : undefined}
      className={cn("size-2.5 shrink-0 rounded-[3px]", kind === "done" && "bg-primary", kind === "failed" && "border border-destructive/70 text-destructive", kind === "waiting" && "border border-foreground/30 bg-muted")}
    />
  );
}

/**
 * Progress for work on many items at once: an import, a bulk delete, a
 * resize of a whole folder. One bar fills as items finish, and the failed
 * ones take the end of it as a hatch, so a failure differs in pattern and
 * not only in colour. Under the bar a line reads "42 of 120 done, 2 failed,
 * 76 waiting" in tabular numbers, each count with a swatch of its part of
 * the bar. The bar is a real progressbar with its own text ("42 of 120 done,
 * 2 failed, 76 waiting"), and the counts are never a live region: a status
 * line is spoken only at each ten per cent, and when the batch is cancelled or
 * done, so a fast batch cannot flood a screen reader. Cancel stops the rest;
 * on completion it gives way to "Done".
 */
export function BatchProgress({ total, done, failed = 0, label, status = "running", onCancel, locale = "en-US", labels, className, ...props }: BatchProgressProps) {
  const text: Required<BatchProgressLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();

  // Bad numbers must not break the bar: counts are whole, never negative, and never more than the batch.
  const all = Math.max(0, Math.floor(Number.isFinite(total) ? total : 0));
  const good = Math.min(all, Math.max(0, Math.floor(Number.isFinite(done) ? done : 0)));
  const bad = Math.min(all - good, Math.max(0, Math.floor(Number.isFinite(failed) ? failed : 0)));
  const finished = good + bad;
  const waiting = all - finished;

  const numbers = new Intl.NumberFormat(locale);
  const count = (value: number) => numbers.format(value);
  const percentOf = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });

  const doneText = fill(text.done, { done: count(good), total: count(all) });
  const failedText = fill(text.failed, { failed: count(bad) });
  const waitingText = fill(status === "complete" ? text.notStarted : text.waiting, { waiting: count(waiting) });
  const counts = [doneText, bad > 0 ? failedText : "", waiting > 0 ? waitingText : ""].filter(Boolean).join(", ");

  const fraction = all > 0 ? finished / all : 0;
  const goodShare = all > 0 ? (good / all) * 100 : 0;
  const badShare = all > 0 ? (bad / all) * 100 : 0;

  // What a screen reader hears, and only at each ten per cent: the line below the bar is never a live region.
  const tenth = Math.floor(fraction * 10);
  const [said, setSaid] = useState("");
  const heard = useRef({ tenth, status });
  const latest = useRef({ label, counts, percent: percentOf.format(Math.floor(fraction * 10) / 10) });
  useEffect(() => {
    latest.current = { label, counts, percent: percentOf.format(tenth / 10) };
  });
  useEffect(() => {
    const before = heard.current;
    heard.current = { tenth, status };
    const now = latest.current;
    if (status !== before.status) {
      if (status === "complete") setSaid(fill(text.doneSpoken, { label: now.label, counts: now.counts }));
      else if (status === "cancelling") setSaid(fill(text.cancellingSpoken, { label: now.label, counts: now.counts }));
      return;
    }
    if (status === "running" && tenth > before.tenth) setSaid(fill(text.progressSpoken, { label: now.label, percent: now.percent, counts: now.counts }));
    // The words come from labels, which are read at the moment of speaking; only a tenth or a status change speaks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenth, status]);

  return (
    // No aria-busy here: a busy ancestor can hold back the live status below, whose announcements are the point of this panel. The progress bar says where it stands.
    <div data-slot="batch-progress" data-status={status} className={cn("grid w-full gap-3", className)} {...props}>
      <div className="flex min-h-8 items-center justify-between gap-4">
        <p id={`${id}-label`} className="min-w-0 text-sm leading-snug font-medium tracking-[-0.01em] text-balance">
          {label}
        </p>
        {status === "complete" ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium">
            <IconCheck className="size-4" />
            {text.finished}
          </span>
        ) : status === "cancelling" ? (
          <Button type="button" variant="outline" size="sm" loading className="shrink-0">
            {text.cancelling}
          </Button>
        ) : onCancel ? (
          <Button type="button" variant="outline" size="sm" onClick={onCancel} className="shrink-0">
            {text.cancel}
          </Button>
        ) : null}
      </div>

      <div className="relative">
        <Progress
          value={finished}
          max={Math.max(all, 1)}
          aria-labelledby={`${id}-label`}
          getValueLabel={() => counts}
          className={cn("h-2.5 transition-opacity duration-200 motion-reduce:transition-none", status === "cancelling" && "opacity-60")}
        />
        {bad > 0 ? (
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
            <span
              // A few failures in a big batch are less than a pixel wide: the hatch keeps a width that can be seen, and stays inside the bar.
              style={{ ...HATCH, left: `min(${goodShare}%, calc(100% - ${HATCH_MIN}px))`, width: `max(${badShare}%, ${HATCH_MIN}px)` }}
              className="absolute inset-y-0 bg-[color-mix(in_oklch,var(--destructive)_12%,var(--background))] text-destructive transition-[left,width] duration-300 ease-out motion-reduce:transition-none"
            />
          </span>
        ) : null}
      </div>

      <p className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] leading-5 text-muted-foreground tabular-nums">
        <span className="inline-flex items-center gap-2 text-foreground">
          <Swatch kind="done" />
          {doneText}
        </span>
        {bad > 0 ? (
          <span className="inline-flex items-center gap-2 font-medium text-destructive">
            <span className="sr-only">, </span>
            <Swatch kind="failed" />
            {failedText}
          </span>
        ) : null}
        {waiting > 0 ? (
          <span className="inline-flex items-center gap-2">
            <span className="sr-only">, </span>
            <Swatch kind="waiting" />
            {waitingText}
          </span>
        ) : null}
      </p>

      <p role="status" className="sr-only">
        {said}
      </p>
    </div>
  );
}
