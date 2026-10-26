"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { EmptyState } from "@rhs-ui/application/empty-state";
import { IconAlertCircle, IconInbox, IconRefresh } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Progress } from "@rhs-ui/primitives/progress";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { cn } from "@/lib/utils";

/** Where the data is, as the data library you use reports it. */
export type AsyncStatus = "loading" | "error" | "empty" | "ready";

/** What a screen reader hears for each change. */
export interface AsyncViewLabels {
  /** The skeleton came up. Default "Loading". */
  loading: string;
  /** A refresh started behind content that stays. Default "Refreshing". */
  refreshing: string;
  /** Content arrived. Default "Loaded". */
  ready: string;
  /** There is nothing to show. Default "Nothing to show". */
  empty: string;
  /** The request failed. Default "Could not load". */
  error: string;
}

export interface AsyncViewProps extends Omit<ComponentProps<"div">, "children"> {
  /** `loading` until the first data is in, `error` when it failed, `empty` when it came back with nothing, `ready` when there is something to show. */
  status: AsyncStatus;
  /** A request is running. While the status is `ready` or `empty` this is a background refresh: the content stays and a thin bar runs along the top. While it is `error` it puts the Retry button to work. */
  isFetching?: boolean;
  /** What to show while loading, once `loadingDelay` has passed. Default: three rows of grey blocks. */
  skeleton?: ReactNode;
  /** Replaces the whole default error panel. */
  error?: ReactNode;
  /** The title of the default error panel. */
  errorTitle?: string;
  /** The sentence under it: what happened and what to do. */
  errorMessage?: ReactNode;
  /** Adds a Retry button to the default error panel. */
  onRetry?: () => void;
  /** The text on that button. Default "Retry". */
  retryLabel?: string;
  /** What to show when there is nothing. Default: a quiet empty state. */
  empty?: ReactNode;
  /** The content, shown when the status is `ready`. */
  children?: ReactNode;
  /** How long loading must last before the skeleton appears, in ms, so a quick load never flashes. Default 200. */
  loadingDelay?: number;
  /** The words announced to screen readers, for another language or your own wording. */
  labels?: Partial<AsyncViewLabels>;
}

const LABELS: AsyncViewLabels = { loading: "Loading", refreshing: "Refreshing", ready: "Loaded", empty: "Nothing to show", error: "Could not load" };

/**
 * True once `active` has been on for `delay` ms, and false again `minDuration`
 * ms after it turned true at the earliest. A flash shorter than `delay` never
 * shows, and nothing that shows disappears at once.
 */
function useHeldFlag(active: boolean, delay: number, minDuration: number): boolean {
  const [on, setOn] = useState(() => active && delay <= 0);
  const since = useRef(0);
  useEffect(() => {
    if (active) {
      if (on) {
        if (!since.current) since.current = performance.now();
        return;
      }
      const timer = window.setTimeout(() => {
        since.current = performance.now();
        setOn(true);
      }, Math.max(0, delay));
      return () => window.clearTimeout(timer);
    }
    if (!on) return;
    const wait = Math.max(0, minDuration - (performance.now() - since.current));
    const timer = window.setTimeout(() => {
      since.current = 0;
      setOn(false);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [active, on, delay, minDuration]);
  return on;
}

function DefaultSkeleton() {
  return (
    <div className="grid gap-4">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-3">
          <Skeleton delay={row * 120} className="size-10 shrink-0 rounded-lg" />
          <div className="grid min-w-0 flex-1 gap-2">
            <Skeleton delay={row * 120 + 60} className="h-3.5 w-2/5" />
            <Skeleton delay={row * 120 + 120} className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DefaultError({ title, message, onRetry, retryLabel, retrying }: { title: string; message: ReactNode; onRetry?: () => void; retryLabel: string; retrying: boolean }) {
  return (
    <div data-slot="async-view-error" className="flex flex-col items-center rounded-xl border border-dashed border-destructive/40 px-6 py-10 text-center">
      <span aria-hidden="true" className="mb-5 grid size-12 place-items-center rounded-xl border border-destructive/25 bg-destructive/8 text-destructive">
        <IconAlertCircle className="size-5" />
      </span>
      <h3 className="text-base font-medium tracking-[-0.01em]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-5" loading={retrying} onClick={onRetry}>
          {retrying ? null : <IconRefresh />}
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Every state of a data view in one wrapper: loading, error, empty, refreshing
 * and ready, each with a slot and a default that is good enough to ship. It
 * fetches nothing; hand it the status of TanStack Query, SWR or a plain
 * useState. Loading waits `loadingDelay` before the skeleton comes up, so a
 * quick load never flashes one, and keeps it a moment once it is there. A
 * background refresh keeps the old content on screen and runs a thin bar along
 * the top instead of swapping in a skeleton, so nothing jumps and nothing the
 * person is reading disappears. The region carries `aria-busy`, and one polite
 * message announces each change: loading, refreshing, loaded, empty, failed.
 */
export function AsyncView({
  status,
  isFetching = false,
  skeleton,
  error,
  errorTitle = "We could not load this",
  errorMessage = "Check your connection and try again.",
  onRetry,
  retryLabel = "Retry",
  empty,
  children,
  loadingDelay = 200,
  labels,
  className,
  ...props
}: AsyncViewProps) {
  const words = { ...LABELS, ...labels };
  // The skeleton is held on screen for a moment once it is up, so a load that ends just after the delay does not blink one.
  const skeletonOn = useHeldFlag(status === "loading", loadingDelay, 300);
  const view = skeletonOn ? "skeleton" : status === "loading" ? "waiting" : status;
  const refreshing = isFetching && (view === "ready" || view === "empty");
  const barOn = useHeldFlag(refreshing, loadingDelay, 500);

  // One message per change of what the person sees. Nothing is said on the first render (the page itself is the announcement then), nor while the skeleton is still holding back.
  const heard: keyof AsyncViewLabels | null =
    view === "waiting" ? null : view === "skeleton" ? "loading" : (view === "ready" || view === "empty") && barOn ? "refreshing" : view;
  const previous = useRef(heard);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (heard === null || heard === previous.current) return;
    const before = previous.current;
    previous.current = heard;
    // A load that never showed a skeleton just ends: the content appears, and "Loaded" would be news about nothing.
    if (heard === "ready" && before === null) return;
    setMessage(words[heard]);
  });

  // The first state is already on the page, so only a later change fades in. Changes are counted rather than compared with the first view, so a return to it fades in too.
  const [shown, setShown] = useState({ view, changes: 0 });
  if (shown.view !== view) setShown({ view, changes: shown.changes + 1 });
  const fade = shown.changes > 0;

  const body =
    view === "skeleton" ? (
      (skeleton ?? <DefaultSkeleton />)
    ) : view === "error" ? (
      (error ?? <DefaultError title={errorTitle} message={errorMessage} onRetry={onRetry} retryLabel={retryLabel} retrying={isFetching} />)
    ) : view === "empty" ? (
      (empty ?? <EmptyState title="Nothing here yet" description="When there is something to show, it will appear here." icon={<IconInbox className="size-6" />} />)
    ) : view === "ready" ? (
      children
    ) : null;

  return (
    <>
      <div
        data-slot="async-view"
        data-view={view}
        data-refreshing={barOn ? "true" : undefined}
        aria-busy={view === "skeleton" || view === "waiting" || isFetching || undefined}
        className={cn("relative", className)}
        {...props}
      >
        {barOn ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden rounded-t-[inherit] motion-safe:animate-rhs-fade-in">
            <Progress className="h-full rounded-none" />
          </div>
        ) : null}
        {/* Keyed by what is shown and how often that has changed, so each change of state fades in, even back to an earlier one; a refresh keeps the key and so keeps the content and its state. */}
        <div key={`${view}-${shown.changes}`} className={cn(fade && "motion-safe:animate-rhs-fade-in")}>
          {body}
        </div>
      </div>
      {/* Outside the busy region: a live region inside aria-busy is held back by some screen readers until it is no longer busy. */}
      <span role="status" className="sr-only">
        {message}
      </span>
    </>
  );
}
