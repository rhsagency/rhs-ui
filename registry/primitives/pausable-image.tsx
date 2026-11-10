"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import { IconPause, IconPlay, IconSpinner } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface PausableImageLabels {
  /** The name of the button. It names the button in both states, which `aria-pressed` tells apart; the picture's `alt` is read by the picture itself, just before it. Default "Play animation". */
  toggle?: string;
  /** The small tag on the still picture. Default "Animated". */
  badge?: string;
  /** Said to a screen reader, and shown on the picture, when the animation cannot load. Default "Could not play". */
  failed?: string;
}

export interface PausableImageProps extends Omit<ComponentProps<"div">, "children"> {
  /** The address of the animated picture: a GIF, an animated WebP or APNG, or an animated SVG. */
  src: string;
  /** What the picture shows. Required. */
  alt: string;
  /** A still to show while paused. Without it the first frame of `src` is drawn to a canvas, which loads `src` up front; with it nothing animated loads until Play. */
  poster?: string;
  /** Start playing. It is ignored when the visitor prefers reduced motion, so the picture starts still for them. Default false. */
  autoPlay?: boolean;
  /** The shape of the frame as width divided by height. Both the still and the animation fill it, so swapping never moves the page. Default 16 / 9. */
  aspect?: number;
  /** How the picture fills the frame. Default "cover". */
  fit?: "cover" | "contain";
  /** Called with true when the animation starts and false when it stops. */
  onPlayingChange?: (playing: boolean) => void;
  /** The words of the control, for another language. */
  labels?: PausableImageLabels;
}

/**
 * A moving picture that starts still, so animation meets the rule that
 * anything moving for more than five seconds needs a way to pause, stop or hide
 * it (WCAG 2.2.2). It shows a still (a `poster` you pass, or the first frame of
 * the animation drawn to a canvas) with a Play button, and pressing it swaps in
 * the animated source; the button then shrinks to a Pause control in the corner
 * and a second press returns to the still. It is one button with
 * `aria-pressed`, so focus stays on it through both states. Both layers share
 * one box, so nothing shifts when they swap. A visitor who prefers reduced
 * motion always starts paused, whatever `autoPlay` says, and with a `poster`
 * the animated file is not requested until Play.
 */
export function PausableImage({ src, alt, poster, autoPlay = false, aspect = 16 / 9, fit = "cover", onPlayingChange, labels, className, style, ...props }: PausableImageProps) {
  const text = { toggle: labels?.toggle ?? "Play animation", badge: labels?.badge ?? "Animated", failed: labels?.failed ?? "Could not play" };
  const [playing, setPlaying] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [failed, setFailed] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const notify = useRef(onPlayingChange);
  useEffect(() => {
    notify.current = onPlayingChange;
  });

  const change = (next: boolean) => {
    setPlaying(next);
    setArrived(false);
    if (next) setFailed(false);
    notify.current?.(next);
  };

  // Autoplay is the visitor's to refuse: it never runs when they ask for less motion.
  useEffect(() => {
    if (!autoPlay || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setPlaying(true);
    notify.current?.(true);
  }, [autoPlay]);

  // With no poster, the first frame of the animation becomes the still. A canvas shows it without reading a pixel, so a picture from another origin is fine.
  useEffect(() => {
    if (poster) return;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const element = canvas.current;
      if (!element) return;
      element.width = image.naturalWidth || 640;
      element.height = image.naturalHeight || 360;
      element.getContext("2d")?.drawImage(image, 0, 0);
    };
    image.src = src;
    return () => {
      image.onload = null;
    };
  }, [src, poster]);

  const loading = playing && !arrived;
  const fitting = fit === "cover" ? "object-cover" : "object-contain";

  return (
    <div
      data-slot="pausable-image"
      data-state={playing ? "playing" : "paused"}
      style={{ aspectRatio: aspect, ...style }}
      className={cn("relative isolate w-full overflow-hidden rounded-xl border border-border bg-muted", className)}
      {...props}
    >
      <div role="img" aria-label={alt} className="absolute inset-0">
        {poster ? <img src={poster} alt="" loading="lazy" decoding="async" draggable={false} className={cn("size-full", fitting)} /> : <canvas ref={canvas} aria-hidden="true" className={cn("size-full", fitting)} />}
        {playing ? (
          <img
            key={src}
            ref={(node) => {
              // A picture that was already cached is complete before React listens for it.
              if (node?.complete && node.naturalWidth > 0) setArrived(true);
            }}
            src={src}
            alt=""
            decoding="async"
            draggable={false}
            onLoad={() => setArrived(true)}
            onError={() => {
              setFailed(true);
              change(false);
            }}
            className={cn("absolute inset-0 size-full transition-opacity duration-200 motion-reduce:transition-none", fitting, arrived ? "opacity-100" : "opacity-0")}
          />
        ) : null}
      </div>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-foreground/10 ring-inset" />
      {!playing && !failed ? (
        <span aria-hidden="true" className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-background px-2 py-1 text-xs leading-none font-medium text-foreground shadow-xs ring-1 ring-foreground/10">
          {text.badge}
        </span>
      ) : null}
      {failed ? (
        <span aria-hidden="true" className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-destructive px-2 py-1 text-xs leading-none font-medium text-destructive-foreground shadow-xs">
          {text.failed}
        </span>
      ) : null}
      <button
        type="button"
        aria-pressed={playing}
        aria-busy={loading || undefined}
        aria-label={text.toggle}
        onClick={() => change(!playing)}
        className={cn(
          "group/play absolute z-10 cursor-pointer outline-none",
          playing ? "right-3 bottom-3 size-10 rounded-full pointer-coarse:size-11" : "inset-0 grid place-items-center focus-visible:shadow-[inset_0_0_0_3px_var(--ring)]",
        )}
      >
        {playing ? (
          <span className="grid size-full place-items-center rounded-full bg-background text-foreground shadow-xs ring-1 ring-foreground/15 transition-[transform,background-color] duration-150 group-hover/play:scale-105 group-focus-visible/play:ring-[3px] group-focus-visible/play:ring-ring group-active/play:scale-95 motion-reduce:transition-none">
            {loading ? <IconSpinner className="size-4" /> : <IconPause className="size-4" strokeWidth={2.5} />}
          </span>
        ) : (
          <span className="grid size-14 place-items-center rounded-full bg-background text-foreground shadow-sm ring-1 ring-foreground/10 transition-transform duration-150 group-hover/play:scale-105 group-active/play:scale-95 motion-reduce:transition-none">
            <IconPlay className="size-6 translate-x-0.5 fill-current" />
          </span>
        )}
      </button>
      <span role="status" className="sr-only">
        {failed ? text.failed : ""}
      </span>
    </div>
  );
}
