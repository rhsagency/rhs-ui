"use client";

import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

import { IconPause, IconPlay } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** The words the component says on its own, for another language or your own wording. */
export interface StoryProgressLabels {
  /** The one polite announcement; `{n}` and `{count}` are filled in. Default "Slide {n} of {count}". */
  slide: string;
  /** The name of the button while the story plays. Default "Pause". */
  pause: string;
  /** The name of the button while it is paused. Default "Play". */
  play: string;
  /** The name of the button that goes back, shown to keyboard and screen reader users. Default "Previous slide". */
  previous: string;
  /** The name of the button that goes on. Default "Next slide". */
  next: string;
}

export interface StoryProgressProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /** How many slides there are: one segment each. */
  count: number;
  /** The slide that is showing (0 is the first), when you control it. */
  index?: number;
  /** The slide to start on, when you do not control it. Default 0. */
  defaultIndex?: number;
  /** Called with the new index when a tap, a key or the end of a slide moves on. */
  onIndexChange?: (index: number) => void;
  /** How long each slide lasts, in ms: one number for all of them, or one per slide. Default 5000. */
  duration?: number | readonly number[];
  /** Hold the story still, when you control it. Holding a finger on the media does the same while it is down. */
  paused?: boolean;
  /** Called when the Pause button is pressed, with the paused state it asks for. */
  onPausedChange?: (paused: boolean) => void;
  /** Move on by itself when a slide's time is up. Off, the current segment is simply full and only taps and keys move. Default true. */
  autoplay?: boolean;
  /** Called when the last slide's time is up, and when someone goes forward from it. */
  onComplete?: () => void;
  /** `default` draws the segments in the text colour, for a card or a panel. `media` draws them in white, for a photo or a dark slide. */
  tone?: "default" | "media";
  /** Extra controls next to Pause, at the top right: a close button, a mute toggle. */
  actions?: ReactNode;
  /** The name of the story for assistive technology. Default "Story". */
  label?: string;
  /** The words of the buttons and the announcement. */
  labels?: Partial<StoryProgressLabels>;
  /** The media area: the current slide. Leave about 3rem free at the top, where the segments and the buttons sit. Links, buttons and fields in it keep working. */
  children?: ReactNode;
}

const WORDS: StoryProgressLabels = { slide: "Slide {n} of {count}", pause: "Pause", play: "Play", previous: "Previous slide", next: "Next slide" };

const DEFAULT_MS = 5000;
/** A press shorter than this, that did not move, is a tap; longer, it is holding the story still. */
const HOLD_MS = 250;
/** How far, in px, a finger may drift and still count as a tap. */
const SLOP = 14;

const clamp = (n: number, low: number, high: number): number => Math.min(high, Math.max(low, n));

/** The clickable surface of the media area. Taps go to the zones underneath it; only what is interactive in the media takes a press itself. */
const THROUGH = "pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_input]:pointer-events-auto [&_select]:pointer-events-auto [&_textarea]:pointer-events-auto";

/**
 * Segmented progress for stories, onboarding tours and "what's new" panels: one segment per slide at the
 * top, the finished ones full, the current one filling over its duration, the rest empty. Press the left
 * third of the media to go back and the right third to go on; hold anywhere to pause, and let go to carry
 * on. Keyboard users get Left and Right on the story and a visible Pause button; Previous and Next buttons
 * appear on focus, and "Slide 2 of 5" is said once, politely. The fill is a CSS animation, so pausing keeps
 * the exact place and a hidden tab pauses by itself. Under reduced motion nothing advances on its own, the
 * current segment is simply full and the Pause button is not drawn. Going back from the first slide
 * restarts it; going on from the last one calls `onComplete`.
 */
export function StoryProgress({
  count,
  index,
  defaultIndex = 0,
  onIndexChange,
  duration = DEFAULT_MS,
  paused,
  onPausedChange,
  autoplay = true,
  onComplete,
  tone = "default",
  actions,
  label = "Story",
  labels,
  className,
  children,
  onKeyDown,
  ...props
}: StoryProgressProps) {
  const words = { ...WORDS, ...labels };
  const last = Math.max(0, count - 1);
  const [ownIndex, setOwnIndex] = useState(defaultIndex);
  const current = clamp(index ?? ownIndex, 0, last);
  /** Counts up to restart the first slide when someone goes back from it. */
  const [round, setRound] = useState(0);
  const [ownPaused, setOwnPaused] = useState(false);
  const stopped = paused ?? ownPaused;
  const [holding, setHolding] = useState(false);
  const [away, setAway] = useState(false);
  const press = useRef<{ x: number; y: number; at: number; action: "back" | "next" | null } | null>(null);
  const running = autoplay && !stopped && !holding && !away;
  const ms = typeof duration === "number" ? duration : (duration[current] ?? DEFAULT_MS);

  // A story in a background tab would carry on unseen.
  useEffect(() => {
    const onVisibility = () => setAway(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  function go(target: number) {
    if (target > last) {
      onComplete?.();
      return;
    }
    if (target < 0) {
      setRound((n) => n + 1);
      return;
    }
    if (index === undefined) setOwnIndex(target);
    onIndexChange?.(target);
  }

  function toggle() {
    const next = !stopped;
    if (paused === undefined) setOwnPaused(next);
    onPausedChange?.(next);
  }

  function pressStart(event: PointerEvent<HTMLElement>, action: "back" | "next" | null) {
    if (event.button !== 0) return;
    press.current = { x: event.clientX, y: event.clientY, at: performance.now(), action };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // A synthetic pointer has nothing to capture; the press still works.
    }
    setHolding(true);
  }

  function pressEnd(event: PointerEvent<HTMLElement>) {
    const started = press.current;
    press.current = null;
    setHolding(false);
    if (!started?.action) return;
    const quick = performance.now() - started.at < HOLD_MS;
    const still = Math.hypot(event.clientX - started.x, event.clientY - started.y) < SLOP;
    if (quick && still) go(started.action === "next" ? current + 1 : current - 1);
  }

  function pressCancel() {
    press.current = null;
    setHolding(false);
  }

  function keys(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || (event.key !== "ArrowRight" && event.key !== "ArrowLeft")) return;
    // A field inside a slide keeps its own arrow keys.
    if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable='true']")) return;
    event.preventDefault();
    go(event.key === "ArrowRight" ? current + 1 : current - 1);
  }

  const media = tone === "media";
  const control = cn("shrink-0", media && "text-white hover:bg-white/20 hover:text-white focus-visible:border-white/70 focus-visible:ring-white/40");
  const zone = (action: "back" | "next" | null) => ({
    onPointerDown: (event: PointerEvent<HTMLElement>) => pressStart(event, action),
    onPointerUp: pressEnd,
    onPointerCancel: pressCancel,
    onLostPointerCapture: pressCancel,
    onContextMenu: (event: { preventDefault: () => void }) => event.preventDefault(),
  });

  return (
    <div
      data-slot="story-progress"
      data-tone={tone}
      role="group"
      aria-roledescription="story"
      aria-label={label}
      tabIndex={0}
      onKeyDown={keys}
      className={cn("relative isolate outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40", className)}
      {...props}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-20 flex gap-1 px-3 pt-3">
        {Array.from({ length: Math.max(0, count) }, (_, i) => {
          const state = i < current ? "done" : i === current ? "now" : "todo";
          return (
            <span key={i} className={cn("relative h-1 min-w-0 flex-1 overflow-hidden rounded-full", media ? "bg-white/35" : "bg-foreground/15")}>
              <span
                // The current segment is a new element for every slide and every restart, so its animation begins again.
                key={state === "now" ? `${i}-${round}` : state}
                onAnimationEnd={state === "now" && autoplay ? () => go(current + 1) : undefined}
                style={state === "now" && autoplay ? { animationDuration: `${ms}ms`, animationPlayState: running ? "running" : "paused" } : undefined}
                className={cn(
                  "absolute inset-0 origin-left rounded-full",
                  media ? "bg-white" : "bg-foreground",
                  state === "done" && "scale-x-100",
                  state === "todo" && "scale-x-0",
                  state === "now" && autoplay && "animate-rhs-story-fill motion-reduce:animate-none",
                )}
              />
            </span>
          );
        })}
      </div>
      <div className="absolute top-[1.375rem] right-2 z-30 flex items-center gap-0.5">
        {/* For keyboard and screen reader users, who have no thirds to press: hidden until one of them has focus. */}
        <span className="sr-only focus-within:not-sr-only focus-within:flex focus-within:gap-0.5">
          <Button type="button" variant="ghost" size="sm" onClick={() => go(current - 1)} className={control}>
            {words.previous}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => go(current + 1)} className={control}>
            {words.next}
          </Button>
        </span>
        {autoplay ? (
          <Button type="button" variant="ghost" size="icon-sm" aria-label={stopped ? words.play : words.pause} onClick={toggle} className={cn(control, "motion-reduce:hidden")}>
            {stopped ? <IconPlay /> : <IconPause />}
          </Button>
        ) : null}
        {actions}
      </div>
      <div aria-hidden="true" className="absolute inset-0 z-0 grid touch-pan-y grid-cols-3 select-none">
        <div {...zone("back")} />
        <div {...zone(null)} />
        <div {...zone("next")} />
      </div>
      <div className={cn("relative z-10 h-full", THROUGH)}>{children}</div>
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {words.slide.replace("{n}", String(current + 1)).replace("{count}", String(count))}
      </span>
    </div>
  );
}
