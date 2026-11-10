"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from "react";

import { IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface CategoryStripScrollerProps {
  /** The list of categories. Every item that can take focus carries `data-category`. */
  children: ReactNode;
  /** The id of the current category. When it changes, the strip scrolls it into view. */
  currentKey?: string;
  className?: string;
}

const reduced = (): boolean => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The item that is current, on a link or on a button. */
const CURRENT = "[aria-current='page'], [aria-pressed='true']";
/** How far the current item keeps from the edge of the strip: the fade is fully opaque 64px in, and the arrow (32px) sits inside that. */
const CLEARANCE = 64;
/** A few pixels into the fade are not worth moving the row for: it would uncover an arrow and a fade on the other side for nothing. */
const TOLERANCE = 8;

const ARROW =
  "absolute top-[calc(50%-0.125rem)] z-20 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-xs outline-none transition-colors duration-150 hover:bg-muted motion-reduce:transition-none [@media(hover:hover)]:inline-flex [&_svg]:size-4";

/**
 * The scrolling part of CategoryStrip: fade edges and arrows that show only where more is hidden, dragging with a
 * mouse that glides on when you let go (touch keeps its own momentum), the arrow keys, Home and End between the
 * items, and the current item scrolled into view when it changes. When the row first appears and the current item
 * sits in a fade (or behind an arrow), it is centred, and that is checked again while the row settles (a web font
 * widening every label) until the person scrolls, presses a key or focuses an item. It knows nothing about the
 * items: they come as children, drawn on the server.
 */
export function CategoryStripScroller({ children, currentKey, className }: CategoryStripScrollerProps) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ id: -1, x: 0, left: 0, moved: false, velocity: 0, last: 0, time: 0 });
  const blocked = useRef(false);
  const frame = useRef(0);
  const arrived = useRef(false);
  /** The person has taken over (a press, the wheel, a key or focus in the row): the row stops putting the current item back. */
  const adrift = useRef(false);
  /** The current item had to be moved to the middle once; until the person takes over, it is kept there as widths change. */
  const centred = useRef(false);

  const measure = () => {
    const element = track.current;
    if (!element) return;
    const next = { start: element.scrollLeft > 2, end: element.scrollLeft + element.clientWidth < element.scrollWidth - 2 };
    setEdges((now) => (now.start === next.start && now.end === next.end ? now : next));
  };

  /** Where the current item stands: how far it must move to be clear of the fade and the arrow (0 when it is), and how far it is from the middle. */
  const place = (): { element: HTMLDivElement; short: number; off: number } | null => {
    const element = track.current;
    const item = element?.querySelector<HTMLElement>(CURRENT);
    if (!element || !item) return null;
    const view = element.getBoundingClientRect();
    const box = item.getBoundingClientRect();
    // On a strip too narrow for the full clearance the item has to be in the middle anyway.
    const margin = Math.min(CLEARANCE, Math.max(0, (view.width - box.width) / 2));
    const before = box.left - view.left - margin;
    const after = box.right - view.right + margin;
    return { element, short: before < -TOLERANCE ? before : after > TOLERANCE ? after : 0, off: box.left - view.left - (view.width - box.width) / 2 };
  };

  /** Centres the current item at once when it sits in the fade or behind an arrow (as near as the ends allow), and keeps it there; leaves the row alone while it is clear. False when there is no current item. */
  const centre = (): boolean => {
    const spot = place();
    if (!spot) return false;
    if (spot.short) centred.current = true;
    if (centred.current && Math.abs(spot.off) > 1) spot.element.scrollBy({ left: spot.off, behavior: "auto" });
    return true;
  };

  /** Moves the current item into the clear, only as far as it must. */
  const bring = () => {
    const spot = place();
    if (spot?.short) spot.element.scrollBy({ left: spot.short, behavior: reduced() ? "auto" : "smooth" });
  };

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    measure();
    // Until the person takes over, a change in widths keeps the current item where it was put.
    const settle = () => {
      measure();
      if (!adrift.current) centre();
    };
    const observer = new ResizeObserver(settle);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    // A web font arriving changes every width.
    void document.fonts?.ready.then(settle);
    const take = () => {
      adrift.current = true;
    };
    const events = ["pointerdown", "wheel", "keydown", "focusin"] as const;
    for (const type of events) element.addEventListener(type, take, { capture: true, passive: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame.current);
      for (const type of events) element.removeEventListener(type, take, { capture: true });
    };
    // `measure` and `centre` read refs and set state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The current category is in view inside the strip, never the page: centred the first time if it has to move, and later only as far as it must.
  useLayoutEffect(() => {
    if (!arrived.current) arrived.current = centre();
    else bring();
    // `centre` and `bring` read refs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey]);

  const nudge = (direction: 1 | -1) => {
    const element = track.current;
    adrift.current = true;
    if (element) element.scrollBy({ left: direction * element.clientWidth * 0.7, behavior: reduced() ? "auto" : "smooth" });
  };

  function release(event: PointerEvent<HTMLDivElement>) {
    const element = track.current;
    const state = drag.current;
    if (!element || event.pointerId !== state.id) return;
    state.id = -1;
    if (!state.moved) return;
    setDragging(false);
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
    // The click that follows a drag belongs to the drag, not to the item under the pointer.
    blocked.current = true;
    window.setTimeout(() => (blocked.current = false), 0);
    // A flick glides on for a moment, and never far.
    let velocity = Math.max(-2.5, Math.min(2.5, state.velocity));
    if (reduced() || Math.abs(velocity) < 0.1) return;
    let before = performance.now();
    const tick = (now: number) => {
      const elapsed = Math.min(32, now - before);
      before = now;
      element.scrollLeft += velocity * elapsed;
      velocity *= Math.pow(0.92, elapsed / 16);
      if (Math.abs(velocity) > 0.03 && element.scrollLeft > 0 && element.scrollLeft < element.scrollWidth - element.clientWidth) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }

  function keys(event: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("[data-category]"));
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (at === -1) return;
    const next = event.key === "ArrowRight" ? at + 1 : event.key === "ArrowLeft" ? at - 1 : event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    items[Math.min(items.length - 1, Math.max(0, next))]?.focus();
  }

  const fade =
    edges.start && edges.end
      ? "[mask-image:linear-gradient(90deg,transparent,transparent_1.25rem,#000_4rem,#000_calc(100%-4rem),transparent_calc(100%-1.25rem),transparent)]"
      : edges.start
        ? "[mask-image:linear-gradient(90deg,transparent,transparent_1.25rem,#000_4rem)]"
        : edges.end
          ? "[mask-image:linear-gradient(90deg,#000_calc(100%-4rem),transparent_calc(100%-1.25rem),transparent)]"
          : null;

  return (
    <div data-slot="category-strip-scroller" className={cn("relative", className)}>
      {edges.start ? (
        <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => nudge(-1)} className={cn(ARROW, "left-0")}>
          <IconChevronLeft />
        </button>
      ) : null}
      <div
        ref={track}
        data-dragging={dragging || undefined}
        onScroll={measure}
        onKeyDown={keys}
        onDragStart={(event) => event.preventDefault()}
        onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
          if (event.pointerType !== "mouse" || event.button !== 0) return;
          cancelAnimationFrame(frame.current);
          drag.current = { id: event.pointerId, x: event.clientX, left: event.currentTarget.scrollLeft, moved: false, velocity: 0, last: event.clientX, time: performance.now() };
        }}
        onPointerMove={(event: PointerEvent<HTMLDivElement>) => {
          const state = drag.current;
          if (event.pointerId !== state.id) return;
          const moved = event.clientX - state.x;
          if (!state.moved) {
            if (Math.abs(moved) < 5) return;
            state.moved = true;
            setDragging(true);
            event.currentTarget.setPointerCapture(event.pointerId);
          }
          event.currentTarget.scrollLeft = state.left - moved;
          const now = performance.now();
          if (now > state.time) state.velocity = state.velocity * 0.7 + ((state.last - event.clientX) / (now - state.time)) * 0.3;
          state.last = event.clientX;
          state.time = now;
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onClickCapture={(event: MouseEvent<HTMLDivElement>) => {
          if (!blocked.current) return;
          event.preventDefault();
          event.stopPropagation();
        }}
        // scroll-padding keeps an item reached by the keyboard clear of the fade and the arrow (the arrows only exist where there is a hover).
        className={cn("relative overflow-x-auto overscroll-x-contain scroll-px-16 [@media(hover:hover)]:scroll-px-24 [scrollbar-width:none] data-[dragging=true]:cursor-grabbing data-[dragging=true]:select-none [&::-webkit-scrollbar]:hidden", fade)}
      >
        {children}
      </div>
      {edges.end ? (
        <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => nudge(1)} className={cn(ARROW, "right-0")}>
          <IconChevronRight />
        </button>
      ) : null}
    </div>
  );
}
