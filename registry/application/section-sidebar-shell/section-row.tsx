"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SectionRowProps {
  /** The landmark's name for screen readers. */
  label: string;
  /** The sections, as list items. */
  children: ReactNode;
  className?: string;
}

/**
 * The row of sections in the header of SectionSidebarShell. When there are
 * more than fit, it scrolls sideways and fades out at an edge while there is
 * more to see there; the current section is scrolled into the middle when the
 * page loads. It is a list of links, not a tablist: each section is a page of
 * its own, and the current one carries aria-current.
 */
export function SectionRow({ label, children, className }: SectionRowProps) {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const list = track.current;
    if (!list) return;
    const measure = () => setEdges({ start: list.scrollLeft > 4, end: list.scrollLeft + list.clientWidth < list.scrollWidth - 4 });
    const current = list.querySelector<HTMLElement>('[aria-current="true"], [aria-current="page"]');
    if (current && list.scrollWidth > list.clientWidth) list.scrollLeft = current.offsetLeft - (list.clientWidth - current.offsetWidth) / 2;
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
    <nav data-slot="section-row" aria-label={label} className={cn("relative min-w-0", className)}>
      <ul
        ref={track}
        className={cn(
          "relative flex items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none] md:px-0",
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
