"use client";

import { useEffect, useRef, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

export interface ScrollProgressProps extends ComponentProps<"div"> {
  /** `page` follows the whole document; `nearest` follows the closest scrolling box, for a panel or a reader. */
  source?: "page" | "nearest";
}

function scrollerOf(element: HTMLElement): HTMLElement | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) return node;
  }
  return null;
}

/**
 * A thin bar that fills as you read. Place it at the top of the page or of a
 * scrolling panel (it is sticky; position it with className). Driven by a
 * CSS scroll timeline where the browser has one, by a passive scroll
 * listener where it does not. Decorative: hidden from assistive technology.
 */
export function ScrollProgress({ source = "page", className, ...props }: ScrollProgressProps) {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = bar.current;
    if (!element || CSS.supports("animation-timeline: scroll()")) return;
    const scroller = source === "nearest" ? scrollerOf(element) : null;
    const update = (): void => {
      const top = scroller ? scroller.scrollTop : scrollY;
      const room = scroller ? scroller.scrollHeight - scroller.clientHeight : document.documentElement.scrollHeight - innerHeight;
      element.style.transform = `scaleX(${room > 0 ? Math.min(1, top / room) : 0})`;
    };
    update();
    const target: HTMLElement | Window = scroller ?? window;
    target.addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    return () => { target.removeEventListener("scroll", update); removeEventListener("resize", update); };
  }, [source]);
  return (
    <div data-slot="scroll-progress" aria-hidden="true" className={cn("sticky top-0 z-40 h-0.5 w-full overflow-clip", className)} {...props}>
      <div
        ref={bar}
        className={cn(
          "h-full w-full origin-left [transform:scaleX(0)] bg-foreground supports-[animation-timeline:scroll()]:[animation-name:var(--animate-rhs-progress)] supports-[animation-timeline:scroll()]:[animation-fill-mode:both] supports-[animation-timeline:scroll()]:[animation-timing-function:linear]",
          source === "page" ? "supports-[animation-timeline:scroll()]:[animation-timeline:scroll(root)]" : "supports-[animation-timeline:scroll()]:[animation-timeline:scroll(nearest)]",
        )}
      />
    </div>
  );
}
