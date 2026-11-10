"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Layout effects run before the browser paints, which is what makes the first frame right; on the server there is nothing to run. */
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The light theme's tokens, for a bar of dark text over a light photograph on a page that is itself in the dark theme. A bar cannot reach
 * the page's own light tokens from inside the dark class, so this sets the neutral ones. On a light page nothing applies and the page's
 * own tokens are used. Every class is written out in full, because Tailwind only generates what it can read in the source.
 */
const LIGHT_IN_DARK = [
  "dark:[--background:oklch(0.992_0_0)] dark:[--foreground:oklch(0.165_0_0)]",
  "dark:[--card:oklch(1_0_0)] dark:[--card-foreground:oklch(0.165_0_0)]",
  "dark:[--popover:oklch(1_0_0)] dark:[--popover-foreground:oklch(0.165_0_0)]",
  "dark:[--primary:oklch(0.165_0_0)] dark:[--primary-foreground:oklch(1_0_0)]",
  "dark:[--secondary:oklch(0.955_0_0)] dark:[--secondary-foreground:oklch(0.225_0_0)]",
  "dark:[--muted:oklch(0.955_0_0)] dark:[--muted-foreground:oklch(0.42_0_0)]",
  "dark:[--accent:oklch(0.955_0_0)] dark:[--accent-foreground:oklch(0.165_0_0)]",
  "dark:[--border:oklch(0.905_0_0)] dark:[--input:oklch(0.905_0_0)] dark:[--ring:oklch(0.165_0_0)]",
].join(" ");

/** The nearest ancestor that scrolls on its own (an app layout with a scrolling main), or the window when the page itself scrolls. */
function scrollerOf(node: HTMLElement): HTMLElement | Window {
  for (let element = node.parentElement; element && element !== document.body && element !== document.documentElement; element = element.parentElement) {
    const { overflowY } = getComputedStyle(element);
    if ((overflowY === "auto" || overflowY === "scroll") && element.scrollHeight > element.clientHeight) return element;
  }
  return window;
}

export interface ScrollHeaderProps extends ComponentProps<"header"> {
  /** What the bar sits on at rest: "light" is light text over a dark hero, "dark" is dark text over a light one. */
  tone?: "light" | "dark";
  /** How far the page scrolls, in px, before the bar turns solid. */
  threshold?: number;
  /** Fix the state instead of reading the scroll: for a preview, a story or a test. */
  scrolled?: boolean;
}

/**
 * The bar itself: one passive scroll listener on the page (or on the nearest
 * scrolling layout) that sets data-scrolled on the header, and the classes
 * that follow it. The state starts from the real scroll position, read before
 * the first paint, so a page that opens already scrolled never flashes the
 * see-through bar over its content. At rest with a light tone the text is white
 * and the bar speaks the dark theme's tokens, so its buttons and its focus ring
 * are legible on a photograph without any colour of their own; with a dark tone
 * on a page in the dark theme it speaks neutral light ones. Once solid it
 * hands everything back to the page.
 */
export function ScrollHeader({ tone = "light", threshold = 24, scrolled, className, children, ...props }: ScrollHeaderProps) {
  const ref = useRef<HTMLElement>(null);
  const [measured, setMeasured] = useState(false);
  const solid = scrolled ?? measured;

  useBeforePaint(() => {
    const node = ref.current;
    if (!node || scrolled !== undefined) return;
    const scroller = scrollerOf(node);
    const read = () => setMeasured((scroller instanceof Window ? scroller.scrollY : scroller.scrollTop) > threshold);
    read();
    scroller.addEventListener("scroll", read, { passive: true });
    return () => scroller.removeEventListener("scroll", read);
  }, [scrolled, threshold]);

  return (
    <header
      ref={ref}
      data-slot="navbar-transparent"
      data-scrolled={solid}
      data-tone={tone}
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b transition-[background-color,border-color,color] duration-200 motion-reduce:transition-none",
        solid ? "border-border bg-background text-foreground" : cn("border-transparent bg-transparent", tone === "light" ? "dark text-white" : cn("text-foreground", LIGHT_IN_DARK)),
        className,
      )}
      {...props}
    >
      {children}
    </header>
  );
}
