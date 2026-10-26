"use client";

import { useEffect, useRef, useState, type ComponentProps, type RefObject } from "react";

import { IconAlertCircle, IconCheck, IconRefresh } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

/** What the list holds: one string for every count, or one string per plural form. */
export type InfiniteScrollNoun = string | (Partial<Record<Intl.LDMLPluralRule, string>> & { other: string });

/** The words of the footer, for another language or your own wording. */
export interface InfiniteScrollLabels {
  /** The button that stays as the fallback. Default "Load more". */
  loadMore: string;
  /** While a page is coming. Default "Loading more". */
  loading: string;
  /** When it failed. Default "Could not load more". */
  error: string;
  /** The text on the button that tries again. Default "Retry". */
  retry: string;
  /** When there is nothing left. Default "You have seen everything". */
  end: string;
  /** Said once a page has arrived. {added} is how many came, {noun} what they are, {count} how many there are now. Default "{added} more {noun} loaded, {count} in total". */
  loaded: string;
  /** The count under the button, when both `count` and `total` are known. Default "{count} of {total} {noun}". */
  progress: string;
  /** The count under the button, when only `count` is known. Default "{count} {noun}". */
  counted: string;
}

export interface InfiniteScrollStatusProps extends Omit<ComponentProps<"div">, "children" | "ref"> {
  /** Whether there is another page. At false the footer says it is the end and stops watching. */
  hasMore: boolean;
  /** True while a page is being fetched. Set it as soon as onLoadMore is called: that is what lets the footer ask again when the new page still leaves it in view. */
  loading?: boolean;
  /** True when the last request failed, or a string saying why. The footer stops loading by itself until Retry is pressed. */
  error?: boolean | string;
  /** Fetch the next page. It is called when the footer comes near the viewport, and when the button is pressed, and never twice for the same page. */
  onLoadMore: () => void;
  /** Called when Retry is pressed. Default: onLoadMore. */
  onRetry?: () => void;
  /** How far before the viewport edge the next page is asked for. Default "400px 0px". */
  rootMargin?: string;
  /** The element that scrolls, when the list scrolls inside a box and not on the page. rootMargin then applies to that box. */
  root?: RefObject<Element | null>;
  /** How many items the list holds now. With it, each page that arrives is announced politely: "20 more posts loaded". */
  count?: number;
  /** How many items there are in all, if you know. Shown with the count. */
  total?: number;
  /** What the items are, for the announcement and the count: "posts". Pass one string per plural form to get the singular right. Default "items". */
  noun?: InfiniteScrollNoun;
  /** The words of the footer. */
  labels?: Partial<InfiniteScrollLabels>;
  /** The locale the numbers and the plural form follow. Default "en-US". */
  locale?: string;
}

const LABELS: InfiniteScrollLabels = {
  loadMore: "Load more",
  loading: "Loading more",
  error: "Could not load more",
  retry: "Retry",
  end: "You have seen everything",
  loaded: "{added} more {noun} loaded, {count} in total",
  progress: "{count} of {total} {noun}",
  counted: "{count} {noun}",
};

/** Replaces {slots} in a template with text. */
function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => values[key] ?? whole);
}

/** The noun in the right plural form for a count. */
function nounFor(noun: InfiniteScrollNoun, amount: number, locale: string): string {
  if (typeof noun === "string") return noun;
  return noun[new Intl.PluralRules(locale).select(amount)] ?? noun.other;
}

/**
 * The footer of an auto-loading list. It watches itself with an
 * IntersectionObserver and calls `onLoadMore` when it nears the viewport, then
 * shows a spinner while the page comes, "Could not load more" with Retry when it
 * fails (and stops loading by itself until Retry is pressed), and "You have seen
 * everything" at the end. A visible Load more button stays as the fallback for
 * keyboard users and for browsers without IntersectionObserver; pressing it, or
 * Retry, hands keyboard focus to the footer while the page comes and back to the
 * button after, so nobody loses their place. It never asks twice for the same
 * page, and the pages that arrive are announced politely when you tell it how
 * many items the list holds. Place it right after the last item.
 */
export function InfiniteScrollStatus({
  hasMore,
  loading = false,
  error = false,
  onLoadMore,
  onRetry,
  rootMargin = "400px 0px",
  root,
  count,
  total,
  noun = "items",
  labels,
  locale = "en-US",
  className,
  ...props
}: InfiniteScrollStatusProps) {
  const words = { ...LABELS, ...labels };
  const node = useRef<HTMLDivElement>(null);
  const action = useRef<HTMLButtonElement>(null);
  const failed = Boolean(error);
  const watching = hasMore && !loading && !failed;
  const state = failed ? "error" : loading ? "loading" : hasMore ? "idle" : "end";

  // One page, one request: the footer is armed again only when a page has landed or the footer has left the view.
  const armed = useRef(true);
  const load = useRef(onLoadMore);
  useEffect(() => {
    load.current = onLoadMore;
  });
  /** Load more and Retry give way to the spinner, and a button that goes takes keyboard focus with it: the footer holds it meanwhile. */
  const holdFocus = () => {
    const footer = node.current;
    const held = document.activeElement;
    if (footer && held && held !== footer && footer.contains(held)) footer.focus({ preventScroll: true });
  };
  const ask = () => {
    armed.current = false;
    holdFocus();
    load.current();
  };
  const retry = () => {
    armed.current = false;
    holdFocus();
    (onRetry ?? load.current)();
  };
  // When the page has come, or has failed, focus held by the footer goes to the button that is there now. At the end there is none, and it stays.
  useEffect(() => {
    if ((state === "idle" || state === "error") && node.current && document.activeElement === node.current) action.current?.focus({ preventScroll: true });
  }, [state]);

  const wasLoading = useRef(loading);
  useEffect(() => {
    if (wasLoading.current && !loading) armed.current = true;
    wasLoading.current = loading;
  }, [loading]);
  useEffect(() => {
    armed.current = true;
  }, [hasMore]);

  // A new observer reports the current state at once, so a page that still leaves the footer in view is followed by the next.
  useEffect(() => {
    const target = node.current;
    if (!target || !watching || typeof IntersectionObserver === "undefined") return;
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
      { root: root?.current ?? null, rootMargin },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [watching, rootMargin, root]);

  // What a page added is said once it has landed, and so is the end.
  const began = useRef<{ from: number | undefined } | null>(null);
  const [said, setSaid] = useState("");
  useEffect(() => {
    // This runs only when `loading` changes: going true starts a page, going false is that page landing.
    if (loading) {
      began.current ??= { from: count };
      return;
    }
    const run = began.current;
    began.current = null;
    if (!run || failed) return;
    const parts: string[] = [];
    if (count !== undefined && run.from !== undefined && count > run.from) {
      const added = count - run.from;
      parts.push(fill(words.loaded, { added: new Intl.NumberFormat(locale).format(added), noun: nounFor(noun, added, locale), count: new Intl.NumberFormat(locale).format(count) }));
    }
    if (!hasMore) parts.push(words.end);
    if (parts.length) setSaid(parts.join(". "));
  }, [loading]);
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 6000);
    return () => window.clearTimeout(timer);
  }, [said]);

  const tally =
    count === undefined
      ? null
      : total === undefined
        ? fill(words.counted, { count: new Intl.NumberFormat(locale).format(count), noun: nounFor(noun, count, locale) })
        : fill(words.progress, { count: new Intl.NumberFormat(locale).format(count), total: new Intl.NumberFormat(locale).format(total), noun: nounFor(noun, total, locale) });

  return (
    <>
      <div
        ref={node}
        data-slot="infinite-scroll-status"
        data-state={state}
        aria-busy={loading || undefined}
        // Never in the tab order: only a place for focus to rest while a button is gone.
        tabIndex={-1}
        className={cn("flex min-h-24 flex-col items-center justify-center gap-3 px-4 py-6 text-center text-sm outline-none", className)}
        {...props}
      >
        {state === "idle" ? (
          <>
            {tally ? <p className="text-xs text-muted-foreground tabular-nums">{tally}</p> : null}
            <Button ref={action} type="button" variant="outline" size="sm" onClick={ask}>
              {words.loadMore}
            </Button>
          </>
        ) : null}
        {state === "loading" ? (
          <p className="flex items-center gap-2.5 text-muted-foreground motion-safe:animate-rhs-fade-in">
            <Spinner size={16} label="" aria-hidden="true" role="presentation" className="text-foreground" />
            {words.loading}
          </p>
        ) : null}
        {state === "error" ? (
          <div className="flex flex-col items-center gap-3 motion-safe:animate-rhs-fade-in">
            <p role="alert" className="flex items-start gap-2 text-left">
              <IconAlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-destructive" />
              <span className="[overflow-wrap:anywhere]">
                <span className="font-medium">{words.error}.</span>
                {typeof error === "string" ? <span className="text-muted-foreground"> {error}</span> : null}
              </span>
            </p>
            <Button ref={action} type="button" variant="outline" size="sm" onClick={retry}>
              <IconRefresh />
              {words.retry}
            </Button>
          </div>
        ) : null}
        {state === "end" ? (
          <div className="grid w-full justify-items-center gap-1 motion-safe:animate-rhs-fade-in">
            <div className="flex w-full items-center gap-3 text-muted-foreground">
              <span aria-hidden="true" className="h-px flex-1 bg-border" />
              <p className="flex items-center gap-2">
                <IconCheck size={14} strokeWidth={2.5} aria-hidden="true" />
                {words.end}
              </p>
              <span aria-hidden="true" className="h-px flex-1 bg-border" />
            </div>
            {tally ? <p className="text-xs text-muted-foreground tabular-nums">{tally}</p> : null}
          </div>
        ) : null}
      </div>
      {/* Outside the busy region: a live region inside aria-busy is held back by some screen readers until the region is no longer busy. */}
      <span role="status" className="sr-only">
        {said}
      </span>
    </>
  );
}
