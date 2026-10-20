"use client";

import { useEffect, useRef, useState, type ComponentProps, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

export interface ScrollAwareHeaderProps extends Omit<ComponentProps<"header">, "ref"> {
  /**
   * `hide` slides away while you scroll down and returns when you scroll up.
   * `condense` shrinks its padding and gains a hairline. `solid` turns from
   * transparent to solid.
   */
  behavior?: "hide" | "condense" | "solid";
  /** Pixels of scroll before the header reacts. Defaults to 80 for `hide` and 12 for the others. */
  threshold?: number;
  /** Pixels to stop short of the top of the scroll area, for something fixed above it. */
  offset?: number;
}

function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") return parent;
  }
  return null;
}

/** Scroll distance in one direction that counts as a change of direction, so a jittery trackpad does not flicker the header. */
const TOLERANCE = 6;

/**
 * A sticky header that gets out of the way: it hides on the way down and
 * returns on the way up, or condenses, or turns solid, once the page has
 * scrolled. It never hides while anything inside it has focus, while a menu
 * in it is open, or at the top of the page. It moves on transform only and
 * toggles instantly under reduced motion; the scroll listener is passive and
 * coalesced into one frame. Condensing trades padding for margin, so the page
 * below never shifts.
 */
export function ScrollAwareHeader({ behavior = "hide", threshold, offset = 0, className, style, ...props }: ScrollAwareHeaderProps) {
  const header = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const limit = threshold ?? (behavior === "hide" ? 80 : 12);

  useEffect(() => {
    const node = header.current;
    if (!node) return;
    const scroller = scrollParent(node);
    const source: HTMLElement | Window = scroller ?? window;
    const read = (): number => Math.max(0, scroller ? scroller.scrollTop : window.scrollY);
    let last = read();
    let seen = last;
    let away = false;
    let frame = 0;
    const show = (value: boolean): void => {
      away = value;
      setHidden(value);
    };
    const update = (): void => {
      frame = 0;
      const y = read();
      seen = y;
      setScrolled(y > (behavior === "hide" ? 2 : limit));
      if (behavior === "hide") {
        const open = node.matches(":focus-within") || node.querySelector('[aria-expanded="true"], [data-state="open"]') !== null;
        if (y <= limit || open || y < last - TOLERANCE) {
          show(false);
          last = y;
        } else if (y > last + TOLERANCE) {
          show(true);
          last = y;
        }
      } else last = y;
    };
    const schedule = (): void => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    source.addEventListener("scroll", schedule, { passive: true });
    // Tabbing into a hidden header brings it back at once. The browser has already scrolled to reach the link it
    // focused, which is out of sight above the page, so the header is put in place and the page goes back to where it was.
    const reveal = (): void => {
      const wasAway = away;
      node.style.transition = "none";
      node.style.transform = "none";
      show(false);
      if (wasAway && Math.abs(read() - seen) > 1) {
        if (scroller) scroller.scrollTop = seen;
        else window.scrollTo({ top: seen, behavior: "instant" });
      }
      requestAnimationFrame(() => {
        node.style.transition = "";
        node.style.transform = "";
      });
    };
    node.addEventListener("focusin", reveal);
    return () => {
      cancelAnimationFrame(frame);
      source.removeEventListener("scroll", schedule);
      node.removeEventListener("focusin", reveal);
    };
  }, [behavior, limit]);

  const condensed = behavior === "condense" && scrolled;
  const vars = { top: offset, "--rhs-offset": `${offset}px` } as CSSProperties;

  return (
    <header
      ref={header}
      data-slot="scroll-aware-header"
      data-behavior={behavior}
      data-scrolled={scrolled}
      data-hidden={hidden}
      className={cn(
        "sticky z-40 w-full border-b border-transparent py-[var(--rhs-header-py,1rem)] transition-[transform,padding,margin,background-color,border-color] duration-200 ease-out motion-reduce:transition-none",
        behavior === "hide" && "bg-background",
        scrolled && "border-border bg-background",
        condensed && "py-[var(--rhs-header-py-condensed,0.5rem)] mb-[calc((var(--rhs-header-py,1rem)-var(--rhs-header-py-condensed,0.5rem))*2)]",
        hidden && "[transform:translateY(calc(-100%-var(--rhs-offset,0px)))]",
        className,
      )}
      style={{ ...vars, ...style }}
      {...props}
    />
  );
}
