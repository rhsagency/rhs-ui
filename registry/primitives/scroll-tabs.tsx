"use client";

import { useEffect, useRef, useState } from "react";

import { IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface ScrollTab {
  id: string;
  label: string;
  /** A count after the label: open items, results. */
  count?: number;
}

export interface ScrollTabsProps {
  tabs: readonly ScrollTab[];
  value: string;
  onValueChange: (id: string) => void;
  label: string;
  className?: string;
}

/**
 * Many tabs on a narrow screen: one row that scrolls sideways with fade
 * edges and arrow buttons that appear only when there is more to see. The
 * active tab scrolls itself into view, and the tablist keeps one tab stop
 * with arrow keys, Home and End.
 */
export function ScrollTabs({ tabs, value, onValueChange, label, className }: ScrollTabsProps) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const measure = () => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft > 4, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  };
  useEffect(() => {
    measure();
    const el = track.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    track.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [value]);
  function keys(event: React.KeyboardEvent) {
    const index = tabs.findIndex((tab) => tab.id === value);
    const next = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    const tab = tabs[(next + tabs.length) % tabs.length];
    if (!tab) return;
    onValueChange(tab.id);
    requestAnimationFrame(() => track.current?.querySelector<HTMLElement>(`[data-tab="${tab.id}"]`)?.focus());
  }
  const nudge = (direction: 1 | -1) => track.current?.scrollBy({ left: direction * (track.current.clientWidth * 0.7), behavior: "smooth" });
  const arrow = "absolute top-1/2 z-10 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4";
  return (
    <div data-slot="scroll-tabs" className={cn("relative", className)}>
      {edges.start ? <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => nudge(-1)} className={cn(arrow, "left-0")}><IconChevronLeft /></button> : null}
      <div
        ref={track}
        role="tablist"
        aria-label={label}
        onScroll={measure}
        onKeyDown={keys}
        className={cn("relative flex gap-1 overflow-x-auto border-b border-border [scrollbar-width:none]", edges.start && "[mask-image:linear-gradient(90deg,transparent,#000_3rem)]", edges.end && "[mask-image:linear-gradient(90deg,#000_calc(100%-3rem),transparent)]", edges.start && edges.end && "[mask-image:linear-gradient(90deg,transparent,#000_3rem,#000_calc(100%-3rem),transparent)]")}
      >
        {tabs.map((tab) => {
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              data-tab={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onValueChange(tab.id)}
              className="-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-3 py-2.5 text-sm whitespace-nowrap text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground aria-selected:border-foreground aria-selected:text-foreground"
            >
              {tab.label}
              {tab.count !== undefined ? <span className="rounded-full bg-muted px-1.5 text-[11px] tabular-nums">{tab.count}</span> : null}
            </button>
          );
        })}
      </div>
      {edges.end ? <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => nudge(1)} className={cn(arrow, "right-0")}><IconChevronRight /></button> : null}
    </div>
  );
}
