"use client";

import { useEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface StickySectionHeaderProps extends Omit<ComponentProps<"div">, "ref"> {
  /** The heading text: "March 2026", "B", "Notifications". */
  children: ReactNode;
  /** Something to put at the end of the bar, outside the heading: a count, a link, an action. */
  aside?: ReactNode;
  /** Pixels to stop short of the top of the scroll area, for a fixed navbar above. */
  offset?: number;
  /** The heading level of the text. */
  level?: 2 | 3 | 4 | 5 | 6;
  /** The element of the bar itself. */
  as?: "div" | "header" | "li";
}

function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") return parent;
  }
  return null;
}

/**
 * The heading of a section in a long grouped list: a changelog by month,
 * contacts by letter, a settings page. It sticks to the top of the scroll
 * area while its section is in view and the next heading pushes it away.
 * It is plain `position: sticky`, so Page Down, find in page and screen
 * magnifiers behave, and the heading keeps its level. A sentinel and one
 * IntersectionObserver tell it when it is stuck, so the bottom hairline and
 * the solid background appear only then, with no scroll handler.
 */
export function StickySectionHeader({ children, aside, offset = 0, level = 2, as = "div", className, style, ...props }: StickySectionHeaderProps) {
  const Tag = as as "div";
  const Heading = `h${level}` as "h2";
  const bar = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLSpanElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const node = bar.current;
    const probe = sentinel.current;
    if (!node || !probe || typeof IntersectionObserver === "undefined") return;
    // The probe sits `offset` + 1 pixels above the bar, so it crosses the top edge of the scroll area exactly when the bar
    // reaches its stuck position. The observed area is everything above that edge (a very tall margin on top, the whole
    // height cut from the bottom): "intersecting" then simply means "stuck", and it still flips when a jump of the scroll
    // position skips the visible area altogether.
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry) setStuck(entry.isIntersecting);
      },
      { root: scrollParent(node), rootMargin: "100000px 0px -100% 0px", threshold: 0 },
    );
    observer.observe(probe);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={bar}
      data-slot="sticky-section-header"
      data-stuck={stuck}
      className={cn(
        "sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-transparent py-3 transition-[background-color,border-color] duration-150 motion-reduce:transition-none",
        "data-[stuck=true]:border-border data-[stuck=true]:bg-background",
        className,
      )}
      style={{ top: offset, ...style } as CSSProperties}
      {...props}
    >
      <span ref={sentinel} aria-hidden="true" className="pointer-events-none absolute inset-x-0 h-px" style={{ top: -(Math.max(0, offset) + 1) }} />
      <Heading className="min-w-0 text-sm font-medium tracking-[-0.01em]">{children}</Heading>
      {aside ? <div className="shrink-0 text-xs text-muted-foreground">{aside}</div> : null}
    </Tag>
  );
}
