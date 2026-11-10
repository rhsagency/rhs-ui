"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Brings a link to the middle of the row by moving the row itself: scrollIntoView would move the page as well. */
function centre(row: HTMLElement, link: HTMLElement) {
  row.scrollLeft += link.getBoundingClientRect().left - row.getBoundingClientRect().left - (row.clientWidth - link.offsetWidth) / 2;
}

/**
 * The row of categories: it scrolls sideways when there are more than fit, a
 * fade marks each edge that has more behind it, and the link marked
 * aria-current comes into view when the row is first shown and again when the
 * page changes. Only the row moves, never the page. The links themselves are
 * yours, rendered on the server, so this holds no routes and takes no
 * component as a prop.
 */
export function CategoryScroller({ className, children, ...props }: ComponentProps<"div">) {
  const track = useRef<HTMLDivElement>(null);
  const settled = useRef<Element | null>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const measure = () => setEdges({ start: element.scrollLeft > 4, end: element.scrollLeft + element.clientWidth < element.scrollWidth - 4 });
    measure();
    element.addEventListener("scroll", measure, { passive: true });
    // The row itself keeps its size when a web font arrives or the links change, but its content does not: watch both.
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    for (const child of Array.from(element.children)) observer.observe(child);
    let gone = false;
    void document.fonts?.ready.then(() => {
      if (gone) return;
      // The links have their final widths now, so the current one is centred again, and the edges are measured again.
      const current = element.querySelector<HTMLElement>('[aria-current="page"]');
      if (current) centre(element, current);
      measure();
    });
    return () => {
      gone = true;
      element.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, []);

  // After every render: a new page hands this component a new current link, and that link is brought to the middle of the row.
  useEffect(() => {
    const element = track.current;
    const current = element?.querySelector<HTMLElement>('[aria-current="page"]') ?? null;
    if (!element || !current || current === settled.current) return;
    settled.current = current;
    centre(element, current);
  });

  return (
    <div
      ref={track}
      data-slot="category-scroller"
      className={cn(
        "relative overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        edges.start && !edges.end && "[mask-image:linear-gradient(90deg,transparent,#000_2.5rem)]",
        !edges.start && edges.end && "[mask-image:linear-gradient(90deg,#000_calc(100%-2.5rem),transparent)]",
        edges.start && edges.end && "[mask-image:linear-gradient(90deg,transparent,#000_2.5rem,#000_calc(100%-2.5rem),transparent)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
