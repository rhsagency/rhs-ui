"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import { IconRefresh } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** The words the bar uses, for translation. `{app}` and `{version}` are filled in. */
export interface UpdateAvailableBarLabels {
  /** The sentence when you pass `appName`. Default "A new version of {app} is ready". */
  message?: string;
  /** The sentence without it. Default "A new version is ready". */
  messageGeneric?: string;
  /** The version after the sentence, when you pass `version`. Default "v{version}". */
  version?: string;
  /** The link to the release notes, when you pass `changesHref`. Default "What changed". */
  changes?: string;
  /** The main button. Default "Reload now". */
  reload?: string;
  /** The same button while the page restarts. Default "Reloading". */
  reloading?: string;
  /** The quiet button. Default "Later". */
  later?: string;
}

export interface UpdateAvailableBarProps extends Omit<ComponentProps<"div">, "children"> {
  /** Reloads into the new version. Wire it to your service worker's skipWaiting message and let the page reload when the new worker takes over, or to a plain `location.reload()`. Leave it out and Reload now calls `location.reload()`. It may return a promise; the button shows a spinner while the page restarts, and returns if it settles without one. */
  onReload?: () => void | Promise<void>;
  /** Called when Later was pressed, after the bar has been hidden and the snooze remembered. */
  onLater?: () => void;
  /** The version that is ready: "2.4.0". It is written after the sentence, and a snooze is remembered per version, so a newer one asks again at once. */
  version?: string;
  /** Where the release notes are. Adds a quiet "What changed" link after the sentence. */
  changesHref?: string;
  /** The product's name for the sentence: "A new version of Acme is ready". */
  appName?: string;
  /** How long Later hides the bar, in minutes. Default 60. It is kept in sessionStorage, so it survives navigations and reloads of the tab, and the bar comes back when the time is up. */
  snoozeMinutes?: number;
  /** "top" puts the bar in the flow of the page, above everything, where it pushes the page down instead of covering the header and scrolls away with the page (add `sticky` to keep it in view). "bottom" fixes it to the bottom edge of the viewport, over the page, with room for the home indicator (pass `className="absolute"` to place it inside a box of your own). Default "top". */
  position?: "top" | "bottom";
  /** Keeps a top bar in view while the page scrolls. It then writes its height, as it grows in and out, to `--update-bar-height` on the element it sits in, so a sticky header can hang under it with `className="sticky top-[var(--update-bar-height,0px)]"` instead of being covered. The bar sticks inside its parent: put it in the element that holds the page. The bottom bar is fixed already and ignores this. Default false. */
  sticky?: boolean;
  /** The sessionStorage key for the snooze. Default one per version. */
  storageKey?: string;
  /** The words the bar uses, for translation. */
  labels?: UpdateAvailableBarLabels;
}

const DEFAULT_LABELS = {
  message: "A new version of {app} is ready",
  messageGeneric: "A new version is ready",
  version: "v{version}",
  changes: "What changed",
  reload: "Reload now",
  reloading: "Reloading",
  later: "Later",
} satisfies Required<UpdateAvailableBarLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** How long the bar takes to leave, in ms: the length of its transition. */
const LEAVE_MS = 220;

/** The longest a timer can wait: setTimeout turns anything larger into an instant call. */
const MAX_TIMER = 2_147_000_000;

/** A reload that has not restarted the page by now is taken as a failure, and the button comes back. */
const GIVE_UP_MS = 10_000;

function readSnooze(key: string): number {
  try {
    return Number(window.sessionStorage.getItem(key)) || 0;
  } catch {
    // Storage can be blocked: the bar then shows every time, which is the safe way to be wrong.
    return 0;
  }
}

function writeSnooze(key: string, until: number): void {
  try {
    window.sessionStorage.setItem(key, String(until));
  } catch {
    // Nothing to remember it with: the bar comes back on the next page.
  }
}

/**
 * A slim bar that says a new version is ready: a refresh icon, one sentence
 * ("A new version of Acme is ready"), the version, an optional link to what
 * changed, a quiet Later and a Reload now. Later hides it and remembers the
 * snooze in sessionStorage, so it returns after the interval and not on every
 * navigation; Reload shows a busy state while the page restarts. It is
 * announced once through a status region and never takes focus. At the top it
 * sits in the flow of the page and grows in, so it pushes the page down instead
 * of covering the header, and it scrolls away with the page unless you pass
 * `sticky`, which also hands its height to a sticky header through
 * `--update-bar-height`; at the bottom it is fixed to the viewport, slides in
 * and clears the home indicator on a phone through the safe-area inset. Under
 * reduced motion it simply appears.
 */
export function UpdateAvailableBar({ onReload, onLater, version, changesHref, appName, snoozeMinutes = 60, position = "top", sticky = false, storageKey, labels, className, ...props }: UpdateAvailableBarProps) {
  const text: Required<UpdateAvailableBarLabels> = { ...DEFAULT_LABELS, ...labels };
  const key = storageKey ?? `rhs-ui-update-snooze:${version ?? "latest"}`;
  // Hidden on the server and before the snooze is read, so a visitor who snoozed the bar never sees it flash.
  const [phase, setPhase] = useState<"hidden" | "open" | "leaving">("hidden");
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState("");
  const timers = useRef<{ leave?: ReturnType<typeof setTimeout>; wake?: ReturnType<typeof setTimeout>; giveUp?: ReturnType<typeof setTimeout> }>({});

  // Shows the bar unless a snooze still runs, and wakes it when the snooze ends.
  useEffect(() => {
    const wake = () => {
      const wait = readSnooze(key) - Date.now();
      if (wait <= 0) {
        setPhase("open");
      } else {
        setPhase("hidden");
        timers.current.wake = setTimeout(wake, Math.min(wait, MAX_TIMER));
      }
    };
    wake();
    const current = timers.current;
    return () => {
      clearTimeout(current.wake);
      clearTimeout(current.leave);
      clearTimeout(current.giveUp);
    };
  }, [key]);

  const sentence = appName ? fill(text.message, { app: appName }) : text.messageGeneric;

  // Said once, a moment after the bar is in the page: a status region that appears with its text is not always read.
  useEffect(() => {
    if (phase !== "open") {
      setSaid("");
      return;
    }
    const timer = setTimeout(() => setSaid(sentence), 150);
    return () => clearTimeout(timer);
  }, [phase, sentence]);

  function later() {
    const until = Date.now() + Math.max(0, snoozeMinutes) * 60_000;
    writeSnooze(key, until);
    setPhase("leaving");
    clearTimeout(timers.current.leave);
    timers.current.leave = setTimeout(() => setPhase("hidden"), LEAVE_MS);
    clearTimeout(timers.current.wake);
    timers.current.wake = setTimeout(() => setPhase("open"), Math.min(until - Date.now(), MAX_TIMER));
    onLater?.();
  }

  async function reload() {
    setBusy(true);
    clearTimeout(timers.current.giveUp);
    try {
      if (!onReload) {
        window.location.reload();
        return;
      }
      const result = onReload();
      if (result instanceof Promise) {
        await result;
        setBusy(false);
      } else {
        // A plain call has no end to wait for: the page restarts, or it does not and the button comes back.
        timers.current.giveUp = setTimeout(() => setBusy(false), GIVE_UP_MS);
      }
    } catch {
      setBusy(false);
    }
  }

  const top = position === "top";
  const open = phase === "open";

  // A sticky top bar says how tall it is on the element it sits in, as it grows in and out, so a sticky header can hang under it: top-[var(--update-bar-height,0px)].
  const grow = useRef<HTMLDivElement>(null);
  const pinned = top && sticky && phase !== "hidden";
  useEffect(() => {
    if (!pinned) return;
    const box = grow.current?.parentElement;
    const host = box?.parentElement;
    if (!box || !host) return;
    const measure = () => host.style.setProperty("--update-bar-height", `${box.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => {
      observer.disconnect();
      host.style.removeProperty("--update-bar-height");
    };
  }, [pinned]);

  // The bar itself, the same at either edge. At the top it has a hairline under it, at the bottom a hairline over it and room for the home indicator.
  const bar = (
    <div className={cn("border-border bg-card text-card-foreground", top ? "border-b" : "border-t pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-sm")}>
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 flex-1 basis-64 items-center gap-3">
          <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-muted">
            <IconRefresh className="size-4" />
          </span>
          {/* The sentence, the version and the link are one run: when they wrap, each part starts at the left edge of the text, not a margin to the right of it. */}
          <p className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-sm leading-5">
            <span className="font-medium">{sentence}</span>
            {version ? <span className="font-mono text-xs text-muted-foreground tabular-nums">{fill(text.version, { version })}</span> : null}
            {changesHref ? (
              <a href={changesHref} className="rounded-sm text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
                {text.changes}
              </a>
            ) : null}
          </p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={later} className="text-muted-foreground hover:text-foreground">
            {text.later}
          </Button>
          <Button type="button" size="sm" loading={busy} onClick={() => void reload()}>
            {busy ? text.reloading : text.reload}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <p role="status" className="sr-only">
        {said}
      </p>
      {phase === "hidden" ? null : top ? (
        // In the flow of the page, so it pushes the page down instead of covering the header, and scrolls away with it unless it is sticky. It opens and closes by growing from nothing.
        <div
          data-slot="update-available-bar"
          data-position="top"
          data-state={open ? "open" : "closed"}
          className={cn(
            "relative grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
            sticky && "sticky top-0 z-50",
            open ? "grid-rows-[1fr] opacity-100 starting:grid-rows-[0fr] starting:opacity-0" : "pointer-events-none grid-rows-[0fr] opacity-0",
            className,
          )}
          {...props}
        >
          <div ref={grow} className="min-h-0 overflow-hidden">
            {bar}
          </div>
        </div>
      ) : (
        // Fixed to the bottom edge of the viewport, over the page. It slides in from below.
        <div
          data-slot="update-available-bar"
          data-position="bottom"
          data-state={open ? "open" : "closed"}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 transition-[translate,opacity] duration-200 ease-out motion-reduce:transition-none",
            open ? "translate-y-0 opacity-100 starting:translate-y-full starting:opacity-0" : "pointer-events-none translate-y-full opacity-0",
            className,
          )}
          {...props}
        >
          {bar}
        </div>
      )}
    </>
  );
}
