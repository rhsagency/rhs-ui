"use client";

import { useId, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from "react";

import { IconAlertCircle, IconCheck, IconLock, IconUnlock } from "@rhs-ui/icons";
import {
  balance,
  clamp,
  decimalsOf,
  DEFAULT_LABELS,
  evenShares,
  moveHandle,
  onGrid,
  pairOf,
  parseNumber,
  reachOf,
  setShare,
  SHADES,
  sharesOf,
  shortfallOf,
  type AllocationLabels,
  type AllocationPart,
  type Shares,
} from "@rhs-ui/primitives/allocation-slider/shares";
import { cn } from "@/lib/utils";

export type { AllocationLabels, AllocationPart, Shares } from "@rhs-ui/primitives/allocation-slider/shares";

export interface AllocationSliderProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** What is being divided: "Traffic split". It heads the field and names the group for a screen reader. */
  label: string;
  /** Keep the label for screen readers only, when the page already says it. */
  hideLabel?: boolean;
  /** The parts of the whole, in the order they stand on the bar. Each has a stable `id` and the `label` people read. */
  parts: readonly AllocationPart[];
  /** What each part holds, by id: `{ email: 40, social: 35, search: 25 }`. Use it to control the slider. */
  value?: Readonly<Record<string, number>>;
  /** What each part holds to start with, when you do not control the slider. Default an even split. */
  defaultValue?: Readonly<Record<string, number>>;
  /** Called with every new split while a divider moves, and when a number field or Balance changes one. */
  onValueChange?: (value: Record<string, number>) => void;
  /** Called once when a drag ends or a key press settles, for a save that should not run on every pixel. */
  onValueCommit?: (value: Record<string, number>) => void;
  /** The distance between values. Default 1. */
  step?: number;
  /** What the parts add up to. Default 100. */
  total?: number;
  /** The least any part may hold. Default 0. */
  min?: number;
  /** Give every part a lock. A locked part keeps its share: dividers and number fields leave it alone and trade between the parts that are free. */
  lockable?: boolean;
  /** The ids of the locked parts, when you control the locks. */
  locked?: readonly string[];
  /** The ids of the parts that start locked, when you do not control the locks. */
  defaultLocked?: readonly string[];
  /** Called with the ids of the locked parts whenever a lock is turned. */
  onLockedChange?: (ids: string[]) => void;
  /** The unit written after the numbers. A symbol sticks to the number, a word stands apart. Default "%". */
  unit?: string;
  /** The locale the numbers are written and read in. Default "en-US". */
  locale?: string;
  /** The words of the slider, for another language or your own voice. */
  labels?: Partial<AllocationLabels>;
  /** Turn the whole slider off. */
  disabled?: boolean;
}

const unitSuffix = (unit: string): string => (unit === "" ? "" : unit.length === 1 ? unit : ` ${unit}`);

const HANDLE =
  "absolute top-1/2 grid h-[calc(100%+0.75rem)] w-3 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full border border-border bg-background shadow-sm outline-none " +
  "transition-[background-color,border-color,box-shadow] duration-150 hover:border-foreground/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 " +
  "data-[active]:z-10 data-[active]:border-foreground/50 data-[active]:bg-muted aria-disabled:cursor-not-allowed aria-disabled:opacity-40 motion-reduce:transition-none " +
  // The part you see is 12px wide; the part that answers a finger is 44px.
  "before:absolute before:-inset-x-4 before:inset-y-0 before:content-['']";

const FIELD =
  "inline-flex h-9 shrink-0 items-center gap-1 rounded-md border border-input bg-background px-2.5 text-sm shadow-xs transition-[border-color,box-shadow] duration-150 " +
  "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40 motion-reduce:transition-none data-[locked]:bg-muted/60 data-[disabled]:opacity-50";

/**
 * A control for dividing a whole: traffic across variants, budget across
 * channels, revenue between partners. The bar is split by dividers that are
 * sliders in their own right; dragging one moves the share between the two
 * parts beside it, so the total stays fixed. Arrow keys move a divider one
 * step, Shift or the Page keys ten, and the value of the divider says the two
 * parts it affects ("Email 40%, Social 35%"). Every part also has a number
 * field, which takes from the other parts or gives to them in proportion, and
 * with `lockable` a lock that takes a part out of all of that. A total readout
 * is always in view: "Adds up to 100%", or what is missing or too much, with a
 * Balance button that spreads it over the parts that are free. Parts are told
 * apart by their name and by a shade of grey, never by colour alone.
 */
export function AllocationSlider({
  label,
  hideLabel,
  parts,
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  step = 1,
  total = 100,
  min = 0,
  lockable = false,
  locked: lockedProp,
  defaultLocked,
  onLockedChange,
  unit = "%",
  locale = "en-US",
  labels: labelOverrides,
  disabled,
  className,
  ...props
}: AllocationSliderProps) {
  const text: AllocationLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const base = useId();
  const labelId = `${base}-label`;
  const bar = useRef<HTMLDivElement>(null);
  const handles = useRef<(HTMLSpanElement | null)[]>([]);
  const drag = useRef<{ handle: number | null; candidates: number[]; startX: number; start: Shares; span: number } | null>(null);
  const arriving = useRef(false);
  const [own, setOwn] = useState<Shares>(() => ({ ...evenShares(parts, total, step), ...defaultValue }));
  const [lockedOwn, setLockedOwn] = useState<readonly string[]>(defaultLocked ?? []);
  const [active, setActive] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ id: string; text: string } | null>(null);
  const values: Shares = value ?? own;
  const lockedIds = new Set(lockable ? (lockedProp ?? lockedOwn) : []);
  // The split as it stands right now, also between two renders: pointer events can arrive faster than React draws.
  const live = useRef<Shares>(values);
  live.current = values;
  const numbers = new Intl.NumberFormat(locale);
  const suffix = unitSuffix(unit);
  // A number field is as wide as the longest number it can hold, so it never clips and never jumps.
  const widest = new Intl.NumberFormat(locale, { minimumFractionDigits: decimalsOf(step), maximumFractionDigits: decimalsOf(step) });
  const written = (amount: number) => `${numbers.format(amount)}${suffix}`;

  const shares = sharesOf(values, parts);
  const sum = Number(shares.reduce((all, share) => all + share, 0).toFixed(6));
  const span = Math.max(sum, total);
  const gap = shortfallOf(values, parts, total);
  const open = parts.filter((part) => !lockedIds.has(part.id)).length;
  const bounds = shares.map((_, index) => shares.slice(0, index + 1).reduce((all, share) => all + share, 0));

  function commit(next: Shares, settle = false) {
    if (next === live.current) return;
    live.current = next;
    if (value === undefined) setOwn(next);
    onValueChange?.({ ...next });
    if (settle) onValueCommit?.({ ...next });
  }

  function turnLock(id: string) {
    const next = lockedIds.has(id) ? [...lockedIds].filter((entry) => entry !== id) : [...lockedIds, id];
    if (lockedProp === undefined) setLockedOwn(next);
    onLockedChange?.(next);
  }

  /** The handles that stand on the same boundary as this one and have a free part on each side: all of them can be meant by a press on any. */
  function together(handle: number): number[] {
    return parts
      .slice(0, -1)
      .map((_, index) => index)
      .filter((index) => bounds[index] === bounds[handle] && pairOf(parts, lockedIds, index) !== null);
  }

  function press(event: PointerEvent<HTMLSpanElement>, handle: number) {
    if (disabled || event.button !== 0) return;
    event.preventDefault();
    const same = together(handle);
    if (!same.length) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { handle: same.length > 1 ? null : handle, candidates: same, startX: event.clientX, start: live.current, span };
    if (same.length === 1) {
      setActive(handle);
      handles.current[handle]?.focus({ preventScroll: true });
    }
  }

  function slide(event: PointerEvent<HTMLSpanElement>) {
    const grab = drag.current;
    const width = bar.current?.getBoundingClientRect().width;
    if (!grab || !width) return;
    const dx = event.clientX - grab.startX;
    // Several dividers on one spot (a part with nothing in it): only the way the pointer goes can say which one is meant.
    if (grab.handle === null) {
      if (Math.abs(dx) < 2) return;
      grab.handle = dx > 0 ? Math.max(...grab.candidates) : Math.min(...grab.candidates);
      setActive(grab.handle);
      handles.current[grab.handle]?.focus({ preventScroll: true });
    }
    commit(moveHandle(grab.start, parts, lockedIds, grab.handle, onGrid((dx / width) * grab.span, step), min, step));
  }

  function release(event: PointerEvent<HTMLSpanElement>) {
    if (!drag.current) return;
    drag.current = null;
    setActive(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    onValueCommit?.({ ...live.current });
  }

  function key(event: KeyboardEvent<HTMLSpanElement>, handle: number) {
    if (disabled || event.altKey || event.ctrlKey || event.metaKey) return;
    const pair = pairOf(parts, lockedIds, handle);
    if (!pair) return;
    const reach = reachOf(live.current, parts, pair, min);
    const by = step * (event.shiftKey ? 10 : 1);
    const moves: Record<string, number> = { ArrowRight: by, ArrowUp: by, ArrowLeft: -by, ArrowDown: -by, PageUp: step * 10, PageDown: -step * 10, Home: -reach.back, End: reach.forward };
    const delta = moves[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    commit(moveHandle(live.current, parts, lockedIds, handle, delta, min, step), true);
  }

  function commitDraft() {
    if (!draft) return;
    const parsed = parseNumber(draft.text);
    const id = draft.id;
    setDraft(null);
    if (parsed !== null) commit(setShare(live.current, parts, lockedIds, id, parsed, min, step), true);
  }

  if (!parts.length) return null;

  const status = gap === 0 ? text.adds(written(total)) : gap > 0 ? text.short(written(gap)) : text.over(written(-gap));

  return (
    <div data-slot="allocation-slider" data-disabled={disabled || undefined} role="group" aria-labelledby={labelId} className={cn("@container grid w-full min-w-0 gap-3", className)} {...props}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
        <span id={labelId} className={cn("text-sm font-medium", hideLabel && "sr-only")}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          <p role="status" aria-live="polite" className={cn("flex items-center gap-1.5 text-sm font-medium tabular-nums", gap === 0 ? "text-muted-foreground" : "text-destructive")}>
            {gap === 0 ? <IconCheck aria-hidden="true" className="size-4 shrink-0" /> : <IconAlertCircle aria-hidden="true" className="size-4 shrink-0" />}
            {status}
          </p>
          {gap !== 0 ? (
            <button
              type="button"
              disabled={disabled || open === 0}
              onClick={() => commit(balance(live.current, parts, lockedIds, total, min, step), true)}
              className="h-7 rounded-md border border-border bg-background px-2.5 text-[0.8125rem] font-medium outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none"
            >
              {text.balance}
            </button>
          ) : null}
        </div>
      </div>

      <div ref={bar} className="relative mt-1 h-12 touch-none select-none">
        {/* The parts fill the whole bar, and the frame is drawn over them in the same box: a divider at 40% then stands exactly where the shade changes at 40%. */}
        <div className="absolute inset-0 flex overflow-hidden rounded-lg">
          {parts.map((part, index) => {
            const shade = SHADES[index % SHADES.length]!;
            const share = shares[index]!;
            return (
              <div
                key={part.id}
                data-slot="allocation-slider-part"
                // No padding on the part itself: a padded flex item cannot be narrower than its padding, so every part would take 16px before the rest is shared out by share.
                // A name or number is drawn only where it clears the dividers on both sides (they reach 6px into the part): the text plus 8px each side, a name from 4.5rem and a number from 2.75rem.
                className={cn("@container/part grid min-w-0 content-center justify-items-center overflow-hidden text-center", shade.fill, shade.ink)}
                style={{ flexGrow: share, flexBasis: 0 }}
              >
                <span className="hidden max-w-full truncate px-1 text-[0.6875rem] leading-4 font-medium @[4.5rem]/part:block">{part.label}</span>
                <span className="hidden max-w-full truncate px-1 text-sm leading-5 font-semibold tabular-nums @[2.75rem]/part:block">{written(share)}</span>
              </div>
            );
          })}
          {sum < total ? (
            // The dashed edge is drawn, not a border: a border would take room from the parts before it, and they would no longer end where their dividers stand.
            <div
              aria-hidden="true"
              className="relative min-w-0 bg-muted/40 before:absolute before:inset-y-0 before:left-0 before:border-l before:border-dashed before:border-border before:content-['']"
              style={{ flexGrow: total - sum, flexBasis: 0 }}
            />
          ) : null}
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-lg border border-border" />
        {parts.slice(0, -1).map((part, index) => {
          const pair = pairOf(parts, lockedIds, index);
          const left = parts[pair?.left ?? index]!;
          const right = parts[pair?.right ?? index + 1]!;
          return (
            <span
              key={part.id}
              ref={(node) => {
                handles.current[index] = node;
              }}
              role="slider"
              tabIndex={disabled || !pair ? -1 : 0}
              aria-label={text.handle(left.label, right.label)}
              aria-orientation="horizontal"
              aria-valuemin={min}
              aria-valuemax={pair ? shares[pair.left]! + shares[pair.right]! - min : shares[index]!}
              aria-valuenow={pair ? shares[pair.left]! : shares[index]!}
              aria-valuetext={text.between(left.label, written(shares[pair?.left ?? index]!), right.label, written(shares[pair?.right ?? index + 1]!))}
              aria-disabled={disabled || !pair || undefined}
              data-active={active === index ? "" : undefined}
              onPointerDown={(event) => press(event, index)}
              onPointerMove={slide}
              onPointerUp={release}
              onPointerCancel={release}
              onKeyDown={(event) => key(event, index)}
              className={HANDLE}
              style={{ left: `${(bounds[index]! / span) * 100}%` }}
            >
              <span aria-hidden="true" className="h-4 w-px rounded-full bg-muted-foreground/60" />
            </span>
          );
        })}
      </div>
      {lockable && open < 2 ? <p className="-mt-1 text-xs text-muted-foreground">{text.needTwo}</p> : null}

      <ul aria-label={text.parts} className="grid divide-y divide-border">
        {parts.map((part, index) => {
          const shade = SHADES[index % SHADES.length]!;
          const share = shares[index]!;
          const isLocked = lockedIds.has(part.id);
          const mine = draft && draft.id === part.id ? draft : null;
          const room = parts.reduce((all, other, at) => (at === index || lockedIds.has(other.id) ? all : all + Math.max(0, shares[at]! - min)), 0);
          return (
            <li key={part.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
              <span aria-hidden="true" className={cn("size-3.5 shrink-0 rounded-[4px] border border-border", shade.fill)} />
              <span className="min-w-0 flex-1 truncate text-sm">{part.label}</span>
              {lockable ? (
                <button
                  type="button"
                  aria-pressed={isLocked}
                  aria-label={text.lock(part.label)}
                  disabled={disabled}
                  onClick={() => turnLock(part.id)}
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-md outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
                    isLocked ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {isLocked ? <IconLock aria-hidden="true" className="size-4" /> : <IconUnlock aria-hidden="true" className="size-4" />}
                </button>
              ) : null}
              <span data-locked={isLocked || undefined} data-disabled={disabled || undefined} className={FIELD}>
                <input
                  type="text"
                  role="spinbutton"
                  inputMode={Number.isInteger(step) ? "numeric" : "decimal"}
                  aria-label={text.field(part.label)}
                  aria-valuenow={share}
                  aria-valuemin={min}
                  aria-valuemax={share + room}
                  aria-valuetext={written(share)}
                  readOnly={isLocked}
                  disabled={disabled}
                  value={mine ? mine.text : numbers.format(share)}
                  style={{ width: `calc(${Math.max(widest.format(total).length, 2)}ch + 2px)` }}
                  onMouseDown={(event) => {
                    arriving.current = document.activeElement !== event.currentTarget;
                  }}
                  onMouseUp={(event) => {
                    if (!arriving.current) return;
                    arriving.current = false;
                    event.preventDefault();
                  }}
                  onFocus={(event) => event.currentTarget.select()}
                  onChange={(event) => setDraft({ id: part.id, text: event.target.value })}
                  onBlur={commitDraft}
                  onKeyDown={(event) => {
                    const moves: Record<string, number> = { ArrowUp: step, ArrowDown: -step, PageUp: step * 10, PageDown: -step * 10 };
                    if (event.key in moves) {
                      event.preventDefault();
                      const typed = mine ? (parseNumber(mine.text) ?? share) : share;
                      commit(setShare(live.current, parts, lockedIds, part.id, clamp(typed + moves[event.key]!, min, span), min, step), true);
                      setDraft(null);
                    } else if (event.key === "Enter") {
                      commitDraft();
                      event.currentTarget.select();
                    } else if (event.key === "Escape") setDraft(null);
                  }}
                  className="h-7 min-w-0 bg-transparent p-0 text-right tabular-nums outline-none read-only:text-muted-foreground"
                />
                {unit ? (
                  <span aria-hidden="true" className="text-muted-foreground">
                    {unit}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
