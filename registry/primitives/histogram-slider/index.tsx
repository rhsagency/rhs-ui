"use client";

import { useId, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from "react";

import {
  centreOf,
  clamp,
  countBetween,
  DEFAULT_LABELS,
  handleLeft,
  normaliseRange,
  parseNumber,
  percentOf,
  snap,
  valueAt,
  type HistogramLabels,
  type HistogramSummary,
} from "@rhs-ui/primitives/histogram-slider/values";
import { cn } from "@/lib/utils";

export type { HistogramLabels, HistogramSummary } from "@rhs-ui/primitives/histogram-slider/values";

export interface HistogramSliderProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** What the slider filters: "Price per night". It heads the field and names the handles for a screen reader. */
  label: string;
  /** Keep the label for screen readers only, when the page already says it. */
  hideLabel?: boolean;
  /** How many items sit in each bucket, from `min` to `max` in equal parts: `[12, 40, 96, 180, ...]`. One bar is drawn for each. */
  buckets: readonly number[];
  /** The lowest value the range can start at. */
  min: number;
  /** The highest value the range can end at. */
  max: number;
  /** The distance between values, counted from `min`. Default 1. */
  step?: number;
  /** The chosen range, `[low, high]`, when you control the slider. */
  value?: readonly [number, number];
  /** The range to start with, when you do not control the slider. Default the whole range. */
  defaultValue?: readonly [number, number];
  /** Called with every new range while a handle moves, and when a number field commits one. */
  onValueChange?: (value: [number, number]) => void;
  /** Called once when a drag ends or a key press settles, for a search that should not run on every pixel. */
  onValueCommit?: (value: [number, number]) => void;
  /** How a value is written: `(v) => "€" + v`. It is used in the sentence, in the number fields and in what a screen reader hears. Default the number as the locale writes it. */
  formatValue?: (value: number) => string;
  /** The noun for what is counted, singular then plural: `["home", "homes"]`. Default result and results. */
  noun?: readonly [string, string];
  /** Writes the sentence under the heading yourself, when "312 homes between 800 and 1,400" is not how you say it. */
  summary?: (info: HistogramSummary) => string;
  /** The locale the numbers are written and read in. Default "en-US". */
  locale?: string;
  /** The words of the slider, for another language or your own voice. */
  labels?: Partial<HistogramLabels>;
  /** Turn the slider and its fields off. */
  disabled?: boolean;
}

const FIELD =
  "grid min-w-0 gap-0.5 rounded-lg border border-input bg-background px-2.5 pt-1.5 pb-2 shadow-xs @2xs:px-3 transition-[border-color,box-shadow] duration-150 " +
  "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40 motion-reduce:transition-none data-[disabled]:opacity-50";

const HANDLE =
  "absolute top-1/2 block size-6 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-primary bg-background shadow-sm outline-none " +
  "transition-shadow duration-150 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[active]:z-10 data-[active]:cursor-grabbing motion-reduce:transition-none " +
  // The part you see is 24px; the part that answers a finger is 44px.
  "before:absolute before:-inset-2.5 before:content-['']";

/**
 * The price filter of listing sites: a range slider with a row of bars behind
 * the track that shows how many items sit at each value, so people see where
 * the choices cluster. Inside the range the bars are full strength and outside
 * they are faint, with the cut exactly where the handles are. The bars are
 * drawn in CSS and hidden from assistive technology; one sentence carries the
 * information ("312 homes between 800 and 1,400") and is read out politely as
 * the handles move. Two number fields stay in step with the handles, and the
 * handles never cross, so the minimum can never pass the maximum. Both
 * handles are sliders with 44px targets and take the arrow, Page, Home and End
 * keys; a press anywhere on the track moves the nearest one.
 */
export function HistogramSlider({
  label,
  hideLabel,
  buckets,
  min,
  max,
  step = 1,
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  formatValue,
  noun = ["result", "results"],
  summary,
  locale = "en-US",
  labels: labelOverrides,
  disabled,
  className,
  ...props
}: HistogramSliderProps) {
  const text: HistogramLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const base = useId();
  const labelId = `${base}-label`;
  const summaryId = `${base}-summary`;
  const track = useRef<HTMLDivElement>(null);
  const handles = useRef<(HTMLSpanElement | null)[]>([]);
  const drag = useRef<{ index: 0 | 1 | null; grab: number; startX: number } | null>(null);
  // A click that brings the focus into a field would put the caret down and lose the selection made on arrival; this keeps it for that one click.
  const arriving = useRef(false);
  const [own, setOwn] = useState<[number, number]>(() => normaliseRange(defaultValue ?? [min, max], min, max, step));
  const [active, setActive] = useState<0 | 1 | null>(null);
  const [draft, setDraft] = useState<{ end: "low" | "high"; text: string } | null>(null);
  const [low, high] = normaliseRange(value ?? own, min, max, step);
  // What the handles stand on right now, also between two renders: pointer events can arrive faster than React draws.
  const now = useRef<[number, number]>([low, high]);
  now.current = [low, high];
  const numbers = new Intl.NumberFormat(locale);
  const write = formatValue ?? ((amount: number) => numbers.format(amount));

  function set(next: readonly [number, number], commit = false) {
    const range = normaliseRange(next, min, max, step);
    const changed = range[0] !== now.current[0] || range[1] !== now.current[1];
    if (changed) {
      now.current = range;
      if (value === undefined) setOwn(range);
      onValueChange?.(range);
    }
    if (commit && changed) onValueCommit?.(range);
  }

  /** The handle moved to `target`, kept between the limit and the other handle: they meet but never cross. */
  function moveHandle(index: 0 | 1, target: number, commit = false) {
    const [a, b] = now.current;
    if (index === 0) set([clamp(snap(target, min, max, step), min, b), b], commit);
    else set([a, clamp(snap(target, min, max, step), a, max)], commit);
  }

  /**
   * The nearest handle to a pointer, and how far off its centre the pointer grabbed it. When both handles stand under the pointer, only the
   * first move can say which one is meant: to the left it is the minimum, to the right the maximum.
   */
  function pick(clientX: number): { index: 0 | 1 | null; grab: number } {
    const box = track.current?.getBoundingClientRect() ?? { left: 0, width: 1 };
    const [a, b] = now.current;
    const at = [centreOf(a, box, min, max), centreOf(b, box, min, max)] as const;
    const da = Math.abs(clientX - at[0]);
    const db = Math.abs(clientX - at[1]);
    if (a === b && da <= 12) return { index: null, grab: clientX - at[0] };
    const index: 0 | 1 = da < db ? 0 : db < da ? 1 : clientX < at[0] ? 0 : 1;
    const off = clientX - at[index];
    return { index, grab: Math.abs(off) <= 12 ? off : 0 };
  }

  function choose(index: 0 | 1) {
    if (drag.current) drag.current.index = index;
    setActive(index);
    handles.current[index]?.focus({ preventScroll: true });
  }

  function slide(event: PointerEvent<HTMLDivElement>) {
    const box = track.current?.getBoundingClientRect();
    const grab = drag.current;
    if (!box || !grab) return;
    if (grab.index === null) {
      if (Math.abs(event.clientX - grab.startX) < 2) return;
      choose(event.clientX < grab.startX ? 0 : 1);
    }
    if (grab.index !== null) moveHandle(grab.index, valueAt(event.clientX - grab.grab, box, min, max, step));
  }

  function press(event: PointerEvent<HTMLDivElement>) {
    if (disabled || event.button !== 0) return;
    event.preventDefault();
    const found = pick(event.clientX);
    drag.current = { ...found, startX: event.clientX };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (found.index !== null) choose(found.index);
    slide(event);
  }

  function release(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    drag.current = null;
    setActive(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    onValueCommit?.([...now.current]);
  }

  function key(event: KeyboardEvent<HTMLSpanElement>, index: 0 | 1) {
    if (disabled || event.altKey || event.ctrlKey || event.metaKey) return;
    const [a, b] = now.current;
    const here = index === 0 ? a : b;
    const [lo, hi] = index === 0 ? [min, b] : [a, max];
    const arrows: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };
    let target: number | null = null;
    if (event.key in arrows) target = here + arrows[event.key]! * step * (event.shiftKey ? 10 : 1);
    else if (event.key === "PageUp") target = here + step * 10;
    else if (event.key === "PageDown") target = here - step * 10;
    else if (event.key === "Home") target = lo;
    else if (event.key === "End") target = hi;
    if (target === null) return;
    event.preventDefault();
    moveHandle(index, target, true);
  }

  /** The number typed into a field, kept on a step and between the limits and the other end: the minimum never passes the maximum. */
  function commitDraft() {
    if (!draft) return;
    const parsed = parseNumber(draft.text, locale);
    setDraft(null);
    if (parsed !== null) moveHandle(draft.end === "low" ? 0 : 1, parsed, true);
  }

  const peak = Math.max(1, ...buckets);
  const count = countBetween(buckets, min, max, low, high);
  const info: HistogramSummary = {
    count,
    countText: numbers.format(count),
    low,
    high,
    lowText: write(low),
    highText: write(high),
    noun: count === 1 ? noun[0] : noun[1],
  };
  const sentence = (summary ?? text.summary)(info);
  const from = percentOf(low, min, max);
  const to = percentOf(high, min, max);

  // The bars are laid out between the centres of the two handles at the ends, which is where the track puts them, so an edge of a bar is exactly under a handle.
  const bars = (tone: string) => (
    <div className="flex h-full items-end gap-0.5">
      {buckets.map((amount, index) => (
        <span key={index} className={cn("min-w-0 flex-1 rounded-t-[3px]", tone)} style={{ height: `${Math.max((amount / peak) * 100, 3)}%` }} />
      ))}
    </div>
  );

  const field = (end: "low" | "high", name: string, current: number) => {
    const mine = draft && draft.end === end ? draft : null;
    return (
      <label data-disabled={disabled || undefined} className={FIELD}>
        <span className="text-[0.6875rem] leading-4 font-medium text-muted-foreground">{name}</span>
        <input
          type="text"
          role="spinbutton"
          inputMode={Number.isInteger(step) && min >= 0 ? "numeric" : "decimal"}
          aria-label={`${name}, ${label}`}
          aria-valuenow={current}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={write(current)}
          disabled={disabled}
          value={mine ? mine.text : write(current)}
          // The text stays as it is written ("€1,400") until something is typed over it, and the whole of it is selected on arrival.
          onMouseDown={(event) => {
            arriving.current = document.activeElement !== event.currentTarget;
          }}
          onMouseUp={(event) => {
            if (!arriving.current) return;
            arriving.current = false;
            event.preventDefault();
          }}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => setDraft({ end, text: event.target.value })}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            const moves: Record<string, number> = { ArrowUp: step, ArrowDown: -step, PageUp: step * 10, PageDown: -step * 10 };
            if (event.key in moves) {
              event.preventDefault();
              const typed = mine ? (parseNumber(mine.text, locale) ?? current) : current;
              moveHandle(end === "low" ? 0 : 1, typed + moves[event.key]!, true);
              setDraft(null);
            } else if (event.key === "Enter") {
              commitDraft();
              event.currentTarget.select();
            } else if (event.key === "Escape") setDraft(null);
          }}
          className="h-6 w-full min-w-0 bg-transparent p-0 text-sm font-medium text-ellipsis tabular-nums outline-none"
        />
      </label>
    );
  };

  return (
    <div data-slot="histogram-slider" data-disabled={disabled || undefined} role="group" aria-labelledby={labelId} className={cn("@container grid w-full min-w-0 gap-1", className)} {...props}>
      <span id={labelId} className={cn("text-sm font-medium", hideLabel && "sr-only")}>
        {label}
      </span>
      {/* The sentence can run to two lines in a narrow box. Two lines are kept for it there, so the slider does not move under a finger when it wraps. */}
      <p id={summaryId} role="status" aria-live="polite" className="min-h-10 text-sm text-muted-foreground tabular-nums @md:min-h-5">
        {sentence}
      </p>

      <div className="relative mt-2 h-[5.25rem]">
        {buckets.length ? (
          <div aria-hidden="true" data-slot="histogram-slider-bars" className={cn("pointer-events-none absolute inset-x-3 top-0 h-14", disabled && "opacity-50")}>
            <div className="absolute inset-0">{bars("bg-foreground/15")}</div>
            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - to}% 0 ${from}%)` }}>
              {bars("bg-foreground")}
            </div>
          </div>
        ) : null}
        <div
          ref={track}
          data-disabled={disabled || undefined}
          onPointerDown={press}
          onPointerMove={slide}
          onPointerUp={release}
          onPointerCancel={release}
          className="absolute inset-x-0 bottom-0 h-11 touch-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
        >
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-muted">
            <span className="absolute inset-y-0 rounded-full bg-primary" style={{ left: handleLeft(from), right: `calc(100% - ${handleLeft(to)})` }} />
          </div>
          {([low, high] as const).map((at, index) => (
            <span
              key={index}
              ref={(node) => {
                handles.current[index] = node;
              }}
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-label={index === 0 ? text.minimumOf(label) : text.maximumOf(label)}
              aria-orientation="horizontal"
              aria-valuemin={index === 0 ? min : low}
              aria-valuemax={index === 0 ? high : max}
              aria-valuenow={at}
              aria-valuetext={write(at)}
              aria-disabled={disabled || undefined}
              data-active={active === index ? "" : undefined}
              onKeyDown={(event) => key(event, index as 0 | 1)}
              className={HANDLE}
              style={{ left: handleLeft(index === 0 ? from : to) }}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 @2xs:gap-3">
        {field("low", text.minimum, low)}
        <span aria-hidden="true" className="h-px w-2 bg-border @2xs:w-3" />
        {field("high", text.maximum, high)}
      </div>
    </div>
  );
}
