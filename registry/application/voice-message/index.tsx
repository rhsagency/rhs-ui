"use client";

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from "react";

import { IconAlertCircle, IconPause, IconPlay, IconSpinner } from "@rhs-ui/icons";
import { claimPlayback, releasePlayback } from "@rhs-ui/application/voice-message/playback";
import { DEFAULT_LABELS, SPEEDS, clock, fallbackPeaks, fill, resample, type VoiceMessageLabels } from "@rhs-ui/application/voice-message/voice";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export type { VoiceMessageLabels } from "@rhs-ui/application/voice-message/voice";

export interface VoiceMessageProps extends Omit<ComponentProps<"div">, "children" | "onPlay"> {
  /** The audio: an address or a data URI. It is only fetched as far as its length until someone presses play. */
  src?: string;
  /** The loudness of the recording as a list of peak values, on any scale: the waveform is drawn from them. Without it a waveform is drawn from the address, the same on the server and in the browser. */
  peaks?: readonly number[];
  /** How long the recording runs, in seconds. It is shown at once; once the audio has loaded, its own length takes over. */
  duration?: number;
  /** Whose message it is. Yours sits on the right in the inverted tone, theirs on the left in the quiet one. Default "them". */
  sender?: "me" | "them";
  /** The sender's name for a screen reader: "Priya". Without it the message says "you" or "them". */
  name?: string;
  /** Where the message starts, in seconds, for a note that was listened to halfway. Default 0. */
  defaultTime?: number;
  /** Playback started. Use it to mark the message as heard. */
  onPlay?: () => void;
  /** The words the message says, for translation. */
  labels?: VoiceMessageLabels;
}

/** How many bars the waveform has: enough to read as a voice at the width of a bubble, few enough to stay a calm texture. */
const BARS = 40;

/** What differs between a message you sent and one you received: the bubble, the play button, the waveform's two tones and the small text. */
const TONE = {
  me: {
    bubble: "rounded-br-md bg-primary text-primary-foreground",
    play: "bg-primary-foreground text-primary hover:bg-primary-foreground/90 focus-visible:border-primary-foreground focus-visible:ring-primary-foreground/50",
    rest: "text-primary-foreground/35",
    played: "text-primary-foreground",
    small: "text-primary-foreground/75",
    chip: "bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25 focus-visible:ring-primary-foreground/50",
    focus: "focus-visible:ring-primary-foreground/50",
    error: "text-primary-foreground",
  },
  them: {
    bubble: "rounded-bl-md bg-muted text-foreground",
    play: "",
    rest: "text-foreground/25",
    played: "text-foreground",
    small: "text-muted-foreground",
    chip: "border border-border bg-background text-foreground hover:bg-background/60 focus-visible:ring-ring/40",
    focus: "focus-visible:ring-ring/40",
    // Plain destructive red is short of AA on the grey bubble, so it is pulled a little toward the text colour.
    error: "text-[color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]",
  },
} as const;

/** The bars of the waveform, all the same height in a row, so two layers of them line up exactly. */
function Bars({ heights, tone }: { heights: readonly number[]; tone: string }) {
  return (
    <div aria-hidden="true" className={cn("absolute inset-0 flex items-center gap-[2px]", tone)}>
      {heights.map((height, index) => (
        <span key={index} style={{ height: `${Math.round(Math.max(0.14, height) * 100)}%` }} className="min-w-0 flex-1 rounded-full bg-current" />
      ))}
    </div>
  );
}

/**
 * A voice note in a chat: a round play button, a waveform that fills as it
 * plays, elapsed over total time in tabular numbers and a speed button that
 * goes 1x, 1.5x, 2x. The waveform is also the seek slider: click or drag it,
 * or use the arrow keys (5 seconds, 15 with Shift), Page Up and Down, Home and
 * End. The play button keeps its name and reports aria-pressed while it plays.
 * Only one message plays at a time: starting one pauses the one that was
 * playing, through a tiny shared store, and a message that ends goes back to
 * its start. While the audio loads the button shows a spinner and says so; if
 * it cannot be loaded the bubble says "Could not load voice message" in words
 * and offers Try again. Without peaks it draws a waveform from the address, the
 * same one on the server and in the browser; the progress needs no animation,
 * so reduced motion changes nothing about it.
 */
export function VoiceMessage({ src, peaks, duration, sender = "them", name, defaultTime = 0, onPlay, labels, className, ...props }: VoiceMessageProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const tone = TONE[sender];
  const id = useId();
  const audio = useRef<HTMLAudioElement>(null);
  const wave = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [loaded, setLoaded] = useState<number | null>(null);
  const [time, setTime] = useState(defaultTime);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [seen, setSeen] = useState(src);
  // A message that is given other audio starts again from its beginning; one that is only now given its first audio keeps the place it was told to start at.
  if (src !== seen) {
    setSeen(src);
    if (seen !== undefined) {
      setLoaded(null);
      setTime(0);
      setPlaying(false);
      setLoading(false);
      setFailed(false);
    }
  }

  const length = loaded ?? duration ?? 0;
  const heights = useMemo(() => (peaks && peaks.length > 0 ? resample(peaks, BARS) : fallbackPeaks(src ?? id, BARS)), [peaks, src, id]);
  const fraction = length > 0 ? Math.min(1, Math.max(0, time / length)) : 0;
  const who = name ?? (sender === "me" ? text.me : text.them);

  // While it plays, the progress follows the audio frame by frame; the browser's own timeupdate is only a few times a second.
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      const element = audio.current;
      if (element && !dragging.current) setTime((before) => (Math.abs(before - element.currentTime) > 0.03 ? element.currentTime : before));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  // A message that leaves the page stops, and gives up its place.
  useEffect(
    () => () => {
      releasePlayback(id);
      audio.current?.pause();
    },
    [id],
  );

  function seekTo(next: number) {
    const value = Math.min(length || next, Math.max(0, next));
    setTime(value);
    const element = audio.current;
    if (element && element.readyState > 0) element.currentTime = value;
  }

  async function toggle() {
    const element = audio.current;
    if (!element) return;
    if (!element.paused) {
      element.pause();
      return;
    }
    if (!src) {
      setFailed(true);
      return;
    }
    claimPlayback(id, () => element.pause());
    element.playbackRate = SPEEDS[speed] ?? 1;
    if (Math.abs(element.currentTime - time) > 0.3) element.currentTime = time;
    setLoading(element.readyState < 3);
    try {
      await element.play();
      onPlay?.();
    } catch (error) {
      // A press that a pause cancelled is no failure, and a browser that wants a tap first is not one either.
      const reason = error instanceof DOMException ? error.name : "";
      if (reason === "AbortError") return;
      releasePlayback(id);
      setLoading(false);
      if (reason !== "NotAllowedError") setFailed(true);
    }
  }

  function retry() {
    setFailed(false);
    setTime(0);
    audio.current?.load();
  }

  function cycleSpeed() {
    const next = (speed + 1) % SPEEDS.length;
    setSpeed(next);
    if (audio.current) audio.current.playbackRate = SPEEDS[next] ?? 1;
  }

  function fromPointer(event: PointerEvent<HTMLDivElement>) {
    const box = wave.current?.getBoundingClientRect();
    if (!box || box.width === 0 || !(length > 0)) return;
    seekTo(((event.clientX - box.left) / box.width) * length);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || failed) return;
    const step = event.shiftKey ? 15 : 5;
    const next =
      event.key === "ArrowRight" || event.key === "ArrowUp" ? time + step : event.key === "ArrowLeft" || event.key === "ArrowDown" ? time - step : event.key === "PageUp" ? time + 15 : event.key === "PageDown" ? time - 15 : event.key === "Home" ? 0 : event.key === "End" ? length : null;
    if (next === null) return;
    event.preventDefault();
    seekTo(next);
  }

  const total = clock(length);

  return (
    <div
      data-slot="voice-message"
      data-sender={sender}
      data-state={failed ? "failed" : playing ? "playing" : undefined}
      role="group"
      aria-label={fill(text.group, { sender: who, total })}
      className={cn("flex w-full max-w-[19rem]", sender === "me" && "ml-auto", className)}
      {...props}
    >
      <div className={cn("grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 rounded-2xl px-3 py-2.5", tone.bubble)}>
        <Button
          type="button"
          size="icon"
          aria-pressed={playing}
          aria-label={text.play}
          aria-busy={loading || undefined}
          disabled={failed}
          onClick={() => void toggle()}
          className={cn("size-10 rounded-full", tone.play)}
        >
          {loading ? <IconSpinner /> : playing ? <IconPause strokeWidth={2.5} /> : <IconPlay fill="currentColor" className="translate-x-px" />}
        </Button>

        <div className={cn("grid min-w-0 gap-1", failed && "col-span-2")}>
          <div
            ref={wave}
            role="slider"
            tabIndex={failed ? -1 : 0}
            aria-label={text.seek}
            aria-valuemin={0}
            aria-valuemax={Math.round(length)}
            aria-valuenow={Math.round(Math.min(time, length || time))}
            aria-valuetext={fill(text.position, { time: clock(time), total })}
            aria-disabled={failed || undefined}
            onKeyDown={onKeyDown}
            onPointerDown={(event) => {
              if (event.button !== 0 || failed) return;
              dragging.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              fromPointer(event);
            }}
            onPointerMove={(event) => {
              if (dragging.current) fromPointer(event);
            }}
            onPointerUp={() => {
              dragging.current = false;
            }}
            onPointerCancel={() => {
              dragging.current = false;
            }}
            className={cn("relative h-8 touch-pan-y rounded-md outline-none focus-visible:ring-[3px]", failed ? "opacity-50" : "cursor-pointer", tone.focus)}
          >
            <Bars heights={heights} tone={tone.rest} />
            <div aria-hidden="true" className="absolute inset-0" style={{ clipPath: `inset(0 ${(1 - fraction) * 100}% 0 0)` }}>
              <Bars heights={heights} tone={tone.played} />
            </div>
          </div>

          {failed ? (
            <p role="alert" className={cn("flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs leading-4 font-medium", tone.error)}>
              <span className="inline-flex items-center gap-1.5">
                <IconAlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
                {text.failed}
              </span>
              <button type="button" onClick={retry} className={cn("rounded-sm underline underline-offset-2 outline-none focus-visible:ring-[3px]", tone.focus)}>
                {text.retry}
              </button>
            </p>
          ) : (
            <p aria-hidden="true" className={cn("text-xs leading-4 tabular-nums", tone.small)}>
              {clock(time)} / {total}
            </p>
          )}
        </div>

        {failed ? null : (
          <button
            type="button"
            aria-label={fill(text.speed, { speed: SPEEDS[speed] ?? 1 })}
            onClick={cycleSpeed}
            className={cn("inline-grid h-6 min-w-9 place-items-center rounded-full px-2 text-xs font-medium tabular-nums outline-none transition-colors duration-150 focus-visible:ring-[3px] motion-reduce:transition-none", tone.chip)}
          >
            {SPEEDS[speed]}x
          </button>
        )}
      </div>

      <p role="status" className="sr-only">
        {loading ? text.loading : ""}
      </p>
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const element = event.currentTarget;
          if (Number.isFinite(element.duration) && element.duration > 0) setLoaded(element.duration);
          if (time > 0) element.currentTime = Math.min(time, element.duration || time);
          setFailed(false);
        }}
        onDurationChange={(event) => {
          const next = event.currentTarget.duration;
          if (Number.isFinite(next) && next > 0) setLoaded(next);
        }}
        onPlaying={() => {
          setLoading(false);
          setPlaying(true);
        }}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onPause={() => {
          setPlaying(false);
          setLoading(false);
          releasePlayback(id);
        }}
        onEnded={(event) => {
          event.currentTarget.currentTime = 0;
          setTime(0);
          setPlaying(false);
          releasePlayback(id);
        }}
        onError={() => {
          setFailed(true);
          setPlaying(false);
          setLoading(false);
          releasePlayback(id);
        }}
        className="hidden"
      />
    </div>
  );
}
