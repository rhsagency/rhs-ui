"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from "react";

import { chapterAt, clamp, formatTime, seekValueText, segmentsOf, type SeekBarBuffered, type SeekBarChapter } from "@rhs-ui/primitives/seek-bar/time";
import { cn } from "@/lib/utils";

export type { SeekBarBuffered, SeekBarChapter } from "@rhs-ui/primitives/seek-bar/time";

export interface SeekBarProps extends Omit<ComponentProps<"div">, "onChange" | "defaultValue" | "children"> {
  /** Where the media is now, in seconds. Update it from `timeupdate` (or every animation frame, for a smoother thumb). */
  value: number;
  /** How long the media is, in seconds. Zero, NaN or Infinity (not loaded yet, or a live stream) turns the bar off. */
  duration: number;
  /** The stretches that are already loaded, drawn between the played part and the rest. `toBuffered(media.buffered)` makes them from a media element. */
  buffered?: readonly SeekBarBuffered[];
  /** Named parts of the media. The bar is drawn in one piece for each, and the tooltip names the chapter under the pointer. */
  chapters?: readonly SeekBarChapter[];
  /** Called with the new time while the visitor drags, and for a click and every key press. Seek the media here to scrub live. */
  onSeek?: (seconds: number) => void;
  /** Called when a drag starts, for example to pause a video while it is scrubbed. */
  onSeekStart?: () => void;
  /** Called once with the final time when the pointer is released, and after each key press. Seek the media here, and not in `onSeek`, to jump only on release, which keeps a video from stuttering. */
  onSeekEnd?: (seconds: number) => void;
  /** Seconds moved by an arrow key. Shift moves three times as far. Default 5, so 15 with Shift. */
  step?: number;
  /** Turn the bar off. */
  disabled?: boolean;
  /** What the bar is called for assistive technology. Default "Seek". */
  label?: string;
  /** The words a screen reader says for a time, for another language. Default "1 minute 23 seconds of 4 minutes 56 seconds". While the length is not known yet it is called with 0 and 0, and the default is "Length not known yet". */
  valueText?: (seconds: number, duration: number) => string;
}

/** How long a time is held after a release or a key press, waiting for the player to report that it got there. */
const SETTLE_MS = 700;
/** The gap between two chapters, in px. */
const GAP = 2;
/** What a screen reader hears while the length is not known yet, when `valueText` does not say otherwise. */
const UNKNOWN_LENGTH = "Length not known yet";

/**
 * The scrubber for any audio or video player: what has played, what is
 * already loaded and what is left, in one thin bar. A tooltip shows the time
 * under the pointer and the name of the chapter it is in; with chapters the bar
 * is drawn in a piece for each. It is a slider for time: Left and Right (or Up
 * and Down) seek 5 seconds, 15 with Shift, Home and End jump to the ends, Page
 * Up and Page Down move a tenth of the length, and a screen reader hears "1
 * minute 23 seconds of 4 minutes 56 seconds". A drag keeps hold of the pointer
 * wherever it goes. Pass `onSeekEnd` to seek the media only on release. Until
 * the length is known the bar is off and says so ("Length not known yet"). You
 * bring the player: the bar shows `value` and reports where the visitor wants
 * to be.
 */
export function SeekBar({
  value,
  duration,
  buffered,
  chapters,
  onSeek,
  onSeekStart,
  onSeekEnd,
  step = 5,
  disabled = false,
  label = "Seek",
  valueText,
  className,
  ...props
}: SeekBarProps) {
  const total = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const off = disabled || total === 0;
  const track = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  // Whether the bar has focus because of a pointer: a press focuses it by script, which a browser may still count as keyboard focus.
  const byPointer = useRef(false);
  const latest = useRef(0);
  const settling = useRef<{ from: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  // The time the thumb shows while it is being moved, and for a moment after: the player has not caught up yet.
  const [held, setHeld] = useState<number | null>(null);
  const [pressed, setPressed] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);

  const now = clamp(Number.isFinite(value) ? value : 0, 0, total);
  const shown = held ?? now;
  const tipTime = off ? null : pressed ? shown : hover !== null ? hover * total : focused ? shown : null;
  const chapter = tipTime === null ? undefined : chapterAt(chapters, tipTime);
  const current = chapterAt(chapters, shown);
  // With no length there is no "0 seconds of 0 seconds" to say: a bar that is not ready says so in words and has no value.
  const unknown = total === 0;
  const spoken = unknown ? (valueText ? valueText(0, 0) : UNKNOWN_LENGTH) : valueText ? valueText(shown, total) : current ? `${seekValueText(shown, total)}, ${current.title}` : seekValueText(shown, total);

  function forget() {
    if (settling.current) clearTimeout(settling.current.timer);
    settling.current = null;
  }

  /** Hold the time a moment longer, until the player reports it (`value` changes) or the moment is over. */
  function settle() {
    forget();
    settling.current = {
      from: now,
      timer: setTimeout(() => {
        settling.current = null;
        setHeld(null);
      }, SETTLE_MS),
    };
  }

  useEffect(() => {
    if (settling.current && !dragging.current && value !== settling.current.from) {
      forget();
      setHeld(null);
    }
  }, [value]);
  useEffect(() => forget, []);

  // The tooltip follows the pointer but never leaves the bar: its position is worked out from what is measured.
  useLayoutEffect(() => {
    const box = tip.current;
    const bar = track.current;
    if (!box || !bar || tipTime === null || total === 0) return;
    const width = bar.clientWidth;
    const centre = (tipTime / total) * width;
    box.style.left = `${clamp(centre - box.offsetWidth / 2, 0, Math.max(0, width - box.offsetWidth))}px`;
  });

  function fractionAt(clientX: number): number {
    const box = track.current?.getBoundingClientRect();
    return box && box.width > 0 ? clamp((clientX - box.left) / box.width, 0, 1) : 0;
  }

  function commit(next: number) {
    latest.current = next;
    setHeld(next);
    settle();
    onSeek?.(next);
    onSeekEnd?.(next);
  }

  function press(event: PointerEvent<HTMLDivElement>) {
    if (off || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    byPointer.current = true;
    event.currentTarget.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
    forget();
    dragging.current = true;
    const next = fractionAt(event.clientX) * total;
    latest.current = next;
    setPressed(true);
    setHeld(next);
    onSeekStart?.();
    onSeek?.(next);
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    if (off) return;
    const fraction = fractionAt(event.clientX);
    if (event.pointerType === "mouse") setHover(fraction);
    if (!dragging.current) return;
    const next = fraction * total;
    if (next === latest.current) return;
    latest.current = next;
    setHeld(next);
    onSeek?.(next);
  }

  function release(event: PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    dragging.current = false;
    setPressed(false);
    if (event.pointerType !== "mouse") setHover(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    settle();
    onSeekEnd?.(latest.current);
  }

  function key(event: KeyboardEvent<HTMLDivElement>) {
    if (off || event.altKey || event.ctrlKey || event.metaKey) return;
    const from = held ?? now;
    const leap = event.shiftKey ? step * 3 : step;
    let next: number;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = from + leap;
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = from - leap;
    else if (event.key === "PageUp") next = from + total / 10;
    else if (event.key === "PageDown") next = from - total / 10;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = total;
    else return;
    event.preventDefault();
    // A key press makes this keyboard use, even after a click: from now on the tooltip follows focus.
    byPointer.current = false;
    setFocused(true);
    next = clamp(next, 0, total);
    if (next !== from) commit(next);
  }

  const segments = segmentsOf(total, chapters);
  const loaded = (buffered ?? []).filter((range) => range.end > range.start);
  const fraction = total > 0 ? shown / total : 0;

  return (
    <div data-slot="seek-bar" data-disabled={off || undefined} className={cn("relative w-full min-w-0", className)} {...props}>
      <div
        ref={track}
        role="slider"
        tabIndex={off ? -1 : 0}
        aria-label={label}
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={unknown ? undefined : total}
        aria-valuenow={unknown ? undefined : Math.round(shown)}
        aria-valuetext={spoken}
        aria-disabled={off || undefined}
        data-scrubbing={pressed || undefined}
        onPointerDown={press}
        onPointerMove={move}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={() => setHover(null)}
        onKeyDown={key}
        onFocus={() => setFocused(!byPointer.current)}
        onBlur={() => {
          byPointer.current = false;
          setFocused(false);
        }}
        className={cn(
          "group/seek relative flex h-6 w-full touch-none items-center outline-none select-none",
          // The part you see is a few pixels tall; the part that answers a finger is 40.
          "before:absolute before:inset-x-0 before:-inset-y-2 before:content-['']",
          off ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        )}
      >
        <div className="relative h-1 w-full transition-[height] duration-150 group-hover/seek:h-1.5 group-focus-visible/seek:h-1.5 group-data-[scrubbing]/seek:h-1.5 motion-reduce:transition-none">
          {(segments.length ? segments : [{ start: 0, end: 1 }]).map((segment, index, all) => {
            const length = segment.end - segment.start;
            const span = total > 0 ? length / total : 1;
            const last = index === all.length - 1;
            return (
              <span
                key={segment.start}
                className="absolute inset-y-0 overflow-hidden rounded-full bg-foreground/10"
                style={{ left: `${total > 0 ? (segment.start / total) * 100 : 0}%`, width: last ? `${span * 100}%` : `calc(${span * 100}% - ${GAP}px)` }}
              >
                {loaded.map((range) => {
                  const from = clamp((range.start - segment.start) / length, 0, 1);
                  const to = clamp((range.end - segment.start) / length, 0, 1);
                  return to > from ? <span key={`${range.start}-${range.end}`} className="absolute inset-y-0 bg-foreground/20" style={{ left: `${from * 100}%`, width: `${(to - from) * 100}%` }} /> : null;
                })}
                <span
                  className="absolute inset-y-0 left-0 bg-foreground transition-[width] duration-200 ease-linear group-data-[scrubbing]/seek:transition-none motion-reduce:transition-none"
                  style={{ width: `${clamp((shown - segment.start) / length, 0, 1) * 100}%` }}
                />
              </span>
            );
          })}
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center transition-[left] duration-200 ease-linear group-data-[scrubbing]/seek:transition-none motion-reduce:transition-none"
          style={{ left: `${fraction * 100}%` }}
        >
          <span className="absolute inset-0 rounded-full bg-ring/50 opacity-0 transition-opacity duration-150 group-focus-visible/seek:opacity-100 motion-reduce:transition-none" />
          <span
            className={cn(
              "relative size-3 rounded-full bg-foreground shadow-xs ring-2 ring-background transition-transform duration-150 motion-reduce:transition-none",
              !off && "group-hover/seek:scale-125 group-focus-visible/seek:scale-125 group-data-[scrubbing]/seek:scale-125",
            )}
          />
        </span>
      </div>
      <div
        ref={tip}
        aria-hidden="true"
        data-open={tipTime !== null || undefined}
        className="pointer-events-none absolute bottom-full left-0 z-10 mb-1 w-max max-w-full rounded-md bg-foreground px-2.5 py-1.5 text-center text-background opacity-0 shadow-sm transition-opacity duration-100 data-[open]:opacity-100 motion-reduce:transition-none"
      >
        <span className="block text-xs leading-4 font-medium tabular-nums">{formatTime(tipTime ?? shown, total)}</span>
        {chapter ? <span className="block truncate text-[0.6875rem] leading-4 text-background/70">{chapter.title}</span> : null}
      </div>
    </div>
  );
}
