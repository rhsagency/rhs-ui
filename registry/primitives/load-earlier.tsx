"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type RefObject } from "react";

import { IconAlertCircle, IconArrowUp, IconRefresh } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

/** What the list holds: one string for every count, or one string per plural form. */
export type LoadEarlierNoun = string | (Partial<Record<Intl.LDMLPluralRule, string>> & { other: string });

/** The words of the row, for another language or your own wording. */
export interface LoadEarlierLabels {
  /** The button. Default "Load earlier messages". */
  loadEarlier: string;
  /** While older items are coming. Default "Loading earlier messages". */
  loading: string;
  /** When the request failed. Default "Could not load earlier messages". */
  error: string;
  /** The text on the button that tries again. Default "Retry". */
  retry: string;
  /** When nothing older is left. Default "This is the start of the conversation". */
  start: string;
  /** Said once older items have arrived; `{added}`, `{noun}` and `{count}` (how many there are now) are filled in. Default "{added} earlier {noun} loaded, {count} in total". */
  loaded: string;
}

export interface LoadEarlierProps extends Omit<ComponentProps<"div">, "children" | "ref"> {
  /** Whether there is anything older. At false the row says it is the start and stops watching. */
  hasEarlier: boolean;
  /** True while older items are being fetched. Set it as soon as `onLoadEarlier` is called. */
  loading?: boolean;
  /** True when the last request failed, or a string saying why. The row then stops loading by itself until Retry is pressed. */
  error?: boolean | string;
  /** Fetch the older items and put them before the ones you have. Never called twice for the same page. */
  onLoadEarlier: () => void;
  /** Called when Retry is pressed. Default: `onLoadEarlier`. */
  onRetry?: () => void;
  /** Load by itself when the row comes into view at the top. The button stays as the fallback. Default false. */
  auto?: boolean;
  /** The element that scrolls, when the list scrolls inside a box. Default: the nearest ancestor that scrolls, or the page. */
  scrollRef?: RefObject<HTMLElement | null>;
  /** How many pixels before the top of the view the row asks, in `auto` mode. Default 160. */
  threshold?: number;
  /** How many items the list holds now. With it, older items that arrive are announced politely as a count: "12 earlier messages loaded". */
  count?: number;
  /** What the items are, for the announcement. One string, or one per plural form to get the singular right. Default "messages". */
  noun?: LoadEarlierNoun;
  /** The words of the row. */
  labels?: Partial<LoadEarlierLabels>;
  /** The locale the numbers and the plural form follow. Default "en-US". */
  locale?: string;
}

const WORDS: LoadEarlierLabels = {
  loadEarlier: "Load earlier messages",
  loading: "Loading earlier messages",
  error: "Could not load earlier messages",
  retry: "Retry",
  start: "This is the start of the conversation",
  loaded: "{added} earlier {noun} loaded, {count} in total",
};

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (whole, key: string) => values[key] ?? whole);
const nounFor = (noun: LoadEarlierNoun, amount: number, locale: string): string => (typeof noun === "string" ? noun : (noun[new Intl.PluralRules(locale).select(amount)] ?? noun.other));

/** The nearest ancestor that scrolls vertically, or the page. */
function scrollParentOf(node: HTMLElement): HTMLElement {
  for (let element = node.parentElement; element; element = element.parentElement) {
    const overflow = getComputedStyle(element).overflowY;
    if (overflow === "auto" || overflow === "scroll" || overflow === "overlay") return element;
  }
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

/** Whether any of a box is inside what a scroller shows. */
function isInView(box: DOMRect, scroller: HTMLElement): boolean {
  const page = scroller === document.scrollingElement;
  const top = page ? 0 : scroller.getBoundingClientRect().top;
  const bottom = page ? window.innerHeight : top + scroller.clientHeight;
  return box.bottom > top + 1 && box.top < bottom - 1;
}

/** The item the reader is looking at: the first one below the row whose bottom is in view. */
function anchorBelow(row: HTMLElement, scroller: HTMLElement): HTMLElement | null {
  // The things that come after the row. A row inside a wrapper of its own (an li) is followed by what follows the wrapper.
  let unit: HTMLElement = row;
  while (!unit.nextElementSibling && unit.parentElement && unit.parentElement !== scroller && unit.parentElement !== document.body) unit = unit.parentElement;
  let items: HTMLElement[] = [];
  for (let next = unit.nextElementSibling; next; next = next.nextElementSibling) if (next instanceof HTMLElement) items.push(next);
  // One wrapper around the items (a ul, or a div): look at what is in it.
  while (items.length === 1 && items[0] && items[0].children.length > 1) items = Array.from(items[0].children).filter((child): child is HTMLElement => child instanceof HTMLElement);
  const top = scroller === document.scrollingElement ? 0 : scroller.getBoundingClientRect().top;
  return items.find((item) => item.getBoundingClientRect().bottom > top + 1) ?? items[0] ?? null;
}

/**
 * The upward counterpart of Load more, for chats, logs and activity feeds that open at the bottom. Put it first in
 * the scrolling list. It is a button, or with `auto` a trigger that fires when the row scrolls into view, and it
 * calls `onLoadEarlier`; when the older items are added above, it keeps the reader on the message they were looking
 * at, by measuring that message before and after and correcting the scroll position by the difference (so it also
 * works where the browser does not anchor the scroll by itself, and never corrects twice where it does). It shows
 * a spinner row while loading, "Could not load earlier messages" with Retry on failure, and a quiet start of the
 * conversation when nothing is left. What arrived is announced once as a count, never item by item, so keep the
 * list itself out of a live region.
 */
export function LoadEarlier({
  hasEarlier,
  loading = false,
  error = false,
  onLoadEarlier,
  onRetry,
  auto = false,
  scrollRef,
  threshold = 160,
  count,
  noun = "messages",
  labels,
  locale = "en-US",
  className,
  ...props
}: LoadEarlierProps) {
  const words = { ...WORDS, ...labels };
  const row = useRef<HTMLDivElement>(null);
  const action = useRef<HTMLButtonElement>(null);
  const failed = Boolean(error);
  const state = failed ? "error" : loading ? "loading" : hasEarlier ? "idle" : "start";
  const watching = auto && hasEarlier && !loading && !failed;

  const load = useRef(onLoadEarlier);
  useEffect(() => {
    load.current = onLoadEarlier;
  });

  // While older items are on their way, the reader's place is kept: the item they were looking at is measured, and put back where it was.
  const hold = useRef<{ scroller: HTMLElement; anchor: HTMLElement; offset: number; gap: number } | null>(null);
  const ends = useRef<{ stop: () => void; timer: number } | null>(null);
  const stopHolding = () => {
    ends.current?.stop();
    window.clearTimeout(ends.current?.timer);
    ends.current = null;
    hold.current = null;
  };
  /** Where the item the reader is on sits now, and how far below the row it is. */
  const measure = (kept: NonNullable<typeof hold.current>) => {
    const top = kept.anchor.getBoundingClientRect().top;
    const box = row.current?.getBoundingClientRect();
    return { top, gap: box ? top - box.bottom : 0, rowInView: box ? isInView(box, kept.scroller) : false };
  };
  /**
   * Puts the item the reader was on back where it was, if the list moved it. A browser that anchors the scroll already
   * did: then there is nothing to add. While the row itself is in view, a change in its own height (an error and a
   * Retry button taking more room than a spinner) is for the reader to see: only what was added between the row and
   * their item is made up.
   */
  const restore = () => {
    const kept = hold.current;
    if (!kept) return;
    if (!kept.anchor.isConnected) return stopHolding();
    const now = measure(kept);
    const delta = now.rowInView ? now.gap - kept.gap : now.top - kept.offset;
    if (Math.abs(delta) >= 0.5) kept.scroller.scrollTo({ top: kept.scroller.scrollTop + delta, behavior: "instant" as ScrollBehavior });
    // Whatever is left is the new place to keep.
    const settled = measure(kept);
    kept.offset = settled.top;
    kept.gap = settled.gap;
  };
  const capture = () => {
    const element = row.current;
    if (!element) return;
    stopHolding();
    const scroller = scrollRef?.current ?? scrollParentOf(element);
    const anchor = anchorBelow(element, scroller);
    if (!anchor) return;
    const kept = { scroller, anchor, offset: 0, gap: 0 };
    hold.current = kept;
    const start = measure(kept);
    kept.offset = start.top;
    kept.gap = start.gap;
    // The reader may scroll while it loads: wherever they are is the place to keep.
    const target: Window | HTMLElement = scroller === document.scrollingElement ? window : scroller;
    const remember = () => {
      if (hold.current !== kept) return;
      const now = measure(kept);
      kept.offset = now.top;
      kept.gap = now.gap;
    };
    target.addEventListener("scroll", remember, { passive: true });
    // Images and fonts in the new items change their height after they arrive.
    const observer = new ResizeObserver(restore);
    [anchor.parentElement, element.parentElement, ...Array.from(scroller.children)].forEach((node) => node && observer.observe(node));
    ends.current = {
      stop: () => {
        target.removeEventListener("scroll", remember);
        observer.disconnect();
      },
      timer: 0,
    };
  };

  // After every render: the older items have been added by now if they are going to be, and nothing has been painted yet.
  useLayoutEffect(() => {
    restore();
    const current = ends.current;
    if (!current) return;
    // The place is kept while the request runs and, once, for a moment after the items land.
    if (loading) {
      window.clearTimeout(current.timer);
      current.timer = 0;
    } else if (!current.timer) {
      current.timer = window.setTimeout(stopHolding, 1200);
    }
  });
  useEffect(() => stopHolding, []);

  /** The button gives way to the spinner, and a button that goes takes keyboard focus with it: the row holds it meanwhile. */
  const holdFocus = () => {
    const element = row.current;
    const held = document.activeElement;
    if (element && held && held !== element && element.contains(held)) element.focus({ preventScroll: true });
  };
  const armed = useRef(true);
  const asked = useRef<{ from: number | undefined } | null>(null);
  const ask = (again = false) => {
    armed.current = false;
    holdFocus();
    capture();
    asked.current = { from: count };
    if (again && onRetry) onRetry();
    else load.current();
  };
  // When the request has ended, focus held by the row goes to the button that is there now. The button is above the view by then, so nothing scrolls.
  useEffect(() => {
    if ((state === "idle" || state === "error") && row.current && document.activeElement === row.current) action.current?.focus({ preventScroll: true });
  }, [state]);

  const wasLoading = useRef(loading);
  useEffect(() => {
    if (wasLoading.current && !loading) armed.current = true;
    wasLoading.current = loading;
  }, [loading]);
  useEffect(() => {
    armed.current = true;
  }, [hasEarlier]);

  // In auto mode the row asks when it comes within `threshold` of the top of the view. A new observer reports where the row is at once, so a page that leaves the row in view is followed by the next.
  useEffect(() => {
    const element = row.current;
    if (!element || !watching || typeof IntersectionObserver === "undefined") return;
    const scroller = scrollRef?.current ?? scrollParentOf(element);
    const observer = new IntersectionObserver(
      (entries) => {
        const latest = entries[entries.length - 1];
        if (!latest) return;
        if (!latest.isIntersecting) {
          armed.current = true;
          return;
        }
        if (armed.current) ask();
      },
      { root: scroller === document.scrollingElement ? null : scroller, rootMargin: `${threshold}px 0px 0px 0px` },
    );
    observer.observe(element);
    return () => observer.disconnect();
    // `ask` reads refs and the latest callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watching, threshold, scrollRef]);

  // What the older items added is said once, as a count, when the request has landed.
  const [said, setSaid] = useState("");
  useEffect(() => {
    const run = asked.current;
    if (!run || loading) return;
    if (failed) {
      asked.current = null;
      return;
    }
    if (count !== undefined && run.from !== undefined && count > run.from) {
      asked.current = null;
      const added = count - run.from;
      const numbers = new Intl.NumberFormat(locale);
      setSaid(fill(words.loaded, { added: numbers.format(added), noun: nounFor(noun, added, locale), count: numbers.format(count) }));
    }
    // The words are read from the render that changed the count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, loading, failed]);
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 6000);
    return () => window.clearTimeout(timer);
  }, [said]);

  return (
    <div
      ref={row}
      data-slot="load-earlier"
      data-state={state}
      aria-busy={loading || undefined}
      // Never in the tab order: only a place for focus to rest while a button is gone.
      tabIndex={-1}
      className={cn("flex min-h-16 flex-col items-center justify-center gap-3 px-4 py-4 text-center text-sm outline-none", className)}
      {...props}
    >
      {state === "idle" ? (
        <Button ref={action} type="button" variant="outline" size="sm" onClick={() => ask()}>
          <IconArrowUp />
          {words.loadEarlier}
        </Button>
      ) : null}
      {state === "loading" ? (
        <p className="flex items-center gap-2.5 text-muted-foreground">
          <Spinner size={16} label="" aria-hidden="true" role="presentation" className="text-foreground" />
          {words.loading}
        </p>
      ) : null}
      {state === "error" ? (
        <div className="flex flex-col items-center gap-3">
          <p role="alert" className="flex items-start gap-2 text-left">
            <IconAlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-destructive" />
            <span className="[overflow-wrap:anywhere]">
              <span className="font-medium">{words.error}.</span>
              {typeof error === "string" ? <span className="text-muted-foreground"> {error}</span> : null}
            </span>
          </p>
          <Button ref={action} type="button" variant="outline" size="sm" onClick={() => ask(true)}>
            <IconRefresh />
            {words.retry}
          </Button>
        </div>
      ) : null}
      {state === "start" ? (
        <div className="flex w-full items-center gap-3 text-xs text-muted-foreground">
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
          <p>{words.start}</p>
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
        </div>
      ) : null}
      {/* Inside the row, so it is never taken for an item the reader could be on. It speaks after the request has ended, when the row is no longer busy. */}
      <span role="status" className="sr-only">
        {said}
      </span>
    </div>
  );
}
