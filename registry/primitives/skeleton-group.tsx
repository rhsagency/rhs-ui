"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from "react";

export interface SkeletonGroupProps extends ComponentProps<"div"> {
  /** Shows the placeholders while true. When it turns false they are not rendered and nothing is announced, so the real content simply arrives. Default true. */
  loading?: boolean;
  /** The one phrase a screen reader hears for the whole group. Default "Loading content". */
  label?: string;
  /** Milliseconds between the shimmer of one block and the next, in document order. Default 80. */
  stagger?: number;
}

const StaggerContext = createContext(0);

/**
 * The blocks of a group: every Skeleton, and any custom shape that carries
 * `data-skeleton`. Both get their delay from `--shimmer-delay`, which is the
 * variable Skeleton reads for its shimmer.
 */
const BLOCKS = "[data-slot='skeleton'], [data-skeleton]";

/** How long a screen reader waits before hearing "Loading": a skeleton that is gone sooner is never announced. */
const ANNOUNCE_AFTER = 120;

/**
 * Placeholders that read as one "Loading" and sweep as one wave. Put any
 * number of Skeleton blocks inside, at any depth: the group sets the delay of
 * their shimmer in document order, so the light travels across the layout
 * instead of every block pulsing in time, and nothing is wired by hand. It
 * marks its region `aria-busy` and renders a single visually hidden status, in
 * place of a dozen silent boxes. That status is filled in a moment after the
 * group mounts, not with it, because a live region that is created together
 * with its message is often never read. A shape that is not a Skeleton joins
 * the wave with `data-skeleton` and `animation-delay: var(--shimmer-delay)`, or
 * asks for its own delay with `useSkeletonDelay`.
 */
export function SkeletonGroup({ loading = true, label = "Loading content", stagger = 80, className, children, ...props }: SkeletonGroupProps) {
  const root = useRef<HTMLDivElement>(null);
  const [announced, setAnnounced] = useState(false);

  // Skeleton takes its delay as a prop; the group hands it out by position in the document, however deep the block sits.
  useLayoutEffect(() => {
    const region = root.current;
    if (!region || !loading) return;
    const apply = () => {
      let position = 0;
      for (const block of region.querySelectorAll<HTMLElement>(BLOCKS)) block.style.setProperty("--shimmer-delay", `${position++ * stagger}ms`);
    };
    apply();
    // Blocks that mount later (a list that grows) join the wave too.
    const observer = new MutationObserver(apply);
    observer.observe(region, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [loading, stagger]);

  useEffect(() => {
    if (!loading) {
      setAnnounced(false);
      return;
    }
    const timer = window.setTimeout(() => setAnnounced(true), ANNOUNCE_AFTER);
    return () => window.clearTimeout(timer);
  }, [loading]);

  if (!loading) return null;
  return (
    <>
      <StaggerContext.Provider value={stagger}>
        <div ref={root} data-slot="skeleton-group" aria-busy="true" className={className} {...props}>
          {children}
        </div>
      </StaggerContext.Provider>
      {/* Outside the busy region: a live region inside aria-busy is held back by some screen readers until it is no longer busy. */}
      <span role="status" className="sr-only">
        {announced ? label : ""}
      </span>
    </>
  );
}

/**
 * The shimmer delay, in ms, of the block at `index` in the nearest
 * SkeletonGroup: its `stagger` times the index. For a custom shape that does
 * not use Skeleton and is not reached by the group's own pass over the page;
 * 0 outside a group, so the shape still renders on its own.
 */
export function useSkeletonDelay(index: number): number {
  return useContext(StaggerContext) * Math.max(0, index);
}
