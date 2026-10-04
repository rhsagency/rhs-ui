"use client";

import { useEffect, useRef, useState } from "react";

import { IconMaximize, IconPause, IconPlay, IconVolume, IconVolumeOff } from "@rhs-ui/icons";
import { Slider } from "@rhs-ui/primitives/slider";
import { cn } from "@/lib/utils";

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  /** What the video is, for the player's accessible name. */
  title: string;
  /** WebVTT captions, shown by default when given. */
  captions?: { src: string; label: string; srcLang: string };
  className?: string;
}

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

/**
 * A video with controls in the RHS UI style: play, a scrubber that is a real
 * slider, time, mute and fullscreen, captions on when you provide them.
 * Space toggles play when the player has focus. No autoplay.
 */
export function VideoPlayer({ src, poster, title, captions, className }: VideoPlayerProps) {
  const host = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  useEffect(() => {
    const node = video.current;
    if (!node) return;
    const tick = () => setTime(node.currentTime);
    const meta = () => setDuration(node.duration || 0);
    const play = () => setPlaying(true);
    const pause = () => setPlaying(false);
    node.addEventListener("timeupdate", tick);
    node.addEventListener("loadedmetadata", meta);
    node.addEventListener("play", play);
    node.addEventListener("pause", pause);
    return () => { node.removeEventListener("timeupdate", tick); node.removeEventListener("loadedmetadata", meta); node.removeEventListener("play", play); node.removeEventListener("pause", pause); };
  }, []);
  const toggle = () => { const node = video.current; if (!node) return; if (node.paused) void node.play(); else node.pause(); };
  const button = "inline-flex size-8 items-center justify-center rounded-md text-white outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white [&_svg]:size-4";
  return (
    <div ref={host} data-slot="video-player" role="group" aria-label={title} tabIndex={0} onKeyDown={(event) => { if (event.key === " " && event.target === event.currentTarget) { event.preventDefault(); toggle(); } }} className={cn("group/player relative overflow-hidden rounded-xl bg-black outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", className)}>
      <video ref={video} src={src || undefined} poster={poster} playsInline muted={muted} onClick={toggle} className="aspect-video w-full">
        {captions ? <track kind="captions" src={captions.src} label={captions.label} srcLang={captions.srcLang} default /> : null}
      </video>
      {!playing ? (
        <button type="button" onClick={toggle} aria-label={`Play ${title}`} className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg outline-none focus-visible:ring-4 focus-visible:ring-white/60 [&_svg]:size-6"><IconPlay /></button>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-linear-to-t from-black/70 to-transparent px-3 pt-8 pb-2">
        <button type="button" className={button} onClick={toggle} aria-label={playing ? "Pause" : "Play"}>{playing ? <IconPause /> : <IconPlay />}</button>
        <Slider className="flex-1" value={[time]} min={0} max={duration || 1} step={0.1} thumbLabels={["Position"]} onValueChange={([value]) => { if (video.current && value !== undefined) video.current.currentTime = value; }} />
        <span className="w-20 text-right text-xs text-white tabular-nums">{clock(time)} / {clock(duration)}</span>
        <button type="button" className={button} onClick={() => setMuted(!muted)} aria-label={muted ? "Unmute" : "Mute"} aria-pressed={muted}>{muted ? <IconVolumeOff /> : <IconVolume />}</button>
        <button type="button" className={button} onClick={() => void host.current?.requestFullscreen?.()} aria-label="Fullscreen"><IconMaximize /></button>
      </div>
    </div>
  );
}
