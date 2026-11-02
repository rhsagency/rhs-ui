"use client";

import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";

/**
 * A sideways scroll region that is a stop for the keyboard only while there is
 * something to scroll. A scrolling box has to be focusable, or a keyboard user
 * cannot reach what is past its edge; but a box that fits has nothing past its
 * edge, and an extra stop in the tab order is noise. So it starts focusable,
 * which is also what the server renders, and gives the stop up once it has
 * measured that its content fits. The arrow keys scroll it natively, snapping
 * included; Home and End, which browsers keep for up and down, go to its two ends.
 */
export function ScrollRegion({ children, onKeyDown, ...props }: ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setScrolls(element.scrollWidth > element.clientWidth + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, []);

  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    const element = ref.current;
    if (!element || event.defaultPrevented || event.target !== event.currentTarget) return;
    if ((event.key !== "Home" && event.key !== "End") || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollTo({ left: event.key === "Home" ? 0 : element.scrollWidth, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div ref={ref} role="region" tabIndex={scrolls ? 0 : undefined} {...props} onKeyDown={keyDown}>
      {children}
    </div>
  );
}
