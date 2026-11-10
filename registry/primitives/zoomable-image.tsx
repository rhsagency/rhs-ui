"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";

import { IconMinus, IconPlus, IconSpinner, IconZoomIn } from "@rhs-ui/icons";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface ZoomableImageLabels {
  /** The name of the zoomable frame. Default "Zoomable image". */
  region?: string;
  /** The name of the group of buttons. Default "Zoom controls". */
  group?: string;
  /** Default "Zoom in". */
  zoomIn?: string;
  /** Default "Zoom out". */
  zoomOut?: string;
  /** The name of the button that shows the level and sets it back to 100%; the level follows. Default "Reset zoom". */
  reset?: string;
  /** The hint on a screen with a mouse. Default "Click to zoom". */
  hintPointer?: string;
  /** The hint on a touch screen. Default "Tap to zoom". */
  hintTouch?: string;
  /** Shown while the sharper picture loads. Default "Loading detail". */
  loadingDetail?: string;
  /** Read after the name of the frame: which keys do what. */
  instructions?: string;
  /** Said once the level settles; `{percent}` is the number. Default "Zoom {percent} percent". */
  announce?: string;
}

export interface ZoomableImageProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /** The address of the picture. A different address starts over at the whole picture, so pair it with a thumbnail strip freely. */
  src: string;
  /** What the picture shows. Required. */
  alt: string;
  /** The shape of the frame as width divided by height. The picture fills it. Default 3 / 2. */
  ratio?: number;
  /** The largest zoom, where 1 is the whole picture. Default 4. */
  maxZoom?: number;
  /** A sharper version, loaded the first time the zoom passes 1.5, so the page pays for it only when someone looks closely. */
  highResSrc?: string;
  /** Called with the zoom (1 to `maxZoom`) every time it changes, including the step back to 1 when `src` changes. */
  onZoomChange?: (zoom: number) => void;
  /** The language of the level, "150%". Default "en-US". */
  locale?: string;
  /** The words for names, hints and announcements. */
  labels?: ZoomableImageLabels;
}

/** Where the picture is: its zoom, and the corner of the frame it starts at, as fractions of the frame's own width and height. */
interface View {
  s: number;
  x: number;
  y: number;
}

const HOME: View = { s: 1, x: 0, y: 0 };
/** What one press of plus or minus adds or takes away. */
const STEP = 0.5;
/** How far an arrow key moves the picture, as a fraction of the frame. */
const NUDGE = 0.12;
/** Past this zoom the sharper picture is wanted. */
const DETAIL_FROM = 1.5;

const clamp = (n: number, low: number, high: number) => Math.min(high, Math.max(low, n));

/** The view with the picture kept over the whole frame: its edge never comes into sight. */
const settle = (s: number, x: number, y: number): View => ({ s, x: clamp(x, 1 - s, 0), y: clamp(y, 1 - s, 0) });

/** Zoom to `next`, keeping the point (fx, fy) of the frame, as fractions, where it is. */
function zoomTo(view: View, next: number, fx: number, fy: number, max: number): View {
  const s = clamp(next, 1, max);
  const px = (fx - view.x) / view.s;
  const py = (fy - view.y) / view.s;
  return settle(s, fx - px * s, fy - py * s);
}

/**
 * An image you can look at closely, in place. Click or tap toggles 2x around
 * the point you hit, Ctrl (or Cmd) with the wheel and a two-finger pinch zoom
 * continuously up to `maxZoom`, and dragging pans inside the frame without the
 * edge of the picture ever coming into view. For people without a mouse, Zoom
 * in, Zoom out and a button that shows the level and resets it sit in the
 * corner, and when the picture has focus +, - and 0 zoom and the arrow keys
 * move it. The frame is a labelled region, the level is announced once it
 * settles, the picture moves with a transform on the compositor, and under
 * reduced motion it steps instantly. Give it a `highResSrc` and the sharper
 * file loads only the first time the zoom passes 1.5. A new `src` starts the
 * picture over at 100%, and the sharper file of the old one never stays behind.
 */
export function ZoomableImage({ src, alt, ratio = 3 / 2, maxZoom = 4, highResSrc, onZoomChange, locale = "en-US", labels, className, onKeyDown, ...props }: ZoomableImageProps) {
  const text = {
    region: labels?.region ?? "Zoomable image",
    group: labels?.group ?? "Zoom controls",
    zoomIn: labels?.zoomIn ?? "Zoom in",
    zoomOut: labels?.zoomOut ?? "Zoom out",
    reset: labels?.reset ?? "Reset zoom",
    hintPointer: labels?.hintPointer ?? "Click to zoom",
    hintTouch: labels?.hintTouch ?? "Tap to zoom",
    loadingDetail: labels?.loadingDetail ?? "Loading detail",
    instructions: labels?.instructions ?? "Press plus and minus to zoom and 0 to reset. When it is zoomed, the arrow keys move the picture.",
    announce: labels?.announce ?? "Zoom {percent} percent",
  };
  const max = Math.max(1, maxZoom);
  const help = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>(HOME);
  // What the handlers read: always the latest view, even between two renders.
  const latest = useRef<View>(HOME);
  // True while a finger, a pointer or the wheel is steering: the picture follows at once instead of easing.
  const [moving, setMoving] = useState(false);
  const [wantsDetail, setWantsDetail] = useState(false);
  // The sharper file that has finished loading. A different file starts unseen and fades in, whatever was shown before it.
  const [detailFor, setDetailFor] = useState<string | undefined>(undefined);
  const [heard, setHeard] = useState("");
  // A new picture starts over at the whole frame, and asks for its sharper file only once someone looks closely at it.
  const [shownSrc, setShownSrc] = useState(src);
  if (shownSrc !== src) {
    setShownSrc(src);
    setView(HOME);
    setMoving(false);
    setWantsDetail(false);
  }
  const detailReady = highResSrc !== undefined && detailFor === highResSrc;

  const notify = useRef(onZoomChange);
  useEffect(() => {
    notify.current = onZoomChange;
  });
  const reported = useRef(1);

  const apply = useCallback((next: View) => {
    latest.current = next;
    setView(next);
    if (next.s > DETAIL_FROM) setWantsDetail(true);
    if (Math.abs(next.s - reported.current) > 0.001) {
      reported.current = next.s;
      notify.current?.(next.s);
    }
  }, []);

  const step = (delta: number) => apply(zoomTo(latest.current, Math.round((latest.current.s + delta) * 100) / 100, 0.5, 0.5, max));
  const reset = () => apply(HOME);
  const nudge = (dx: number, dy: number) => {
    const now = latest.current;
    if (now.s <= 1) return false;
    apply(settle(now.s, now.x + dx, now.y + dy));
    return true;
  };

  const toggleAt = (clientX: number, clientY: number) => {
    const box = viewport.current?.getBoundingClientRect();
    if (!box?.width) return;
    const now = latest.current;
    if (now.s > 1.01) apply(HOME);
    else apply(zoomTo(now, Math.min(2, max), (clientX - box.left) / box.width, (clientY - box.top) / box.height, max));
  };

  // One pointer pans, two pinch; a pointer that never moves is a click.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ mode: "idle" as "idle" | "pan" | "pinch", from: HOME, x: 0, y: 0, distance: 1, cx: 0, cy: 0, moved: false });

  // The handlers read these refs, so a new picture starts them over too, and whoever listens to the zoom hears that it is back at 1.
  useEffect(() => {
    latest.current = HOME;
    pointers.current.clear();
    gesture.current.mode = "idle";
    if (reported.current !== 1) {
      reported.current = 1;
      notify.current?.(1);
    }
  }, [src]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // The pointer is already gone: nothing to capture.
    }
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const g = gesture.current;
    if (pointers.current.size === 1) {
      Object.assign(g, { mode: "pan", from: latest.current, x: event.clientX, y: event.clientY, moved: false });
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      if (!a || !b) return;
      Object.assign(g, { mode: "pinch", from: latest.current, distance: Math.hypot(a.x - b.x, a.y - b.y) || 1, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, moved: true });
      setMoving(true);
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointer = pointers.current.get(event.pointerId);
    const box = viewport.current?.getBoundingClientRect();
    if (!pointer || !box?.width) return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    const g = gesture.current;
    if (g.mode === "pan") {
      if (!g.moved && Math.hypot(event.clientX - g.x, event.clientY - g.y) < 4) return;
      if (!g.moved) {
        g.moved = true;
        if (g.from.s > 1) setMoving(true);
      }
      if (g.from.s > 1) apply(settle(g.from.s, g.from.x + (event.clientX - g.x) / box.width, g.from.y + (event.clientY - g.y) / box.height));
    } else if (g.mode === "pinch") {
      const [a, b] = [...pointers.current.values()];
      if (!a || !b) return;
      const s = clamp(g.from.s * ((Math.hypot(a.x - b.x, a.y - b.y) || 1) / g.distance), 1, max);
      // The point of the picture that was between the fingers stays between them, wherever they go.
      const u = ((g.cx - box.left) / box.width - g.from.x) / g.from.s;
      const v = ((g.cy - box.top) / box.height - g.from.y) / g.from.s;
      apply(settle(s, ((a.x + b.x) / 2 - box.left) / box.width - u * s, ((a.y + b.y) / 2 - box.top) / box.height - v * s));
    }
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(event.pointerId)) return;
    const g = gesture.current;
    if (pointers.current.size === 0) {
      if (g.mode === "pan" && !g.moved && event.type === "pointerup") toggleAt(event.clientX, event.clientY);
      g.mode = "idle";
      setMoving(false);
    } else if (pointers.current.size === 1 && g.mode === "pinch") {
      // One finger is left: carry on panning from where the pinch ended.
      const rest = [...pointers.current.values()][0];
      if (rest) Object.assign(g, { mode: "pan", from: latest.current, x: rest.x, y: rest.y, moved: true });
    }
  };

  // Ctrl or Cmd with the wheel zooms (a trackpad pinch arrives the same way). It needs a listener that may cancel the page's own zoom, which React's onWheel cannot be.
  const wheelTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const box = element.getBoundingClientRect();
      const delta = clamp(event.deltaY * (event.deltaMode === 1 ? 16 : 1), -120, 120);
      const now = latest.current;
      apply(zoomTo(now, now.s * Math.exp(-delta * 0.004), (event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height, max));
      // The small steps of a trackpad follow at once; a notch of a wheel eases.
      setMoving(Math.abs(delta) < 40);
      window.clearTimeout(wheelTimer.current);
      wheelTimer.current = window.setTimeout(() => setMoving(false), 160);
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      element.removeEventListener("wheel", onWheel);
      window.clearTimeout(wheelTimer.current);
    };
  }, [apply, max]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return;
    switch (event.key) {
      case "+":
      case "=":
        step(STEP);
        break;
      case "-":
      case "_":
        step(-STEP);
        break;
      case "0":
        reset();
        break;
      // Arrow keys only belong to the picture while it is zoomed; at 100% they scroll the page as usual.
      case "ArrowLeft":
        if (!nudge(NUDGE, 0)) return;
        break;
      case "ArrowRight":
        if (!nudge(-NUDGE, 0)) return;
        break;
      case "ArrowUp":
        if (!nudge(0, NUDGE)) return;
        break;
      case "ArrowDown":
        if (!nudge(0, -NUDGE)) return;
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  // The level is said once it has stopped moving for a moment, never on every step.
  const percent = Math.round(view.s * 100);
  const spoken = useRef(100);
  useEffect(() => {
    if (spoken.current === percent) return;
    spoken.current = percent;
    const timer = window.setTimeout(() => setHeard(text.announce.replace("{percent}", String(percent))), 700);
    return () => window.clearTimeout(timer);
  }, [percent, text.announce]);

  const format = useMemo(() => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }), [locale]);
  const level = format.format(Math.round(view.s * 100) / 100);
  const atMin = view.s <= 1.001;
  const atMax = view.s >= max - 0.001;
  const zoomed = view.s > 1.001;

  return (
    <div
      data-slot="zoomable-image"
      role="region"
      aria-label={text.region}
      aria-describedby={help}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        "@container relative w-full overflow-hidden rounded-xl border border-border bg-muted outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
        className,
      )}
      {...props}
    >
      <AspectRatio ref={viewport} ratio={ratio} className="overflow-hidden">
        <div
          data-slot="zoomable-image-layer"
          data-moving={moving || undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ transform: `translate3d(${view.x * 100}%, ${view.y * 100}%, 0) scale(${view.s})` }}
          className={cn(
            "size-full origin-top-left select-none transition-transform duration-200 ease-out motion-reduce:transition-none",
            moving && "transition-none will-change-transform",
            zoomed ? "cursor-grab touch-none data-moving:cursor-grabbing" : "cursor-zoom-in touch-pan-y",
          )}
        >
          <img src={src} alt={alt} draggable={false} decoding="async" className="size-full object-cover" />
          {highResSrc && wantsDetail ? (
            <img
              // Keyed by the file, so every new file is a new element that starts transparent and never leaves the last one on screen.
              key={highResSrc}
              src={highResSrc}
              alt=""
              aria-hidden="true"
              draggable={false}
              decoding="async"
              onLoad={() => setDetailFor(highResSrc)}
              className={cn("absolute inset-0 size-full object-cover transition-opacity duration-300 motion-reduce:transition-none", detailReady ? "opacity-100" : "opacity-0")}
            />
          ) : null}
        </div>
      </AspectRatio>

      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground shadow-xs transition-opacity duration-200 motion-reduce:transition-none @max-xs:hidden",
          zoomed && "opacity-0",
        )}
      >
        <IconZoomIn className="size-3.5" />
        <span className="pointer-coarse:hidden">{text.hintPointer}</span>
        <span className="hidden pointer-coarse:inline">{text.hintTouch}</span>
      </span>

      {highResSrc && wantsDetail && !detailReady ? (
        <span className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground shadow-xs">
          <IconSpinner className="size-3.5" />
          {text.loadingDetail}
        </span>
      ) : null}

      <div role="group" aria-label={text.group} className="absolute right-3 bottom-3 inline-flex items-stretch overflow-hidden rounded-lg border border-border bg-background shadow-xs">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={text.zoomOut}
          aria-disabled={atMin || undefined}
          onClick={() => !atMin && step(-STEP)}
          className="rounded-none pointer-coarse:size-11 aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:bg-transparent"
        >
          <IconMinus />
        </Button>
        <span aria-hidden="true" className="w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`${text.reset}: ${level}`}
          aria-disabled={atMin || undefined}
          onClick={reset}
          className="min-w-[3.75rem] rounded-none px-2 tabular-nums pointer-coarse:h-11 aria-disabled:cursor-default aria-disabled:hover:bg-transparent"
        >
          {level}
        </Button>
        <span aria-hidden="true" className="w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={text.zoomIn}
          aria-disabled={atMax || undefined}
          onClick={() => !atMax && step(STEP)}
          className="rounded-none pointer-coarse:size-11 aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:bg-transparent"
        >
          <IconPlus />
        </Button>
      </div>

      <p id={help} className="sr-only">
        {text.instructions}
      </p>
      <span role="status" className="sr-only">
        {heard}
      </span>
    </div>
  );
}
