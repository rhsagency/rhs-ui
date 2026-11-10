"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type MouseEvent, type ReactNode } from "react";

import { IconClose, IconMaximize } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface FloatingPlayerLabels {
  /** The name of the button that closes the mini player. Default "Close mini player". */
  close?: string;
  /** The link that scrolls back to the video. Default "Back to video". */
  back?: string;
  /** The name of the region, after the player's own name: "Product tour, mini player". Default "mini player". */
  region?: string;
  /** Said once when the player docks; `{label}` is its name. Default "{label} is playing in a mini player". */
  docked?: string;
  /** The note in the place the player left behind, while it is docked. Default "Playing in the mini player". */
  placeholder?: string;
}

export interface FloatingPlayerProps extends Omit<ComponentProps<"div">, "children"> {
  /** Whether the media is playing. A video that is not playing is never docked. Once docked, pausing keeps it docked so it can be resumed. */
  playing: boolean;
  /** The corner the mini player docks to. Default "bottom-right". */
  dock?: "bottom-right" | "bottom-left";
  /** The width of the mini player: a number of px or any CSS length. It never grows past the screen. Default 320. */
  width?: number | string;
  /** Called when the mini player is closed with its button or Escape. Pause the media here. The player stays where it is until the video is back in view. */
  onClose?: () => void;
  /** Called with `true` when the player docks and `false` when it returns, closes or the video scrolls back into view. */
  onDock?: (docked: boolean) => void;
  /** The name of the player: "Product tour". It names the mini player's region. */
  label?: string;
  /** The words used, for another language. */
  labels?: FloatingPlayerLabels;
  /** Your player: a video element, an iframe or a component. It is never moved or re-created, so playback does not restart. */
  children: ReactNode;
}

/** The part of the player that must be on screen for it to count as in view. */
const IN_VIEW = 0.2;

/**
 * Keeps a playing video in view. While it is on screen nothing changes. When it scrolls away during
 * playback the same element, never a copy, docks to a corner of the screen as a mini player, so
 * playback does not restart, and a placeholder of the same height holds its place so the page does not
 * jump. The mini player is a labelled region with a Close button and a "Back to video" link, Escape
 * closes it, and it keeps clear of a phone's safe area. A paused video is never docked, and under reduced
 * motion it docks without the slide. Do not put it inside an element with a `transform`, which would
 * make "fixed" mean "fixed inside that element".
 */
export function FloatingPlayer({ playing, dock = "bottom-right", width = 320, onClose, onDock, label = "Video player", labels, className, style, children, ...props }: FloatingPlayerProps) {
  const words = {
    close: labels?.close ?? "Close mini player",
    back: labels?.back ?? "Back to video",
    region: labels?.region ?? "mini player",
    docked: (labels?.docked ?? "{label} is playing in a mini player").replace("{label}", label),
    placeholder: labels?.placeholder ?? "Playing in the mini player",
  };
  const id = useId();
  const slot = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const refocus = useRef(false);
  const [visible, setVisible] = useState(true);
  const [docked, setDocked] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Is the place of the player on screen? Its placeholder is watched, not the player itself, because the player is the thing that moves.
  useEffect(() => {
    const node = slot.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setVisible(entry.isIntersecting && (entry.intersectionRatio >= IN_VIEW || entry.intersectionRect.height >= 240));
      },
      { threshold: [0, 0.1, IN_VIEW, 0.5, 1] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Dock when it is playing and out of view; undock when it is back. A close lasts until the video is seen again.
  useEffect(() => {
    if (visible) {
      setDocked(false);
      setDismissed(false);
    } else if (playing && !dismissed) setDocked(true);
  }, [visible, playing, dismissed]);

  // The height of the player is kept on the placeholder, so the page does not close up when the player leaves it.
  useEffect(() => {
    const holder = slot.current;
    const node = frame.current;
    if (!holder || !node || docked) return;
    const write = () => holder.style.setProperty("--fp-height", `${node.offsetHeight}px`);
    write();
    const observer = new ResizeObserver(write);
    observer.observe(node);
    return () => observer.disconnect();
  }, [docked]);

  const told = useRef(false);
  useEffect(() => {
    if (told.current === docked) return;
    told.current = docked;
    onDock?.(docked);
  }, [docked, onDock]);

  // When the mini player goes, its button goes with it: focus lands on the player, not on the page.
  useEffect(() => {
    if (!docked && refocus.current) {
      refocus.current = false;
      frame.current?.focus({ preventScroll: true });
    }
  }, [docked]);

  const close = () => {
    refocus.current = true;
    setDismissed(true);
    setDocked(false);
    onClose?.();
  };
  const goBack = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    refocus.current = true;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    slot.current?.scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" });
  };
  // The mini player sits where the video was in the markup, far from where the reader is, so Escape has to work from anywhere that nothing else
  // owns: from inside the player, or with nothing focused. A menu or a dialog that took the key has already prevented its default.
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });
  useEffect(() => {
    if (!docked) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const active = document.activeElement;
      if (active && active !== document.body && !frame.current?.contains(active)) return;
      event.preventDefault();
      closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [docked]);

  const corner = dock === "bottom-left" ? "left-[max(1rem,env(safe-area-inset-left))]" : "right-[max(1rem,env(safe-area-inset-right))]";
  return (
    <div
      ref={slot}
      id={id}
      data-slot="floating-player"
      data-docked={docked ? "" : undefined}
      className={cn("relative data-[docked]:min-h-(--fp-height)", className)}
      style={style}
      {...props}
    >
      <span role="status" className="sr-only">
        {docked ? words.docked : ""}
      </span>
      {/* What the player leaves behind: the same height, and a note, so the gap reads as "it moved", not as "it broke". */}
      {docked ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center rounded-xl border border-dashed border-border bg-muted/40 px-4 text-center text-xs text-muted-foreground">
          {words.placeholder}
        </div>
      ) : null}
      <div
        ref={frame}
        tabIndex={-1}
        role={docked ? "region" : undefined}
        aria-label={docked ? `${label}, ${words.region}` : undefined}
        style={{ "--fp-width": typeof width === "number" ? `${width}px` : width } as CSSProperties}
        className={cn(
          "outline-none",
          docked && ["fixed bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 w-(--fp-width) max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm ring-1 ring-foreground/5 motion-safe:animate-rhs-float-in", corner],
        )}
      >
        {docked ? (
          <div className="flex h-10 items-center justify-between gap-2 border-b border-border pr-1 pl-1.5">
            <a
              href={`#${id}`}
              onClick={goBack}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              <IconMaximize size={14} />
              {words.back}
            </a>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={words.close} onClick={close}>
              <IconClose />
            </Button>
          </div>
        ) : null}
        <div className="[&>iframe]:block [&>iframe]:w-full [&>video]:block [&>video]:w-full">{children}</div>
      </div>
    </div>
  );
}
