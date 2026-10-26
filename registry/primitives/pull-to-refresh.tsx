"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconArrowDown, IconRefresh } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

/** The words of the control, for another language or your own wording. */
export interface PullToRefreshLabels {
  /** Under the indicator while the pull has not reached the threshold. Default "Pull to refresh". */
  pull: string;
  /** Once it has. Default "Release to refresh". */
  release: string;
  /** While the work runs, on the indicator and for screen readers. Default "Refreshing". */
  refreshing: string;
  /** The text on the button, and its name. Default "Refresh". */
  refresh: string;
  /** Said when the work has finished. Default "Refreshed". */
  refreshed: string;
  /** Shown and said when onRefresh rejected. Default "Could not refresh". */
  failed: string;
}

export interface PullToRefreshIndicatorProps extends ComponentProps<"div"> {
  /** How far along the pull is: 0 where it starts, 1 at the threshold. It turns the arrow and fills the ring. */
  progress: number;
  /** `pull` below the threshold, `release` once past it, `refreshing` while the work runs. */
  phase: "pull" | "release" | "refreshing";
  /** The words under the arrow. */
  labels?: Pick<PullToRefreshLabels, "pull" | "release" | "refreshing">;
}

const LABELS: PullToRefreshLabels = { pull: "Pull to refresh", release: "Release to refresh", refreshing: "Refreshing", refresh: "Refresh", refreshed: "Refreshed", failed: "Could not refresh" };

const RING = 2 * Math.PI * 14.5;

/**
 * What the person sees at the top while they pull: a ring that fills and an
 * arrow that turns over with the pull, then a spinner while the work runs, and a
 * few words. It is the indicator PullToRefresh draws, exported so you can show
 * its states in your own docs or build another layout around it.
 */
export function PullToRefreshIndicator({ progress, phase, labels = LABELS, className, ...props }: PullToRefreshIndicatorProps) {
  const filled = Math.min(1, Math.max(0, progress));
  return (
    <div data-slot="pull-to-refresh-indicator" data-phase={phase} className={cn("flex items-center gap-2.5 text-xs text-muted-foreground", className)} {...props}>
      <span className="relative grid size-8 shrink-0 place-items-center rounded-full border border-border bg-background text-foreground shadow-xs">
        <svg viewBox="0 0 32 32" aria-hidden="true" className="absolute inset-0 size-full -rotate-90">
          <circle
            cx="16"
            cy="16"
            r="14.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={RING}
            strokeDashoffset={RING * (1 - (phase === "pull" ? filled : 1))}
            className={cn("transition-opacity duration-200 motion-reduce:transition-none", phase === "refreshing" ? "opacity-0" : "opacity-100")}
          />
        </svg>
        {phase === "refreshing" ? (
          <Spinner size={16} label="" aria-hidden="true" role="presentation" />
        ) : (
          <IconArrowDown size={14} style={{ transform: `rotate(${filled * 180}deg)` }} className="transition-transform duration-150 motion-reduce:transition-none" />
        )}
      </span>
      <span className="whitespace-nowrap">{phase === "pull" ? labels.pull : phase === "release" ? labels.release : labels.refreshing}</span>
    </div>
  );
}

/** The finger has to move this far before a pull starts, so a tap or a scroll is never taken for one. */
const SLOP = 8;
/** The spinner stays at least this long, so a refresh that answers at once is still seen. */
const MINIMUM = 450;

/** Elastic resistance: the content follows the finger at first, then less and less, and never more than 2.4 thresholds. */
function resist(distance: number, threshold: number): number {
  const limit = threshold * 2.4;
  return limit * (1 - Math.exp((-0.9 * distance) / limit));
}

export interface PullToRefreshProps extends Omit<ComponentProps<"div">, "children"> {
  /** Does the refresh, and returns its promise: the spinner stays until it settles. It runs when a pull is released past the threshold and when the Refresh button is pressed. */
  onRefresh: () => Promise<unknown> | void;
  /** How far the content must be pulled down, in px, before releasing refreshes. Default 64. */
  threshold?: number;
  /** Turns the gesture and the button off. */
  disabled?: boolean;
  /** Something for the left of the bar above the list, such as its title. */
  header?: ReactNode;
  /** Names the list for screen readers, for example "Inbox". With it the list is a labelled region. */
  listLabel?: string;
  /** The words of the control. */
  labels?: Partial<PullToRefreshLabels>;
  /** The list. It scrolls inside the component, so give the component a height: className="h-96". */
  children: ReactNode;
}

/**
 * The mobile gesture for refreshing a list. Drag down at the top of the list and
 * an indicator turns with the pull, with elastic resistance; release past the
 * threshold and it becomes a spinner while `onRefresh` runs, then the content
 * settles back. Letting go early cancels, and so does taking the finger back
 * above where it began, which hands the rest of the touch to the list. Only
 * touch (and pen, where the browser reports it as touch) starts a pull, so
 * wheels and desktop scrolling stay untouched, and the gesture is never the only
 * way: a visible Refresh button in the bar runs the same handler for keyboard,
 * mouse and screen reader users. The list sets overscroll-behavior so the
 * browser's own refresh does not fight it. The result is announced politely.
 */
export function PullToRefresh({ onRefresh, threshold = 64, disabled = false, header, listLabel, labels, className, children, ...props }: PullToRefreshProps) {
  const words = { ...LABELS, ...labels };
  const scroller = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"idle" | "pulling" | "refreshing">("idle");
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [failed, setFailed] = useState(false);
  const [said, setSaid] = useState("");
  const busy = useRef(false);
  const latest = useRef({ onRefresh, threshold, disabled, words });
  useEffect(() => {
    latest.current = { onRefresh, threshold, disabled, words };
  });

  const run = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const { onRefresh: work, threshold: hold, words: texts } = latest.current;
    setPhase("refreshing");
    setPull(hold);
    setFailed(false);
    setSaid(texts.refreshing);
    try {
      await Promise.all([Promise.resolve(work()), new Promise((resolve) => window.setTimeout(resolve, MINIMUM))]);
      setSaid(texts.refreshed);
    } catch {
      setFailed(true);
      setSaid(texts.failed);
    } finally {
      busy.current = false;
      setPhase("idle");
      setPull(0);
    }
  }, []);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    let startX = 0;
    let startY = 0;
    let tracking = false;
    let pulling = false;
    let reached = 0;
    const stop = () => {
      tracking = false;
      pulling = false;
    };
    const start = (event: TouchEvent) => {
      const touch = event.touches[0];
      // A pull begins only at the very top of the list, with one finger, and not while it is already working.
      if (!touch || event.touches.length !== 1 || latest.current.disabled || busy.current || node.scrollTop > 0) return;
      startX = touch.clientX;
      startY = touch.clientY;
      reached = 0;
      tracking = true;
      pulling = false;
    };
    const move = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!tracking || !touch) return;
      const distance = touch.clientY - startY;
      if (!pulling) {
        // Upwards, sideways, or a list that has scrolled meanwhile: that is the list's gesture, not ours.
        if (distance < 0 || node.scrollTop > 0 || Math.abs(touch.clientX - startX) > Math.abs(distance)) {
          stop();
          return;
        }
        if (distance < SLOP) return;
        pulling = true;
        setPhase("pulling");
        setDragging(true);
      } else if (distance < 0) {
        // The finger is back above where it began: the pull is over, the list is at rest and the rest of the touch is the list's.
        stop();
        reached = 0;
        setDragging(false);
        setPull(0);
        setPhase("idle");
        return;
      }
      // The gesture is ours from here on: the list must not scroll or bounce under the finger.
      if (event.cancelable) event.preventDefault();
      // Never below zero: a finger on its way back up must not drag the list up with it.
      reached = Math.max(0, resist(distance - SLOP, latest.current.threshold));
      setPull(reached);
    };
    const end = (event: TouchEvent) => {
      const released = pulling;
      const cancelled = event.type === "touchcancel";
      stop();
      if (!released) return;
      setDragging(false);
      if (!cancelled && reached >= latest.current.threshold) {
        void run();
      } else {
        setPull(0);
        setPhase("idle");
      }
    };
    node.addEventListener("touchstart", start, { passive: true });
    node.addEventListener("touchmove", move, { passive: false });
    node.addEventListener("touchend", end);
    node.addEventListener("touchcancel", end);
    return () => {
      node.removeEventListener("touchstart", start);
      node.removeEventListener("touchmove", move);
      node.removeEventListener("touchend", end);
      node.removeEventListener("touchcancel", end);
    };
  }, [run]);

  useEffect(() => {
    if (!said || said === words.refreshing) return;
    const timer = window.setTimeout(() => setSaid(""), 5000);
    return () => window.clearTimeout(timer);
  }, [said, words.refreshing]);

  const refreshing = phase === "refreshing";
  const progress = threshold > 0 ? pull / threshold : 0;
  return (
    <>
      <div data-slot="pull-to-refresh" data-state={phase} aria-busy={refreshing || undefined} className={cn("flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card", className)} {...props}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border py-1.5 pr-1.5 pl-4">
          <div className="min-w-0 truncate text-sm font-medium tracking-[-0.01em]">{header}</div>
          <div className="flex shrink-0 items-center gap-1">
            {failed ? <span className="pr-1 text-xs text-destructive">{words.failed}</span> : null}
            <Button type="button" variant="ghost" size="sm" loading={refreshing} disabled={disabled} onClick={() => void run()}>
              {refreshing ? null : <IconRefresh />}
              {refreshing ? words.refreshing : words.refresh}
            </Button>
          </div>
        </div>
        <div className="relative min-h-0 flex-1 overflow-hidden bg-muted/50">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 grid place-items-center overflow-hidden" style={{ height: pull, opacity: Math.min(1, progress / 0.6) }}>
            <PullToRefreshIndicator progress={progress} phase={refreshing ? "refreshing" : progress >= 1 ? "release" : "pull"} labels={words} />
          </div>
          <div
            ref={scroller}
            // A list that scrolls must be reachable by keyboard, so the arrow keys move it.
            tabIndex={0}
            role={listLabel ? "region" : undefined}
            aria-label={listLabel}
            data-dragging={dragging || undefined}
            className="relative h-full overflow-y-auto overscroll-y-contain bg-card outline-none transition-transform duration-300 ease-out focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset data-[dragging]:transition-none motion-reduce:transition-none"
            style={{ transform: `translateY(${pull}px)` }}
          >
            {children}
          </div>
        </div>
      </div>
      <span role="status" className="sr-only">
        {said}
      </span>
    </>
  );
}
