"use client";

import { useEffect, useRef, useState, type ComponentProps, type RefObject } from "react";

import {
  DEFAULT_LABELS,
  DEFAULT_PREFIX,
  destinationFor,
  fill,
  insideDialog,
  isTyping,
  type GoToDestination,
  type GoToShortcutsLabels,
} from "@rhs-ui/application/go-to-shortcuts/shortcuts";
import { Kbd } from "@rhs-ui/primitives/kbd";
import { cn } from "@/lib/utils";

export type { GoToDestination, GoToShortcutsLabels } from "@rhs-ui/application/go-to-shortcuts/shortcuts";

export interface GoToHintProps extends Omit<ComponentProps<"div">, "children"> {
  /** The places a letter goes. */
  destinations: readonly GoToDestination[];
  /** The key that starts a go-to. Default "g". */
  prefix?: string;
  /** Whether the panel is up. It fades between the two. Default "open". */
  state?: "open" | "closed";
  /** How long the panel waits for a letter, in ms: a thin bar along its foot runs down over that time. Leave it out for a panel that stays as it is. */
  countdown?: number;
  /** The words the panel says, for translation. */
  labels?: GoToShortcutsLabels;
}

/**
 * The panel that lists where each letter goes: the prefix as a keycap, a row
 * for every destination and the way out. GoToShortcuts shows it when the prefix
 * is pressed; it can also be drawn on its own, in a help page or a changelog,
 * to teach the keys.
 */
export function GoToHint({ destinations, prefix = DEFAULT_PREFIX, state = "open", countdown, labels, className, ...props }: GoToHintProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  // The countdown starts from full the moment the panel opens, so the bar needs one frame at full before it runs down.
  const [run, setRun] = useState(false);
  useEffect(() => {
    if (countdown === undefined || state !== "open") return setRun(false);
    const frame = requestAnimationFrame(() => setRun(true));
    return () => cancelAnimationFrame(frame);
  }, [countdown, state]);
  return (
    <div
      data-slot="go-to-shortcuts-hint"
      data-state={state}
      className={cn(
        "pointer-events-none w-max max-w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md",
        "transition-[opacity,translate] duration-150 ease-out data-[state=closed]:translate-y-1 data-[state=closed]:opacity-0 motion-reduce:transition-none motion-reduce:data-[state=closed]:translate-y-0",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-6 border-b border-border px-3 py-2">
        <p className="flex items-center gap-2 text-xs font-medium">
          {words.title}
          <Kbd>{prefix.toUpperCase()}</Kbd>
        </p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Kbd>Esc</Kbd>
          {words.cancel}
        </p>
      </div>
      <ul className={cn("grid gap-x-6 gap-y-1 px-3 py-2.5", destinations.length > 6 && "grid-cols-2")}>
        {destinations.map((destination) => (
          <li key={destination.key} className="flex min-w-0 items-center gap-2.5 text-sm">
            <Kbd className="shrink-0">{destination.key.toUpperCase()}</Kbd>
            <span className="truncate">{destination.label}</span>
          </li>
        ))}
      </ul>
      {countdown !== undefined ? (
        <div aria-hidden="true" className="h-0.5 bg-muted motion-reduce:hidden">
          <div
            className="h-full origin-left bg-foreground/50 ease-linear"
            style={{ transform: run ? "scaleX(0)" : "scaleX(1)", transition: run ? `transform ${countdown}ms linear` : "none" }}
          />
        </div>
      ) : null}
    </div>
  );
}

export interface GoToShortcutsProps extends Omit<ComponentProps<"div">, "children"> {
  /** The places the keys go. */
  destinations: readonly GoToDestination[];
  /** The key that starts a go-to. Default "g". */
  prefix?: string;
  /** How long the letter has, in ms, after the prefix. Default 1500. */
  timeout?: number;
  /** Turns the shortcuts off, for a page where the keys mean something else. Default true. */
  enabled?: boolean;
  /** Listen only to presses that come from inside this element, for a region of an app. Leave it out to listen to the whole page. */
  scope?: RefObject<HTMLElement | null>;
  /** The words the shortcuts say, for translation. */
  labels?: GoToShortcutsLabels;
}

/**
 * Two-key navigation for people who live in the keyboard: press G, then a
 * letter, to go to the inbox, the dashboard, the settings. After the prefix a
 * small panel appears at the bottom left and lists where each letter goes, so
 * the first press teaches the shortcuts; the next key runs the destination, and
 * Escape, any other key, a click or the timeout puts the panel away. Presses
 * inside text fields and with Ctrl, Cmd or Alt are ignored, a held key does not
 * repeat the prefix, and a screen reader hears "Go to: press a letter" politely.
 * The panel is `fixed`; put it elsewhere through `className`. Spread
 * `goToShortcut("i")` (from the item's shortcuts file) on a link you draw
 * yourself and it carries `aria-keyshortcuts`.
 */
export function GoToShortcuts({ destinations, prefix = DEFAULT_PREFIX, timeout = 1500, enabled = true, scope, labels, className, ...props }: GoToShortcutsProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const [armed, setArmed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const [message, setMessage] = useState("");
  // The latest list and words, without putting the key listener back every time a parent renders.
  const latest = useRef({ destinations, words });
  useEffect(() => {
    latest.current = { destinations, words };
  });

  useEffect(() => {
    if (!enabled) return;
    const source: HTMLElement | Document = scope?.current ?? document;
    const start = prefix.toLowerCase();
    let waiting = false;
    let timer: number | undefined;
    const stop = (note = "") => {
      waiting = false;
      window.clearTimeout(timer);
      setArmed(false);
      setMessage(note);
    };
    const onKeyDown = (raw: Event) => {
      const event = raw as KeyboardEvent;
      if (event.defaultPrevented || event.isComposing) return;
      if (waiting) {
        if (["Shift", "Control", "Alt", "Meta"].includes(event.key)) return;
        if (event.repeat) return;
        const hit = !event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1 ? destinationFor(latest.current.destinations, event.key) : undefined;
        if (!hit) {
          // Escape, or any other key: the go-to is off, and the key does what it would have done.
          stop();
          return;
        }
        event.preventDefault();
        stop(fill(latest.current.words.going, { label: hit.label }));
        if (hit.onGo) hit.onGo();
        else if (hit.href !== undefined) window.location.assign(hit.href);
        return;
      }
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.key.toLowerCase() !== start) return;
      if (isTyping(event.target) || insideDialog(event.target)) return;
      waiting = true;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => stop(), timeout);
      setArmed(true);
      setMessage(latest.current.words.armed);
    };
    const cancel = () => {
      if (waiting) stop();
    };
    source.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", cancel);
    return () => {
      source.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", cancel);
      window.clearTimeout(timer);
      setArmed(false);
    };
  }, [enabled, prefix, timeout, scope]);

  // The panel goes in the page, then fades in on the next frame; it fades out and only then goes.
  useEffect(() => {
    if (armed) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }
    setShown(false);
    const gone = window.setTimeout(() => setMounted(false), 170);
    return () => window.clearTimeout(gone);
  }, [armed]);

  return (
    <div data-slot="go-to-shortcuts" data-armed={armed || undefined} className={cn("pointer-events-none fixed bottom-4 left-4 z-50", className)} {...props}>
      {/* Kept in the page when empty: a live region that appears together with its message is often never read. */}
      <p role="status" aria-live="polite" className="sr-only">
        {message}
      </p>
      {mounted ? <GoToHint destinations={destinations} prefix={prefix} state={shown ? "open" : "closed"} countdown={timeout} labels={labels} /> : null}
    </div>
  );
}
