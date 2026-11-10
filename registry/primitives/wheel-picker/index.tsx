"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";

import {
  copiesFor,
  firstEnabled,
  indexOfValue,
  lastEnabled,
  matchTyped,
  nearestEnabled,
  normaliseOptions,
  stepIndex,
  type NormalOption,
  type WheelColumn,
} from "@rhs-ui/primitives/wheel-picker/wheel";
import { cn } from "@/lib/utils";

export type { WheelColumn, WheelOption } from "@rhs-ui/primitives/wheel-picker/wheel";

export interface WheelPickerProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The columns, left to right: `{ id, options, loop }`. The `wheelRange` helper writes a run of numbers as options. */
  columns: readonly WheelColumn[];
  /** The chosen value of every column, in the order of `columns`, when you control the picker. A value a column does not have starts that column at its first row. */
  value?: readonly string[];
  /** The values to start with, when you do not control the picker. */
  defaultValue?: readonly string[];
  /** Called with the chosen value of every column whenever one of them changes: after a swipe has come to rest, on a tap, and on every key. */
  onValueChange?: (value: string[]) => void;
  /** The height of one row in pixels. Default 40, which is a comfortable thumb target. */
  itemHeight?: number;
  /** How many rows show, an odd number so the chosen one sits in the middle. Default 5. */
  visibleRows?: number;
  /** The name of the whole picker for a screen reader: "Alarm time". */
  label: string;
  /** Turn the whole picker off. */
  disabled?: boolean;
}

const ALIGN = { start: "justify-start pl-3", center: "justify-center", end: "justify-end pr-3" } as const;

/** Whether the person asked their system for less motion. Read when it is needed: it can change while the page is open. */
const prefersLessMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface ColumnViewProps {
  name: string;
  column: WheelColumn;
  options: NormalOption[];
  baseId: string;
  selected: number;
  onSelect: (index: number) => void;
  itemHeight: number;
  rows: number;
  disabled: boolean;
  attach: (node: HTMLDivElement | null) => void;
  hop: (direction: 1 | -1) => void;
}

/** One column: a listbox on native scroll snapping. The chosen row is whichever one rests in the middle. */
function ColumnView({ name, column, options, baseId, selected, onSelect, itemHeight, rows, disabled, attach, hop }: ColumnViewProps) {
  const list = useRef<HTMLDivElement | null>(null);
  const resting = useRef<number | undefined>(undefined);
  // True from the first scroll event until the column has come to rest.
  const moving = useRef(false);
  // The row that a swipe came to rest on and reported, so the column is not scrolled to a place it is already at.
  const swiped = useRef<number | null>(null);
  // The row that was reported and has not yet been taken by whoever controls the picker.
  const asked = useRef<number | null>(null);
  const latest = useRef(selected);
  latest.current = selected;
  const typing = useRef<{ text: string; timer: number | undefined }>({ text: "", timer: undefined });
  const loop = column.loop === true;
  const count = options.length;
  const copies = loop ? copiesFor(count) : 1;
  const middle = (copies - 1) / 2;
  const pad = ((rows - 1) / 2) * itemHeight;
  // The rows above and below the middle fade out; the band behind the middle row is drawn by the picker.
  const edge = Math.max(10, Math.min(42, (100 * ((rows - 1) / 2 - 0.2)) / rows));
  const mask = `linear-gradient(to bottom, transparent 0%, #000 ${edge}%, #000 ${100 - edge}%, transparent 100%)`;

  const localOf = (global: number) => (loop ? ((global % count) + count) % count : Math.min(Math.max(global, 0), count - 1));

  function scrollToRow(global: number, smooth: boolean) {
    list.current?.scrollTo({ top: global * itemHeight, behavior: smooth && !prefersLessMotion() ? "smooth" : "auto" });
  }

  /** The place of a row in the drawn rows that is nearest to where the column is now, so a wrap round is a short way and not a long one. */
  function nearestRow(local: number): number {
    const el = list.current;
    if (!loop || !el) return middle * count + local;
    const here = Math.round(el.scrollTop / itemHeight);
    const around = Math.round((here - local) / count) * count + local;
    return around >= 0 && around < copies * count ? around : middle * count + local;
  }

  // The column starts with its chosen row in the middle, before anything is painted.
  useLayoutEffect(() => {
    if (list.current) list.current.scrollTop = (middle * count + selected) * itemHeight;
    // Only the shape of the column decides where it starts; a row chosen later is scrolled to by the effect below.
  }, [itemHeight, count, copies]);

  // A row that was chosen by a key, by a tap or from outside is scrolled to, unless the column is already resting on it.
  useEffect(() => {
    const el = list.current;
    if (!el || !count) return;
    if (swiped.current === selected) {
      swiped.current = null;
      asked.current = null;
      return;
    }
    swiped.current = null;
    const target = nearestRow(selected);
    // A column that is in the middle of a move is always sent on to the new row: it may pass through that row on its way elsewhere.
    if (!moving.current && Math.round(el.scrollTop / itemHeight) === target) return;
    scrollToRow(target, true);
  }, [selected]);

  useEffect(
    () => () => {
      window.clearTimeout(resting.current);
      window.clearTimeout(typing.current.timer);
    },
    [],
  );

  /** The swipe has come to rest: the row in the middle is the choice. */
  function settle() {
    const el = list.current;
    moving.current = false;
    if (!el || !count) return;
    const global = Math.min(Math.max(Math.round(el.scrollTop / itemHeight), 0), copies * count - 1);
    // The browser snaps a swipe to a row by itself, but not every kind of scroll in every browser (a wheel, a move that was cut short): a column that came to rest between two rows is moved on to the nearest.
    if (Math.abs(el.scrollTop - global * itemHeight) > 1) {
      scrollToRow(global, true);
      return;
    }
    let local = localOf(global);
    if (options[local]?.disabled) {
      // A row that cannot be chosen is moved off, to the nearest one that can.
      const other = nearestEnabled(options, local);
      if (other !== -1) {
        scrollToRow(global + (other - local), true);
        local = other;
      }
    }
    // A looping column goes back to its middle copy, unseen, so there is always room to go on in both directions.
    if (loop && Math.floor(global / count) !== middle) el.scrollTop = (middle * count + local) * itemHeight;
    if (local !== selected) {
      const ask = local;
      swiped.current = ask;
      asked.current = ask;
      onSelect(ask);
      // A picker that is controlled may refuse the row: once the page has had time to draw, a column that was not given the row it asked for goes back to the one it still has.
      window.setTimeout(() => {
        if (asked.current !== ask) return;
        asked.current = null;
        if (latest.current === ask) return;
        swiped.current = null;
        scrollToRow(nearestRow(latest.current), true);
      }, 250);
    }
  }

  // The timer runs the settle of the latest render, so what it knows about the choice is never old.
  const settling = useRef(settle);
  settling.current = settle;

  function onScroll() {
    moving.current = true;
    window.clearTimeout(resting.current);
    resting.current = window.setTimeout(() => settling.current(), 110);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled || event.altKey || event.ctrlKey || event.metaKey) return;
    const { key } = event;
    let next: number | undefined;
    if (key === "ArrowDown") next = stepIndex(options, selected, 1, loop);
    else if (key === "ArrowUp") next = stepIndex(options, selected, -1, loop);
    else if (key === "PageDown") next = stepIndex(options, selected, rows, loop);
    else if (key === "PageUp") next = stepIndex(options, selected, -rows, loop);
    else if (key === "Home") next = firstEnabled(options);
    else if (key === "End") next = lastEnabled(options);
    else if (key === "ArrowRight" || key === "ArrowLeft") {
      event.preventDefault();
      hop(key === "ArrowRight" ? 1 : -1);
      return;
    } else if (key.length === 1 && key !== " ") {
      // Typing jumps: a number to the row that starts with it, a letter to the first row with that letter.
      window.clearTimeout(typing.current.timer);
      typing.current.text = (typing.current.text + key).slice(-6);
      typing.current.timer = window.setTimeout(() => {
        typing.current.text = "";
      }, 700);
      let found = matchTyped(options, typing.current.text, selected);
      if (found === -1 && typing.current.text.length > 1) {
        typing.current.text = key;
        found = matchTyped(options, key, selected);
      }
      if (found === -1) return;
      event.preventDefault();
      if (found !== selected) onSelect(found);
      return;
    } else return;
    event.preventDefault();
    if (next !== undefined && next >= 0 && next !== selected) onSelect(next);
  }

  return (
    <div style={{ width: column.width ?? 96 }} className="relative z-10 min-w-0 shrink rounded-lg has-[[role=listbox]:focus-visible]:ring-[3px] has-[[role=listbox]:focus-visible]:ring-ring/40">
      <div
        ref={(node) => {
          list.current = node;
          attach(node);
        }}
        role="listbox"
        aria-label={name}
        aria-activedescendant={count ? `${baseId}-${selected}` : undefined}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        style={{ height: rows * itemHeight, maskImage: mask, WebkitMaskImage: mask }}
        // Disabled, it holds still: a column that scrolled with no way to focus it is a region a keyboard cannot reach (axe
        // scrollable-region-focusable), and a disabled picker has nothing to turn. The selected row stays in place.
        className={cn("relative snap-y snap-mandatory overflow-y-auto overscroll-contain outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", disabled && "overflow-y-hidden")}
      >
        <div aria-hidden="true" style={{ height: pad }} />
        {Array.from({ length: copies }, (_, copy) => copy).flatMap((copy) =>
          options.map((option, index) => {
            // The rows are drawn again and again in a looping column, but only the middle copy is there for assistive technology.
            const primary = copy === middle;
            return (
              <div
                key={`${copy}:${index}`}
                id={primary ? `${baseId}-${index}` : undefined}
                role={primary ? "option" : undefined}
                aria-hidden={primary ? undefined : true}
                aria-selected={primary ? index === selected : undefined}
                aria-disabled={primary && option.disabled ? true : undefined}
                onClick={() => {
                  if (option.disabled) return;
                  if (index === selected) scrollToRow(copy * count + index, true);
                  else onSelect(index);
                }}
                style={{ height: itemHeight }}
                className={cn(
                  "flex snap-center items-center px-1 text-[1.0625rem] tracking-[-0.01em] tabular-nums",
                  ALIGN[column.align ?? "center"],
                  // A row that cannot be chosen is struck through, as a closed day is in the week grid: opacity on top of the fade at the edges would leave nothing to read.
                  option.disabled ? "cursor-not-allowed text-muted-foreground line-through" : "cursor-pointer",
                )}
              >
                {option.label}
              </div>
            );
          }),
        )}
        <div aria-hidden="true" style={{ height: pad }} />
      </div>
    </div>
  );
}

/**
 * Columns of values that snap to a row, for a time, a duration or a number on a
 * phone: swipe, tap a row, or use the keys. The row in the middle, in a quiet
 * band, is the choice; the rows above and below fade out. Scrolling is the
 * browser's own, so a fling has its momentum and settles on a row, and a
 * looping column (minutes, hours) wraps round for as long as you swipe. Each
 * column is a listbox that says which row is chosen: Arrow Up and Down move, a
 * number or a letter typed jumps to the row that starts with it, Home and End go
 * to the ends, Page Up and Down go a screenful, and Arrow Left and Right move
 * to the next column. With the system set to reduced motion every move is an
 * instant jump. It is the touch-first sibling of the Time picker, and sits well
 * in a Drawer.
 */
export function WheelPicker({ columns, value, defaultValue, onValueChange, itemHeight = 40, visibleRows = 5, label, disabled = false, className, ...props }: WheelPickerProps) {
  const base = useId();
  const [own, setOwn] = useState<readonly string[]>(defaultValue ?? []);
  const values = value ?? own;
  const lists = useRef<(HTMLDivElement | null)[]>([]);
  // A server cannot scroll a column to its chosen row, so until the columns are in place the picker holds its space and shows nothing, instead of showing the top of every column and jumping.
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    setReady(true);
  }, []);
  // The middle row is the choice, so the number of rows must be odd and there must be at least three.
  const rows = Math.max(3, Math.floor(visibleRows) % 2 === 0 ? Math.floor(visibleRows) + 1 : Math.floor(visibleRows));
  const normal = columns.map((column) => normaliseOptions(column.options));
  const selected = columns.map((_, index) => indexOfValue(normal[index] ?? [], values[index]));

  function choose(column: number, row: number) {
    const picked = normal[column]?.[row];
    if (!picked) return;
    const next = columns.map((_, index) => (index === column ? picked.value : (normal[index]?.[selected[index] ?? 0]?.value ?? "")));
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  return (
    <div data-slot="wheel-picker" role="group" aria-label={label} aria-disabled={disabled || undefined} className={cn("relative isolate flex w-fit max-w-full items-stretch justify-center gap-1 px-2 select-none", !ready && "invisible", disabled && "pointer-events-none opacity-60", className)} {...props}>
      <div aria-hidden="true" style={{ height: itemHeight }} className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 rounded-lg bg-muted" />
      {columns.map((column, index) => (
        <div key={column.id} className="contents">
          <ColumnView
            name={column.label ?? column.id}
            column={column}
            options={normal[index] ?? []}
            baseId={`${base}-${column.id}`}
            selected={selected[index] ?? 0}
            onSelect={(row) => choose(index, row)}
            itemHeight={itemHeight}
            rows={rows}
            disabled={disabled}
            attach={(node) => {
              lists.current[index] = node;
            }}
            hop={(direction) => lists.current[index + direction]?.focus()}
          />
          {column.separator ? (
            <span aria-hidden="true" className="relative z-10 grid min-w-3 shrink-0 place-items-center self-center px-0.5 text-[1.0625rem] font-medium text-muted-foreground" style={{ height: itemHeight }}>
              {column.separator}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
