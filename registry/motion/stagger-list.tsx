"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ComponentProps, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

export interface StaggerListProps extends Omit<ComponentProps<"ul">, "ref"> {
  /** Milliseconds between one item starting and the next. */
  step?: number;
  /** The longest any item waits, so a long list never makes anyone wait. */
  maxDelay?: number;
  /** Milliseconds each item takes to arrive. */
  duration?: number;
  /** The way items travel as they arrive: `up` rises into place, `left` slides in from the right. */
  direction?: "up" | "down" | "left" | "right" | "none";
  /** Travel in pixels. */
  distance?: number;
  /** Play once (the default), or play again every time the list comes back into view. */
  once?: boolean;
  /** The element to render. Use `ul` or `ol` for list semantics and give it `li` children. */
  as?: "ul" | "ol" | "div" | "section" | "dl";
}

const noSubscription = (): (() => void) => () => {};

/** True when this instance was created in the browser, false while it is hydrating server HTML. */
function useCreatedInBrowser(): boolean {
  const browser = useSyncExternalStore(noSubscription, () => true, () => false);
  const [created] = useState(browser);
  return created;
}

/**
 * A list whose items arrive one after another when it scrolls into view. It
 * renders the element you choose and leaves its children alone, so a ul or ol
 * keeps its role and its item count for assistive technology (it carries an
 * explicit role="list", because Safari with VoiceOver drops the semantics of a
 * list that has no bullets). Each child gets an index-based delay that is
 * capped by `maxDelay`. The server renders every
 * item visible, so nothing is hidden before hydration or without JavaScript;
 * a list already on screen when the page hydrates stays as it is, and one that
 * mounts in the browser always plays. Reduced motion and print show every
 * item at once.
 */
export function StaggerList({ step = 70, maxDelay = 560, duration = 500, direction = "up", distance = 14, once = true, as = "ul", className, style, ...props }: StaggerListProps) {
  const Tag = as as "ul";
  const ref = useRef<HTMLUListElement>(null);
  const created = useCreatedInBrowser();
  const [phase, setPhase] = useState<"idle" | "hidden" | "shown" | "done">("idle");

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // A list taller than the window can never show a large share of itself, so cap what we wait for.
    const room = Math.min(1, window.innerHeight / Math.max(node.getBoundingClientRect().height, 1));
    const needed = Math.min(0.15, room * 0.9);
    let seen = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
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
          setPhase("shown");
          if (once) observer.disconnect();
        } else if (!once && !entry.isIntersecting) setPhase("hidden");
      },
      { threshold: [0, needed] },
    );
    if (created) setPhase("hidden"); // before the first paint, so the items never flash
    observer.observe(node);
    return () => observer.disconnect();
  }, [created, once]);

  // The delay of each child rides on the child itself, so any element can be an item.
  useLayoutEffect(() => {
    const list = ref.current;
    if (!list || phase === "idle") return;
    Array.from(list.children).forEach((child, index) => (child as HTMLElement).style.setProperty("--rhs-stagger-delay", `${Math.min(index * step, maxDelay)}ms`));
  });

  // Done: hand the items back to their own styles, so a child with an animation of its own is not overridden for good.
  useEffect(() => {
    if (phase !== "shown") return;
    const id = window.setTimeout(() => setPhase("done"), maxDelay + duration + 80);
    return () => window.clearTimeout(id);
  }, [phase, maxDelay, duration]);

  const x = direction === "left" ? distance : direction === "right" ? -distance : 0;
  const y = direction === "up" ? distance : direction === "down" ? -distance : 0;
  const vars = { "--rhs-stagger-x": `${x}px`, "--rhs-stagger-y": `${y}px`, "--rhs-stagger-duration": `${duration}ms` } as CSSProperties;

  return (
    <Tag
      ref={ref}
      data-slot="stagger-list"
      data-state={phase === "idle" || phase === "done" ? undefined : phase}
      role={as === "ul" || as === "ol" ? "list" : undefined}
      className={cn(
        "[&[data-state=hidden]>*]:opacity-0",
        // The keyframes name comes from the theme, the timing from each item: --rhs-stagger-delay is set on the item itself and
        // the duration is inherited from the list. A var() inside the theme value would resolve on :root, so no item would
        // ever get a delay of its own.
        "[&[data-state=shown]>*]:[animation:var(--animate-rhs-stagger-in)_var(--rhs-stagger-duration,500ms)_cubic-bezier(0.22,1,0.36,1)_var(--rhs-stagger-delay,0ms)_backwards]",
        "motion-reduce:[&>*]:animate-none! motion-reduce:[&>*]:opacity-100! print:[&>*]:animate-none! print:[&>*]:opacity-100!",
        className,
      )}
      style={{ ...vars, ...style }}
      {...props}
    />
  );
}
