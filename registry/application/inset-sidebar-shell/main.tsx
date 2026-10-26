"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * The scrolling page of InsetSidebarShell. Once the page has scrolled, its
 * first pixels fade out under the header instead of being cut off by a line.
 * At rest nothing fades, so a full-bleed table keeps its first row and the
 * scrollbar and the focus ring stay whole. A one pixel marker at the top of
 * the page and an IntersectionObserver tell it when the page has moved: no
 * scroll listener, no work while the page is still.
 */
export function InsetSidebarMain({ className, children, ...props }: ComponentProps<"main">) {
  const page = useRef<HTMLElement>(null);
  const marker = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const root = page.current;
    const node = marker.current;
    if (!root || !node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(entry ? !entry.isIntersecting : false), { root });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <main
      ref={page}
      data-slot="inset-sidebar-shell-main"
      data-scrolled={scrolled ? "true" : "false"}
      tabIndex={0}
      className={cn(
        "relative min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]",
        // The fade is a mask whose gradient sits just above the top edge until the page moves, then slides in.
        "[mask-image:linear-gradient(to_bottom,transparent,#000_14px)] [mask-position:0_-14px] [mask-repeat:no-repeat] [mask-size:100%_calc(100%_+_14px)] transition-[mask-position] duration-200 data-[scrolled=true]:[mask-position:0_0] motion-reduce:transition-none",
        className,
      )}
      {...props}
    >
      <div ref={marker} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px" />
      {children}
    </main>
  );
}
