"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps, type CSSProperties, type Ref } from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

/** What tells the highlight that the content changed: the value itself, a version number, a timestamp. */
export type UpdateKey = string | number | boolean | null | undefined;

export interface UpdateHighlightProps extends ComponentProps<"div"> {
  /** Anything that changes when the content does. A new key lights the highlight; the same key does nothing. */
  changeKey: UpdateKey;
  /** How long the fade takes, in ms. Default 1500. */
  duration?: number;
  /** The words of the small marker shown under reduced motion. Default "Updated". When you pass it, the same words are also said politely to screen readers on every change. */
  label?: string;
  /** What a screen reader hears on a change when the marker's words say too little: "Order NW-1043 is now Shipped". Replaces `label` for the announcement only. */
  announce?: string;
  /** Leave the first value alone, so nothing lights up on load. Default true; pass false to mark a row that has just arrived. */
  skipFirst?: boolean;
  /** Always (true) or never (false) use the marker instead of the fade. Leave it out to follow the reader's system setting, or pass your own app's "reduce motion" switch. */
  reduceMotion?: boolean;
  /** Draw the highlight on your own element, such as a table row or a list item, instead of on a div. */
  asChild?: boolean;
  /** A span for a number inside a line of text. The marker then follows the text instead of sitting in the corner. */
  inline?: boolean;
}

type Phase = "idle" | "lit" | "fading" | "marked";

/** How long the marker stays when the fade is off, never shorter than this. */
const MARKER_MS = 3000;

// The tint is a layer over the element and the marker a small tag hung on its top edge (a corner inside would sit on the content of a compact row), both drawn with ::before and ::after, so nothing is added inside it. They exist
// only while a highlight runs: a pseudo-element in a <tr> is wrapped in a table cell of its own by the browser, which would push the whole row sideways.
// The tag inherits the typography of whatever it hangs on, so it sets its own tracking and case: a big number set with tight tracking must not crush a 12px word.
const TINT = "before:pointer-events-none before:absolute before:inset-0 before:z-[1] before:rounded-[inherit] before:bg-foreground/10 before:opacity-0 before:transition-opacity before:duration-[var(--rhs-highlight-duration,1500ms)] before:ease-in-out before:content-none";
const TINT_ON = "data-[highlight]:before:content-[''] data-[highlight=lit]:before:opacity-100 data-[highlight=lit]:before:duration-0";
const TAG = "after:pointer-events-none after:z-[2] after:rounded-sm after:bg-foreground after:px-1.5 after:py-[3px] after:text-xs after:leading-none after:font-medium after:tracking-normal after:whitespace-nowrap after:text-background after:normal-case after:select-none after:content-none data-[highlight=marked]:after:content-[var(--rhs-label)]";
const CORNER = "after:absolute after:top-0 after:right-3 after:-translate-y-1/2";
const FLOW = "after:ml-1.5 after:inline-block after:align-middle";

// The same, drawn on the cells of a table row, which is where a row can show them.
const ROW_TINT =
  "[&>*]:relative [&>*]:isolate [&>*]:before:pointer-events-none [&>*]:before:absolute [&>*]:before:inset-0 [&>*]:before:z-[1] [&>*]:before:bg-foreground/10 [&>*]:before:opacity-0 [&>*]:before:transition-opacity [&>*]:before:duration-[var(--rhs-highlight-duration,1500ms)] [&>*]:before:ease-in-out [&>*]:before:content-none";
const ROW_TINT_ON = "data-[highlight]:[&>*]:before:content-[''] data-[highlight=lit]:[&>*]:before:opacity-100 data-[highlight=lit]:[&>*]:before:duration-0";
const ROW_TAG =
  "[&>*:last-child]:after:pointer-events-none [&>*:last-child]:after:absolute [&>*:last-child]:after:top-0 [&>*:last-child]:after:right-3 [&>*:last-child]:after:-translate-y-1/2 [&>*:last-child]:after:z-[2] [&>*:last-child]:after:rounded-sm [&>*:last-child]:after:bg-foreground [&>*:last-child]:after:px-1.5 [&>*:last-child]:after:py-[3px] [&>*:last-child]:after:text-xs [&>*:last-child]:after:leading-none [&>*:last-child]:after:font-medium [&>*:last-child]:after:tracking-normal [&>*:last-child]:after:whitespace-nowrap [&>*:last-child]:after:text-background [&>*:last-child]:after:normal-case [&>*:last-child]:after:select-none [&>*:last-child]:after:content-none data-[highlight=marked]:[&>*:last-child]:after:content-[var(--rhs-label)]";

// One polite status region for the whole page, made when the first highlight with words mounts, so it is already there when the first message is written.
let statusNode: HTMLElement | null = null;
let waiting: string[] = [];
let sayTimer: number | undefined;

function statusRegion(): HTMLElement {
  if (statusNode?.isConnected) return statusNode;
  const node = document.createElement("div");
  node.setAttribute("role", "status");
  node.setAttribute("aria-live", "polite");
  node.setAttribute("aria-atomic", "true");
  node.setAttribute("data-slot", "update-highlight-status");
  node.className = "sr-only";
  document.body.append(node);
  statusNode = node;
  return node;
}

/** Messages that arrive within a blink are read as one sentence, and an identical one only once. */
function say(message: string) {
  waiting.push(message);
  window.clearTimeout(sayTimer);
  sayTimer = window.setTimeout(() => {
    const text = [...new Set(waiting)].join(". ");
    waiting = [];
    const node = statusRegion();
    node.textContent = "";
    window.setTimeout(() => {
      node.textContent = text;
    }, 60);
    window.setTimeout(() => {
      if (node.textContent === text) node.textContent = "";
    }, 5000);
  }, 150);
}

function setRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) (ref as { current: T | null }).current = node;
}

/**
 * Marks something that just changed, so a reader whose eyes were elsewhere
 * sees where: wrap a table row, a card or a number and hand it a `changeKey`.
 * When the key changes, a tint of the foreground colour lights up and fades
 * over about a second and a half. The first value is never marked, changes that
 * arrive while it is still fading restart the same highlight instead of
 * stacking, and nothing is added inside the element. Under reduced motion there
 * is no fade: a small "Updated" marker shows for a few seconds instead, so the
 * change stays visible. Pass `label` (or `announce`) and a screen reader hears
 * what changed in a polite message, because a highlight means nothing to it.
 * Use `asChild` to put it on a table row. Made for live tables, feeds and
 * dashboards where values change under the reader's eyes.
 */
export function UpdateHighlight({ changeKey, duration = 1500, label, announce, skipFirst = true, reduceMotion, asChild = false, inline = false, className, style, children, ref, ...props }: UpdateHighlightProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [run, setRun] = useState(0);
  const [row, setRow] = useState(false);
  const last = useRef<{ key: UpdateKey; seen: boolean }>({ key: changeKey, seen: false });
  const words = label ?? "Updated";
  const spoken = announce ?? label;

  // A new key starts a highlight. The first value is only remembered, and the same key twice (a re-render, React's strict mode) does nothing.
  useEffect(() => {
    const first = !last.current.seen;
    const changed = !Object.is(last.current.key, changeKey);
    last.current = { key: changeKey, seen: true };
    if (first ? skipFirst : !changed) return;
    const reduced = reduceMotion ?? (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setPhase(reduced ? "marked" : "lit");
    setRun((count) => count + 1);
    if (spoken) say(spoken);
    // Only a new key matters here: the other props are read as they are at that moment.
  }, [changeKey]);

  useEffect(() => {
    if (spoken !== undefined) statusRegion();
  }, [spoken !== undefined]);

  // "lit" is the tint at full strength with no transition. Two frames later it is let go, the transition in the CSS does the fade, and the layers are taken away
  // when it is done. "run" restarts all of it when a change lands while a highlight is already running.
  useEffect(() => {
    if (phase === "lit") {
      let second = 0;
      const first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => setPhase("fading"));
      });
      return () => {
        cancelAnimationFrame(first);
        cancelAnimationFrame(second);
      };
    }
    if (phase === "fading" || phase === "marked") {
      const timer = window.setTimeout(() => setPhase("idle"), phase === "fading" ? duration + 120 : Math.max(MARKER_MS, duration * 2));
      return () => window.clearTimeout(timer);
    }
  }, [phase, run, duration]);

  // A table row is told apart by what it is, not by a prop: its cells carry the tint instead of the row itself.
  const attach = useCallback(
    (node: HTMLElement | null) => {
      if (node) setRow(node.tagName === "TR");
      setRef(ref as Ref<HTMLElement> | undefined, node);
    },
    [ref],
  );

  const shared = {
    "data-slot": "update-highlight",
    "data-highlight": phase === "idle" ? undefined : phase,
    style: { "--rhs-highlight-duration": `${duration}ms`, "--rhs-label": JSON.stringify(words), ...style } as CSSProperties,
  };

  if (asChild) {
    return (
      <Slot.Root {...shared} {...props} ref={attach} className={cn(row ? [ROW_TINT, ROW_TINT_ON, ROW_TAG] : ["relative isolate", TINT, TINT_ON, TAG, inline ? FLOW : CORNER], className)}>
        {children}
      </Slot.Root>
    );
  }
  const classes = cn("relative isolate", TINT, TINT_ON, TAG, inline ? FLOW : CORNER, className);
  return inline ? (
    <span {...shared} {...(props as ComponentProps<"span">)} ref={ref as Ref<HTMLSpanElement> | undefined} className={classes}>
      {children}
    </span>
  ) : (
    <div {...shared} {...props} ref={ref} className={classes}>
      {children}
    </div>
  );
}
