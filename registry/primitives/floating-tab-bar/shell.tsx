"use client";

import { useEffect, useRef, useState, type ComponentProps, type RefObject } from "react";

import { cn } from "@/lib/utils";

export interface FloatingTabBarShellProps extends ComponentProps<"nav"> {
  /** Slide off the screen while the page scrolls down, and come back on any upward move. */
  hideOnScroll?: boolean;
  /** The element that scrolls, when it is not the page. It must exist before the bar does. */
  scrollRef?: RefObject<HTMLElement | null>;
}

/** How far the page must scroll down, in px, before the bar leaves. A small drift does not hide it. */
const HIDE_AFTER = 12;

/**
 * The fixed frame of the floating tab bar: it pins the island to the bottom of the screen above the home
 * indicator, lets taps through everywhere around it, and slides it away while the reader scrolls down.
 * It is the only part of the bar that needs script, so the bar itself can be rendered on the server.
 */
export function FloatingTabBarShell({ hideOnScroll = false, scrollRef, className, children, onFocus, ...props }: FloatingTabBarShellProps) {
  const nav = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!hideOnScroll) {
      setHidden(false);
      return;
    }
    const source: HTMLElement | Window = scrollRef?.current ?? window;
    const read = () => (source instanceof Window ? source.scrollY : source.scrollTop);
    let last = read();
    let down = 0;
    const onScroll = () => {
      const now = read();
      const delta = now - last;
      last = now;
      // At the very top, and on any move upwards, the bar is there.
      if (now <= 8 || delta < 0) {
        down = 0;
        setHidden(false);
        return;
      }
      down += delta;
      // Someone who tabbed into the bar is using it: it stays.
      const active = document.activeElement;
      const using = active instanceof HTMLElement && Boolean(nav.current?.contains(active)) && active.matches(":focus-visible");
      if (down > HIDE_AFTER && !using) setHidden(true);
    };
    source.addEventListener("scroll", onScroll, { passive: true });
    return () => source.removeEventListener("scroll", onScroll);
  }, [hideOnScroll, scrollRef]);

  return (
    <nav
      ref={nav}
      data-slot="floating-tab-bar"
      data-hidden={hidden ? "" : undefined}
      onFocus={(event) => {
        // Tabbing into a bar that is out of sight brings it back.
        setHidden(false);
        onFocus?.(event);
      }}
      className={cn(
        // 0.5rem at the sides leaves a 320px screen 304px for the island: five items fit with a current label of about seven letters ("Account").
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        "transition-transform duration-300 ease-out data-[hidden]:translate-y-[calc(100%+0.5rem)] motion-reduce:transition-none",
        className,
      )}
      {...props}
    >
      {children}
    </nav>
  );
}
