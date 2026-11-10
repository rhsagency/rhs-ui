"use client";

import { useId, useLayoutEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from "react";

import { clamp, clock, resamplePeaks, spokenClock } from "@rhs-ui/primitives/audio-waveform/peaks";
import { cn } from "@/lib/utils";

export interface AudioWaveformProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /** Loudness from 0 to 1 in time order, as many as you have: the bars are resampled to the width. Empty draws a flat line, for peaks that are still on their way. */
  peaks: readonly number[];
  /** How much has played, from 0 to 1. Those bars are drawn in the foreground colour, the rest muted. */
  progress?: number;
  /** Called with the position, 0 to 1, when the visitor presses or drags on the waveform, or uses the arrow keys. Only with `interactive`. */
  onSeek?: (progress: number) => void;
  /** The width of a bar in px. Default 3. */
  barWidth?: number;
  /** The space between two bars in px. Default 2. */
  gap?: number;
  /** The height in px. Default 40. */
  height?: number;
  /** Make it a slider: a press or a drag seeks, the arrow keys seek, and a marker shows where a press will land. Without it the waveform is a still picture. */
  interactive?: boolean;
  /** The length of the audio in seconds. With it the slider says "1 minute 23 seconds of 4 minutes 56 seconds" and the marker shows the time. */
  duration?: number;
  /** What the waveform is called: "Voice note from Maya". An interactive waveform always has one (default "Seek"); a still one is hidden from assistive technology unless you give it one. */
  label?: string;
}

const MARKER_WIDTH = 2;

/**
 * A waveform drawn from peak values, for a voice note, a podcast or a track:
 * rounded bars as two SVG paths that are resampled to any width, with the
 * played part in the foreground colour and the rest muted. It is static and
 * cheap, so a list of fifty is fine. The server renders a flat dotted line
 * until the browser has measured the width, so it is never an empty box. With
 * `interactive` it is a slider: press or drag to seek, Left and Right (5
 * seconds, or 2 percent without a `duration`), Shift for three times that,
 * Home, End and the Page keys, and a marker with the time shows where a press
 * will land. Peaks come from your server, or from `peaksFromArrayBuffer` in
 * the browser.
 */
export function AudioWaveform({ peaks, progress = 0, onSeek, barWidth = 3, gap = 2, height = 40, interactive = false, duration, label, className, style, ...props }: AudioWaveformProps) {
  const id = useId().replace(/:/g, "");
  const box = useRef<HTMLDivElement>(null);
  const pressed = useRef(false);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const measure = () => setWidth(Math.floor(element.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const played = clamp(Number.isFinite(progress) ? progress : 0, 0, 1);
  const known = typeof duration === "number" && Number.isFinite(duration) && duration > 0;
  const pitch = Math.max(1, barWidth + gap);
  const count = Math.max(1, Math.floor((width + gap) / pitch));
  const left = (width - (count * pitch - gap)) / 2;
  const round = (value: number): number => Math.round(value * 100) / 100;

  let bars = "";
  if (width > 0) {
    resamplePeaks(peaks, count).forEach((peak, index) => {
      const tall = Math.max(barWidth + 1, peak * height);
      const reach = (tall - barWidth) / 2;
      bars += `M${round(left + index * pitch + barWidth / 2)} ${round(height / 2 - reach)}V${round(height / 2 + reach)}`;
    });
  }

  function fractionAt(clientX: number): number {
    const rect = box.current?.getBoundingClientRect();
    return rect && rect.width > 0 ? clamp((clientX - rect.left) / rect.width, 0, 1) : 0;
  }

  function press(event: PointerEvent<HTMLDivElement>) {
    if (!interactive || event.button !== 0) return;
    pressed.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    onSeek?.(fractionAt(event.clientX));
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    if (!interactive) return;
    const fraction = fractionAt(event.clientX);
    if (event.pointerType === "mouse" || pressed.current) setHover(fraction);
    if (pressed.current) onSeek?.(fraction);
  }

  function release(event: PointerEvent<HTMLDivElement>) {
    if (!pressed.current) return;
    pressed.current = false;
    if (event.pointerType !== "mouse") setHover(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function key(event: KeyboardEvent<HTMLDivElement>) {
    if (!interactive || event.altKey || event.ctrlKey || event.metaKey) return;
    const leap = (known ? 5 / (duration as number) : 0.02) * (event.shiftKey ? 3 : 1);
    let next: number;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = played + leap;
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = played - leap;
    else if (event.key === "PageUp") next = played + 0.1;
    else if (event.key === "PageDown") next = played - 0.1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 1;
    else return;
    event.preventDefault();
    next = clamp(next, 0, 1);
    if (next !== played) onSeek?.(next);
  }

  const seconds = known ? played * (duration as number) : 0;
  const slider = interactive
    ? ({
        role: "slider",
        tabIndex: 0,
        "aria-label": label ?? "Seek",
        "aria-orientation": "horizontal",
        "aria-valuemin": 0,
        "aria-valuemax": known ? (duration as number) : 100,
        "aria-valuenow": known ? Math.round(seconds) : Math.round(played * 100),
        "aria-valuetext": known ? `${spokenClock(seconds)} of ${spokenClock(duration as number)}` : `${Math.round(played * 100)} percent`,
      } as const)
    : label
      ? ({ role: "img", "aria-label": label } as const)
      : ({ "aria-hidden": true } as const);

  return (
    <div
      ref={box}
      data-slot="audio-waveform"
      data-interactive={interactive || undefined}
      onPointerDown={press}
      onPointerMove={move}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={() => setHover(null)}
      onKeyDown={key}
      className={cn(
        "relative w-full min-w-0 select-none",
        interactive && "cursor-pointer touch-pan-y rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
        className,
      )}
      style={{ ...style, height }}
      {...slider}
      {...props}
    >
      {width > 0 ? (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" strokeWidth={barWidth} strokeLinecap="round" aria-hidden="true" focusable="false" className="pointer-events-none absolute inset-0 block overflow-visible">
          <clipPath id={`${id}-played`}>
            <rect x="0" y="0" width={round(played * width)} height={height} />
          </clipPath>
          <path d={bars} className="stroke-foreground/25" />
          <path d={bars} className="stroke-foreground" clipPath={`url(#${id}-played)`} />
        </svg>
      ) : (
        // The width is only known in the browser, so on the server (and until the first measure) a flat dotted line stands in, and the box is never empty.
        <svg width="100%" height={height} fill="none" strokeWidth={barWidth} strokeLinecap="round" aria-hidden="true" focusable="false" className="pointer-events-none absolute inset-0 block overflow-visible">
          <line x1={barWidth / 2} y1={height / 2} x2="100%" y2={height / 2} strokeDasharray={`0.01 ${pitch - 0.01}`} className="stroke-foreground/25" />
        </svg>
      )}
      {hover !== null ? (
        <>
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 rounded-full bg-foreground/70" style={{ left: `calc(${hover * 100}% - ${MARKER_WIDTH / 2}px)`, width: MARKER_WIDTH }} />
          {known ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-full z-10 mb-1 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 text-xs font-medium text-background tabular-nums shadow-sm"
              style={{ left: `clamp(1.5rem, ${hover * 100}%, calc(100% - 1.5rem))` }}
            >
              {clock(hover * (duration as number))}
            </span>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
