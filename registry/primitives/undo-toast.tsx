"use client";

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";

import { dismissToast, toast } from "@rhs-ui/primitives/toast";

export interface UndoToastOptions {
  /** What just happened, as a short sentence in the past tense: "Archived Halcyon brand kit". It is the whole announcement: "Archived Halcyon brand kit. Undo available". */
  message: string;
  /** Called when Undo is pressed. Put the item back in your optimistic state here. The delete never happens. */
  onUndo?: () => void;
  /** Called exactly once when the delete should become real: the time ran out, the toast was closed without Undo, a newer toast pushed this one out, or the page is being left. Use `keepalive` or `sendBeacon` here if it makes a request, so it survives the page going away. */
  onCommit?: () => void;
  /** How long Undo stays on offer, in ms. Default 6000. */
  duration?: number;
  /** The text on the button, and in "Undo available". Default "Undo". */
  undoLabel?: string;
}

let counter = 0;
/** Commits that have not happened yet, by toast id: what leaving the page has to flush. */
const pending = new Map<string, () => void>();
let bound = false;

function flushOnLeave() {
  if (bound || typeof window === "undefined") return;
  bound = true;
  // pagehide, not unload: it also fires when a phone puts the tab to sleep or the browser freezes the page.
  window.addEventListener("pagehide", () => {
    for (const commit of [...pending.values()]) commit();
  });
}

/**
 * Runs `callback` after the component is really gone. React's strict mode
 * unmounts and mounts a component straight away to check it; that is not gone.
 */
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

/**
 * A countdown that waits while the person is dealing with it: the pointer is
 * over the toast, focus is inside it, the tab is hidden or the window has
 * lost focus. Returns whether it is waiting, for the line that drains.
 */
function useCountdown(root: RefObject<HTMLElement | null>, ms: number, onElapsed: () => void): boolean {
  const [waiting, setWaiting] = useState(false);
  const elapsed = useRef(onElapsed);
  useEffect(() => {
    elapsed.current = onElapsed;
  });
  useEffect(() => {
    const own = root.current;
    if (!own) return;
    // The toast is the house Toast (data-slot="toast"): hovering or tabbing to any part of it counts, not just this text.
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
        left = 0;
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
      setWaiting(holds.size > 0);
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
  return waiting;
}

function UndoMessage({ message, duration, onElapsed, onGone }: { message: string; duration: number; onElapsed: () => void; onGone: () => void }) {
  const root = useRef<HTMLSpanElement>(null);
  const waiting = useCountdown(root, duration, onElapsed);
  useGone(onGone);
  return (
    // As tall as the Undo button, so a one-line message is centred on it and not left hanging above it.
    <span ref={root} className="flex min-h-8 items-center [overflow-wrap:anywhere]">
      {message}
      {/* Anchored to the toast itself (the house Toast is relative and clips its corners), not to this text. Whole seconds under reduced motion, so nothing slides. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-foreground/40 motion-safe:animate-[rhs-drain_var(--undo-duration)_linear_forwards] motion-reduce:animate-[rhs-drain_var(--undo-duration)_var(--undo-steps)_forwards]"
        style={
          {
            "--undo-duration": `${duration}ms`,
            "--undo-steps": `steps(${Math.max(1, Math.round(duration / 1000))}, end)`,
            animationPlayState: waiting ? "paused" : "running",
          } as CSSProperties
        }
      />
    </span>
  );
}

/**
 * The delete-with-undo pattern, on top of the house toast(). The item is gone
 * at once: you have already removed it in your own state. The toast says so,
 * offers Undo, and a thin line drains over `duration`. If Undo is pressed,
 * `onUndo` runs and the delete never happens. Otherwise `onCommit` runs once,
 * and only once: when the time is up, when the toast is closed without Undo,
 * when a newer toast pushes it out, and when the page is left. The time stops
 * while the toast is hovered or has focus, and while the tab is in the
 * background. Undo is reached like any toast action, with F8. Screen readers
 * hear "Message. Undo available" politely. It returns the toast's id.
 */
export function toastUndo({ message, onUndo, onCommit, duration = 6000, undoLabel = "Undo" }: UndoToastOptions): string {
  const id = `rhs-undo-${++counter}`;
  // There is no toast on the server, so nothing to commit or undo.
  if (typeof window === "undefined") return id;
  let settled = false;
  const settle = (callback?: () => void) => {
    if (settled) return;
    settled = true;
    pending.delete(id);
    callback?.();
  };
  const commit = () => settle(onCommit);
  pending.set(id, commit);
  flushOnLeave();
  // The toast's announcement is its text nodes one after the other, with nothing in between: "Archived Halcyon" and "Undo available" would be heard as one word.
  const stop = /[.!?…]\s*$/.test(message) ? " " : ". ";
  toast(
    <UndoMessage
      message={message}
      duration={duration}
      onElapsed={() => {
        commit();
        dismissToast(id);
      }}
      onGone={commit}
    />,
    {
      id,
      // Radix would close the toast on its own clock; this one keeps its own, so it can wait with the person and so the commit lands the moment the time is up.
      duration: Number.POSITIVE_INFINITY,
      action: { label: undoLabel, altText: `${stop}${undoLabel} available`, onClick: () => settle(onUndo) },
    },
  );
  return id;
}
