"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode, type UIEvent } from "react";

import { IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface DragScrollProps extends Omit<ComponentProps<"div">, "ref" | "children" | "className" | "style"> {
  /** The items in the strip: cards, chips or thumbnails. Give them a width; they never shrink. */
  children: ReactNode;
  /** Names the strip for assistive technology. It is a focusable region you can scroll with the arrow keys. */
  label: string;
  /** Settle on the start edge or the centre of an item as you scroll. */
  snap?: false | "start" | "center";
  /** Space between items, in pixels. */
  gap?: number;
  /** Previous and next buttons at the edges. They appear only on devices with a fine pointer, and only where there is more to scroll. */
  arrows?: boolean;
  /** Styles the wrapper. Every other prop goes to the scrolling strip. */
  className?: string;
}

const reduced = (): boolean => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A horizontal strip of cards, chips or thumbnails that also scrolls by
 * grabbing it with a mouse or pen, with a short glide when you let go, or by
 * snapping to the next item when `snap` is on. A drag never clicks the item
 * under it. Touch keeps its native scrolling; the strip is a labelled region
 * that scrolls by item with the arrow keys, Home and End; the wheel moves it
 * sideways only while the pointer is over it, no modifier is held and there
 * is room to move, so the page is never trapped.
 */
export function DragScroll({ children, label, snap = false, gap = 12, arrows = false, className, onScroll, onKeyDown, ...props }: DragScrollProps) {
  const strip = useRef<HTMLDivElement>(null);
  const drag = useRef({ id: -1, x: 0, left: 0, moved: false, velocity: 0, last: 0, time: 0 });
  const motion = useRef({ frame: 0, settle: 0, blocked: false, wheelUntil: 0 });
  const [dragging, setDragging] = useState(false);
  const [edges, setEdges] = useState({ previous: false, next: false });

  const measure = (): void => {
    const el = strip.current;
    if (!el) return;
    const previous = el.scrollLeft > 2;
    const next = el.scrollLeft < el.scrollWidth - el.clientWidth - 2;
    setEdges((now) => (now.previous === previous && now.next === next ? now : { previous, next }));
  };

  /** Where each item would rest, in scroll positions. */
  const stops = (el: HTMLElement): number[] => {
    const max = el.scrollWidth - el.clientWidth;
    const padding = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
    return Array.from(el.children).map((child) => {
      const item = child as HTMLElement;
      const left = snap === "center" ? item.offsetLeft - (el.clientWidth - item.offsetWidth) / 2 : item.offsetLeft - padding;
      return Math.min(max, Math.max(0, left));
    });
  };

  /** One step: to the next or previous item (always when snapping, and for the keyboard), or most of a screenful for the buttons of a free strip. */
  const go = (direction: 1 | -1, step: "item" | "page" = "page"): void => {
    const el = strip.current;
    if (!el) return;
    const here = el.scrollLeft;
    const max = el.scrollWidth - el.clientWidth;
    const byItem = snap || step === "item";
    const all = byItem ? stops(el) : [];
    const target = byItem ? (direction > 0 ? all.find((stop) => stop > here + 2) ?? max : [...all].reverse().find((stop) => stop < here - 2) ?? 0) : here + direction * el.clientWidth * 0.8;
    el.scrollTo({ left: target, behavior: reduced() ? "auto" : "smooth" });
  };

  const release = (event: PointerEvent<HTMLDivElement>): void => {
    const el = strip.current;
    const state = drag.current;
    if (!el || event.pointerId !== state.id) return;
    state.id = -1;
    if (!state.moved) return;
    setDragging(false);
    if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
    motion.current.blocked = true;
    window.setTimeout(() => (motion.current.blocked = false), 0);
    if (snap) {
      // Settle on the nearest item, then hand snapping back to the browser.
      const all = stops(el);
      const nearest = all.reduce((best, stop) => (Math.abs(stop - el.scrollLeft) < Math.abs(best - el.scrollLeft) ? stop : best), all[0] ?? 0);
      el.scrollTo({ left: nearest, behavior: reduced() ? "auto" : "smooth" });
      motion.current.settle = window.setTimeout(() => (el.style.scrollSnapType = ""), reduced() ? 0 : 450);
    } else {
      el.style.scrollSnapType = "";
      // A flick glides on for a moment, and never far.
      let velocity = Math.max(-2.5, Math.min(2.5, state.velocity));
      if (reduced() || Math.abs(velocity) <= 0.1) return;
      let before = performance.now();
      const tick = (now: number): void => {
        const elapsed = Math.min(32, now - before);
        before = now;
        el.scrollLeft += velocity * elapsed;
        velocity *= Math.pow(0.92, elapsed / 16);
        if (Math.abs(velocity) > 0.03 && el.scrollLeft > 0 && el.scrollLeft < el.scrollWidth - el.clientWidth) motion.current.frame = requestAnimationFrame(tick);
      };
      motion.current.frame = requestAnimationFrame(tick);
    }
  };

  useLayoutEffect(measure);

  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(el);
    // Wheel: sideways only while there is room that way, so the page is never trapped.
    const wheel = (event: WheelEvent): void => {
      if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey || event.defaultPrevented) return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      const forward = event.deltaY > 0;
      if (max <= 1 || (forward ? el.scrollLeft >= max - 1 : el.scrollLeft <= 1)) return;
      event.preventDefault();
      if (snap) {
        // One item per wheel gesture: a single notch is too small to leave a snap point.
        const now = performance.now();
        if (now < motion.current.wheelUntil) return;
        motion.current.wheelUntil = now + 260;
        go(forward ? 1 : -1);
      } else el.scrollLeft += event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      observer?.disconnect();
      el.removeEventListener("wheel", wheel);
      cancelAnimationFrame(motion.current.frame);
      window.clearTimeout(motion.current.settle);
    };
    // Installed again when `snap` changes, because the wheel steps by snap points. `go` and `measure` only read refs.
  }, [snap]);

  const arrow = "absolute inset-y-0 z-10 my-auto hidden rounded-full bg-background shadow-sm transition-opacity duration-200 motion-reduce:transition-none [@media(pointer:fine)]:inline-flex data-[visible=false]:pointer-events-none data-[visible=false]:opacity-0";

  return (
    <div data-slot="drag-scroll" className={cn("relative", className)}>
      <div
        ref={strip}
        role="region"
        aria-label={label}
        tabIndex={0}
        data-dragging={dragging || undefined}
        data-scrollable={edges.previous || edges.next || undefined}
        {...props}
        onScroll={(event: UIEvent<HTMLDivElement>) => {
          onScroll?.(event);
          measure();
        }}
        onLoadCapture={measure}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.target !== event.currentTarget) return;
          const el = event.currentTarget;
          if (event.key === "ArrowRight") go(1, "item");
          else if (event.key === "ArrowLeft") go(-1, "item");
          else if (event.key === "Home") el.scrollTo({ left: 0, behavior: reduced() ? "auto" : "smooth" });
          else if (event.key === "End") el.scrollTo({ left: el.scrollWidth, behavior: reduced() ? "auto" : "smooth" });
          else return;
          event.preventDefault();
        }}
        onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
          const el = event.currentTarget;
          if (event.pointerType === "touch" || event.button !== 0 || (event.target as HTMLElement).closest("input, textarea, select, [contenteditable='true']")) return;
          cancelAnimationFrame(motion.current.frame);
          window.clearTimeout(motion.current.settle);
          motion.current.blocked = false;
          drag.current = { id: event.pointerId, x: event.clientX, left: el.scrollLeft, moved: false, velocity: 0, last: event.clientX, time: performance.now() };
        }}
        onPointerMove={(event: PointerEvent<HTMLDivElement>) => {
          const el = event.currentTarget;
          const state = drag.current;
          if (event.pointerId !== state.id) return;
          const moved = event.clientX - state.x;
          if (!state.moved) {
            if (Math.abs(moved) < 4) return;
            state.moved = true;
            setDragging(true);
            el.setPointerCapture(event.pointerId);
            el.style.scrollSnapType = "none";
          }
          el.scrollLeft = state.left - moved;
          const now = performance.now();
          if (now > state.time) state.velocity = state.velocity * 0.7 + ((state.last - event.clientX) / (now - state.time)) * 0.3;
          state.last = event.clientX;
          state.time = now;
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onClickCapture={(event: MouseEvent<HTMLDivElement>) => {
          if (!motion.current.blocked) return;
          event.preventDefault();
          event.stopPropagation();
        }}
        onDragStart={(event) => event.preventDefault()}
        style={{ gap }}
        className={cn(
          // Room all round for focus rings, taken back with a negative margin so the layout is unchanged.
          "relative -m-1 flex scroll-p-1 overflow-x-auto overscroll-x-contain p-1 outline-none [scrollbar-width:none] focus-visible:ring-[3px] focus-visible:ring-ring/40 [&::-webkit-scrollbar]:hidden [&>*]:shrink-0",
          "data-[scrollable=true]:[@media(pointer:fine)]:cursor-grab data-[dragging=true]:cursor-grabbing data-[dragging=true]:select-none",
          snap === "start" && "snap-x snap-mandatory [&>*]:snap-start",
          snap === "center" && "snap-x snap-mandatory [&>*]:snap-center",
        )}
      >
        {children}
      </div>
      {arrows ? (
        <>
          <Button type="button" variant="outline" size="icon" tabIndex={-1} aria-label="Scroll left" data-visible={edges.previous} aria-hidden={!edges.previous || undefined} onClick={() => go(-1)} className={cn(arrow, "left-2")}>
            <IconChevronLeft />
          </Button>
          <Button type="button" variant="outline" size="icon" tabIndex={-1} aria-label="Scroll right" data-visible={edges.next} aria-hidden={!edges.next || undefined} onClick={() => go(1)} className={cn(arrow, "right-2")}>
            <IconChevronRight />
          </Button>
        </>
      ) : null}
    </div>
  );
}
