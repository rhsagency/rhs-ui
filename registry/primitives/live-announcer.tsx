"use client";

import { useEffect, useSyncExternalStore } from "react";

export type Politeness = "polite" | "assertive";

export interface AnnounceEvent {
  /** The text that was written to the region. */
  message: string;
  /** Which region it went to: `polite` waits for a pause, `assertive` interrupts. */
  politeness: Politeness;
}

export interface LiveAnnouncerProps {
  /** How long a message stays in its region before the region is emptied, in ms, so nothing is left behind for someone reading the page with a screen reader. Default 5000. */
  clearAfterMs?: number;
  /** Called once a message has been handed to a region, in order: for a visible log in a preview or a test. */
  onAnnounce?: (event: AnnounceEvent) => void;
}

/** The pause between emptying a region and filling it, so a screen reader sees a change even when the words are the same as before. */
const REFILL_MS = 70;
/** The least time between two messages in one region, so a screen reader reads each one instead of only the last. */
const STEP_MS = 320;
/** The same message within this time counts as one. */
const DUPLICATE_MS = 600;
/** More than this waiting in one region and the oldest are dropped: a flood is not worth listening to. */
const QUEUE_MAX = 6;
/** A message sent while no announcer is mounted waits for one, but not longer than this. */
const WAIT_MS = 2000;

interface Lane {
  queue: { message: string; at: number }[];
  /** A message is being written or has just been written, and the next one waits its turn. */
  busy: boolean;
  /** The message whose region is empty and about to be filled. */
  inflight: string | null;
  last: { message: string; at: number } | null;
  fill: number | undefined;
  clear: number | undefined;
}

const lane = (): Lane => ({ queue: [], busy: false, inflight: null, last: null, fill: undefined, clear: undefined });

// One announcer per page. The engine lives here, not in the component, so announce() works from any hook or handler without a context in between, and a message sent before <LiveAnnouncer /> has mounted (from a child's mount effect) is kept for it.
const lanes: Record<Politeness, Lane> = { polite: lane(), assertive: lane() };
const EMPTY = { polite: "", assertive: "" } as const;
let snapshot: Readonly<Record<Politeness, string>> = EMPTY;
let settings: { clearAfterMs: number; onAnnounce?: LiveAnnouncerProps["onAnnounce"] } = { clearAfterMs: 5000 };
let mounted = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

function write(politeness: Politeness, value: string) {
  if (snapshot[politeness] === value) return;
  snapshot = { ...snapshot, [politeness]: value };
  for (const listener of listeners) listener();
}

/** Takes the next message of a lane: empty the region, fill it a moment later, then wait before the one after. */
function pump(politeness: Politeness) {
  const state = lanes[politeness];
  if (mounted === 0 || state.busy) return;
  const next = state.queue.shift();
  if (next === undefined) return;
  state.busy = true;
  state.inflight = next.message;
  write(politeness, "");
  state.fill = window.setTimeout(() => {
    state.inflight = null;
    write(politeness, next.message);
    settings.onAnnounce?.({ message: next.message, politeness });
    window.clearTimeout(state.clear);
    state.clear = window.setTimeout(() => write(politeness, ""), settings.clearAfterMs);
    state.fill = window.setTimeout(() => {
      state.busy = false;
      pump(politeness);
    }, STEP_MS);
  }, REFILL_MS);
}

/** The announcer is gone (or being re-mounted, as React's strict mode does): stop the clocks and keep what was not yet said. */
function pause() {
  for (const politeness of ["polite", "assertive"] as const) {
    const state = lanes[politeness];
    window.clearTimeout(state.fill);
    window.clearTimeout(state.clear);
    if (state.inflight !== null) state.queue.unshift({ message: state.inflight, at: Date.now() });
    state.inflight = null;
    state.busy = false;
    write(politeness, "");
  }
}

function resume() {
  for (const politeness of ["polite", "assertive"] as const) {
    const state = lanes[politeness];
    state.queue = state.queue.filter((item) => Date.now() - item.at < WAIT_MS);
    pump(politeness);
  }
}

/**
 * Says something to screen readers: "3 results found", "Draft saved",
 * "Upload failed". It does nothing on the server. An identical message sent
 * again within a blink is dropped, and the rest are read in turn. Called
 * before `<LiveAnnouncer />` has mounted, it waits a moment for it rather than
 * being lost.
 */
export function announce(message: string, politeness: Politeness = "polite"): void {
  if (typeof window === "undefined" || message.trim() === "") return;
  const state = lanes[politeness];
  const now = Date.now();
  if (state.last && state.last.message === message && now - state.last.at < DUPLICATE_MS) return;
  state.last = { message, at: now };
  state.queue = [...state.queue, { message, at: now }].slice(-QUEUE_MAX);
  pump(politeness);
}

/**
 * The same `announce`, from a hook: `const say = useAnnounce()`, then
 * `say("3 results found")` or `say("Upload failed", "assertive")`. The
 * function is the same on every render, so it is safe in an effect's
 * dependencies, and it is a safe no-op on the server.
 */
export function useAnnounce(): typeof announce {
  return announce;
}

/**
 * The one place that tells screen readers what just happened. Mount it once,
 * near the root of the page and outside anything that is hidden while a dialog
 * is open (a sibling of your app's main wrapper, not a child of it). Both of
 * its regions, one polite and one assertive, exist from the first render: a
 * live region that is created in the same moment as its message is often never
 * read, and that is the usual reason a toast, a counter or a form error stays
 * silent. A message is written by emptying the region and filling it again a
 * moment later, so a repeat of the same words is read again. Identical
 * messages sent within a blink count as one, and the rest are read in turn,
 * not on top of each other. Use `assertive` only for what has to interrupt: a
 * failure, a lost connection.
 */
export function LiveAnnouncer({ clearAfterMs = 5000, onAnnounce }: LiveAnnouncerProps) {
  const text = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY,
  );
  useEffect(() => {
    settings = { clearAfterMs, onAnnounce };
  });
  useEffect(() => {
    mounted += 1;
    if (mounted === 1) resume();
    return () => {
      mounted -= 1;
      if (mounted === 0) pause();
    };
  }, []);

  return (
    <div data-slot="live-announcer" className="sr-only">
      <div role="status" aria-live="polite" aria-atomic="true">
        {text.polite}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true">
        {text.assertive}
      </div>
    </div>
  );
}
