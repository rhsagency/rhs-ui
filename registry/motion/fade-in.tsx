"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore, type AnimationEvent, type ComponentProps, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

export interface FadeInProps extends Omit<ComponentProps<"div">, "ref"> {
  /** The way the block travels as it arrives: `up` rises into place, `left` slides in from the right. */
  direction?: "up" | "down" | "left" | "right" | "none";
  /** Travel in pixels. */
  distance?: number;
  /** Milliseconds to wait once the block is visible: the way to line a row of them up. */
  delay?: number;
  /** Milliseconds the entrance takes. */
  duration?: number;
  /** Play once (the default), or play again every time the block comes back into view. */
  once?: boolean;
  /** How much of the block (0 to 1) must be on screen before it plays. */
  amount?: number;
  /** The element to render. */
  as?: "div" | "section" | "article" | "aside" | "figure" | "header" | "footer" | "li" | "p" | "span";
}

const noSubscription = (): (() => void) => () => {};

/** True when this instance was created in the browser, false while it is hydrating server HTML. */
function useCreatedInBrowser(): boolean {
  const browser = useSyncExternalStore(noSubscription, () => true, () => false);
  const [created] = useState(browser);
  return created;
}

/**
 * A once-only entrance for any block: it fades in and rises a few pixels the
 * first time it is on screen, on its own clock. Reveal follows the scroll;
 * FadeIn plays and is done, which suits cards and copy the reader will not
 * scrub. The server renders it fully visible, so there is no hidden content
 * without JavaScript and none before hydration; a block that is already on
 * screen when the page hydrates simply stays, and one that mounts in the
 * browser (a route change, a conditional) always plays. Only opacity and
 * transform move, so layout never shifts, and reduced motion and print show
 * everything at rest.
 */
export function FadeIn({ direction = "up", distance = 16, delay = 0, duration = 600, once = true, amount = 0.2, as = "div", className, style, onAnimationEnd, ...props }: FadeInProps) {
  const Tag = as as "div";
  const ref = useRef<HTMLDivElement>(null);
  const created = useCreatedInBrowser();
  const [phase, setPhase] = useState<"idle" | "hidden" | "shown" | "done">("idle");
  const playing = useRef(false);
  const last = useRef<IntersectionObserverEntry | null>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // A block taller than the window can never show a large share of itself, so cap what we wait for.
    const room = Math.min(1, window.innerHeight / Math.max(node.getBoundingClientRect().height, 1));
    const needed = Math.min(amount, room * 0.9);
    let seen = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        last.current = entry;
        if (!seen && !created) {
          // Already on screen from the server HTML: leave it be.
          seen = true;
          if (entry.isIntersecting) {
            if (once) observer.disconnect();
            return;
          }
          setPhase("hidden");
          return;
        }
        seen = true;
        if (entry.isIntersecting && entry.intersectionRatio >= needed - 0.001) {
          playing.current = true;
          setPhase("shown");
          if (once) observer.disconnect();
        } else if (!once && !entry.isIntersecting && !playing.current) setPhase("hidden");
      },
      { threshold: needed > 0 ? [0, needed] : [0] },
    );
    if (created) setPhase("hidden"); // before the first paint, so the block never flashes
    observer.observe(node);
    return () => observer.disconnect();
  }, [created, once, amount]);

  const x = direction === "left" ? distance : direction === "right" ? -distance : 0;
  const y = direction === "up" ? distance : direction === "down" ? -distance : 0;
  const vars = { "--rhs-fade-x": `${x}px`, "--rhs-fade-y": `${y}px`, "--rhs-fade-duration": `${duration}ms`, "--rhs-fade-delay": `${delay}ms` } as CSSProperties;

  return (
    <Tag
      ref={ref}
      data-slot="fade-in"
      data-state={phase === "idle" || phase === "done" ? undefined : phase}
      className={cn(
        "data-[state=hidden]:opacity-0",
        // The keyframes name comes from the theme, the timing from this element's own variables. A var() inside the theme
        // value would resolve on :root, and every block would share one delay and one duration. `rhs-enter` is this item's
        // own name: `rhs-fade-in` belongs to the overlays of dialog and sheet, which declare it as a plain 160ms fade.
        "data-[state=shown]:[animation:var(--animate-rhs-enter)_var(--rhs-fade-duration,600ms)_cubic-bezier(0.22,1,0.36,1)_var(--rhs-fade-delay,0ms)_backwards]",
        "motion-reduce:animate-none! motion-reduce:opacity-100! print:animate-none! print:opacity-100!",
        className,
      )}
      style={{ ...vars, ...style }}
      onAnimationEnd={(event: AnimationEvent<HTMLDivElement>) => {
        onAnimationEnd?.(event);
        if (event.target !== event.currentTarget) return;
        playing.current = false;
        // Done: hand the element back to its own styles. If it left the screen while it was still arriving, hide it again for the next visit.
        setPhase(!once && last.current && !last.current.isIntersecting ? "hidden" : "done");
      }}
      {...props}
    />
  );
}
