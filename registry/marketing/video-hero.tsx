"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { IconPause, IconPlay } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface VideoHeroProps {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  title: string;
  description?: string;
  actions?: ReactNode;
  /** A muted, looping clip. Without it the poster stands alone. */
  src?: string;
  poster: string;
  /** What the clip shows, for people who cannot see it. */
  alt: string;
  className?: string;
}

/**
 * Copy over a full-bleed clip. The clip is muted, plays inline, never starts
 * under reduced motion, and has a visible pause control (WCAG 2.2.2). The
 * copy sits on a scrim that keeps contrast whatever the frame shows.
 */
export function VideoHero({ title, description, actions, src, poster, alt, titleAs: Title = "h2", className }: VideoHeroProps) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const node = video.current;
    if (!node || !src) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    node.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [src]);
  function toggle() {
    const node = video.current;
    if (!node) return;
    if (node.paused) void node.play().then(() => setPlaying(true));
    else {
      node.pause();
      setPlaying(false);
    }
  }
  return (
    <section data-slot="video-hero" className={cn("dark relative isolate overflow-hidden rounded-2xl bg-background text-foreground", className)}>
      {src ? (
        <video ref={video} className="absolute inset-0 -z-10 size-full object-cover" src={src} poster={poster} muted loop playsInline preload="metadata" aria-label={alt} />
      ) : (
        <img className="absolute inset-0 -z-10 size-full object-cover" src={poster} alt={alt} />
      )}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black/55" />
      <div className="flex min-h-[32rem] flex-col justify-end px-6 py-12 sm:px-12 sm:py-16">
        <Title className="max-w-2xl text-5xl font-medium leading-[1.04] tracking-[-.055em] text-balance sm:text-6xl">{title}</Title>
        {description ? <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">{description}</p> : null}
        {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {src ? (
        <button type="button" onClick={toggle} aria-label={playing ? "Pause background video" : "Play background video"} className="absolute right-4 bottom-4 inline-flex size-10 items-center justify-center rounded-full border border-border bg-background/70 backdrop-blur outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4">
          {playing ? <IconPause /> : <IconPlay />}
        </button>
      ) : null}
    </section>
  );
}
