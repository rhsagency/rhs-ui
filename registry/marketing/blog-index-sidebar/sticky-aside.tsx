"use client";

import { useEffect, useRef, type ComponentProps, type FocusEvent } from "react";

/** How far a focused control keeps clear of the header and the window edge, in px. */
const CLEARANCE = 8;

/**
 * The sidebar's element. It writes its own height to `--aside-h`, and the
 * classes of the block do the rest in CSS: the sticky offset is the header's
 * height or, for a sidebar taller than the window, the offset that pins its
 * bottom edge to the bottom of the window, whichever is smaller. A tall
 * sidebar therefore still sticks (its last widget stays in view while the page
 * scrolls) instead of scrolling away, and a short one hangs under the header.
 * Before the first measurement the offset is simply the header's.
 *
 * A pinned sidebar does not move when the page scrolls, so the browser cannot
 * bring a control at its top into view by scrolling alone. When focus lands on
 * a control that sits under the header, this scrolls the page up by as much as
 * it takes for the sidebar to start moving again, and then some.
 */
export function StickyAside({ onFocus, ...props }: ComponentProps<"aside">) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => node.style.setProperty("--aside-h", `${node.offsetHeight}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const reveal = (event: FocusEvent<HTMLElement>) => {
    onFocus?.(event);
    const node = ref.current;
    const target = event.target;
    if (!node || !(target instanceof HTMLElement)) return;
    // The browser scrolls to the focused control first; look at where it ended up.
    window.requestAnimationFrame(() => {
      if (document.activeElement !== target || getComputedStyle(node).position !== "sticky") return;
      const probe = document.createElement("div");
      probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;width:0;height:var(--sticky-top,6rem)";
      node.append(probe);
      const header = probe.getBoundingClientRect().height;
      probe.remove();
      const shortfall = header + CLEARANCE - target.getBoundingClientRect().top;
      if (shortfall <= 0) return;
      // Where the sidebar would sit if it were not stuck: how far it is held below that is how far to scroll before it moves.
      const { position, top } = node.style;
      node.style.position = "relative";
      node.style.top = "0px";
      const natural = node.getBoundingClientRect().top;
      node.style.position = position;
      node.style.top = top;
      const held = Math.max(0, Number.parseFloat(getComputedStyle(node).top) - natural);
      window.scrollBy({ top: -(held + shortfall), behavior: "instant" });
    });
  };

  return <aside {...props} ref={ref} onFocus={reveal} />;
}
