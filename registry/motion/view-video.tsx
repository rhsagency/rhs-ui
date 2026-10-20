"use client";

import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";

import { IconPause, IconPlay } from "@rhs-ui/icons";
import { useInView, usePrefersReducedMotion } from "@rhs-ui/motion/use-in-view";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface ViewVideoSource {
  /** The file's URL. */
  src: string;
  /** The MIME type, so the browser can skip a format it cannot play: "video/webm" or "video/mp4". */
  type: string;
}

export interface ViewVideoProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** The clip. For several formats use `sources` instead. Pass another file and the new clip loads and plays in its place. */
  src?: string;
  /** The same clip in more formats, best first: WebM, then MP4 as the fallback. Pass another list and the new clip loads and plays in its place. */
  sources?: readonly ViewVideoSource[];
  /** A still of the clip. It shows until the clip plays and stands in for it under reduced motion. */
  poster: string;
  /** What the clip shows. It names the video and its pause button. */
  label: string;
  /** Loop the clip. */
  loop?: boolean;
  /** How much of the video must be on screen before it plays, from 0 to 1. */
  threshold?: number;
  /** Add the browser's own controls (seek, volume, fullscreen) next to the pause button. */
  controls?: boolean;
  /** Width over height of the frame, 16 / 9 by default. It holds the space before the clip loads. */
  ratio?: number;
  /** Called with true when the clip starts playing and false when it stops (scrolled away, paused, tab hidden), for a status label or analytics. */
  onPlayingChange?: (playing: boolean) => void;
}

/**
 * A muted loop or product demo that only plays while it is in view. It starts
 * when at least half of it is on screen and pauses when it leaves, or when the
 * tab goes to the background, so it costs no battery or data while nobody
 * watches. Only metadata loads until it is a screen away. A pause button is
 * always there (WCAG 2.2.2), pausing it yourself sticks, and under reduced
 * motion it never starts by itself: the poster stays until you press play.
 */
export function ViewVideo({ src, sources, poster, label, loop = true, threshold = 0.5, controls = false, ratio = 16 / 9, onPlayingChange, className, ...props }: ViewVideoProps) {
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const reduced = usePrefersReducedMotion();
  const near = useInView(frame, { once: true, margin: "100% 0px" });
  const [seen, setSeen] = useState(false);
  const [awake, setAwake] = useState(true);
  const [held, setHeld] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const ours = useRef(false);
  const state = useRef({ seen, awake });
  const hold = held || reduced;
  // Which clip is on show. The browser reads a video's files once and ignores later edits to its <source>s, so a new clip needs a new element.
  const clip = src ?? sources?.map((source) => `${source.type} ${source.src}`).join(" ");

  useEffect(() => {
    state.current = { seen, awake };
  });

  const notify = useRef(onPlayingChange);
  const reported = useRef(false);
  useEffect(() => {
    notify.current = onPlayingChange;
  });
  useEffect(() => {
    if (reported.current === playing) return;
    reported.current = playing;
    notify.current?.(playing);
  }, [playing]);

  // Mostly on screen: play. Otherwise rest.
  useEffect(() => {
    const node = frame.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    // A frame taller than the screen can never be half in view, so half the screen filled counts too.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const filled = entry.rootBounds ? entry.intersectionRect.height / entry.rootBounds.height : 0;
        setSeen(entry.intersectionRatio >= threshold || filled >= threshold);
      },
      { threshold: Array.from({ length: 21 }, (_, step) => step / 20) },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  useEffect(() => {
    const update = (): void => setAwake(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    const node = video.current;
    if (!node || failed) return;
    if (seen && awake && !hold) {
      // Autoplay can still be refused (a battery saver, say): the poster stays and the button offers play.
      node.play().catch(() => {});
    } else if (!node.paused) {
      ours.current = true;
      node.pause();
    }
    // A new clip is a new element, so it starts here too.
  }, [seen, awake, hold, failed, clip]);

  // A new clip starts with a clean slate.
  useEffect(() => {
    setFailed(false);
    setPlaying(false);
  }, [clip]);

  function toggle(): void {
    const node = video.current;
    if (!node) return;
    if (node.paused) {
      setHeld(false);
      node.play().catch(() => {});
    } else {
      setHeld(true);
      ours.current = true;
      node.pause();
    }
  }

  const fail = (): void => setFailed(true);

  return (
    <div ref={frame} data-slot="view-video" data-state={failed ? "failed" : playing ? "playing" : "paused"} className={cn("relative overflow-hidden rounded-xl border border-border bg-muted", className)} {...props}>
      <AspectRatio ratio={ratio}>
        <video
          key={clip}
          ref={video}
          aria-label={label}
          poster={poster}
          src={src}
          muted
          loop={loop}
          playsInline
          controls={controls}
          preload={near && !reduced ? "auto" : "metadata"}
          onPlay={() => setPlaying(true)}
          onPause={() => {
            setPlaying(false);
            // A pause nobody here asked for, from the native controls, is the reader's choice. Browser housekeeping in the background is not.
            if (!ours.current && state.current.seen && state.current.awake) setHeld(true);
            ours.current = false;
          }}
          onError={src ? fail : undefined}
          className="size-full object-cover"
        >
          {sources?.map((source, index) => <source key={`${source.type}-${index}`} src={source.src} type={source.type} onError={index === sources.length - 1 ? fail : undefined} />)}
        </video>
      </AspectRatio>
      {failed ? (
        <p role="status" className="absolute bottom-3 left-3 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground shadow-xs">
          Video unavailable
        </p>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggle}
          aria-label={`${playing ? "Pause" : "Play"} video: ${label}`}
          // The dark scope keeps a light glyph on a dark disc whatever the page theme, so it reads over any frame.
          className={cn("dark absolute right-3 rounded-full border-foreground/25 bg-background/90 text-foreground shadow-xs hover:bg-background", controls ? "top-3" : "bottom-3")}
        >
          {playing ? <IconPause /> : <IconPlay />}
        </Button>
      )}
    </div>
  );
}
