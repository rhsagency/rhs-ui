"use client";

import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from "react";

import { IconArrowLeftRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export type ImageSequenceMode = "drag" | "hover";

export interface ImageSequenceLabels {
  /** The hint on the picture until the first interaction. Default "Drag to rotate", or "Move across to scrub" in hover mode. */
  hint?: string;
  /** What a screen reader hears as the value; `{n}` is the frame and `{total}` how many there are. Default "Frame {n} of {total}". */
  valueText?: string;
}

export interface ImageSequenceProps extends Omit<ComponentProps<"div">, "children" | "onChange" | "defaultValue"> {
  /** The addresses of the frames, in order. Keep the array stable between renders: the frames are preloaded when it changes. */
  frames: readonly string[];
  /** What the picture shows, and so the name of the viewer: "Kestrel speaker, turning". Required. */
  alt: string;
  /** `drag` turns the picture as the pointer is dragged, like a turntable. `hover` maps the pointer's place along the picture to a frame, like a scrubbable preview. Default "drag". */
  mode?: ImageSequenceMode;
  /** Carry on past the last frame to the first, and back. Default true for `drag` (a turn has no end) and false for `hover`. */
  loop?: boolean;
  /** Turn the picture once, slowly, the first time it is on screen, as a hint that it moves. For `drag` only, and never under reduced motion. Default false. */
  autoRotate?: boolean;
  /** How far a drag turns it: 1 means dragging across the whole picture shows every frame once. Higher turns faster. Default 1. */
  sensitivity?: number;
  /** The frame to start on, counted from 0. Default 0. */
  defaultFrame?: number;
  /** Called with the index of the frame (from 0) each time it changes. */
  onFrameChange?: (index: number) => void;
  /** The shape of the frame as width divided by height. Default 4 / 3. */
  aspect?: number;
  /** How a frame fits the box. Default "contain", so a product is never cropped. */
  fit?: "cover" | "contain";
  /** The hint and the spoken value, for another language. */
  labels?: ImageSequenceLabels;
}

const wrap = (n: number, total: number): number => ((n % total) + total) % total;
const clamp = (n: number, low: number, high: number): number => Math.min(high, Math.max(low, n));

/** How long the one slow turn of `autoRotate` takes, in milliseconds. */
const TURN_MS = 3600;
/** How many frames are fetched at a time after the first. */
const BATCH = 4;

/**
 * A set of frames you scrub with the pointer: a 360-degree product spin you
 * drag, a flipbook, or a video preview that follows the cursor. The pointer
 * drives it, not the scroll: dragging (or, in hover mode, moving across) the
 * picture picks the frame. The first frame shows at once and the others are
 * fetched behind it in small batches, with a thin line along the top while they
 * come in; until a frame has arrived the nearest one that has stays up, so
 * nothing blinks. For the keyboard and assistive technology the picture is a
 * slider: Left and Right (or Up and Down) step one frame, Page Up and Page Down
 * ten percent, Home and End jump to the ends, and it reads "Frame 12 of 36".
 * A hint ("Drag to rotate") goes away at the first touch, and `autoRotate`, one
 * slow turn on first view, never runs for a visitor who prefers reduced motion.
 * Vertical swipes still scroll the page on a phone.
 */
export function ImageSequence({ frames, alt, mode = "drag", loop = mode === "drag", autoRotate = false, sensitivity = 1, defaultFrame = 0, onFrameChange, aspect = 4 / 3, fit = "contain", labels, className, onKeyDown, ...props }: ImageSequenceProps) {
  const total = frames.length;
  const text = {
    hint: labels?.hint ?? (mode === "drag" ? "Drag to rotate" : "Move across to scrub"),
    valueText: labels?.valueText ?? "Frame {n} of {total}",
  };
  const start = total ? clamp(Math.round(defaultFrame), 0, total - 1) : 0;
  const [index, setIndex] = useState(start);
  const [touched, setTouched] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [arrived, setArrived] = useState(0);
  const here = useRef(start);
  const position = useRef(start);
  const drag = useRef<{ x: number; from: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const got = useRef(new Set<number>());
  const spun = useRef(false);
  const notify = useRef(onFrameChange);
  useEffect(() => {
    notify.current = onFrameChange;
  });

  const show = (next: number) => {
    if (next === here.current) return;
    here.current = next;
    setIndex(next);
    notify.current?.(next);
  };
  /** Move to a place along the turn, as a number that may run past the ends: a loop wraps it, anything else stops at them. */
  const place = (at: number) => {
    position.current = at;
    show(loop ? wrap(Math.round(at), total) : clamp(Math.round(at), 0, total - 1));
  };
  const jump = (to: number) => {
    position.current = to;
    show(to);
  };

  // The frames arrive behind the first, a few at a time. The Image objects stay referenced so every one is in the cache when it is wanted.
  const signature = `${total}|${frames[0] ?? ""}|${frames[total - 1] ?? ""}`;
  useEffect(() => {
    let stopped = false;
    const kept: HTMLImageElement[] = [];
    got.current = new Set();
    setArrived(0);
    const preload = (i: number) =>
      new Promise<void>((resolve) => {
        const image = new Image();
        image.decoding = "async";
        const done = (ok: boolean) => {
          if (!stopped) {
            if (ok) got.current.add(i);
            setArrived((n) => n + 1);
          }
          resolve();
        };
        image.onload = () => done(true);
        image.onerror = () => done(false);
        image.src = frames[i] ?? "";
        kept.push(image);
      });
    void (async () => {
      if (!total) return;
      await preload(start);
      const rest = Array.from({ length: total }, (_, i) => i).filter((i) => i !== start);
      for (let i = 0; i < rest.length && !stopped; i += BATCH) await Promise.all(rest.slice(i, i + BATCH).map(preload));
    })();
    return () => {
      stopped = true;
    };
    // The frames themselves are read once per signature: a new array of the same frames is not a new set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const ready = total > 0 && arrived >= total;

  // One slow turn, the first time the picture is mostly on screen and has all its frames.
  useEffect(() => {
    const element = box.current;
    if (!autoRotate || mode !== "drag" || total < 2 || !ready || touched || spun.current || !element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const origin = position.current;
    const tick = (now: number, began: number) => {
      const t = Math.min(1, (now - began) / TURN_MS);
      place(origin + (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2) * total);
      if (t < 1) frame = requestAnimationFrame((time) => tick(time, began));
      else spun.current = true;
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        frame = requestAnimationFrame((time) => tick(time, time));
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
    // `place` is rebuilt every render and reads only refs and the props named here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRotate, mode, total, ready, touched, loop]);

  const scrub = (event: PointerEvent<HTMLDivElement>) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect?.width) return;
    jump(clamp(Math.floor(((event.clientX - rect.left) / rect.width) * total), 0, total - 1));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!total || (event.pointerType === "mouse" && event.button !== 0)) return;
    setTouched(true);
    if (mode === "hover") return scrub(event);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // The pointer is already gone: nothing to capture.
    }
    drag.current = { x: event.clientX, from: position.current };
    setDragging(true);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!total) return;
    if (mode === "hover") {
      setTouched(true);
      return scrub(event);
    }
    const grab = drag.current;
    const width = box.current?.clientWidth;
    if (grab && width) place(grab.from + ((event.clientX - grab.x) / width) * total * sensitivity);
  };
  const onPointerEnd = () => {
    drag.current = null;
    setDragging(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !total || event.altKey || event.ctrlKey || event.metaKey) return;
    const by = (delta: number) => jump(loop ? wrap(here.current + delta, total) : clamp(here.current + delta, 0, total - 1));
    const page = Math.max(1, Math.round(total / 10));
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        by(1);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        by(-1);
        break;
      case "PageUp":
        by(page);
        break;
      case "PageDown":
        by(-page);
        break;
      case "Home":
        jump(0);
        break;
      case "End":
        jump(total - 1);
        break;
      default:
        return;
    }
    event.preventDefault();
    setTouched(true);
  };

  // The picture on show: the frame wanted if it has arrived, otherwise the nearest one that has.
  let shown = index;
  if (!got.current.has(index)) {
    for (let step = 1; step < total; step++) {
      const around = [index - step, index + step].map((i) => (loop ? wrap(i, total) : i)).find((i) => got.current.has(i));
      if (around !== undefined) {
        shown = around;
        break;
      }
    }
  }
  const percent = total > 1 ? (index / (total - 1)) * 100 : 0;

  return (
    <div
      ref={box}
      data-slot="image-sequence"
      data-mode={mode}
      data-dragging={dragging ? "true" : "false"}
      role="slider"
      tabIndex={0}
      aria-label={alt}
      aria-orientation="horizontal"
      aria-valuemin={1}
      aria-valuemax={Math.max(1, total)}
      aria-valuenow={index + 1}
      aria-valuetext={total ? text.valueText.replace("{n}", String(index + 1)).replace("{total}", String(total)) : undefined}
      aria-busy={total > 0 && !ready ? true : undefined}
      style={{ aspectRatio: aspect }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onPointerLeave={(event) => {
        if (mode === "hover" && event.pointerType === "mouse") jump(start);
      }}
      onKeyDown={handleKeyDown}
      className={cn(
        "group/seq relative w-full touch-pan-y overflow-hidden rounded-xl border border-border bg-muted outline-none select-none",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
        mode === "drag" ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-ew-resize",
        className,
      )}
      {...props}
    >
      {total ? <img src={frames[shown]} alt="" draggable={false} decoding="async" className={cn("size-full", fit === "cover" ? "object-cover" : "object-contain")} /> : null}
      <span aria-hidden="true" className={cn("pointer-events-none absolute inset-x-0 top-0 h-0.5 transition-opacity duration-300 motion-reduce:transition-none", ready ? "opacity-0" : "opacity-100")}>
        <span className="block h-full bg-foreground/70 transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${total ? (arrived / total) * 100 : 0}%` }} />
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-foreground/10 opacity-0 transition-opacity duration-200 group-hover/seq:opacity-100 group-focus-visible/seq:opacity-100 group-data-[dragging=true]/seq:opacity-100 motion-reduce:transition-none"
      >
        <span className="block h-full bg-foreground" style={{ width: `${percent}%` }} />
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium whitespace-nowrap text-foreground shadow-xs transition-opacity duration-300 motion-reduce:transition-none",
          touched && "opacity-0",
        )}
      >
        <IconArrowLeftRight className="size-3.5" />
        {text.hint}
      </span>
    </div>
  );
}
