"use client";

import { useCallback, useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from "react";

import { IconImage, IconRotateCcw, IconZoomIn, IconZoomOut } from "@rhs-ui/icons";
import {
  centredCrop,
  keepInside,
  layoutOf,
  resizeFrame,
  settleCrop,
  toCrop,
  zoomCrop,
  zoomOf,
  type CropRect,
  type Frame,
  type Handle,
  type ImageCrop,
  type Layout,
} from "@rhs-ui/application/image-cropper/crop";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Button } from "@rhs-ui/primitives/button";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { Slider } from "@rhs-ui/primitives/slider";
import { cn } from "@/lib/utils";

export type { CropRect, ImageCrop };
export type { CropToBlobOptions } from "@rhs-ui/application/image-cropper/crop";

/** The words the cropper uses, for translation. `{left}`, `{top}`, `{zoom}`, `{width}` and `{height}` are filled in. */
export interface ImageCropperLabels {
  /** The name of the crop frame for a screen reader. Default "Crop frame". */
  frame?: string;
  /** What a screen reader hears as the frame's value. Default "{left}% from the left, {top}% from the top". */
  position?: string;
  /** Said after the position. Default "zoom {zoom}%". */
  zoomed?: string;
  /** The instructions a screen reader reads with the frame. */
  help?: string;
  /** The name of the zoom slider. Default "Zoom". */
  zoom?: string;
  /** The name of the zoom out button. Default "Zoom out". */
  zoomOut?: string;
  /** The name of the zoom in button. Default "Zoom in". */
  zoomIn?: string;
  /** The button that restores the centred fit. Default "Reset". */
  reset?: string;
  /** Said after a reset. Default "Crop reset to the centre".  */
  resetDone?: string;
  /** The size of the crop in image pixels. Default "Crop {width} × {height} px". */
  size?: string;
  /** The heading of the error. Default "The image could not be loaded". */
  failed?: string;
  /** The reason when the browser is offline. Default "You appear to be offline. Reconnect and try again." */
  offline?: string;
  /** The reason when the picture is a file that is not an image. Default "The file is not an image the browser can read. Try a JPG, PNG or WebP." */
  unreadable?: string;
  /** The reason otherwise. Default "The address did not return an image. Check the link, or choose another picture." */
  missing?: string;
  /** The button that tries again. Default "Try again". */
  retry?: string;
}

export interface ImageCropperProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The address of the picture to crop. A new address starts over. */
  src: string;
  /** What the picture shows, for people who cannot see it. */
  alt: string;
  /** The crop, when you control it: a rectangle in source pixels and the zoom. `null` means none yet, and the cropper reports the centred one. */
  value?: ImageCrop | null;
  /** The crop to start with, when you do not control it. */
  defaultValue?: ImageCrop;
  /** Called with `{ x, y, width, height, zoom }` as the crop moves: the rectangle is in the picture's own pixels, so a server or `cropToBlob` can do the cut. It is also called once when the picture has loaded, and whenever a change of `aspect` or `shape` makes a new crop. Round the numbers before a server cuts with them. */
  onValueChange?: (crop: ImageCrop) => void;
  /** The shape of the frame as width divided by height (1, 4 / 3, 16 / 9), or "free" to let people drag the frame's edges. Default 1. */
  aspect?: number | "free";
  /** The least zoom. The picture always covers the frame, so this is 1 or more. Default 1. */
  minZoom?: number;
  /** The most zoom: 4 means a crop a quarter as wide as the largest of its shape. Default 4. */
  maxZoom?: number;
  /** `round` is a circle, for avatars: it is always 1:1. Default `rect`. */
  shape?: "rect" | "round";
  /** Called with the picture's element once it has loaded: give it to `cropToBlob(image, crop)`. */
  onReady?: (image: HTMLImageElement) => void;
  /** For a picture from another site that sends the right headers: without it `cropToBlob` is refused by the browser. */
  crossOrigin?: "anonymous" | "use-credentials";
  /** Turns the cropper off. */
  disabled?: boolean;
  /** The language of the numbers in messages. Default "en-US". */
  locale?: string;
  /** The words the cropper uses, for translation. */
  labels?: ImageCropperLabels;
}

const DEFAULT_LABELS = {
  frame: "Crop frame",
  position: "{left}% from the left, {top}% from the top",
  zoomed: "zoom {zoom}%",
  help: "Use the arrow keys to move the crop by 1%, or by 10% with Shift. Press plus or minus to zoom, and Home to start over. With a free shape, hold Alt and use the arrow keys to resize the frame.",
  zoom: "Zoom",
  zoomOut: "Zoom out",
  zoomIn: "Zoom in",
  reset: "Reset",
  resetDone: "Crop reset to the centre",
  size: "Crop {width} × {height} px",
  failed: "The image could not be loaded",
  offline: "You appear to be offline. Reconnect and try again.",
  unreadable: "The file is not an image the browser can read. Try a JPG, PNG or WebP.",
  missing: "The address did not return an image. Check the link, or choose another picture.",
  retry: "Try again",
} satisfies Required<ImageCropperLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const between = (n: number, low: number, high: number) => Math.min(high, Math.max(low, n));

/** Keeps the pointer while it is dragged outside the stage. A pointer that is no longer active cannot be captured, and that is not worth an error. */
function capture(event: PointerEvent<HTMLElement>) {
  try {
    event.currentTarget.setPointerCapture(event.pointerId);
  } catch {
    // The drag then ends at the edge of the element, which is acceptable.
  }
}

/** The keys that move the crop, as a step along each axis. */
const ARROWS: Readonly<Record<string, readonly [number, number]>> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

/** The frame can not be dragged smaller than this, in stage pixels. */
const MIN_FRAME = 48;

/** The handles of a frame with no fixed shape: a small square on each corner and edge, with a larger place to grab. */
const HANDLES: Readonly<Record<Handle, string>> = {
  nw: "-top-[5px] -left-[5px] cursor-nwse-resize",
  n: "-top-[5px] left-1/2 -translate-x-1/2 cursor-ns-resize",
  ne: "-top-[5px] -right-[5px] cursor-nesw-resize",
  e: "top-1/2 -right-[5px] -translate-y-1/2 cursor-ew-resize",
  se: "-right-[5px] -bottom-[5px] cursor-nwse-resize",
  s: "-bottom-[5px] left-1/2 -translate-x-1/2 cursor-ns-resize",
  sw: "-bottom-[5px] -left-[5px] cursor-nesw-resize",
  w: "top-1/2 -left-[5px] -translate-y-1/2 cursor-ew-resize",
};

/** A resize that is under way: where the frame started and how the picture lay under it. */
interface Resize {
  handle: Handle;
  start: Frame;
  scale: number;
  offsetX: number;
  offsetY: number;
  originX: number;
  originY: number;
}

/** The cropper for one picture: a new `src` mounts a new one, so nothing of the last picture is left behind. */
function Cropper({ src, alt, value, defaultValue, onValueChange, aspect = 1, minZoom = 1, maxZoom = 4, shape = "rect", onReady, crossOrigin, disabled = false, locale = "en-US", labels, className, ...props }: ImageCropperProps) {
  const text: Required<ImageCropperLabels> = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const helpId = `${base}-help`;
  const stage = useRef<HTMLDivElement>(null);
  const frameNode = useRef<HTMLDivElement>(null);
  const taken = useRef<HTMLImageElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const [reason, setReason] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [own, setOwn] = useState<CropRect | null>(defaultValue ?? null);
  const [dragging, setDragging] = useState(false);
  const [gesture, setGesture] = useState<Layout | null>(null);
  const [said, setSaid] = useState("");
  // Changes are animated only once the stage has stopped changing size, so the first layout and a resize of the page never play as a movement.
  const [calm, setCalm] = useState(false);

  const free = shape !== "round" && aspect === "free";
  const fixed: number | null = shape === "round" ? 1 : aspect === "free" ? null : aspect > 0 && Number.isFinite(aspect) ? aspect : 1;
  const low = Math.max(1, minZoom);
  const high = Math.max(low, maxZoom);
  const width = natural?.width ?? 0;
  const height = natural?.height ?? 0;
  const raw: CropRect | null = value !== undefined ? value : own;
  const rect = natural ? settleCrop(raw, width, height, fixed, low, high) : null;
  const measured = size.width > 0 && size.height > 0;
  const ready = status === "ready" && rect !== null && measured;
  const layout: Layout | null = ready && rect ? (gesture ?? layoutOf(rect, size.width, size.height)) : null;
  const zoom = rect ? zoomOf(rect, width, height) : 1;

  useEffect(() => {
    setCalm(false);
    const timer = window.setTimeout(() => setCalm(true), 300);
    return () => window.clearTimeout(timer);
  }, [size.width, size.height, ready]);

  // The latest crop and callbacks, read by handlers that run between renders.
  const live = useRef<CropRect | null>(rect);
  live.current = rect;
  const latest = useRef({ onReady, onValueChange });
  latest.current = { onReady, onValueChange };
  const reported = useRef("");

  // The stage's size decides how big the frame is; it is measured, and again whenever it changes.
  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.contentRect;
      if (box) setSize((current) => (current.width === box.width && current.height === box.height ? current : { width: box.width, height: box.height }));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const loaded = useCallback((node: HTMLImageElement) => {
    // A picture that is already finished is seen twice, by the ref and by the load event: it is taken once.
    if (taken.current === node) return;
    taken.current = node;
    reported.current = "";
    setNatural({ width: node.naturalWidth, height: node.naturalHeight });
    setStatus("ready");
    latest.current.onReady?.(node);
  }, []);

  const failed = useCallback(() => {
    setReason(typeof navigator !== "undefined" && navigator.onLine === false ? text.offline : /^(?:data|blob):/i.test(src) ? text.unreadable : text.missing);
    setStatus("error");
  }, [src, text.offline, text.unreadable, text.missing]);

  // A picture that was finished before this ran (the page came from a server) never says so again.
  const attach = useCallback(
    (node: HTMLImageElement | null) => {
      if (!node?.complete) return;
      if (node.naturalWidth > 0 && node.naturalHeight > 0) loaded(node);
      else failed();
    },
    [loaded, failed],
  );

  function commit(next: CropRect) {
    if (!natural) return;
    const settled = keepInside(next, width, height);
    live.current = settled;
    const crop = toCrop(settled, width, height);
    reported.current = JSON.stringify(crop);
    if (value === undefined) setOwn(settled);
    onValueChange?.(crop);
  }

  // The crop a new picture, a new shape or a saved value settles on is reported once, so the owner always has the crop that is on show.
  const key = rect ? `${rect.x}|${rect.y}|${rect.width}|${rect.height}` : "";
  useEffect(() => {
    if (!natural || !rect) return;
    const crop = toCrop(rect, width, height);
    const signature = JSON.stringify(crop);
    if (signature === reported.current) return;
    reported.current = signature;
    if (value === undefined) setOwn(rect);
    latest.current.onValueChange?.(crop);
  }, [natural, key]);

  function zoomBy(factor: number, at?: { x: number; y: number }) {
    const current = live.current;
    if (!current || !natural || !measured) return;
    const now = zoomOf(current, width, height);
    const target = between(now * factor, low, high);
    if (Math.abs(target - now) < 0.0001) return;
    const { frame } = layoutOf(current, size.width, size.height);
    const focus = at ? { x: between((at.x - frame.left) / frame.width, 0, 1), y: between((at.y - frame.top) / frame.height, 0, 1) } : undefined;
    commit(zoomCrop(current, width, height, target, focus));
  }

  function panBy(dx: number, dy: number) {
    const current = live.current;
    if (!current || !measured) return;
    const { scale } = layoutOf(current, size.width, size.height);
    commit({ ...current, x: current.x - dx / scale, y: current.y - dy / scale });
  }

  function reset() {
    if (!natural) return;
    commit(centredCrop(width, height, fixed));
    setSaid(text.resetDone);
  }

  // A second the message is news; left in the live region it would be read again with the next one.
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 3000);
    return () => window.clearTimeout(timer);
  }, [said]);

  // Ctrl and the wheel zoom the picture (and a pinch on a trackpad arrives as exactly that). It must be a listener that may cancel the page's own zoom, which React's cannot.
  const wheel = useRef<(event: WheelEvent) => void>(() => undefined);
  wheel.current = (event: WheelEvent) => {
    if (disabled || !(event.ctrlKey || event.metaKey) || !stage.current) return;
    event.preventDefault();
    const box = stage.current.getBoundingClientRect();
    // A wheel reports its step in pixels, lines (Firefox) or pages, and one notch of a mouse is a hundred pixels or more. Counted in pixels and capped, a notch zooms by about a third, while the small steps of a trackpad pinch pass unchanged.
    const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1);
    zoomBy(Math.exp(-between(pixels, -30, 30) * 0.01), { x: event.clientX - box.left, y: event.clientY - box.top });
  };
  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const listener = (event: WheelEvent) => wheel.current(event);
    node.addEventListener("wheel", listener, { passive: false });
    return () => node.removeEventListener("wheel", listener);
  }, []);

  // Dragging the picture, and pinching it with two fingers.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; x: number; y: number } | null>(null);
  const measure = () => {
    const [a, b] = [...pointers.current.values()];
    return a && b ? { distance: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : null;
  };

  function onStageDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled || !ready || (event.pointerType === "mouse" && event.button !== 0)) return;
    capture(event);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    pinch.current = pointers.current.size === 2 ? measure() : null;
    setDragging(true);
    frameNode.current?.focus({ preventScroll: true });
  }

  function onStageMove(event: PointerEvent<HTMLDivElement>) {
    const before = pointers.current.get(event.pointerId);
    if (!before) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const now = pointers.current.size >= 2 ? measure() : null;
    if (now && pinch.current && stage.current) {
      const box = stage.current.getBoundingClientRect();
      if (pinch.current.distance > 0) zoomBy(now.distance / pinch.current.distance, { x: now.x - box.left, y: now.y - box.top });
      panBy(now.x - pinch.current.x, now.y - pinch.current.y);
      pinch.current = now;
    } else if (pointers.current.size === 1) {
      panBy(event.clientX - before.x, event.clientY - before.y);
    }
  }

  function onStageUp(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    pinch.current = null;
    if (pointers.current.size === 0) setDragging(false);
  }

  // Dragging the edges and corners of a free frame: the picture stays where it is while the frame moves, and when the hand lets go the frame settles back to fill the stage.
  const resizing = useRef<Resize | null>(null);

  function startResize(handle: Handle, event: PointerEvent<HTMLElement>) {
    const current = live.current;
    if (disabled || !current || !measured) return;
    event.stopPropagation();
    event.preventDefault();
    const start = layoutOf(current, size.width, size.height);
    capture(event);
    resizing.current = { handle, start: start.frame, scale: start.scale, offsetX: start.offsetX, offsetY: start.offsetY, originX: event.clientX, originY: event.clientY };
    setGesture(start);
    setDragging(true);
    frameNode.current?.focus({ preventScroll: true });
  }

  function moveResize(event: PointerEvent<HTMLElement>) {
    const job = resizing.current;
    if (!job || !natural) return;
    // The frame stays on the picture, and on the stage.
    const limits = { left: Math.max(job.offsetX, 0), top: Math.max(job.offsetY, 0), right: Math.min(job.offsetX + width * job.scale, size.width), bottom: Math.min(job.offsetY + height * job.scale, size.height) };
    const frame = resizeFrame(job.start, job.handle, event.clientX - job.originX, event.clientY - job.originY, limits, MIN_FRAME);
    setGesture({ frame, scale: job.scale, offsetX: job.offsetX, offsetY: job.offsetY });
    commit({ x: (frame.left - job.offsetX) / job.scale, y: (frame.top - job.offsetY) / job.scale, width: frame.width / job.scale, height: frame.height / job.scale });
  }

  function endResize() {
    resizing.current = null;
    setGesture(null);
    setDragging(false);
  }

  function onFrameKey(event: KeyboardEvent<HTMLDivElement>) {
    const current = live.current;
    if (disabled || !current || !natural || event.ctrlKey || event.metaKey) return;
    const unit = event.shiftKey ? 0.1 : 0.01;
    const arrow = ARROWS[event.key];
    if (arrow) {
      event.preventDefault();
      const [dx = 0, dy = 0] = arrow;
      if (event.altKey && free) {
        // Resizing is about the middle of the frame, from the keyboard.
        const least = Math.max(8, Math.min(width, height) * 0.02);
        const next = { width: between(current.width + dx * 2 * unit * width, least, width), height: between(current.height + dy * 2 * unit * height, least, height) };
        commit({ x: current.x - (next.width - current.width) / 2, y: current.y - (next.height - current.height) / 2, ...next });
      } else if (!event.altKey) {
        commit({ ...current, x: current.x + dx * unit * width, y: current.y + dy * unit * height });
      }
    } else if (event.key === "+" || event.key === "=" || event.key === "Add") {
      event.preventDefault();
      zoomBy(1.12);
    } else if (event.key === "-" || event.key === "_" || event.key === "Subtract") {
      event.preventDefault();
      zoomBy(1 / 1.12);
    } else if (event.key === "Home") {
      event.preventDefault();
      reset();
    }
  }

  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const left = rect && width ? Math.round((rect.x / width) * 100) : 0;
  const top = rect && height ? Math.round((rect.y / height) * 100) : 0;
  const zoomPercent = Math.round(zoom * 100);
  const placeText = `${fill(text.position, { left: String(left), top: String(top) })}, ${fill(text.zoomed, { zoom: String(zoomPercent) })}`;
  const round = shape === "round";
  const interacting = dragging || gesture !== null;
  const animate = calm && !interacting;

  return (
    <div data-slot="image-cropper" data-status={status} data-shape={round ? "round" : free ? "free" : "rect"} className={cn("@container grid gap-4", className)} {...props}>
      <AspectRatio
        ref={stage}
        ratio={4 / 3}
        onPointerDown={onStageDown}
        onPointerMove={onStageMove}
        onPointerUp={onStageUp}
        onPointerCancel={onStageUp}
        aria-busy={status === "loading" || undefined}
        className={cn("touch-none overflow-hidden rounded-xl border border-border bg-black select-none", disabled ? "cursor-not-allowed opacity-60" : dragging ? "cursor-grabbing" : ready ? "cursor-grab" : undefined)}
      >
        {status !== "error" ? (
          <img
            key={attempt}
            ref={attach}
            src={src}
            alt={alt}
            crossOrigin={crossOrigin}
            draggable={false}
            onLoad={(event) => {
              const node = event.currentTarget;
              if (node.naturalWidth > 0 && node.naturalHeight > 0) loaded(node);
              else failed();
            }}
            onError={failed}
            style={layout ? { width: width * layout.scale, height: height * layout.scale, transform: `translate3d(${layout.offsetX}px, ${layout.offsetY}px, 0)` } : undefined}
            className={cn(
              "absolute top-0 left-0 max-w-none origin-top-left will-change-transform",
              layout ? "opacity-100" : "pointer-events-none opacity-0",
              animate && "transition-[transform,width,height] duration-150 ease-out motion-reduce:transition-none",
            )}
          />
        ) : null}

        {status === "loading" || (status === "ready" && !ready) ? <Skeleton className="absolute inset-0 rounded-none" /> : null}

        {layout ? (
          <div
            ref={frameNode}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-roledescription="crop frame"
            aria-label={text.frame}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={left}
            aria-valuetext={placeText}
            aria-describedby={helpId}
            aria-disabled={disabled || undefined}
            data-active={interacting || undefined}
            onKeyDown={onFrameKey}
            style={{ left: layout.frame.left, top: layout.frame.top, width: layout.frame.width, height: layout.frame.height }}
            className={cn(
              "group/frame absolute z-10 border border-white/90 shadow-[0_0_0_100vmax_rgb(0_0_0/0.55)] outline-none focus-visible:ring-[3px] focus-visible:ring-white/60",
              round ? "rounded-full" : "rounded-[2px]",
              animate && "transition-[left,top,width,height] duration-200 ease-out motion-reduce:transition-none",
            )}
          >
            {round ? null : (
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150 group-data-[active]/frame:opacity-100 motion-reduce:transition-none">
                <span className="absolute inset-y-0 left-1/3 w-px bg-white/35" />
                <span className="absolute inset-y-0 left-2/3 w-px bg-white/35" />
                <span className="absolute inset-x-0 top-1/3 h-px bg-white/35" />
                <span className="absolute inset-x-0 top-2/3 h-px bg-white/35" />
              </span>
            )}
            {free
              ? (Object.keys(HANDLES) as Handle[]).map((handle) => (
                  <span
                    key={handle}
                    data-handle={handle}
                    onPointerDown={(event) => startResize(handle, event)}
                    onPointerMove={moveResize}
                    onPointerUp={endResize}
                    onPointerCancel={endResize}
                    className={cn("absolute z-10 size-2.5 touch-none rounded-[2px] bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.45)] before:absolute before:-inset-3 before:content-['']", HANDLES[handle])}
                  />
                ))
              : null}
          </div>
        ) : null}

        {status === "error" ? (
          <div role="alert" className="absolute inset-0 z-20 grid place-content-center justify-items-center gap-2 bg-muted px-6 text-center">
            <IconImage aria-hidden="true" className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">{text.failed}</p>
            <p className="max-w-sm text-xs leading-5 text-muted-foreground">{reason}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={() => {
                setStatus("loading");
                setAttempt((current) => current + 1);
              }}
            >
              {text.retry}
            </Button>
          </div>
        ) : null}
      </AspectRatio>

      <div className={cn("grid gap-3", status === "error" && "hidden")}>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon-sm" aria-label={text.zoomOut} disabled={disabled || !ready || zoom <= low + 0.001} onClick={() => zoomBy(1 / 1.25)}>
            <IconZoomOut className="size-4" />
          </Button>
          {/* The zoom is rounded to the slider's step, so a screen reader hears 1.05 and not 1.05000105. */}
          <Slider className="flex-1" min={low} max={high} step={0.01} value={[Math.round(between(zoom, low, high) * 100) / 100]} thumbLabels={[text.zoom]} disabled={disabled || !ready} onValueChange={([next]) => next !== undefined && zoomBy(next / zoom)} />
          <Button type="button" variant="ghost" size="icon-sm" aria-label={text.zoomIn} disabled={disabled || !ready || zoom >= high - 0.001} onClick={() => zoomBy(1.25)}>
            <IconZoomIn className="size-4" />
          </Button>
          <span className="w-12 shrink-0 text-right text-sm tabular-nums" aria-hidden="true">
            {zoomPercent}%
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="text-xs text-muted-foreground tabular-nums">{rect ? fill(text.size, { width: number.format(Math.round(rect.width)), height: number.format(Math.round(rect.height)) }) : " "}</p>
          <Button type="button" variant="ghost" size="sm" disabled={disabled || !ready} onClick={reset} className="text-muted-foreground hover:text-foreground">
            <IconRotateCcw />
            {text.reset}
          </Button>
        </div>
      </div>

      <p id={helpId} className="sr-only">
        {text.help}
      </p>
      <span role="status" className="sr-only">
        {said}
      </span>
    </div>
  );
}


/**
 * Choose the crop of a picture. The frame keeps the shape you chose and stays
 * put; the picture moves under it: drag it, zoom with the slider, a pinch, Ctrl
 * and the wheel, or the plus and minus keys, and what is outside the frame is
 * dimmed. It reports the crop as a rectangle in the picture's own pixels, with
 * the zoom, so a server or the exported `cropToBlob` can do the cut. The frame
 * is the keyboard target: the arrow keys move the crop by 1% (Shift 10%), plus
 * and minus zoom, Home starts over, and the place is said as "40% from the
 * left, 25% from the top". With `aspect="free"` the frame's edges and corners
 * can be dragged (Alt and the arrow keys resize it), and `shape="round"` is for
 * avatars. A picture that cannot be loaded gives a calm error with the reason.
 */
export function ImageCropper(props: ImageCropperProps) {
  return <Cropper key={props.src} {...props} />;
}
