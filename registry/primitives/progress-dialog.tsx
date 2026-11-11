"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { IconBan, IconCheck, IconWarning } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@rhs-ui/primitives/dialog";
import { Progress } from "@rhs-ui/primitives/progress";
import { cn } from "@/lib/utils";

/** Where the task is: still going, finished, failed, or stopped on purpose. */
export type ProgressDialogStatus = "running" | "done" | "failed" | "cancelled";

/** The words the dialog says, for another language or your own wording. */
export interface ProgressDialogLabels {
  /** The quiet button that starts the cancel question. Default "Cancel". */
  cancel: string;
  /** The button that lets the task go on behind the page. Default "Continue in background". */
  background: string;
  /** The cancel question. Default "Cancel this task?" */
  cancelTitle: string;
  /** What cancelling costs, in a line. Default "What is done so far is thrown away." */
  cancelBody: string;
  /** The safe answer to the cancel question, which has focus. Default "Keep going". */
  keepGoing: string;
  /** The answer that cancels. Default "Yes, cancel". */
  confirmCancel: string;
  /** Said where the step is while a cancel is being carried out. Default "Cancelling". */
  cancelling: string;
  /** The heading when the task finished. Default "Done". */
  doneTitle: string;
  /** The heading when the task failed. Default "Something went wrong". */
  failedTitle: string;
  /** What is said when the task failed and no `error` was given. Default "The task stopped before it finished." */
  failedFallback: string;
  /** The heading when the task was cancelled. Default "Cancelled". */
  cancelledTitle: string;
  /** What is said when the task was cancelled. Default "The task was stopped before it finished." */
  cancelledBody: string;
  /** The primary button of a finished task, which closes the dialog. Default "Done". */
  done: string;
  /** The button that closes the dialog after a failure or a cancel. Default "Close". */
  close: string;
  /** The primary button of a failed task, shown with `onRetry`. Default "Try again". */
  retry: string;
}

export interface ProgressDialogProps {
  /** Whether the dialog is showing. */
  open: boolean;
  /** Called when the dialog asks to close. It never does while the task is running; after it ends, Escape, the close button and Done ask. */
  onOpenChange?: (open: boolean) => void;
  /** What is happening: "Exporting orders". It is the heading while the task runs, and it names the progress bar. */
  title: string;
  /** One line under the title while the task runs: "Northwind, 3,482 orders to CSV". */
  description?: ReactNode;
  /** Where the task is. Click and Escape cannot dismiss the dialog while it is `running`; the other three replace the body in place. */
  status: ProgressDialogStatus;
  /** How far along it is, from 0 to 1. Leave it out when the end is unknown: the bar then moves without a length. */
  progress?: number;
  /** The current step in words: "Compressing 3 of 12 files". It sits above the bar and is part of the bar's value text. */
  stepLabel?: string;
  /** Cancel was confirmed. Without it there is no Cancel button. The dialog waits for you to set `status` to `cancelled`. */
  onCancel?: () => void;
  /** "Continue in background" was pressed: hide the dialog and show your own toast or banner. Without it there is no such button. */
  onBackground?: () => void;
  /** What a finished task leaves, with the next action: a file to download, a link to the result. It replaces the bar when `status` is `done`. */
  result?: ReactNode;
  /** Why a failed task failed, in plain words. It is announced at once when `status` becomes `failed`. */
  error?: ReactNode;
  /** The failed task can be run again: this adds Try again, which has focus. */
  onRetry?: () => void;
  /** The locale that writes the percentage. Default "en-US". */
  locale?: string;
  /** The words the dialog says, for translation. */
  labels?: Partial<ProgressDialogLabels>;
  /** Classes for the panel, for a different width. */
  className?: string;
}

const DEFAULT_LABELS = {
  cancel: "Cancel",
  background: "Continue in background",
  cancelTitle: "Cancel this task?",
  cancelBody: "What is done so far is thrown away.",
  keepGoing: "Keep going",
  confirmCancel: "Yes, cancel",
  cancelling: "Cancelling",
  doneTitle: "Done",
  failedTitle: "Something went wrong",
  failedFallback: "The task stopped before it finished.",
  cancelledTitle: "Cancelled",
  cancelledBody: "The task was stopped before it finished.",
  done: "Done",
  close: "Close",
  retry: "Try again",
} satisfies ProgressDialogLabels;

/** How long a step label that is the only news (a task with no percentage) waits before it is read out again. */
const SPEAK_EVERY_MS = 5000;

/** The round mark of an ended task, in the way each one should read: solid for done, red for failed, grey for stopped. */
function StatusMark({ status }: { status: Exclude<ProgressDialogStatus, "running"> }) {
  const tone = { done: "bg-foreground text-background", failed: "bg-destructive/12 text-destructive", cancelled: "bg-muted text-muted-foreground" }[status];
  return (
    <span aria-hidden="true" data-slot="progress-dialog-mark" className={cn("grid size-10 shrink-0 place-items-center rounded-full [&_svg]:size-5", tone)}>
      {status === "done" ? <IconCheck /> : status === "failed" ? <IconWarning /> : <IconBan />}
    </span>
  );
}

/**
 * A modal for a task that takes longer than a toast: an export, an import, a publish. It shows the title, the current
 * step in words and a bar that is a real progressbar, with a determinate length or without one. While the task runs a click
 * outside and Escape do nothing, and Cancel is an explicit button that asks once, in place, with Keep going as the answer
 * that has focus. The bar is read out politely every ten percent, not on every tick, and a task with no percentage reads
 * its step now and then. When the task ends the body is replaced in place by the result (with its next action), the
 * reason it failed (with Try again) or a note that it was cancelled, and focus moves to the primary button of that end
 * state, so nobody has to reopen anything. "Continue in background" hands the task back to the page.
 */
export function ProgressDialog({ open, onOpenChange, title, description, status, progress, stepLabel, onCancel, onBackground, result, error, onRetry, locale = "en-US", labels, className }: ProgressDialogProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const confirmId = useId();
  const content = useRef<HTMLDivElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const keep = useRef<HTMLButtonElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [spoken, setSpoken] = useState("");
  const wasRunning = useRef(status === "running");
  const lastSpoken = useRef(0);
  /** Where focus was before the dialog opened, to give it back. */
  const returnTo = useRef<HTMLElement | null>(null);

  const running = status === "running";
  const value = progress === undefined || Number.isNaN(progress) ? undefined : Math.min(1, Math.max(0, progress));
  const percent = value === undefined ? undefined : Math.round(value * 100);
  const decile = value === undefined ? null : Math.floor(value * 10);
  const percentText = value === undefined ? "" : new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(value);
  const stepNow = useRef(stepLabel);
  useEffect(() => {
    stepNow.current = stepLabel;
  });

  // A new run, or a run that ended, starts without a question and without a cancel under way.
  useEffect(() => {
    setConfirming(false);
    setCancelling(false);
  }, [status, open]);

  // The question has just appeared: the safe answer takes focus, so a stray Enter cannot cancel the task.
  useEffect(() => {
    if (confirming) keep.current?.focus();
  }, [confirming]);

  // The task ended while the dialog is open: focus goes to the primary button of the end state, which has replaced the buttons that had it.
  useEffect(() => {
    if (running) {
      wasRunning.current = true;
      return;
    }
    if (!wasRunning.current) return;
    wasRunning.current = false;
    primary.current?.focus();
  }, [running]);

  // Read out politely every ten percent: the announcement changes only when the tens digit does.
  useEffect(() => {
    if (!open || !running || decile === null || decile === 0) return;
    setSpoken(`${decile * 10} percent${stepNow.current ? `, ${stepNow.current}` : ""}`);
  }, [open, running, decile]);

  // A task with no percentage has only its step to say, and it may change every second: at most once in a while.
  const openEnded = value === undefined;
  useEffect(() => {
    if (!open || !running || !openEnded || !stepLabel) return;
    const wait = Math.max(0, lastSpoken.current + SPEAK_EVERY_MS - Date.now());
    const timer = window.setTimeout(() => {
      lastSpoken.current = Date.now();
      setSpoken(stepLabel);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [open, running, openEnded, stepLabel]);

  // How it ended is said at once, before anything else.
  useEffect(() => {
    if (!open) return;
    // The words are read when the status changes; a new translation alone is not news.
    if (status === "done") setSpoken(words.doneTitle);
    else if (status === "cancelled") setSpoken(words.cancelledTitle);
    else if (status === "failed") setSpoken(typeof error === "string" ? `${words.failedTitle}. ${error}` : words.failedTitle);
  }, [open, status]);

  const heading = running ? title : status === "done" ? words.doneTitle : status === "failed" ? words.failedTitle : words.cancelledTitle;
  const lede: ReactNode = running ? description : status === "failed" ? (error ?? words.failedFallback) : status === "cancelled" ? words.cancelledBody : null;

  function askToClose(next: boolean) {
    if (!next && running) return;
    onOpenChange?.(next);
  }

  return (
    <Dialog open={open} onOpenChange={askToClose}>
      <DialogContent
        ref={content}
        data-slot="progress-dialog"
        data-status={status}
        showCloseButton={!running}
        {...(lede ? {} : { "aria-describedby": undefined })}
        onOpenAutoFocus={(event) => {
          // Reading the dialog from the top is the right start for a task; a task that has ended already puts its primary button first.
          event.preventDefault();
          const active = document.activeElement;
          returnTo.current = active instanceof HTMLElement && active !== document.body ? active : null;
          (running ? content.current : primary.current)?.focus();
        }}
        onCloseAutoFocus={(event) => {
          // Back to the button that started the task, which is not a trigger of this component.
          const back = returnTo.current;
          returnTo.current = null;
          if (!back?.isConnected) return;
          event.preventDefault();
          back.focus({ preventScroll: true });
        }}
        onEscapeKeyDown={(event) => {
          if (!running) return;
          // Escape never closes a running task; with the cancel question open it takes the question back.
          event.preventDefault();
          if (confirming) setConfirming(false);
        }}
        onInteractOutside={(event) => {
          if (running) event.preventDefault();
        }}
        className={cn("gap-0 sm:max-w-md", className)}
      >
        <div key={status} className="grid gap-5 motion-safe:animate-rhs-fade-in">
          <div className={cn("flex gap-3.5 pr-7", lede ? "items-start" : "items-center")}>
            {running ? null : <StatusMark status={status} />}
            <div className="grid min-w-0 gap-1">
              <DialogTitle className="text-lg leading-snug tracking-[-0.02em]">{heading}</DialogTitle>
              {lede ? (
                <DialogDescription asChild>
                  <div className="text-sm leading-relaxed [overflow-wrap:anywhere]">{lede}</div>
                </DialogDescription>
              ) : null}
            </div>
          </div>

          {running ? (
            <div className="grid gap-2.5">
              <div className="flex min-h-5 items-baseline justify-between gap-4 text-sm">
                <p className="min-w-0 truncate text-foreground">{cancelling ? words.cancelling : stepLabel}</p>
                {percentText ? (
                  <span aria-hidden="true" className="shrink-0 text-muted-foreground tabular-nums">
                    {percentText}
                  </span>
                ) : null}
              </div>
              <Progress
                value={percent}
                aria-label={title}
                aria-valuetext={[stepLabel, percentText].filter(Boolean).join(", ") || undefined}
                className="h-2"
              />
            </div>
          ) : status === "done" && result ? (
            <div className="text-sm">{result}</div>
          ) : null}

          {running && confirming ? (
            <div role="group" aria-labelledby={confirmId} className="flex min-h-14 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p id={confirmId} className="text-sm font-medium">
                  {words.cancelTitle}
                </p>
                <p className="text-sm text-pretty text-muted-foreground">{words.cancelBody}</p>
              </div>
              <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setConfirming(false);
                    setCancelling(true);
                    onCancel?.();
                  }}
                >
                  {words.confirmCancel}
                </Button>
                <Button ref={keep} type="button" onClick={() => setConfirming(false)}>
                  {words.keepGoing}
                </Button>
              </div>
            </div>
          ) : running ? (
            <div className="flex min-h-14 flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              {onCancel ? (
                <Button type="button" variant="ghost" disabled={cancelling} onClick={() => setConfirming(true)} className="sm:-ml-3">
                  {words.cancel}
                </Button>
              ) : (
                <span aria-hidden="true" className="hidden sm:block" />
              )}
              {onBackground ? (
                <Button type="button" variant="outline" disabled={cancelling} onClick={onBackground}>
                  {words.background}
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {status === "failed" && onRetry ? (
                <>
                  <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
                    {words.close}
                  </Button>
                  <Button ref={primary} type="button" onClick={onRetry}>
                    {words.retry}
                  </Button>
                </>
              ) : (
                <Button ref={primary} type="button" onClick={() => onOpenChange?.(false)}>
                  {status === "done" ? words.done : words.close}
                </Button>
              )}
            </div>
          )}
        </div>
        {/* One polite region for the whole dialog, so the announcements queue up instead of competing. */}
        <span role="status" aria-live="polite" className="sr-only">
          {spoken}
        </span>
      </DialogContent>
    </Dialog>
  );
}
