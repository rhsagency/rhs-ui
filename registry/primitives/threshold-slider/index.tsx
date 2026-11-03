"use client";

import { useId, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from "react";

import {
  centreOf,
  clamp,
  DEFAULT_LABELS,
  DEFAULT_ZONES,
  handleLeft,
  labelWidth,
  normaliseLevels,
  parseNumber,
  percentOf,
  snap,
  spokenUnit,
  unitSuffix,
  valueAt,
  type ThresholdLabels,
  type ThresholdValue,
  type ZoneNames,
} from "@rhs-ui/primitives/threshold-slider/zones";
import { cn } from "@/lib/utils";

export type { ThresholdLabels, ThresholdValue, ZoneNames } from "@rhs-ui/primitives/threshold-slider/zones";

export interface ThresholdSliderProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** What the levels are for: "Disk usage alert". It heads the field and names the group for a screen reader. */
  label: string;
  /** Keep the label for screen readers only, when the page already says it. */
  hideLabel?: boolean;
  /** The lowest value on the track. Default 0. */
  min?: number;
  /** The highest value on the track. Default 100. */
  max?: number;
  /** The distance between values, counted from `min`. Default 1. */
  step?: number;
  /** The two levels: the warning starts at `warn`, the critical zone at `critical`. Use it to control the slider. */
  value?: ThresholdValue;
  /** The levels to start with, when you do not control the slider. Default 70 and 90 of the way up. */
  defaultValue?: ThresholdValue;
  /** Called with every new pair of levels while a handle moves, and when a number field commits one. */
  onValueChange?: (value: ThresholdValue) => void;
  /** Called once when a drag ends or a key press settles, for a save that should not run on every pixel. */
  onValueCommit?: (value: ThresholdValue) => void;
  /** The unit written after the numbers: "%", "ms", "GB". A symbol sticks to the number, a word stands apart. Default "%". */
  unit?: string;
  /** What a screen reader says for the unit, when it is not the unit as written: "milliseconds". "%" is said as "percent". */
  spokenUnit?: string;
  /** The names of the three zones. Default OK, Warning and Critical. */
  zoneLabels?: Partial<ZoneNames>;
  /** The least distance between the two handles. They never cross, and never come closer than this. Default one step. */
  minGap?: number;
  /** The locale the numbers are written and read in. Default "en-US". */
  locale?: string;
  /** The words of the slider, for another language or your own voice. */
  labels?: Partial<ThresholdLabels>;
  /** Turn the slider and its fields off. */
  disabled?: boolean;
}

const FIELD =
  "grid min-w-0 gap-1 rounded-lg border border-input bg-background px-3 pt-2 pb-2 shadow-xs transition-[border-color,box-shadow] duration-150 " +
  "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40 motion-reduce:transition-none data-[disabled]:opacity-50";

const HANDLE =
  "absolute top-1/2 block size-6 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-primary bg-background shadow-sm outline-none " +
  "transition-shadow duration-150 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[active]:z-10 data-[active]:cursor-grabbing motion-reduce:transition-none " +
  // The part you see is 24px; the part that answers a finger is 44px.
  "before:absolute before:-inset-2.5 before:content-['']";

type Zone = "ok" | "warn" | "critical";

/** The width, in px, that the labels of the scale are laid out in. Only used to tell whether two numbers would touch; a wider slider has room to spare. */
const SCALE_WIDTH = 240;

/**
 * Alert levels, health scores and budget limits on one bar: two handles split
 * it into three zones, OK, Warning and Critical, each named and measured ("OK
 * to 70%, Warning 70 to 90%, Critical above 90%"). The zones are told apart by
 * pattern and by name as well as by tone, so they read in monochrome and for
 * colour-blind people. The handles never cross and keep a minimum gap, and each
 * one is a slider with its own number field and a spoken value that states the
 * zone it opens ("Warning starts at 70 percent"). A scale under the bar shows
 * the ends and both levels in tabular figures. Arrow keys move one step, Page
 * keys ten, Home and End go to the limits; a press on the bar moves the nearest
 * handle.
 */
export function ThresholdSlider({
  label,
  hideLabel,
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  unit = "%",
  spokenUnit: spokenOverride,
  zoneLabels,
  minGap,
  locale = "en-US",
  labels: labelOverrides,
  disabled,
  className,
  ...props
}: ThresholdSliderProps) {
  const text: ThresholdLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const zones: ZoneNames = { ...DEFAULT_ZONES, ...zoneLabels };
  const base = useId();
  const labelId = `${base}-label`;
  const pattern = (zone: Zone) => `${base.replace(/[^a-zA-Z0-9_-]/g, "")}-${zone}`;
  const gap = Math.max(step, minGap ?? step);
  const track = useRef<HTMLDivElement>(null);
  const handles = useRef<(HTMLSpanElement | null)[]>([]);
  const drag = useRef<{ index: 0 | 1; grab: number } | null>(null);
  const [own, setOwn] = useState<ThresholdValue>(() => normaliseLevels(defaultValue ?? { warn: min + (max - min) * 0.7, critical: min + (max - min) * 0.9 }, min, max, step, gap));
  const [active, setActive] = useState<0 | 1 | null>(null);
  const [draft, setDraft] = useState<{ zone: "warn" | "critical"; text: string } | null>(null);
  const levels = normaliseLevels(value ?? own, min, max, step, gap);
  const { warn, critical } = levels;
  // What the handles stand on right now, also between two renders: pointer events can arrive faster than React draws.
  const now = useRef<ThresholdValue>(levels);
  now.current = levels;
  const arriving = useRef(false);
  const numbers = new Intl.NumberFormat(locale);
  const suffix = unitSuffix(unit);
  const written = (amount: number) => `${numbers.format(amount)}${suffix}`;
  const spoken = (amount: number) => `${numbers.format(amount)}${unit ? ` ${spokenOverride ?? spokenUnit(unit)}` : ""}`;

  function set(next: ThresholdValue, commit = false) {
    const range = normaliseLevels(next, min, max, step, gap);
    const changed = range.warn !== now.current.warn || range.critical !== now.current.critical;
    if (changed) {
      now.current = range;
      if (value === undefined) setOwn(range);
      onValueChange?.(range);
    }
    if (commit && changed) onValueCommit?.(range);
  }

  /** The handle moved to `target`, kept between its limit and the other handle, a gap away from it: they never cross. */
  function moveHandle(index: 0 | 1, target: number, commit = false) {
    const current = now.current;
    if (index === 0) set({ warn: clamp(snap(target, min, max, step), min, current.critical - gap), critical: current.critical }, commit);
    else set({ warn: current.warn, critical: clamp(snap(target, min, max, step), current.warn + gap, max) }, commit);
  }

  function pick(clientX: number): { index: 0 | 1; grab: number } {
    const box = track.current?.getBoundingClientRect() ?? { left: 0, width: 1 };
    const at = [centreOf(now.current.warn, box, min, max), centreOf(now.current.critical, box, min, max)] as const;
    const da = Math.abs(clientX - at[0]);
    const db = Math.abs(clientX - at[1]);
    const index: 0 | 1 = da < db ? 0 : db < da ? 1 : clientX < at[0] ? 0 : 1;
    const off = clientX - at[index];
    return { index, grab: Math.abs(off) <= 12 ? off : 0 };
  }

  function slide(event: PointerEvent<HTMLDivElement>) {
    const box = track.current?.getBoundingClientRect();
    if (!box || !drag.current) return;
    moveHandle(drag.current.index, valueAt(event.clientX - drag.current.grab, box, min, max, step));
  }

  function press(event: PointerEvent<HTMLDivElement>) {
    if (disabled || event.button !== 0) return;
    event.preventDefault();
    const found = pick(event.clientX);
    drag.current = found;
    setActive(found.index);
    event.currentTarget.setPointerCapture(event.pointerId);
    handles.current[found.index]?.focus({ preventScroll: true });
    slide(event);
  }

  function release(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    drag.current = null;
    setActive(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    onValueCommit?.({ ...now.current });
  }

  function key(event: KeyboardEvent<HTMLSpanElement>, index: 0 | 1) {
    if (disabled || event.altKey || event.ctrlKey || event.metaKey) return;
    const current = now.current;
    const here = index === 0 ? current.warn : current.critical;
    const [lo, hi] = index === 0 ? [min, current.critical - gap] : [current.warn + gap, max];
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

  function commitDraft() {
    if (!draft) return;
    const parsed = parseNumber(draft.text, locale);
    setDraft(null);
    if (parsed !== null) moveHandle(draft.zone === "warn" ? 0 : 1, parsed, true);
  }

  const pWarn = percentOf(warn, min, max);
  const pCritical = percentOf(critical, min, max);

  // The scale: the two ends and both levels. A number that would touch the one beside it makes way: an end gives up its place to a handle,
  // and two handles that are close lean away from each other.
  const wMin = labelWidth(written(min));
  const wMax = labelWidth(written(max));
  const wWarn = labelWidth(written(warn));
  const wCritical = labelWidth(written(critical));
  const px = (percent: number) => (percent / 100) * SCALE_WIDTH;
  const hideMin = px(pWarn) < (wMin + wWarn) / 2 + 6;
  const hideMax = px(100 - pCritical) < (wMax + wCritical) / 2 + 6;
  const crowded = px(pCritical - pWarn) < (wWarn + wCritical) / 2 + 6;

  const swatch = (zone: Zone, size = "size-4") => (
    <svg aria-hidden="true" focusable="false" className={cn("shrink-0 overflow-hidden rounded-[4px] border border-border", size)} viewBox="0 0 16 16">
      <rect width="16" height="16" fill={zone === "ok" ? undefined : `url(#${pattern(zone)})`} className={zone === "ok" ? "fill-foreground/10" : undefined} />
    </svg>
  );

  const ranges: Record<Zone, string> = {
    ok: `${text.upTo(numbers.format(warn))}${suffix}`,
    warn: `${text.between(numbers.format(warn), numbers.format(critical))}${suffix}`,
    critical: `${text.above(numbers.format(critical))}${suffix}`,
  };

  const field = (zone: "warn" | "critical", current: number) => {
    const mine = draft && draft.zone === zone ? draft : null;
    const shown = mine ? mine.text : numbers.format(current);
    return (
      <label data-disabled={disabled || undefined} className={FIELD}>
        <span className="flex items-center gap-1.5 text-[0.6875rem] leading-4 font-medium text-muted-foreground">
          {swatch(zone, "size-3")}
          {text.field(zones[zone])}
        </span>
        <span className={cn("flex items-baseline", suffix.startsWith(" ") ? "gap-[3px]" : "gap-0")}>
          <span
            data-value={shown}
            className={cn(
              "relative inline-grid min-w-[1ch] grid-cols-1 text-sm font-medium tabular-nums",
              // What the field holds, drawn unseen in the same cell, gives it its width, so the unit stands right behind the number: a count of ch is never right for a proportional face.
              // The input itself adds nothing to that width (w-0) and fills the cell (min-w-full); an input has a wide width of its own that would keep the unit away.
              "after:invisible after:col-start-1 after:row-start-1 after:overflow-hidden after:pr-px after:whitespace-pre after:content-[attr(data-value)]",
            )}
          >
            <input
              type="text"
              role="spinbutton"
              inputMode={Number.isInteger(step) && min >= 0 ? "numeric" : "decimal"}
              aria-label={`${text.field(zones[zone])}, ${label}`}
              aria-valuenow={current}
              aria-valuemin={zone === "warn" ? min : warn + gap}
              aria-valuemax={zone === "warn" ? critical - gap : max}
              aria-valuetext={spoken(current)}
              disabled={disabled}
              value={shown}
              onMouseDown={(event) => {
                arriving.current = document.activeElement !== event.currentTarget;
              }}
              onMouseUp={(event) => {
                if (!arriving.current) return;
                arriving.current = false;
                event.preventDefault();
              }}
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) => setDraft({ zone, text: event.target.value })}
              onBlur={commitDraft}
              onKeyDown={(event) => {
                const moves: Record<string, number> = { ArrowUp: step, ArrowDown: -step, PageUp: step * 10, PageDown: -step * 10 };
                if (event.key in moves) {
                  event.preventDefault();
                  const typed = mine ? (parseNumber(mine.text, locale) ?? current) : current;
                  moveHandle(zone === "warn" ? 0 : 1, typed + moves[event.key]!, true);
                  setDraft(null);
                } else if (event.key === "Enter") {
                  commitDraft();
                  event.currentTarget.select();
                } else if (event.key === "Escape") setDraft(null);
              }}
              className="col-start-1 row-start-1 h-6 w-0 min-w-full bg-transparent p-0 text-sm font-medium tabular-nums outline-none"
            />
          </span>
          {unit ? (
            <span aria-hidden="true" className="shrink-0 text-sm text-muted-foreground">
              {unit}
            </span>
          ) : null}
        </span>
      </label>
    );
  };

  return (
    <div
      data-slot="threshold-slider"
      data-disabled={disabled || undefined}
      role="group"
      aria-labelledby={labelId}
      className={cn("@container relative grid w-full min-w-0 gap-1", className)}
      {...props}
    >
      <span id={labelId} className={cn("text-sm font-medium", hideLabel && "sr-only")}>
        {label}
      </span>

      {/* The patterns the zones are filled with. They are drawn once here and used by the bar and by the small swatches. */}
      <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute size-0">
        <defs>
          <pattern id={pattern("warn")} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" className="fill-foreground/10" />
            <rect width="2.5" height="6" className="fill-foreground/50" />
          </pattern>
          <pattern id={pattern("critical")} width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" className="fill-foreground" />
            <circle cx="3" cy="3" r="1.05" className="fill-background/60" />
          </pattern>
        </defs>
      </svg>

      <div
        ref={track}
        data-disabled={disabled || undefined}
        onPointerDown={press}
        onPointerMove={slide}
        onPointerUp={release}
        onPointerCancel={release}
        className="relative mt-1 h-11 touch-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
      >
        <div className="absolute inset-x-0 top-1/2 h-4 -translate-y-1/2 overflow-hidden rounded-full">
          {/* Drawn between the centres of the handles, so a zone ends exactly under its handle. The two end zones reach on to the ends of the bar. */}
          <svg aria-hidden="true" focusable="false" className="absolute inset-y-0 left-3 h-full w-[calc(100%-1.5rem)] overflow-visible">
            <rect x={-12} width={12} height="100%" className="fill-foreground/10" />
            <rect x={0} width={`${pWarn}%`} height="100%" className="fill-foreground/10" />
            <rect x={`${pWarn}%`} width={`${pCritical - pWarn}%`} height="100%" fill={`url(#${pattern("warn")})`} />
            <rect x={`${pCritical}%`} width={`${100 - pCritical}%`} height="100%" fill={`url(#${pattern("critical")})`} />
            <rect x="100%" width={12} height="100%" fill={`url(#${pattern("critical")})`} />
          </svg>
        </div>
        {(
          [
            { zone: "warn", at: warn, percent: pWarn, from: min, to: critical - gap },
            { zone: "critical", at: critical, percent: pCritical, from: warn + gap, to: max },
          ] as const
        ).map((handle, index) => (
          <span
            key={handle.zone}
            ref={(node) => {
              handles.current[index] = node;
            }}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={text.handle(zones[handle.zone])}
            aria-orientation="horizontal"
            aria-valuemin={handle.from}
            aria-valuemax={handle.to}
            aria-valuenow={handle.at}
            aria-valuetext={text.startsAt(zones[handle.zone], spoken(handle.at))}
            aria-disabled={disabled || undefined}
            data-active={active === index ? "" : undefined}
            onKeyDown={(event) => key(event, index as 0 | 1)}
            className={HANDLE}
            style={{ left: handleLeft(handle.percent) }}
          />
        ))}
      </div>

      <div aria-hidden="true" className="pointer-events-none relative -mt-1 h-5 text-xs text-muted-foreground tabular-nums">
        {hideMin ? null : (
          <span className="absolute top-0 -translate-x-1/2 whitespace-nowrap" style={{ left: handleLeft(0) }}>
            {written(min)}
          </span>
        )}
        <span className={cn("absolute top-0 font-medium whitespace-nowrap text-foreground", crowded ? "-translate-x-[calc(100%+0.125rem)]" : "-translate-x-1/2")} style={{ left: handleLeft(pWarn) }}>
          {written(warn)}
        </span>
        <span className={cn("absolute top-0 font-medium whitespace-nowrap text-foreground", crowded ? "translate-x-0.5" : "-translate-x-1/2")} style={{ left: handleLeft(pCritical) }}>
          {written(critical)}
        </span>
        {hideMax ? null : (
          <span className="absolute top-0 -translate-x-1/2 whitespace-nowrap" style={{ left: handleLeft(100) }}>
            {written(max)}
          </span>
        )}
      </div>

      <ul aria-label={text.zones} className="mt-3 grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1.5 text-sm">
        {(["ok", "warn", "critical"] as const).map((zone) => (
          <li key={zone} className="col-span-3 grid grid-cols-subgrid items-center">
            {swatch(zone)}
            <span className="font-medium">{zones[zone]}</span>
            <span className="min-w-0 text-muted-foreground tabular-nums">{ranges[zone]}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {field("warn", warn)}
        {field("critical", critical)}
      </div>
    </div>
  );
}
