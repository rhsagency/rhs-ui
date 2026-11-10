"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";

import { IconPause, IconPlay, IconRefresh, IconSpinner } from "@rhs-ui/icons";
import { claimPlayback, releasePlayback } from "@rhs-ui/primitives/play-clip-button/player";
import { cn } from "@/lib/utils";

export type PlayClipButtonSize = "sm" | "md" | "lg";

export interface PlayClipButtonLabels {
  /** Shown under the button, and said to a screen reader, when the clip cannot play. Default "Could not play". */
  error?: string;
}

export interface PlayClipButtonProps extends Omit<ComponentProps<"button">, "children" | "onClick" | "aria-label" | "aria-pressed" | "onEnded"> {
  /** The address of the sound: an MP3, an Ogg or a WAV. It is not requested until the button is first pressed. */
  src: string;
  /** What the button does, as a sentence a screen reader can say on its own: "Play pronunciation of cheese". It names the button while it plays too; `aria-pressed` tells the two apart. Required. */
  label: string;
  /** How big the button is: 32, 40 or 48px. On a touch screen it grows to a 44px target. Default `md`. */
  size?: PlayClipButtonSize;
  /** Called when the clip plays to its end. It is not called when the clip is stopped. */
  onEnded?: () => void;
  /** The words for the error, for another language. */
  labels?: PlayClipButtonLabels;
}

const SIZE: Record<PlayClipButtonSize, string> = {
  sm: "size-8 pointer-coarse:size-11",
  md: "size-10 pointer-coarse:size-11",
  lg: "size-12 pointer-coarse:size-12",
};

/** The ring is drawn in a 40 by 40 box at a radius of 18.5, so its length is fixed. */
const CIRCUMFERENCE = 2 * Math.PI * 18.5;

type Status = "idle" | "loading" | "playing" | "error";

/**
 * A round button that plays a short sound: the pronunciation of a word, a
 * sample, a notification chime. It is a quiet outline at rest; pressed, it
 * fills, shows a pause glyph and draws a thin ring around itself that closes as
 * the clip plays, and pressing it again stops the clip. Only one clip plays at
 * a time on the page: starting another stops this one. The audio element is
 * created on the first press, so a page full of these loads no audio until one
 * is used. It is a toggle button named by its `label` ("Play pronunciation of
 * cheese") with `aria-pressed`, shows a spinner while the file arrives, and
 * says "Could not play" when it cannot: the button then shows a retry arrow, and
 * pressing it asks for the file again, so a flaky network recovers without a
 * reload. The ring keeps showing progress for a visitor who prefers reduced
 * motion, and only drops the easing.
 */
export function PlayClipButton({ src, label, size = "md", onEnded, labels, className, disabled, ...props }: PlayClipButtonProps) {
  const text = { error: labels?.error ?? "Could not play" };
  const [status, setStatus] = useState<Status>("idle");
  const audio = useRef<HTMLAudioElement | null>(null);
  const ring = useRef<SVGCircleElement>(null);
  const frame = useRef(0);
  const ended = useRef(onEnded);
  useEffect(() => {
    ended.current = onEnded;
  });

  const draw = useCallback((fraction: number) => {
    ring.current?.setAttribute("stroke-dashoffset", String(CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, fraction)))));
  }, []);

  const watch = useCallback(() => {
    cancelAnimationFrame(frame.current);
    const tick = () => {
      const element = audio.current;
      if (element && element.duration > 0) draw(element.currentTime / element.duration);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, [draw]);

  /** Stop, rewind and go back to rest. It is also what the shared registry calls when another clip starts. */
  const rest = useCallback(() => {
    cancelAnimationFrame(frame.current);
    const element = audio.current;
    if (element) {
      element.pause();
      element.currentTime = 0;
    }
    draw(0);
    setStatus("idle");
  }, [draw]);

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      audio.current?.pause();
      releasePlayback(rest);
    },
    [rest],
  );

  // A different clip starts from the beginning the next time the button is pressed.
  useEffect(() => {
    const element = audio.current;
    if (element && element.getAttribute("src") !== src) {
      rest();
      releasePlayback(rest);
      element.removeAttribute("src");
      element.load();
    }
  }, [src, rest]);

  const press = () => {
    if (status === "loading" || status === "playing") {
      releasePlayback(rest);
      rest();
      return;
    }
    if (!audio.current) {
      const element = new Audio();
      element.preload = "auto";
      element.addEventListener("playing", () => {
        setStatus("playing");
        watch();
      });
      element.addEventListener("waiting", () => setStatus((now) => (now === "playing" ? "loading" : now)));
      element.addEventListener("ended", () => {
        cancelAnimationFrame(frame.current);
        releasePlayback(rest);
        draw(0);
        setStatus("idle");
        ended.current?.();
      });
      element.addEventListener("error", () => {
        cancelAnimationFrame(frame.current);
        releasePlayback(rest);
        draw(0);
        setStatus("error");
      });
      audio.current = element;
    }
    const element = audio.current;
    // An element that failed stays failed: play() rejects at once and the network is never asked again. A new src starts the load over by itself; the same src needs load().
    if (element.getAttribute("src") !== src) element.src = src;
    else if (status === "error" || element.error) element.load();
    claimPlayback(rest);
    setStatus("loading");
    // An interrupted start (the visitor pressed again, or another clip took over) is not a failure.
    element.play().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      releasePlayback(rest);
      setStatus("error");
    });
  };

  const active = status === "loading" || status === "playing";
  const failed = status === "error";

  return (
    <span data-slot="play-clip-button" data-state={status} className={cn("relative inline-flex items-center", className)}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        aria-busy={status === "loading" || undefined}
        disabled={disabled}
        onClick={press}
        className={cn(
          "group/clip relative inline-grid shrink-0 cursor-pointer place-items-center rounded-full outline-none active:not-disabled:scale-95 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-transform motion-safe:duration-150",
          "focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          SIZE[size],
        )}
        {...props}
      >
        <svg aria-hidden="true" viewBox="0 0 40 40" className={cn("absolute inset-0 size-full -rotate-90 transition-opacity duration-200 motion-reduce:transition-none", active ? "opacity-100" : "opacity-0")}>
          <circle cx="20" cy="20" r="18.5" fill="none" strokeWidth="2" className="stroke-border" />
          <circle
            ref={ring}
            cx="20"
            cy="20"
            r="18.5"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE}
            className={cn("stroke-foreground", status !== "playing" && "motion-safe:transition-[stroke-dashoffset] motion-safe:duration-300")}
          />
        </svg>
        <span
          className={cn(
            "grid size-full place-items-center rounded-full border shadow-xs transition-[background-color,border-color,color,transform] duration-200 ease-out motion-reduce:transition-none",
            // The disc draws back a little while it is active, to leave room for the ring around it.
            active ? "scale-[0.78]" : "scale-100",
            active ? "border-primary bg-primary text-primary-foreground" : failed ? "border-destructive bg-background text-destructive" : "border-border bg-background text-foreground group-hover/clip:bg-muted",
          )}
        >
          {status === "loading" ? <IconSpinner className="size-4" /> : status === "playing" ? <IconPause className="size-4" strokeWidth={2.5} /> : failed ? <IconRefresh className="size-4" /> : <IconPlay className="size-4 translate-x-px fill-current" />}
        </span>
      </button>
      {/* Under the button and out of the flow, so the message never moves the button. */}
      <span role="status" className={failed ? "absolute top-full left-1/2 mt-1.5 -translate-x-1/2 text-xs font-medium whitespace-nowrap text-destructive" : "sr-only"}>
        {failed ? text.error : ""}
      </span>
    </span>
  );
}
