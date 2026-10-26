"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * The sticky header of TopNavShell. It gains its bottom border only once
 * the page has scrolled, which an IntersectionObserver on a one pixel
 * marker at the very top of the page tells it: no scroll listener, no work
 * while the page is still.
 */
export function TopNavHeader({ className, children, ...props }: ComponentProps<"header">) {
  const marker = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const node = marker.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(entry ? !entry.isIntersecting : false));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={marker} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px" />
      <header
        data-slot="top-nav-shell-header"
        data-scrolled={scrolled ? "true" : "false"}
        className={cn("sticky top-0 z-40 border-b border-transparent bg-background transition-colors duration-200 data-[scrolled=true]:border-border motion-reduce:transition-none", className)}
        {...props}
      >
        {children}
      </header>
    </>
  );
}
