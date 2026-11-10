"use client";

import { useEffect, useRef, useState, type ComponentProps, type FocusEvent, type MouseEventHandler, type PointerEvent, type ReactNode } from "react";

import { IconPlay } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface HoverVideoPreviewProps extends Omit<ComponentProps<"a">, "title" | "children" | "onClick" | "href" | "ref"> {
  /** The still picture, shown until the preview plays and under it. It is decoration: the title names the tile. */
  poster: string;
  /** A short muted clip that plays over the poster after the pointer rests on the tile. It is not requested before then. Without it the tile is a plain poster with a play mark. */
  previewSrc?: string;
  /** The title of the video. It names the tile and is shown under the picture, up to two lines. */
  title: string;
  /** A line under the title: who made it, how often it was seen, when. */
  meta?: ReactNode;
  /** The length of the full video: seconds (252) or text ("4:12"). Shown on the picture in tabular numbers, and read out in words. */
  duration?: number | string;
  /** Makes the tile a link. With `onClick` and no `href` it is a button. */
  href?: string;
  /** Runs when the tile is pressed. */
  onClick?: MouseEventHandler<HTMLElement>;
  /** The shape of the poster as width divided by height. Give every tile of a grid the same one so the rows line up. Default 16 / 9. */
  aspect?: number;
  /** How long the pointer or the keyboard focus must rest on the tile, in milliseconds, before the preview is fetched and played. Default 300. */
  delay?: number;
}

/** 252 becomes "4:12" and 3725 becomes "1:02:05"; text is shown as it comes. */
function clock(value: number | string | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "string") return value;
  const total = Math.max(0, Math.round(value));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
}

/** 252 becomes "4 minutes 12 seconds", for a screen reader. */
function spoken(value: number | string | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "string") return value;
  const total = Math.max(0, Math.round(value));
  const unit = (n: number, word: string) => (n ? `${n} ${word}${n === 1 ? "" : "s"}` : "");
  return [unit(Math.floor(total / 3600), "hour"), unit(Math.floor((total % 3600) / 60), "minute"), unit(total % 60, "second")].filter(Boolean).join(" ") || "0 seconds";
}

/** Whether a preview may play now: it needs a hovering pointer, no request to save data and no wish for less motion. Read when the pointer rests, not at render, so it is never stale. */
function previewAllowed(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.matchMedia("(hover: none)").matches) return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !connection?.saveData;
}

/**
 * A video thumbnail that shows what is in it without being asked to load it.
 * It is a poster with a title and a length until the pointer, or the keyboard
 * focus, rests on it for a moment (300 ms by default); only then is the preview
 * clip fetched and played, muted and looping, over the poster, and when you
 * leave it stops and goes back to the start. Nothing is requested before that
 * (the video element is not even on the page), and the preview is skipped
 * entirely on touch screens, when the browser asks to save data and for a
 * visitor who prefers reduced motion, where the poster simply stays. The whole
 * tile is one link, or one button without `href`, named by its title and
 * length; the video is decoration and hidden from assistive technology. For
 * video libraries, course catalogues and film indexes.
 */
export function HoverVideoPreview({ poster, previewSrc, title, meta, duration, href, onClick, aspect = 16 / 9, delay = 300, className, target, rel, download, onPointerEnter, onPointerLeave, onFocus, onBlur, ...props }: HoverVideoPreviewProps) {
  const [mounted, setMounted] = useState(false);
  const [wanted, setWanted] = useState(false);
  const [live, setLive] = useState(false);
  const [progress, setProgress] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const timer = useRef<number | undefined>(undefined);

  // The clip plays while the pointer rests on the tile and goes back to its first frame when it leaves.
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (wanted) {
      void element.play().catch(() => setWanted(false));
    } else {
      element.pause();
      element.currentTime = 0;
    }
  }, [wanted, mounted]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const rest = () => {
    if (!previewSrc) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (!previewAllowed()) return;
      setMounted(true);
      setWanted(true);
    }, delay);
  };
  const leave = () => {
    window.clearTimeout(timer.current);
    setWanted(false);
    setLive(false);
    setProgress(0);
  };
  const handlePointerEnter = (event: PointerEvent<HTMLElement>) => {
    onPointerEnter?.(event as PointerEvent<HTMLAnchorElement>);
    if (event.pointerType === "mouse" || event.pointerType === "pen") rest();
  };
  const handlePointerLeave = (event: PointerEvent<HTMLElement>) => {
    onPointerLeave?.(event as PointerEvent<HTMLAnchorElement>);
    leave();
  };
  const handleFocus = (event: FocusEvent<HTMLElement>) => {
    onFocus?.(event as FocusEvent<HTMLAnchorElement>);
    if (event.currentTarget.matches(":focus-visible")) rest();
  };
  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    onBlur?.(event as FocusEvent<HTMLAnchorElement>);
    leave();
  };

  const length = clock(duration);
  const heard = spoken(duration);

  const picture = (
    <span className="relative isolate block overflow-hidden rounded-xl bg-muted" style={{ aspectRatio: aspect }}>
      <img src={poster} alt="" loading="lazy" decoding="async" draggable={false} className="absolute inset-0 size-full object-cover" />
      {mounted && previewSrc ? (
        <video
          ref={video}
          src={previewSrc}
          muted
          loop
          playsInline
          preload="auto"
          tabIndex={-1}
          aria-hidden="true"
          disablePictureInPicture
          disableRemotePlayback
          onPlaying={() => setLive(true)}
          onTimeUpdate={(event) => setProgress(event.currentTarget.duration ? event.currentTarget.currentTime / event.currentTarget.duration : 0)}
          onError={leave}
          className={cn("absolute inset-0 size-full object-cover transition-opacity duration-200 motion-reduce:transition-none", live ? "opacity-100" : "opacity-0")}
        />
      ) : null}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-foreground/10 ring-inset" />
      <span aria-hidden="true" className={cn("absolute inset-0 grid place-items-center transition-opacity duration-200 motion-reduce:transition-none", live && "opacity-0")}>
        <span className="grid size-12 place-items-center rounded-full bg-white/85 text-black shadow-sm ring-1 ring-black/10 transition-[background-color,transform] duration-200 group-hover/preview:bg-white group-focus-visible/preview:bg-white group-active/preview:scale-95 motion-reduce:transition-none">
          <IconPlay className="size-5 translate-x-px fill-current" />
        </span>
      </span>
      {length ? (
        <span aria-hidden="true" className="absolute right-2 bottom-2.5 rounded-md bg-black/75 px-1.5 py-0.5 text-xs leading-4 font-medium text-white tabular-nums">
          {length}
        </span>
      ) : null}
      <span aria-hidden="true" className={cn("absolute inset-x-0 bottom-0 h-1 bg-black/40 transition-opacity duration-200 motion-reduce:transition-none", live ? "opacity-100" : "opacity-0")}>
        <span className="block h-full bg-white transition-[width] duration-300 ease-linear motion-reduce:transition-none" style={{ width: `${progress * 100}%` }} />
      </span>
    </span>
  );

  const text = (
    <span className="grid min-w-0 gap-0.5 px-0.5">
      <span className="line-clamp-2 text-sm leading-snug font-medium tracking-[-0.01em] text-foreground">{title}</span>
      {meta ? <span className="truncate text-xs text-muted-foreground">{meta}</span> : null}
      {heard ? <span className="sr-only">, {heard}</span> : null}
    </span>
  );

  const shared = {
    "data-slot": "hover-video-preview",
    "data-previewing": live ? "true" : "false",
    onPointerEnter: handlePointerEnter,
    onPointerLeave: handlePointerLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    className: cn(
      "group/preview relative flex min-w-0 flex-col gap-3 rounded-xl text-left outline-none",
      "focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      className,
    ),
  };

  return href !== undefined ? (
    <a href={href} target={target} rel={rel} download={download} onClick={onClick} {...props} {...shared}>
      {picture}
      {text}
    </a>
  ) : (
    <button type="button" onClick={onClick} {...(props as ComponentProps<"button">)} {...shared}>
      {picture}
      {text}
    </button>
  );
}
