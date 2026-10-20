"use client";

import { useCallback, useEffect, useState, type ComponentProps, type FocusEvent, type PointerEvent } from "react";

import { IconPlayPauseAnimated } from "@rhs-ui/icons/animated/play-pause";
import { usePrefersReducedMotion } from "@rhs-ui/motion/use-in-view";
import { Button, type ButtonProps } from "@rhs-ui/primitives/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

/** Why moving content is held for a moment: the pointer is on it, keyboard focus is in it, or the tab is hidden. */
export type AutoplayHold = "hover" | "focus" | "hidden";

export interface UseAutoplayOptions {
  /** Whether it starts playing. Default true. */
  defaultPlaying?: boolean;
  /** Controlled: whether the person wants it playing. Pass it with `onPlayingChange`. */
  playing?: boolean;
  /** Called with the new state whenever the person presses the toggle, or `setPlaying` is called. */
  onPlayingChange?: (playing: boolean) => void;
  /** Start paused when the system asks for less motion, until the person presses play. Default true. */
  respectReducedMotion?: boolean;
  /** Hold it while the pointer is over the content. Default true. */
  pauseOnHover?: boolean;
  /** Hold it while keyboard focus is inside the content. Default true. */
  pauseOnFocus?: boolean;
  /** Hold it while the tab is hidden. Default true. */
  pauseWhenHidden?: boolean;
}

export interface Autoplay {
  /** What the person chose: false after Pause, and at the start under reduced motion. */
  playing: boolean;
  /** Whether the content should move right now: playing, and not held by hover, focus or a hidden tab. This is the one line the content obeys. */
  running: boolean;
  /** Why a playing piece of content is held at the moment, if it is. */
  held: AutoplayHold | null;
  /** Play or pause, as if the toggle had been pressed. */
  setPlaying: (playing: boolean) => void;
  /** Spread on the element that moves, so hover and focus can hold it. */
  contentProps: {
    onPointerEnter: (event: PointerEvent<HTMLElement>) => void;
    onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
    onFocus: (event: FocusEvent<HTMLElement>) => void;
    onBlur: (event: FocusEvent<HTMLElement>) => void;
  };
  /** Spread on <AutoplayToggle> to connect the two. */
  toggleProps: { playing: boolean; onPlayingChange: (playing: boolean) => void };
}

/** The shared rule for who decides: a controlled value, else the person's last press, else the default, which reduced motion turns off. */
function usePlayingState({ playing, defaultPlaying = true, onPlayingChange, respectReducedMotion = true }: Pick<UseAutoplayOptions, "playing" | "defaultPlaying" | "onPlayingChange" | "respectReducedMotion">) {
  const reduced = usePrefersReducedMotion();
  const [choice, setChoice] = useState<boolean | undefined>(undefined);
  const current = playing ?? choice ?? (defaultPlaying && !(respectReducedMotion && reduced));
  const update = useCallback(
    (next: boolean) => {
      if (playing === undefined) setChoice(next);
      onPlayingChange?.(next);
    },
    [playing, onPlayingChange],
  );
  return [current, update] as const;
}

const focusVisible = (element: Element) => {
  try {
    return element.matches(":focus-visible");
  } catch {
    return true;
  }
};

/**
 * The state behind a pause control for moving content. It holds what the
 * person chose, and on top of that holds the content while the pointer is on
 * it, while keyboard focus is inside it and while the tab is hidden, so the
 * content needs only one line to obey it: run only while `running` is true.
 * Spread `contentProps` on the element that moves and `toggleProps` on the
 * <AutoplayToggle>.
 */
export function useAutoplay(options: UseAutoplayOptions = {}): Autoplay {
  const { pauseOnHover = true, pauseOnFocus = true, pauseWhenHidden = true } = options;
  const [playing, setPlaying] = usePlayingState(options);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!pauseWhenHidden) return;
    const sync = () => setHidden(document.visibilityState === "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [pauseWhenHidden]);

  const held: AutoplayHold | null = !playing ? null : pauseOnHover && hovered ? "hover" : pauseOnFocus && focused ? "focus" : pauseWhenHidden && hidden ? "hidden" : null;
  return {
    playing,
    running: playing && held === null,
    held,
    setPlaying,
    contentProps: {
      // A touch is not a hover: the finger lifts at once and would hold the content for nothing.
      onPointerEnter: (event) => {
        if (event.pointerType !== "touch") setHovered(true);
      },
      onPointerLeave: () => setHovered(false),
      // Keyboard focus holds it; a mouse click that happens to focus a button does not.
      onFocus: (event) => {
        if (focusVisible(event.target)) setFocused(true);
      },
      onBlur: (event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      },
    },
    toggleProps: { playing, onPlayingChange: setPlaying },
  };
}

export interface AutoplayToggleProps extends Omit<ComponentProps<"button">, "children" | "onClick" | "title" | "aria-label" | "aria-pressed" | "defaultValue"> {
  /** What it controls, as a noun: "testimonials". The accessible name is "Pause testimonials" while it plays and "Play testimonials" while it is paused. */
  label: string;
  /** Controlled: whether the content is playing. Pass it with `onPlayingChange`, or use `useAutoplay` and spread its `toggleProps`. */
  playing?: boolean;
  /** Uncontrolled: whether it starts playing. Default true. */
  defaultPlaying?: boolean;
  /** Called with the new state when the toggle is pressed. */
  onPlayingChange?: (playing: boolean) => void;
  /** Start paused when the system asks for less motion, until the person presses play. Default true. */
  respectReducedMotion?: boolean;
  /** 32, 36 or 44px. The touch target is 44px at every size. */
  size?: "sm" | "default" | "lg";
  /** Any Button variant. Outline by default. */
  variant?: ButtonProps["variant"];
}

const SIZES = { sm: "icon-sm", default: "icon", lg: "icon" } as const;
const upper = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * The pause control that moving content has to have: WCAG 2.2.2 asks for a
 * way to stop anything that moves for more than five seconds. One button
 * stops and starts a carousel, a ticker or a video, and its name follows the
 * state ("Pause testimonials", "Play testimonials") while the icon morphs
 * between pause and play. A polite message confirms what happened. Because
 * the name already says what pressing will do, it does not also set
 * aria-pressed, which would announce the state twice and contradict itself.
 * It starts paused under reduced motion. Pair it with `useAutoplay`, which also
 * holds the content on hover, on focus and while the tab is hidden.
 */
export function AutoplayToggle({ label, playing, defaultPlaying, onPlayingChange, respectReducedMotion = true, size = "default", variant = "outline", className, ...props }: AutoplayToggleProps) {
  const [on, set] = usePlayingState({ playing, defaultPlaying, onPlayingChange, respectReducedMotion });
  const [message, setMessage] = useState("");
  const name = `${on ? "Pause" : "Play"} ${label}`;
  // The message comes first and is sr-only, so the button is the last child: a Button Group can then join it.
  return (
    <>
      <span role="status" className="sr-only">
        {message}
      </span>
      <TooltipProvider delayDuration={250}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-slot="autoplay-toggle"
              data-state={on ? "playing" : "paused"}
              type="button"
              variant={variant}
              size={SIZES[size]}
              aria-label={name}
              onClick={() => {
                const next = !on;
                set(next);
                setMessage(`${upper(label)} ${next ? "playing" : "paused"}`);
              }}
              className={cn(
                "relative after:absolute after:top-1/2 after:left-1/2 after:size-[max(100%,2.75rem)] after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']",
                size === "lg" && "size-11",
                className,
              )}
              {...props}
            >
              <IconPlayPauseAnimated active={on} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{name}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
}
