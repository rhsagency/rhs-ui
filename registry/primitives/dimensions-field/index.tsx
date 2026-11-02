"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type ComponentProps, type KeyboardEvent, type MouseEvent } from "react";

import { IconInfo, IconLock, IconUnlock } from "@rhs-ui/icons";
import { trackPress, whenReleased } from "@rhs-ui/primitives/dimensions-field/blur-guard";
import {
  clamp,
  decimalsOf,
  DEFAULT_LABELS,
  formatGrouped,
  formatPlain,
  parseSize,
  ratioOf,
  ratioText,
  roundTo,
  tidyTyping,
  type DimensionsLabels,
  type DimensionsValue,
  type Ratio,
} from "@rhs-ui/primitives/dimensions-field/dimensions";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { Toggle } from "@rhs-ui/primitives/toggle";
import { cn } from "@/lib/utils";

export type { DimensionsLabels, DimensionsValue } from "@rhs-ui/primitives/dimensions-field/dimensions";

type Side = "width" | "height";

export interface DimensionsFieldProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children" | "id"> {
  /** The sizes and the lock, when you control them. */
  value?: DimensionsValue;
  /** The sizes to start with, when you do not control them. */
  defaultValue?: Pick<DimensionsValue, "width" | "height">;
  /** Called with `{ width, height, locked }` whenever a size or the lock changes. A size is always inside `min` and `max`; it is null while its field is empty. */
  onValueChange?: (value: DimensionsValue) => void;
  /** The unit shown after the height, such as "px", "cm" or "in". It is also read out with each number. */
  unit?: string;
  /** The smallest size of either side. Default 1. */
  min?: number;
  /** The largest size of either side. Default none. */
  max?: number;
  /** How much an arrow key adds or takes away; with Shift or Page Up and Page Down it is ten times as much. Default 1. */
  step?: number;
  /** How many decimals are kept. Default: as many as `step` has, so none. */
  precision?: number;
  /** Whether the proportions are kept at the start, when you do not control the field. Default false. */
  defaultLocked?: boolean;
  /** The locale that writes the numbers and decides the decimal sign. Default "en-US". */
  locale?: string;
  /** The field's name for a plain form submit: `<name>-width` and `<name>-height` go out in hidden inputs. */
  name?: string;
  /** Turn the whole field off. */
  disabled?: boolean;
  /** Put on the width input, so a <label htmlFor> focuses the field. The input keeps its own name (Width), so give the label an id and pass it as `aria-labelledby` to name the whole group by the visible label. */
  id?: string;
  /** The words the field says, for another language or your own voice. */
  labels?: Partial<DimensionsLabels>;
}

// The group takes the focus ring when an input has focus; the lock is a button, so it asks for the same ring.
const RING_ON_LOCK = "has-[[data-slot=toggle]:focus-visible]:border-ring has-[[data-slot=toggle]:focus-visible]:ring-[3px] has-[[data-slot=toggle]:focus-visible]:ring-ring/40";
const CELL = "flex h-full min-w-0 flex-1 cursor-text items-center";
// In a very narrow field the letters give way to the numbers, which are named for a screen reader anyway.
const LETTER = "pr-0 pl-3 text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase @max-[15rem]:hidden";

/**
 * Width by height in one field, for an image, a print, a banner or a package.
 * The lock between the two sizes keeps the proportions: it remembers the ratio
 * the sizes had when it went on, and from then on changing one side works out
 * the other from that ratio, so a 1200 by 800 image stays 3:2 however often it
 * is resized and rounding never drifts. The arrow keys step a size (Shift or Page
 * Up and Down ten at a time, Ctrl or Cmd with Home and End go to the limits),
 * a size outside `min` and `max` is brought in as soon as its box is left and a
 * quiet line says so, and with the lock on, a size that would push the other
 * side out of range stops where both still fit. The lock is a real toggle that
 * says whether it is pressed, and what the lock moved is told to a screen
 * reader once the typing pauses.
 */
export function DimensionsField({
  value,
  defaultValue,
  onValueChange,
  unit = "",
  min = 1,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  precision: precisionOverride,
  defaultLocked = false,
  locale = "en-US",
  name,
  disabled,
  id,
  labels: labelOverrides,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  ...props
}: DimensionsFieldProps) {
  const base = useId();
  const readoutId = `${base}-readout`;
  const labels: DimensionsLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const precision = precisionOverride ?? decimalsOf(step);
  // A size to start with is held to the limits too, so the field never holds one that is outside them.
  const [own, setOwn] = useState<DimensionsValue>(() => {
    const fit = (size: number | null | undefined) => (size === null || size === undefined ? null : roundTo(clamp(size, min, max), precision));
    return { width: fit(defaultValue?.width), height: fit(defaultValue?.height), locked: defaultLocked };
  });
  const current = value ?? own;
  const [drafts, setDrafts] = useState(() => ({ width: formatPlain(current.width, precision, locale), height: formatPlain(current.height, precision, locale) }));
  // The ratio the lock was set at, as the two sizes it was set between, so "3:2" stays 3:2 whatever the sizes are rounded to since.
  const [ratio, setRatio] = useState<Ratio | null>(() => (current.locked ? ratioOf(current.width, current.height) : null));
  const [synced, setSynced] = useState(value);
  const [note, setNote] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  // The last value this field reported, to tell its own echo from sizes that arrive from outside.
  const reported = useRef<DimensionsValue | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const inputs = useRef<Record<Side, HTMLInputElement | null>>({ width: null, height: null });

  // Sizes that arrive from outside replace what is typed and set the ratio again; an echo of what was just reported changes nothing.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    const before = reported.current;
    if (!before || before.width !== value.width || before.height !== value.height) {
      setDrafts({ width: formatPlain(value.width, precision, locale), height: formatPlain(value.height, precision, locale) });
      setNote(null);
    }
    if (!value.locked) setRatio(null);
    else if (!before || !before.locked || before.width !== value.width || before.height !== value.height) setRatio(ratioOf(value.width, value.height) ?? ratio);
  }

  useEffect(trackPress, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // What a screen reader was told stays only while it is news; left in the live region it would be read again together with the next message.
  useEffect(() => {
    if (!said) return;
    const clear = window.setTimeout(() => setSaid(""), 5000);
    return () => window.clearTimeout(clear);
  }, [said]);

  function sayLater(text: string) {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSaid(text), 800);
  }

  function write(next: DimensionsValue) {
    reported.current = next;
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  /** The smallest and largest a side can be. With the lock on, also small and large enough that the other side stays inside the limits. */
  function bounds(side: Side, kept: Ratio | null): readonly [number, number] {
    if (!kept) return [min, max];
    const factor = side === "width" ? kept.width / kept.height : kept.height / kept.width;
    const low = Math.max(min, min * factor);
    const high = Math.min(max, max * factor);
    return low <= high ? [low, high] : [min, max];
  }

  /** A size brought into range, and with the lock on, the other side that goes with it. */
  function settle(side: Side, typed: number | null): DimensionsValue {
    const other: Side = side === "width" ? "height" : "width";
    let follower = current[other];
    let settled: number | null = null;
    if (typed !== null) {
      const kept = current.locked ? ratio : null;
      const [low, high] = bounds(side, kept);
      settled = roundTo(clamp(typed, low, high), precision);
      if (kept) {
        const scale = kept.width / kept.height;
        follower = clamp(roundTo(side === "width" ? settled / scale : settled * scale, precision), min, max);
      }
    }
    return side === "width" ? { ...current, width: settled, height: follower } : { ...current, height: settled, width: follower };
  }

  function change(side: Side, event: ChangeEvent<HTMLInputElement>) {
    const text = tidyTyping(event.target.value);
    const next = settle(side, parseSize(text, precision));
    const other: Side = side === "width" ? "height" : "width";
    setNote(null);
    // The side that follows is rewritten at once; the one being typed in keeps its text until the field is left.
    setDrafts((now) => ({ ...now, [side]: text, [other]: current.locked && ratio && next[side] !== null ? formatPlain(next[other], precision, locale) : now[other] }));
    if (current.locked && !ratio) {
      const captured = ratioOf(next.width, next.height);
      if (captured) setRatio(captured);
    }
    if (next.width !== current.width || next.height !== current.height) {
      write(next);
      if (current.locked && ratio && next[side] !== null) sayLater(labels.followed(side === "width" ? labels.height : labels.width, formatGrouped(next[other] ?? 0, precision, locale), unit));
    }
  }

  /** A size that was stepped to is a whole number at once: written, reported and not waiting for the field to be left. */
  function jump(side: Side, target: number) {
    const next = settle(side, roundTo(target, precision));
    setNote(null);
    setDrafts({ width: formatPlain(next.width, precision, locale), height: formatPlain(next.height, precision, locale) });
    if (current.locked && !ratio) {
      const captured = ratioOf(next.width, next.height);
      if (captured) setRatio(captured);
    }
    write(next);
    if (current.locked && ratio) sayLater(labels.followed(side === "width" ? labels.height : labels.width, formatGrouped((side === "width" ? next.height : next.width) ?? 0, precision, locale), unit));
  }

  /**
   * A number is left, or Enter is pressed: both sizes are written the locale's way, so a box never keeps text the field has already brought into range, and a size that was brought into range is said.
   * A line that is already showing stays until the next edit, so leaving the other box does not wipe it.
   */
  function commit() {
    setDrafts({ width: formatPlain(current.width, precision, locale), height: formatPlain(current.height, precision, locale) });
    let words: string | null = null;
    for (const side of ["width", "height"] as const) {
      const typed = parseSize(drafts[side], precision);
      const settled = current[side];
      if (typed === null || settled === null || typed === settled) continue;
      const limit = formatGrouped(settled, precision, locale);
      const name = side === "width" ? labels.width : labels.height;
      words = typed > settled ? labels.atMost(name, limit, unit) : labels.atLeast(name, limit, unit);
      break;
    }
    if (words === null) return;
    const message = words;
    whenReleased(() => {
      setNote(message);
      setSaid(message);
    });
  }

  function keyDown(side: Side, event: KeyboardEvent<HTMLInputElement>) {
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    const { key } = event;
    let target: number | undefined;
    if (key === "ArrowUp" || key === "ArrowDown" || key === "PageUp" || key === "PageDown") {
      const size = step * (event.shiftKey || key.startsWith("Page") ? 10 : 1);
      const from = parseSize(drafts[side], precision) ?? current[side];
      target = from === null ? min : from + (key === "ArrowUp" || key === "PageUp" ? size : -size);
    } else if (key === "Home" && (event.ctrlKey || event.metaKey)) target = min;
    else if (key === "End" && (event.ctrlKey || event.metaKey) && Number.isFinite(max)) target = max;
    else if (key === "Enter") commit();
    if (target === undefined) return;
    event.preventDefault();
    jump(side, target);
  }

  function lock(on: boolean) {
    const kept = on ? ratioOf(current.width, current.height) : null;
    setRatio(kept);
    setNote(null);
    setSaid(on ? (kept ? labels.locked(ratioText(kept, locale)) : labels.lockedEmpty) : labels.unlocked);
    write({ ...current, locked: on });
  }

  // The empty space in a half is part of it: a click there puts the cursor in the number.
  function focusNumber(side: Side, event: MouseEvent<HTMLDivElement>) {
    if (event.target !== inputs.current[side]) inputs.current[side]?.focus();
  }

  const both = current.width !== null && current.height !== null;
  const unitText = unit ? ` ${unit}` : "";
  const kept = current.locked ? (ratio ?? ratioOf(current.width, current.height)) : null;

  const half = (side: Side, letter: string, label: string) => {
    const number = current[side];
    return (
      <div data-slot={`dimensions-${side}`} onClick={(event) => focusNumber(side, event)} className={CELL}>
        <InputGroupAddon aria-hidden="true" className={LETTER}>
          {letter}
        </InputGroupAddon>
        <InputGroupInput
          ref={(node) => {
            inputs.current[side] = node;
          }}
          id={side === "width" ? id : undefined}
          type="text"
          role="spinbutton"
          inputMode={precision > 0 ? "decimal" : "numeric"}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={disabled}
          placeholder="-"
          aria-label={label}
          value={drafts[side]}
          onChange={(event) => change(side, event)}
          onBlur={commit}
          onKeyDown={(event) => keyDown(side, event)}
          aria-valuenow={number ?? undefined}
          aria-valuemin={Number.isFinite(min) ? min : undefined}
          aria-valuemax={Number.isFinite(max) ? max : undefined}
          aria-valuetext={number === null ? undefined : `${formatGrouped(number, precision, locale)}${unitText}`}
          aria-describedby={[describedBy, readoutId].filter(Boolean).join(" ")}
          className="pr-1 pl-2 tabular-nums @max-[15rem]:pl-3"
        />
      </div>
    );
  };

  return (
    <div data-slot="dimensions-field" className={cn("grid w-full min-w-0 grid-cols-1", className)} {...props}>
      <InputGroup
        role="group"
        aria-label={labelledBy ? undefined : (ariaLabel ?? labels.group)}
        aria-labelledby={labelledBy}
        className={cn("@container", RING_ON_LOCK, "pr-0")}
      >
        {half("width", "W", labels.width)}
        <div className="flex h-full shrink-0 items-center border-x border-border bg-muted/50 px-1">
          <Toggle
            pressed={current.locked}
            onPressedChange={lock}
            disabled={disabled}
            aria-label={labels.lock}
            className="size-7 min-w-7 px-0"
          >
            {current.locked ? <IconLock aria-hidden="true" className="size-4" /> : <IconUnlock aria-hidden="true" className="size-4" />}
          </Toggle>
        </div>
        {half("height", "H", labels.height)}
        {unit ? (
          <span aria-hidden="true" className="flex h-full shrink-0 items-center rounded-r-[inherit] border-l border-border bg-muted/50 px-3 text-[0.8125rem] font-medium text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </InputGroup>
      <p id={readoutId} className={cn("mt-1.5 flex min-h-5 items-start justify-between gap-3 text-xs text-muted-foreground tabular-nums", disabled && "opacity-50")}>
        {note ? (
          <span className="flex items-start gap-1.5">
            <IconInfo aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            {note}
          </span>
        ) : both ? (
          <span>
            <span className="font-medium text-foreground">
              {formatGrouped(current.width ?? 0, precision, locale)} &times; {formatGrouped(current.height ?? 0, precision, locale)}
            </span>
            {unitText}
          </span>
        ) : (
          <span>{labels.prompt}</span>
        )}
        {kept ? (
          <span className="flex shrink-0 items-center gap-1">
            <IconLock aria-hidden="true" className="size-3" />
            {labels.kept(ratioText(kept, locale))}
          </span>
        ) : null}
      </p>
      <span role="status" className="sr-only">
        {said}
      </span>
      {name ? (
        <>
          <input type="hidden" name={`${name}-width`} value={current.width ?? ""} disabled={disabled} />
          <input type="hidden" name={`${name}-height`} value={current.height ?? ""} disabled={disabled} />
        </>
      ) : null}
    </div>
  );
}
