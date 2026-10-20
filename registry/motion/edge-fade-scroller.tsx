"use client";

import { useEffect, useLayoutEffect, useRef, type ComponentProps, type CSSProperties, type FocusEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface EdgeFadeScrollerProps extends Omit<ComponentProps<"div">, "ref" | "children"> {
  /** The content that scrolls. */
  children: ReactNode;
  /** The direction it scrolls. */
  orientation?: "horizontal" | "vertical";
  /** How wide the fade is, in pixels, once you are at least that far from the edge. Closer in, it is proportionally smaller. */
  fadeSize?: number;
  /** Called when the scroll reaches the end, once per arrival: load the next page here. */
  onReachEnd?: () => void;
  /** Makes the box a labelled region you can focus and scroll with the keyboard. Use it when nothing inside is focusable. */
  label?: string;
  /** Hide the browser scrollbar, as for a row of chips. Defaults to true for horizontal, false for vertical. */
  hideScrollbar?: boolean;
}

/**
 * The fade is a mask, and a mask clips whatever its box paints outside itself, which is exactly where a focus ring (or a
 * shadow) is drawn. So the mask is laid out 6px wider than the box on every side, `no-clip` lifts the clip, and that margin
 * is kept fully opaque: the fade stays where it always was, inside the box, and the ring shows all the way round. The first
 * gradient of each mask is the fade along the scroll axis, the second only lights the margin across it.
 */
const MASK_SPILL = "[mask-size:calc(100%+12px)_calc(100%+12px)] [mask-position:-6px_-6px] [mask-repeat:no-repeat] [mask-clip:no-clip]";
const MASK_HORIZONTAL =
  "[mask-image:linear-gradient(to_right,#000_6px,transparent_6px,#000_calc(6px+var(--rhs-fade-start,0px)),#000_calc(100%-6px-var(--rhs-fade-end,0px)),transparent_calc(100%-6px),#000_calc(100%-6px)),linear-gradient(to_bottom,#000_6px,transparent_6px,transparent_calc(100%-6px),#000_calc(100%-6px))]";
const MASK_HORIZONTAL_RTL =
  "[&:dir(rtl)]:[mask-image:linear-gradient(to_left,#000_6px,transparent_6px,#000_calc(6px+var(--rhs-fade-start,0px)),#000_calc(100%-6px-var(--rhs-fade-end,0px)),transparent_calc(100%-6px),#000_calc(100%-6px)),linear-gradient(to_bottom,#000_6px,transparent_6px,transparent_calc(100%-6px),#000_calc(100%-6px))]";
const MASK_VERTICAL =
  "[mask-image:linear-gradient(to_bottom,#000_6px,transparent_6px,#000_calc(6px+var(--rhs-fade-start,0px)),#000_calc(100%-6px-var(--rhs-fade-end,0px)),transparent_calc(100%-6px),#000_calc(100%-6px)),linear-gradient(to_right,#000_6px,transparent_6px,transparent_calc(100%-6px),#000_calc(100%-6px))]";

/**
 * A scroll box that softens its edges only where there is more to see: chip
 * rows, menus, long lists. The fade is a CSS mask whose width follows the
 * scroll position (a pixel of scroll is a pixel of fade, up to `fadeSize`),
 * so it never covers text or catches a click, grows as you move away from an
 * edge, and is gone when nothing overflows. Scrolling itself is native:
 * keyboard, wheel and touch are untouched, and an item focused with the
 * keyboard scrolls to a spot clear of the fade.
 */
export function EdgeFadeScroller({ children, orientation = "horizontal", fadeSize = 40, onReachEnd, label, hideScrollbar, className, style, onFocus, ...props }: EdgeFadeScrollerProps) {
  const box = useRef<HTMLDivElement>(null);
  const reach = useRef(onReachEnd);
  const atEnd = useRef(false);
  const horizontal = orientation === "horizontal";
  const hidden = hideScrollbar ?? horizontal;

  useEffect(() => {
    reach.current = onReachEnd;
  });

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    let frame = 0;
    const measure = (): void => {
      frame = 0;
      const size = horizontal ? el.clientWidth : el.clientHeight;
      const total = horizontal ? el.scrollWidth : el.scrollHeight;
      const position = Math.abs(horizontal ? el.scrollLeft : el.scrollTop);
      const room = Math.max(0, total - size);
      const before = Math.min(fadeSize, Math.max(0, position - 1));
      const after = Math.min(fadeSize, Math.max(0, room - position - 1));
      el.style.setProperty("--rhs-fade-start", `${before}px`);
      el.style.setProperty("--rhs-fade-end", `${after}px`);
      const arrived = room > 0 && room - position <= 2;
      if (arrived && !atEnd.current) reach.current?.();
      atEnd.current = arrived;
    };
    const schedule = (): void => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    el.addEventListener("scroll", schedule, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(el);
    // The box does not resize when its content does, so watch the items too, and look again when they come and go.
    const watched = new Set<Element>();
    const watchChildren = (): void => {
      Array.from(el.children).forEach((child) => {
        if (!watched.has(child)) {
          watched.add(child);
          observer?.observe(child);
        }
      });
      schedule();
    };
    watchChildren();
    const mutations = typeof MutationObserver === "undefined" ? null : new MutationObserver(watchChildren);
    mutations?.observe(el, { childList: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", schedule);
      observer?.disconnect();
      mutations?.disconnect();
    };
  }, [horizontal, fadeSize]);

  // A focused item lands clear of the fade instead of under it: one fade, and room for its ring, from the edge. Scroll padding
  // sets where the browser puts an item it has to scroll to; an item that is already fully in view, but inside the fade, is not
  // scrolled by the browser at all, so the nudge below finishes the job for keyboard focus.
  const clear = fadeSize + 8;
  const scrollPadding: CSSProperties = horizontal ? { scrollPaddingInline: clear } : { scrollPaddingBlock: clear };
  const keepClear = (target: HTMLElement): void => {
    const el = box.current;
    if (!el || target === el) return;
    // Keyboard focus only: a click on a half-faded item should not move the row under the pointer.
    let keyboard = false;
    try {
      keyboard = target.matches(":focus-visible");
    } catch {
      // A browser without :focus-visible keeps its own scrolling.
    }
    if (!keyboard) return;
    requestAnimationFrame(() => {
      if (!el.contains(target)) return;
      const view = el.getBoundingClientRect();
      const item = target.getBoundingClientRect();
      const before = horizontal ? item.left - view.left : item.top - view.top;
      const after = horizontal ? view.right - item.right : view.bottom - item.bottom;
      // Scrolling past either end is a no-op, so an item at the first or last position stays where it is.
      const delta = before < clear ? before - clear : after < clear ? clear - after : 0;
      if (Math.abs(delta) < 1) return;
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      // An absolute target, so a nudge that starts while the previous one is still gliding still ends in the right place.
      el.scrollTo(horizontal ? { left: el.scrollLeft + delta, behavior } : { top: el.scrollTop + delta, behavior });
    });
  };

  return (
    <div
      ref={box}
      data-slot="edge-fade-scroller"
      data-orientation={orientation}
      role={label ? "region" : undefined}
      aria-label={label}
      tabIndex={label ? 0 : undefined}
      className={cn(
        // The ring is drawn outside the box (see MASK_SPILL); a browser that cannot lift the mask clip gets it inside instead.
        "relative min-w-0 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 not-supports-[mask-clip:no-clip]:focus-visible:ring-inset",
        // Room around the content for the focus rings of what is inside, on every side, taken back with a negative margin so the layout is unchanged.
        horizontal ? "relative -m-1 overflow-x-auto overflow-y-hidden p-1" : "relative -m-1 overflow-y-auto overflow-x-hidden p-1",
        hidden && "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        MASK_SPILL,
        horizontal ? MASK_HORIZONTAL : MASK_VERTICAL,
        horizontal && MASK_HORIZONTAL_RTL,
        className,
      )}
      style={{ ...scrollPadding, ...style }}
      onFocus={(event: FocusEvent<HTMLDivElement>) => {
        onFocus?.(event);
        keepClear(event.target as HTMLElement);
      }}
      {...props}
    >
      {children}
    </div>
  );
}
