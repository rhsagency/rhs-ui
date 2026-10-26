"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

import { Progress } from "@rhs-ui/primitives/progress";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { dismissToast, toast } from "@rhs-ui/primitives/toast";
import { cn } from "@/lib/utils";

export interface TaskToastOptions {
  /** What is running, in the present tense: "Exporting orders". */
  title: string;
  /** A line under the title while it runs. */
  description?: string;
  /** Starts the toast as a bar at this fraction (0 to 1) instead of a spinner alone. Leave it out when you do not know the progress yet. */
  progress?: number;
  /** Adds a Cancel button while the task runs. Pressing it closes the toast and calls this; whatever the task reports afterwards is ignored. */
  onCancel?: () => void;
}

export interface TaskSuccessOptions {
  /** A line under the title: "1,204 orders, 3.2 MB". */
  description?: string;
  /** One button for what to do next: "Open file". It runs `onClick` and closes the toast. */
  action?: { label: string; onClick: () => void };
  /** How long the toast stays before it closes itself, in ms. It waits while the person hovers it or has focus in it. Default 5000. */
  duration?: number;
}

export interface TaskErrorOptions {
  /** A line under the title: what went wrong, in words someone can act on. */
  description?: string;
  /** Adds a Retry button. It closes the toast and calls this; start the task again from here. */
  onRetry?: () => void;
  /** The text on that button. Default "Retry". */
  retryLabel?: string;
}

export interface TaskToast {
  /** The toast's id, for dismissToast. */
  id: string;
  /** How far along it is, from 0 to 1, and optionally what that means: "1,200 of 3,000 orders". */
  progress: (fraction: number, detail?: string) => void;
  /** Turns the toast into a check and a result. It closes itself after a few seconds. */
  success: (title: string, options?: TaskSuccessOptions) => void;
  /** Turns the toast into a warning with a result. It stays until someone closes it. */
  error: (title: string, options?: TaskErrorOptions) => void;
  /** Closes the toast for good: whatever the task reports afterwards is ignored. */
  dismiss: () => void;
}

export interface TaskPromiseMessages<T> {
  /** The title while the promise is pending: "Generating invoices". */
  loading: string;
  /** The title when it resolves, or a function of the value it resolved with. */
  success: string | ((value: T) => string);
  /** The title when it rejects, or a function of the reason it rejected with. */
  error: string | ((reason: unknown) => string);
  /** A line under the title while the promise is pending. */
  description?: string;
}

type Phase = "running" | "success" | "error";

let counter = 0;

/** What is read between two sentences of an announcement: a full stop, unless the first already ends with one. */
const stopAfter = (text: string) => (/[.!?…:]\s*$/.test(text) ? " " : ". ");

/** Sentences in one string, each parted from the next the way a person would read it. */
const sentences = (parts: readonly (string | undefined)[]) => {
  const spoken = parts.filter((part): part is string => Boolean(part));
  return spoken.map((part, index) => (index < spoken.length - 1 ? part + stopAfter(part) : part)).join("");
};

/** Runs `callback` after the component is really gone. React's strict mode unmounts and mounts a component straight away to check it; that is not gone. */
function useGone(callback: () => void) {
  const latest = useRef(callback);
  const alive = useRef(false);
  useEffect(() => {
    latest.current = callback;
  });
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      window.setTimeout(() => {
        if (!alive.current) latest.current();
      }, 0);
    };
  }, []);
}

/** Calls `onElapsed` after `ms` (0 turns it off), and waits while the toast is hovered, has focus, or the tab or window is in the background. */
function useCountdown(root: RefObject<HTMLElement | null>, ms: number, onElapsed: () => void) {
  const elapsed = useRef(onElapsed);
  useEffect(() => {
    elapsed.current = onElapsed;
  });
  useEffect(() => {
    const own = root.current;
    if (!own || ms <= 0) return;
    const toastNode = own.closest<HTMLElement>('[data-slot="toast"]') ?? own;
    const holds = new Set<string>();
    let timer = 0;
    let startedAt = 0;
    let left = ms;
    const start = () => {
      if (timer || holds.size > 0) return;
      startedAt = performance.now();
      timer = window.setTimeout(() => {
        timer = 0;
        elapsed.current();
      }, Math.max(0, left));
    };
    const stop = () => {
      if (!timer) return;
      window.clearTimeout(timer);
      timer = 0;
      left -= performance.now() - startedAt;
    };
    const hold = (name: string, on: boolean) => {
      if (on) {
        holds.add(name);
        stop();
      } else {
        holds.delete(name);
        start();
      }
    };
    const enter = () => hold("pointer", true);
    const leave = () => hold("pointer", false);
    const focusIn = () => hold("focus", true);
    const focusOut = (event: FocusEvent) => {
      if (!(event.relatedTarget instanceof Node && toastNode.contains(event.relatedTarget))) hold("focus", false);
    };
    const visibility = () => hold("hidden", document.hidden);
    const blur = () => hold("window", true);
    const focus = () => hold("window", false);
    toastNode.addEventListener("pointerenter", enter);
    toastNode.addEventListener("pointerleave", leave);
    toastNode.addEventListener("focusin", focusIn);
    toastNode.addEventListener("focusout", focusOut);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    if (document.hidden) hold("hidden", true);
    else start();
    return () => {
      stop();
      toastNode.removeEventListener("pointerenter", enter);
      toastNode.removeEventListener("pointerleave", leave);
      toastNode.removeEventListener("focusin", focusIn);
      toastNode.removeEventListener("focusout", focusOut);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
    };
  }, [root, ms]);
}

/**
 * The title of the toast, and what holds its life together: the spinner while
 * it runs, the polite announcement of each new state, the countdown that closes
 * a success, and the word that the toast is gone. It is the same component in
 * every state, so React keeps it, and the toast changes in place instead of
 * being replaced.
 */
function TaskMessage({ phase, title, said, closeAfter, onClose, onGone }: { phase: Phase; title: string; said: string; closeAfter: number; onClose: () => void; onGone: () => void }) {
  const root = useRef<HTMLSpanElement>(null);
  useCountdown(root, phase === "success" ? closeAfter : 0, onClose);
  useGone(onGone);
  // Radix announces a toast once, when it appears. Every change after that is said here, politely, whatever the tone.
  const [heard, setHeard] = useState("");
  const before = useRef(said);
  useEffect(() => {
    if (before.current === said) return;
    before.current = said;
    setHeard(said);
  });
  return (
    // While it runs there is no icon column, so the title makes room for the spinner where the icon of the result will stand.
    // `contain: inline-size` keeps the toast's grid column from growing to fit this text: on a phone a long title wraps instead of pushing the Cancel button off the toast.
    <span ref={root} className={cn("block [contain:inline-size] [overflow-wrap:anywhere]", phase === "running" && "relative pl-[30px]")}>
      {phase === "running" ? <Spinner size={18} label="" aria-hidden="true" role="presentation" className="absolute top-0.5 left-0 text-muted-foreground" /> : null}
      {title}
      {/* A toast is announced as its text nodes one after the other, with nothing in between: these full stops and commas keep the title, the description and the figures apart. */}
      <span className="sr-only">{stopAfter(title)}</span>
      <span role="status" className="sr-only">
        {heard}
      </span>
    </span>
  );
}

function TaskDetail({ description, fraction, detail, name }: { description?: string; fraction: number | null; detail?: string; name: string }) {
  const percent = fraction === null ? null : Math.round(Math.min(1, Math.max(0, fraction)) * 100);
  return (
    <span className="block [contain:inline-size] [overflow-wrap:anywhere] pl-[30px]">
      {description ? (
        <span className="block">
          {description}
          <span className="sr-only">{stopAfter(description)}</span>
        </span>
      ) : null}
      {percent !== null ? (
        <span className="mt-2 grid gap-1.5">
          <Progress value={percent} aria-label={`${name}, progress`} className="h-1" />
          <span className="flex items-baseline justify-between gap-3 text-xs tabular-nums">
            <span className="min-w-0 truncate">{detail}</span>
            {detail ? <span className="sr-only">, </span> : null}
            <span className="shrink-0 font-medium whitespace-nowrap text-foreground">{percent}%</span>
            <span className="sr-only">. </span>
          </span>
        </span>
      ) : null}
    </span>
  );
}

function start(options: TaskToastOptions): TaskToast {
  const id = `rhs-task-${++counter}`;
  const noop: TaskToast = { id, progress: () => undefined, success: () => undefined, error: () => undefined, dismiss: () => undefined };
  // There is no toast on the server.
  if (typeof window === "undefined") return noop;

  let cancelled = false;
  let dismissed = false;
  let closed = false;
  let finished = false;
  const gone = () => {
    closed = true;
  };

  const running = (fraction: number | null, detail?: string) => {
    if (cancelled || closed || finished) return;
    toast(<TaskMessage phase="running" title={options.title} said="" closeAfter={0} onClose={() => undefined} onGone={gone} />, {
      id,
      duration: Number.POSITIVE_INFINITY,
      description: <TaskDetail name={options.title} description={options.description} fraction={fraction} detail={detail} />,
      action: options.onCancel
        ? {
            label: "Cancel",
            altText: "Cancel available",
            onClick: () => {
              cancelled = true;
              options.onCancel?.();
            },
          }
        : undefined,
    });
  };

  const settle = (phase: "success" | "error", title: string, description: string | undefined, said: string, closeAfter: number, action: { label: string; altText: string; onClick: () => void } | undefined) => {
    if (cancelled || dismissed) return;
    finished = true;
    toast(<TaskMessage phase={phase} title={title} said={said} closeAfter={closeAfter} onClose={() => dismissToast(id)} onGone={gone} />, {
      id,
      tone: phase === "success" ? "success" : "destructive",
      duration: Number.POSITIVE_INFINITY,
      description: description ? (
        <>
          {description}
          <span className="sr-only">{stopAfter(description)}</span>
        </>
      ) : undefined,
      action,
    });
  };

  running(options.progress === undefined ? null : options.progress);

  return {
    id,
    progress: (fraction, detail) => running(Math.min(1, Math.max(0, fraction)), detail),
    success: (title, result = {}) =>
      settle("success", title, result.description, sentences([title, result.description]), result.duration ?? 5000, result.action ? { label: result.action.label, altText: `${result.action.label} available`, onClick: result.action.onClick } : undefined),
    error: (title, result = {}) => {
      const label = result.retryLabel ?? "Retry";
      settle(
        "error",
        title,
        result.description,
        sentences([title, result.description, result.onRetry ? `${label} is available` : undefined]),
        0,
        result.onRetry ? { label, altText: `${label} available`, onClick: result.onRetry } : undefined,
      );
    },
    dismiss: () => {
      dismissed = true;
      closed = true;
      finished = true;
      dismissToast(id);
    },
  };
}

function track<T>(promise: Promise<T>, messages: TaskPromiseMessages<T>): Promise<T> {
  const task = start({ title: messages.loading, description: messages.description });
  promise.then(
    (value) => task.success(typeof messages.success === "function" ? messages.success(value) : messages.success),
    (reason: unknown) => task.error(typeof messages.error === "function" ? messages.error(reason) : messages.error),
  );
  return promise;
}

/**
 * One toast that follows a task from start to finish, on top of the house
 * toast(). It starts as a spinner; `progress(0.4)` turns it into a slim bar with
 * a percentage; `success("Export ready")` turns it into a check and closes it
 * a few seconds later; `error("Export failed", { onRetry })` turns it into a
 * warning that stays until it is dealt with. It is one toast the whole way,
 * changing in place. Each change is announced politely, and a Cancel button
 * shows while it runs when you give `onCancel`. If someone closes the toast
 * while the task runs, progress stops coming back, but the result still
 * arrives: a finished export is worth a toast.
 *
 *     const task = taskToast({ title: "Exporting orders" });
 *     task.progress(0.4);
 *     task.success("Export ready", { action: { label: "Open file", onClick: open } });
 *
 * `taskToast.promise(promise, { loading, success, error })` is the short way.
 */
export const taskToast = Object.assign(start, { promise: track });
