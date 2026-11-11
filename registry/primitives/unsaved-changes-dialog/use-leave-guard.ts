"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface LeaveGuardOptions {
  /** Ask before a click on a link that leaves the page: a link of your app, or another site. Default true. */
  links?: boolean;
  /** Ask before the browser's Back button leaves the page. Default true. */
  history?: boolean;
  /** Register the browser's own prompt for closing the tab, reloading and typing another address. The wording is the browser's and cannot be changed. Default true. */
  unload?: boolean;
}

/** What to give a UnsavedChangesDialog so it asks the question this guard raised. */
export interface LeaveGuardDialogProps {
  /** Whether the question is showing. */
  open: boolean;
  /** The dialog asking to close is a "stay": the way out that was blocked is dropped. */
  onOpenChange: (open: boolean) => void;
  /** Leave was chosen, by Discard or by a Save that worked: the way out that was blocked goes ahead. */
  onLeave: () => void;
}

export interface LeaveGuard {
  /** Whether a way out is waiting for an answer. Give it to the dialog's `open`. */
  open: boolean;
  /**
   * Ask first. With nothing changed it runs `go` at once, otherwise it opens the question and runs `go` when the answer is to leave.
   * Use it for what the guard cannot see: a `router.push` from a button, a Cancel that goes back (`request(() => router.back())`).
   * Before `go` runs on a leave, the guard steps back off its own history entry, so the history reads page, next page.
   */
  request: (go: () => void) => void;
  /** Leave: the way out that was blocked goes ahead, and the question closes. */
  leave: () => void;
  /** Stay: the way out that was blocked is dropped, and the question closes. */
  stay: () => void;
  /** Everything the dialog needs from the guard, to spread onto it: `<UnsavedChangesDialog {...guard.dialogProps} onSave={save} />`. */
  dialogProps: LeaveGuardDialogProps;
}

/** The key that marks the history entry this hook adds. */
const MARK = "__rhsLeaveGuard";

/** How long after a way out was allowed nothing is asked again: long enough for a slow navigation to start, short enough to forget. */
const PASS_MS = 1500;

/** How long the step back off the guard's own history entry may take before the way out goes ahead without waiting for it. */
const STEP_MS = 300;

const isOurs = (state: unknown, token: string | null) => token !== null && typeof state === "object" && state !== null && (state as Record<string, unknown>)[MARK] === token;

/** A way out that waits for the answer, and whether the guard's own history entry has to be stepped off before it goes ahead. */
interface Waiting {
  /** What runs when the answer is to leave. */
  go: () => void;
  /** A link or `request`: step back off the guard's entry first, so the history reads page, next page. Back already leaves two entries at once. */
  unwind: boolean;
}

/**
 * The guard behind the question: while `dirty` is true it catches the ways out of a page that the page can see. A click on
 * a link is caught before the router gets it and asked about; the Back button is caught by keeping one extra entry of its
 * own in the history, so Back lands on the same page where the question can be asked; and the browser's own prompt is
 * registered for closing the tab, reloading and typing a new address. A way out that was blocked is kept, and `leave()`
 * runs it: a link is clicked again with the guard out of the way, so your router handles it as it always does, and Back
 * goes back. Nothing here asks for a library or a router. What no page can see, a `router.push` from a button, goes
 * through `request`. The hook and the dialog work alone: the hook with your own question, the dialog with your own state. Use one guard
 * per page: a link click is caught by the first guard that sees it.
 *
 * The cost of the Back trick: while there are changes the history holds the page twice, so a long press on Back lists it twice.
 * A way out through a link or `request` first steps back off that extra entry, a Back of its own that your router sees as
 * a return to the same page, and goes ahead right after it (or after 300 ms at most), so the history stays page, next page.
 * The entry is taken away again when the changes are saved or reverted, and a leave by the Back button goes back two entries at once.
 */
export function useLeaveGuard(dirty: boolean, options: LeaveGuardOptions = {}): LeaveGuard {
  const { links = true, history: watchHistory = true, unload = true } = options;
  const [open, setOpen] = useState(false);
  /** The way out that waits for the answer. */
  const pending = useRef<Waiting | null>(null);
  /** The history entry this guard added last. It is the one on top of the history while `history.state` carries its token. */
  const entry = useRef<string | null>(null);
  /** True for a moment after a way out was allowed, so it is not caught a second time on its way. */
  const passing = useRef(false);
  const passTimer = useRef<number | undefined>(undefined);
  const dirtyRef = useRef(dirty);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);
  useEffect(() => () => window.clearTimeout(passTimer.current), []);
  // New changes start a new session: whatever was let through before no longer counts, and the guard is up again at once.
  useEffect(() => {
    if (!dirty) return;
    window.clearTimeout(passTimer.current);
    passing.current = false;
  }, [dirty]);

  const ask = useCallback((go: () => void, unwind: boolean) => {
    pending.current = { go, unwind };
    setOpen(true);
  }, []);

  const pass = useCallback((go: () => void) => {
    passing.current = true;
    window.clearTimeout(passTimer.current);
    passTimer.current = window.setTimeout(() => {
      passing.current = false;
    }, PASS_MS);
    go();
  }, []);

  const leave = useCallback(() => {
    const waiting = pending.current;
    pending.current = null;
    setOpen(false);
    if (!waiting) return;
    if (!waiting.unwind || !isOurs(window.history.state, entry.current)) {
      pass(waiting.go);
      return;
    }
    // The guard's own entry is on top, and the way out would push the next page on top of it: the history would read page, page, next page, and Back from
    // the next page would land on a copy of the one that was left. Step off the entry first and let the way out go ahead from that popstate.
    passing.current = true;
    window.clearTimeout(passTimer.current);
    let done = false;
    const proceed = () => {
      if (done) return;
      done = true;
      window.clearTimeout(fallback);
      window.removeEventListener("popstate", proceed);
      pass(waiting.go);
    };
    // A router that swallows the event, or a slow one, must not hold up the way out.
    const fallback = window.setTimeout(proceed, STEP_MS);
    window.addEventListener("popstate", proceed);
    window.history.back();
  }, [pass]);

  const stay = useCallback(() => {
    pending.current = null;
    setOpen(false);
    // The changes were saved while the question was open and the person stayed: the entry the guard kept for them is not needed any more.
    if (!passing.current && !dirtyRef.current && isOurs(window.history.state, entry.current)) window.history.back();
  }, []);

  const request = useCallback(
    (go: () => void) => {
      if (!dirtyRef.current || passing.current) go();
      else ask(go, true);
    },
    [ask],
  );

  // The browser's own prompt: closing the tab, reloading, typing another address.
  useEffect(() => {
    if (!dirty || !unload) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (passing.current) return;
      event.preventDefault();
      // Some browsers only show the prompt when a value is set. What the prompt says is the browser's, not ours.
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, unload]);

  // A click on a link, caught before the router sees it.
  useEffect(() => {
    if (!dirty || !links) return;
    function onClick(event: MouseEvent) {
      if (passing.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      // A new tab or window, and a download, do not leave this page.
      if ((anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      let url: URL;
      try {
        url = new URL(anchor.href);
      } catch {
        return;
      }
      // Web addresses, and addresses of the kind this page was opened with (a file, in a desktop app); not mailto:, tel: or javascript:.
      if (url.protocol !== window.location.protocol && url.protocol !== "http:" && url.protocol !== "https:") return;
      // A link to a place on this very page (an anchor) does not leave it.
      const here = window.location;
      if (url.protocol === here.protocol && url.host === here.host && url.pathname === here.pathname && url.search === here.search) return;
      event.preventDefault();
      event.stopPropagation();
      // Chosen to leave, the same link is clicked again with the guard out of the way: the router then does what it always does.
      ask(() => anchor.click(), true);
    }
    // In the capture phase, on the document: before React, and so before any router link, hears the click.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [dirty, links, ask]);

  // The Back button: an extra history entry of our own, so Back lands on this same page and the question can be asked.
  useEffect(() => {
    if (!dirty || !watchHistory) return;
    const token = Math.random().toString(36).slice(2);
    let armed = false;
    const push = () => window.history.pushState({ ...(window.history.state as Record<string, unknown> | null), [MARK]: token }, "", window.location.href);
    // One tick later: React's strict mode runs an effect, undoes it and runs it again, and that must not touch the history twice.
    const timer = window.setTimeout(() => {
      push();
      armed = true;
      entry.current = token;
    }, 0);
    function onPopState(event: PopStateEvent) {
      if (passing.current || !armed) return;
      // Landing on this guard's own entry (going forward to it) is not a way out. An entry that an earlier session left behind is a copy of the page: Back from it leaves.
      if (isOurs(event.state, token)) return;
      // Back went past our entry onto the page's own: put ours back, and ask. Leaving then goes two entries back.
      push();
      ask(() => window.history.go(-2), false);
    }
    window.addEventListener("popstate", onPopState);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("popstate", onPopState);
      // Switched off with our entry still on top (the changes were saved and the person stayed): take it away, so Back is one press again.
      // Not while the question is open: a save that works switches the guard off before it answers, and the leave that follows needs the entry to step off from.
      if (armed && !passing.current && !pending.current && isOurs(window.history.state, token)) window.history.back();
    };
  }, [dirty, watchHistory, ask]);

  const dialogProps = useMemo<LeaveGuardDialogProps>(
    () => ({
      open,
      onOpenChange: (next) => {
        if (!next) stay();
      },
      onLeave: leave,
    }),
    [open, leave, stay],
  );

  return { open, request, leave, stay, dialogProps };
}
