"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** A draft as it was found in storage. */
export interface LocalDraft<T> {
  /** What was saved: the `value` the hook was given, as it came back from JSON. */
  value: T;
  /** When it was saved, as milliseconds since 1970. Pass it to `DraftRestoredNotice`'s `savedAt`. */
  savedAt: number;
}

export interface UseLocalDraftOptions {
  /** How long to wait after the last change before saving, in ms. A person typing is one save, not one per key. Default 800. */
  delay?: number;
  /** Turn saving off, for the moment the form is being submitted. Default true. */
  enabled?: boolean;
}

export interface UseLocalDraft<T> {
  /** The draft that was waiting when the form mounted, or null. It is null on the server and on the first paint, so the page hydrates cleanly, and then it is set once. */
  draft: LocalDraft<T> | null;
  /** Deletes the stored draft and sets `draft` to null. Call it after the form was saved for real, and when Start over is confirmed. */
  clear: () => void;
}

const PREFIX = "rhs-ui-draft:";

const noop = () => undefined;

function read<T>(storageKey: string): LocalDraft<T> | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && "value" in parsed && "savedAt" in parsed && typeof parsed.savedAt === "number") {
      return { value: parsed.value as T, savedAt: parsed.savedAt };
    }
  } catch {
    // Storage is blocked, or what is in it is not ours: there is no draft.
  }
  return null;
}

/**
 * Keeps a copy of a form on this device while it is being filled in, so a
 * crash, a closed tab or a dead battery does not cost the work. It saves
 * `value` to localStorage a moment after the last change (and at once when the
 * tab is hidden or closed), says on mount whether a draft was waiting, and
 * forgets it when you call `clear()` after the form was saved for real. A
 * form that has not been touched never overwrites the draft it is about to
 * offer, and a form changed back to how it started removes its draft, since
 * there is nothing to restore. `value` must survive JSON: strings, numbers,
 * booleans, arrays and plain objects.
 *
 * It does not put the draft back for you: on mount, if `draft` is set, apply
 * `draft.value` to your form and show a `DraftRestoredNotice`.
 */
export function useLocalDraft<T>(key: string, value: T, { delay = 800, enabled = true }: UseLocalDraftOptions = {}): UseLocalDraft<T> {
  const storageKey = `${PREFIX}${key}`;
  const [draft, setDraft] = useState<LocalDraft<T> | null>(null);
  const text = JSON.stringify(value) ?? "";

  // The form as it was first drawn, the text last written or found, and the write that is waiting for its turn.
  const baseline = useRef(text);
  const stored = useRef<string | null>(null);
  const latest = useRef(text);
  const touched = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const flush = useRef<() => void>(noop);

  // Read first: the effect below must know what is already kept before it decides what to write.
  useEffect(() => {
    const found = read<T>(storageKey);
    stored.current = found ? (JSON.stringify(found.value) ?? "") : baseline.current;
    setDraft(found);
  }, [storageKey]);

  useEffect(() => {
    latest.current = text;
    if (text !== baseline.current) touched.current = true;
    if (!enabled || !touched.current || text === stored.current) {
      flush.current = noop;
      return;
    }
    const write = () => {
      window.clearTimeout(timer.current);
      flush.current = noop;
      stored.current = text;
      try {
        // Back at the starting point: nothing to restore, so nothing is kept.
        if (text === baseline.current) window.localStorage.removeItem(storageKey);
        else window.localStorage.setItem(storageKey, JSON.stringify({ v: 1, savedAt: Date.now(), value }));
      } catch {
        // Storage is full or blocked: the draft is lost, the form is not.
      }
    };
    flush.current = write;
    timer.current = window.setTimeout(write, delay);
    return () => window.clearTimeout(timer.current);
    // `value` is read through `text`: it changes exactly when `text` does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, enabled, delay, storageKey]);

  // A tab that is hidden or closed does not wait for the delay.
  useEffect(() => {
    const now = () => flush.current();
    const hidden = () => {
      if (document.visibilityState === "hidden") now();
    };
    window.addEventListener("pagehide", now);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("pagehide", now);
      document.removeEventListener("visibilitychange", hidden);
      now();
    };
  }, []);

  const clear = useCallback(() => {
    window.clearTimeout(timer.current);
    flush.current = noop;
    // What is on screen now is, from here on, the saved state: only a new change is a draft.
    stored.current = latest.current;
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Blocked storage has no draft to remove.
    }
    setDraft(null);
  }, [storageKey]);

  return { draft, clear };
}
