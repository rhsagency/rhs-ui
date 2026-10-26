"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SettingsTabRowProps {
  /** The landmark's name for screen readers. */
  label: string;
  /** The links, as list items. */
  children: ReactNode;
  className?: string;
}

/**
 * The settings navigation on a phone: one row of links that scrolls
 * sideways, fading out at an edge while there is more to see there. The
 * current page is scrolled into the middle when the page loads. It is a
 * list of links, not a tablist: each one is a page of its own.
 */
export function SettingsTabRow({ label, children, className }: SettingsTabRowProps) {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const list = track.current;
    if (!list) return;
    const measure = () => setEdges({ start: list.scrollLeft > 4, end: list.scrollLeft + list.clientWidth < list.scrollWidth - 4 });
    const current = list.querySelector<HTMLElement>('[aria-current="page"]');
    if (current) list.scrollLeft = current.offsetLeft - (list.clientWidth - current.offsetWidth) / 2;
    measure();
    list.addEventListener("scroll", measure, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(list);
    return () => {
      list.removeEventListener("scroll", measure);
      observer?.disconnect();
    };
  }, []);

  return (
    <nav data-slot="settings-tab-row" aria-label={label} className={cn("relative", className)}>
      <ul
        ref={track}
        className={cn(
          // The rule under the row is an inset shadow, not a border, so the links sit inside the row and the current underline covers it: nothing overflows, and a vertical swipe over the row reaches the page.
          "relative flex items-center gap-1 overflow-x-auto overflow-y-hidden [box-shadow:inset_0_-1px_0_var(--border)] [scrollbar-width:none]",
          edges.start && !edges.end && "[mask-image:linear-gradient(90deg,transparent,#000_2.5rem)]",
          !edges.start && edges.end && "[mask-image:linear-gradient(90deg,#000_calc(100%-2.5rem),transparent)]",
          edges.start && edges.end && "[mask-image:linear-gradient(90deg,transparent,#000_2.5rem,#000_calc(100%-2.5rem),transparent)]",
        )}
      >
        {children}
      </ul>
    </nav>
  );
}
