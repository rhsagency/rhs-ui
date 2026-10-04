"use client";

import { useEffect, useRef, useState } from "react";

import { IconPause, IconPlay, IconRewind, IconFastForward } from "@rhs-ui/icons";
import { Slider } from "@rhs-ui/primitives/slider";
import { cn } from "@/lib/utils";

export interface AudioPlayerProps {
  src: string;
  title: string;
  /** The show, the artist, or who is speaking. */
  subtitle?: string;
  /** Square artwork. */
  artwork?: string;
  className?: string;
}

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

/**
 * A compact audio player for a podcast, a voice note or a track: artwork,
 * title, a scrubber that is a real slider, skip back fifteen and forward
 * thirty seconds, and the speed that podcast listeners always ask for.
 */
export function AudioPlayer({ src, title, subtitle, artwork, className }: AudioPlayerProps) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  useEffect(() => {
    const node = audio.current;
    if (!node) return;
    const tick = () => setTime(node.currentTime);
    const meta = () => setDuration(node.duration || 0);
    const end = () => setPlaying(false);
    node.addEventListener("timeupdate", tick);
    node.addEventListener("loadedmetadata", meta);
    node.addEventListener("ended", end);
    return () => { node.removeEventListener("timeupdate", tick); node.removeEventListener("loadedmetadata", meta); node.removeEventListener("ended", end); };
  }, []);
  const toggle = () => { const node = audio.current; if (!node) return; if (node.paused) { void node.play(); setPlaying(true); } else { node.pause(); setPlaying(false); } };
  const skip = (seconds: number) => { if (audio.current) audio.current.currentTime = Math.max(0, Math.min(duration, audio.current.currentTime + seconds)); };
  const cycle = () => { const next = rate >= 2 ? 1 : rate + 0.25; setRate(next); if (audio.current) audio.current.playbackRate = next; };
  const button = "inline-flex size-9 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4";
  return (
    <div data-slot="audio-player" role="group" aria-label={`Audio: ${title}`} className={cn("flex items-center gap-4 rounded-2xl border border-border bg-card p-3", className)}>
      <audio ref={audio} src={src || undefined} preload="metadata" />
      <span className="size-14 shrink-0 overflow-hidden rounded-xl bg-muted">{artwork ? <img src={artwork} alt="" className="size-full object-cover" /> : null}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
        <div className="mt-2 flex items-center gap-2">
          <span className="w-9 text-xs text-muted-foreground tabular-nums">{clock(time)}</span>
          <Slider className="flex-1" value={[time]} min={0} max={duration || 1} step={1} thumbLabels={["Position"]} onValueChange={([value]) => { if (audio.current && value !== undefined) audio.current.currentTime = value; }} />
          <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">{clock(duration)}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" className={button} aria-label="Back 15 seconds" onClick={() => skip(-15)}><IconRewind /></button>
        <button type="button" className={cn(button, "size-11 bg-foreground text-background hover:bg-foreground/90")} aria-label={playing ? "Pause" : "Play"} onClick={toggle}>{playing ? <IconPause /> : <IconPlay />}</button>
        <button type="button" className={button} aria-label="Forward 30 seconds" onClick={() => skip(30)}><IconFastForward /></button>
        <button type="button" className="h-9 rounded-full px-2 text-xs font-medium tabular-nums outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40" aria-label={`Playback speed ${rate}x`} onClick={cycle}>{rate}×</button>
      </div>
    </div>
  );
}
