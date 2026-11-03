"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** How far in from an edge the fade reaches (3.5rem). The hero gives the strip scroll-px-14, the same distance, so a mark that snaps or is scrolled into view comes to rest clear of the fade. Keep the two together. */
const FADE = "3.5rem";

export interface ScrollStripProps extends ComponentProps<"div"> {
  /** Classes for the box around the scroller: where it sits in its grid, and its margins. `className` is for the scroller itself. */
  frameClassName?: string;
}

/**
 * A sideways scroll region with two courtesies. It is a stop for the keyboard
 * only while there is something to scroll: a scrolling box has to be focusable,
 * or a keyboard user cannot reach what is past its edge, but a strip that fits
 * has nothing past its edge, and an extra stop in the tab order is noise. So it
 * starts focusable, which is also what the server renders, and gives the stop
 * up once it has measured that its content fits. The arrow keys then scroll it,
 * snapping included. And it shows that there is more: while content is hidden
 * past an edge, that edge fades out (a mask on the box around the scroller, so
 * it has no colour of its own to get wrong), the way a strip that bleeds off a
 * phone screen would. The fade follows the scroll position, and it follows the
 * reading direction, so a strip read from right to left starts on the right.
 * While the box itself has keyboard focus the fade is off, so the focus ring
 * around it is whole. Give it an aria-label: a region needs a name.
 */
export function ScrollStrip({ children, className, frameClassName, ...props }: ScrollStripProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(true);
  // Which sides of the screen have more strip past them.
  const [more, setMore] = useState({ left: false, right: false });
  const [ringed, setRinged] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const room = element.scrollWidth - element.clientWidth;
      // scrollLeft runs negative in a strip read from right to left: how far it has moved is its size.
      const moved = Math.abs(element.scrollLeft);
      const rtl = getComputedStyle(element).direction === "rtl";
      const behind = room > 1 && moved > 1;
      const ahead = room > 1 && moved < room - 1;
      const next = { left: rtl ? ahead : behind, right: rtl ? behind : ahead };
      setScrolls(room > 1);
      setMore((now) => (now.left === next.left && now.right === next.right ? now : next));
    };
    measure();
    element.addEventListener("scroll", measure, { passive: true });
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      observer.observe(element);
      if (element.firstElementChild) observer.observe(element.firstElementChild);
    }
    return () => {
      element.removeEventListener("scroll", measure);
      observer?.disconnect();
    };
  }, []);

  const fade = (more.left || more.right) && !ringed;
  const mask = `linear-gradient(to right, ${more.left ? `transparent, #000 ${FADE}` : "#000"}, ${more.right ? `#000 calc(100% - ${FADE}), transparent` : "#000"})`;

  return (
    <div data-slot="trusted-by-hero-strip-frame" className={cn("relative", frameClassName)} style={fade ? { maskImage: mask, WebkitMaskImage: mask } : undefined}>
      <div
        ref={ref}
        role="region"
        tabIndex={scrolls ? 0 : undefined}
        className={cn("relative overflow-x-auto", className)}
        {...props}
        onFocus={(event) => setRinged(event.target === event.currentTarget && event.currentTarget.matches(":focus-visible"))}
        onBlur={() => setRinged(false)}
      >
        {children}
      </div>
    </div>
  );
}
