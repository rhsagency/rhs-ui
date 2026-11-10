"use client";

import { useEffect, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

import { IconCheck } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  dayNames,
  dayOrder,
  describeRect,
  fill,
  formatTime,
  hoursOf,
  parseKey,
  rectKeys,
  rowStarts,
  slotKey,
  slotLength,
  summaryLines,
  type AvailabilityGridLabels,
  type Cell,
} from "@rhs-ui/application/availability-grid/slots";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export type { AvailabilityGridLabels } from "@rhs-ui/application/availability-grid/slots";

export interface AvailabilityGridProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** What is chosen, as a list of slot keys: a day (0 for Sunday to 6 for Saturday), a dash and the time the slot starts at, "1-09:00" for Monday from 09:00. Order does not matter and a key twice counts once. Pass it to control the grid. */
  value?: readonly string[];
  /** What is chosen to begin with, when the grid keeps that itself. */
  defaultValue?: readonly string[];
  /** Called with the new list of slot keys, sorted by day and time, whenever a drag, a key or a quick action changes it. */
  onValueChange?: (value: string[]) => void;
  /** The days to show, as numbers (0 for Sunday). Default all seven. */
  days?: readonly number[];
  /** The hour the first row starts at. Default 8. */
  startHour?: number;
  /** The hour the last row ends at, which is not part of the grid. Default 18. */
  endHour?: number;
  /** How long one slot is, in minutes: 15, 20, 30 or 60. Default 30. */
  slotMinutes?: number;
  /** The day the week starts on, 0 (Sunday) to 6. Default 1, Monday. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** The language of the names of the days, the times and the lists in the summary. Default "en-US". */
  locale?: string;
  /** Write times on a 12-hour clock ("9:00 AM"). Default false: 09:00. */
  hour12?: boolean;
  /** The grid's name for a plain form submit: one field with this name per chosen slot. */
  name?: string;
  /** Turn the whole grid off. */
  disabled?: boolean;
  /** The words the grid says, for translation. */
  labels?: AvailabilityGridLabels;
}

interface Drag {
  anchor: Cell;
  current: Cell;
  /** What the drag does to every cell it covers, decided by the cell it began on: a cell that was chosen clears, one that was not is chosen. */
  mode: "on" | "off";
  /** What was chosen when the drag began, so shrinking the rectangle gives cells back. */
  base: ReadonlySet<string>;
}

const sorted = (keys: Iterable<string>): string[] =>
  [...keys].sort((a, b) => {
    const left = parseKey(a);
    const right = parseKey(b);
    return left && right ? left.day - right.day || left.minutes - right.minutes : a.localeCompare(b);
  });

/**
 * A weekly grid for choosing when someone is free, bookable or on shift: the days across, the hours down, one cell per slot. Pointer users press a cell
 * and drag to paint a rectangle on or off (the cell the drag starts on decides: a chosen one clears, an empty one fills), and a day's heading fills or
 * clears that day. On a touch screen a swipe scrolls the page as usual, and a finger that rests on a cell for a moment starts painting instead: the page
 * stops scrolling under it and the drag runs down the hours too. Keyboard users move with the arrow keys, Home, End, Page Up and Page Down, toggle with Space or Enter, and extend a range with Shift
 * and the arrows. It is a grid role with one tab stop; every cell is named and stated ("Tuesday 09:00 to 09:30, available") and a change is announced
 * politely. A summary folds what is chosen into ranges ("Monday to Friday, 09:00 to 17:00") with the hours a week, and quick actions fill the weekdays
 * or clear everything. A chosen cell is filled, and in forced-colours mode it also carries a check, so the state never rests on colour.
 */
export function AvailabilityGrid({
  value,
  defaultValue,
  onValueChange,
  days,
  startHour = 8,
  endHour = 18,
  slotMinutes: rawSlot = 30,
  weekStartsOn = 1,
  locale = "en-US",
  hour12 = false,
  name,
  disabled = false,
  labels,
  className,
  ...props
}: AvailabilityGridProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const slot = slotLength(rawSlot);
  const grid = useRef<HTMLDivElement>(null);
  const [own, setOwn] = useState<readonly string[]>(defaultValue ?? []);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [focus, setFocus] = useState<Cell>({ col: 0, row: 0 });
  const [range, setRange] = useState<{ from: Cell; to: Cell } | null>(null);
  const [said, setSaid] = useState("");
  // A finger that rests on a cell for a moment, and does not slide off it, is painting: the page stops scrolling under it for the rest of the touch.
  const hold = useRef<{ timer: number; x: number; y: number } | null>(null);
  const painting = useRef(false);
  const [holding, setHolding] = useState(false);

  const order = useMemo(() => dayOrder(weekStartsOn, days), [weekStartsOn, days]);
  const rows = useMemo(() => rowStarts(startHour, endHour, slot), [startHour, endHour, slot]);
  const names = useMemo(() => dayNames(locale), [locale]);
  const times = useMemo(() => rows.map((start) => ({ from: formatTime(start, locale, hour12), to: formatTime(start + slot, locale, hour12), onHour: start % 60 === 0 })), [rows, slot, locale, hour12]);
  const selected = useMemo(() => new Set(value ?? own), [value, own]);

  // What is shown while a drag is on: the cells it covers are set to the drag's mode, the rest stay as they were.
  const covered = useMemo(() => (drag ? new Set(rectKeys(order, rows, drag.anchor, drag.current)) : range ? new Set(rectKeys(order, rows, range.from, range.to)) : null), [drag, range, order, rows]);
  const shown = useMemo(() => {
    if (!drag || !covered) return selected;
    const next = new Set(drag.base);
    for (const key of covered) {
      if (drag.mode === "on") next.add(key);
      else next.delete(key);
    }
    return next;
  }, [drag, covered, selected]);

  const lines = useMemo(() => summaryLines(shown, order, rows, slot, locale, hour12, text), [shown, order, rows, slot, locale, hour12, text]);
  const hours = hoursOf(shown.size, slot);

  // The scroll of a touch can only be stopped by a touchmove listener that is not passive, and only before the scroll has begun: so the hold has to come first.
  useEffect(() => {
    const element = grid.current;
    if (!element) return;
    const stop = (event: TouchEvent) => {
      if (painting.current && event.cancelable) event.preventDefault();
    };
    element.addEventListener("touchmove", stop, { passive: false });
    return () => {
      element.removeEventListener("touchmove", stop);
      if (hold.current) window.clearTimeout(hold.current.timer);
    };
  }, []);

  function endHold() {
    if (hold.current) window.clearTimeout(hold.current.timer);
    hold.current = null;
    painting.current = false;
    setHolding(false);
  }

  const cellKey = (cell: Cell): string => slotKey(order[cell.col] ?? 0, rows[cell.row] ?? 0);
  const state = (on: boolean) => (on ? text.available : text.unavailable);

  function commit(next: Set<string>, message?: string) {
    if (disabled) return;
    const list = sorted(next);
    if (value === undefined) setOwn(list);
    onValueChange?.(list);
    if (message !== undefined) setSaid(message);
  }

  /** Set every cell of a rectangle on or off, and say so. */
  function paint(a: Cell, b: Cell, mode: "on" | "off") {
    const next = new Set(selected);
    for (const key of rectKeys(order, rows, a, b)) {
      if (mode === "on") next.add(key);
      else next.delete(key);
    }
    commit(next, fill(text.changed, { range: describeRect(order, rows, slot, a, b, locale, hour12, text), state: state(mode === "on") }));
  }

  /** Fill a whole day, or clear it if it is already full. */
  function toggleDay(col: number) {
    const top: Cell = { col, row: 0 };
    const bottom: Cell = { col, row: rows.length - 1 };
    const full = rectKeys(order, rows, top, bottom).every((key) => selected.has(key));
    paint(top, bottom, full ? "off" : "on");
  }

  function fillWeekdays() {
    const next = new Set(selected);
    order.forEach((day, col) => {
      if (day >= 1 && day <= 5) for (const key of rectKeys(order, rows, { col, row: 0 }, { col, row: rows.length - 1 })) next.add(key);
    });
    commit(next, text.filledWeekdays);
  }

  function cellAt(event: PointerEvent): Cell | null {
    const element = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-cell]");
    if (!element || !grid.current?.contains(element)) return null;
    return { col: Number(element.dataset.col), row: Number(element.dataset.row) };
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled || (event.pointerType === "mouse" && event.button !== 0)) return;
    const cell = cellAt(event);
    if (!cell) return;
    // The cell the drag begins on decides what it does: a chosen cell clears, an empty one fills.
    setDrag({ anchor: cell, current: cell, mode: selected.has(cellKey(cell)) ? "off" : "on", base: selected });
    setRange(null);
    setFocus(cell);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.querySelector<HTMLElement>(`[data-col="${cell.col}"][data-row="${cell.row}"]`)?.focus({ preventScroll: true });
    if (event.pointerType === "touch") {
      endHold();
      hold.current = {
        x: event.clientX,
        y: event.clientY,
        timer: window.setTimeout(() => {
          hold.current = null;
          painting.current = true;
          setHolding(true);
        }, 250),
      };
    }
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    // A finger that slides off before the hold is a swipe: it scrolls, or paints sideways, as it always did.
    if (hold.current && Math.hypot(event.clientX - hold.current.x, event.clientY - hold.current.y) > 8) {
      window.clearTimeout(hold.current.timer);
      hold.current = null;
    }
    if (!drag) return;
    const cell = cellAt(event);
    if (cell && (cell.col !== drag.current.col || cell.row !== drag.current.row)) setDrag({ ...drag, current: cell });
  }

  function onPointerUp() {
    endHold();
    if (!drag) return;
    paint(drag.anchor, drag.current, drag.mode);
    setDrag(null);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (disabled || event.altKey || event.metaKey || !target.hasAttribute("data-cell")) return;
    // Where the key was pressed: the cell that has the focus.
    const here: Cell = { col: Number(target.dataset.col), row: Number(target.dataset.row) };
    const last = { col: order.length - 1, row: rows.length - 1 };
    const move = (to: Cell) => {
      event.preventDefault();
      const next = { col: Math.min(last.col, Math.max(0, to.col)), row: Math.min(last.row, Math.max(0, to.row)) };
      // Shift keeps a range open from where it began; any other move closes it.
      setRange(event.shiftKey ? { from: range?.from ?? here, to: next } : null);
      grid.current?.querySelector<HTMLElement>(`[data-col="${next.col}"][data-row="${next.row}"]`)?.focus();
    };
    switch (event.key) {
      case "ArrowRight":
        return move({ col: here.col + 1, row: here.row });
      case "ArrowLeft":
        return move({ col: here.col - 1, row: here.row });
      case "ArrowDown":
        return move({ col: here.col, row: here.row + 1 });
      case "ArrowUp":
        return move({ col: here.col, row: here.row - 1 });
      case "Home":
        return move(event.ctrlKey ? { col: 0, row: 0 } : { col: 0, row: here.row });
      case "End":
        return move(event.ctrlKey ? last : { col: last.col, row: here.row });
      case "PageUp":
        return move({ col: here.col, row: 0 });
      case "PageDown":
        return move({ col: here.col, row: last.row });
      case " ":
      case "Enter": {
        event.preventDefault();
        const from = range?.from ?? here;
        const to = range?.to ?? here;
        paint(from, to, selected.has(cellKey(from)) ? "off" : "on");
        setRange(null);
        return;
      }
      case "Escape":
        if (range) {
          event.preventDefault();
          setRange(null);
        }
        return;
      default:
    }
  }

  const empty = shown.size === 0;
  // The time column is wide enough for "10:00 AM" when the clock has twelve hours.
  const columns = `${hour12 ? "3.75rem" : "3rem"} repeat(${order.length}, minmax(0, 1fr))`;
  const rowHeight = `${Math.min(2.25, Math.max(1.125, slot / 20))}rem`;

  return (
    <div data-slot="availability-grid" data-disabled={disabled || undefined} className={cn("@container grid w-full min-w-0 gap-4", className)} {...props}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div aria-hidden="true" className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-[3px] bg-foreground/90 forced-colors:border forced-colors:border-[CanvasText] forced-colors:bg-[Highlight]" />
            {text.legendOn}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-[3px] border border-border bg-muted/60" />
            {text.legendOff}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={fillWeekdays}>
            {text.fillWeekdays}
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={disabled || selected.size === 0} onClick={() => commit(new Set(), text.clearedAll)}>
            {text.clear}
          </Button>
        </div>
      </div>

      <div className={cn("rounded-xl border border-border bg-card p-2.5 shadow-xs transition-shadow duration-150 motion-reduce:transition-none sm:p-3.5", holding && "ring-2 ring-ring/40", disabled && "opacity-60")}>
        <div
          ref={grid}
          role="grid"
          aria-label={text.grid}
          aria-colcount={order.length + 1}
          aria-rowcount={rows.length + 1}
          aria-disabled={disabled || undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            endHold();
            setDrag(null);
          }}
          onKeyDown={onKeyDown}
          style={{ gridTemplateColumns: columns, "--row-h": rowHeight } as CSSProperties}
          className="grid touch-pan-y pt-2 select-none"
        >
          <div role="row" className="contents">
            <div role="columnheader">
              <span className="sr-only">{text.timeColumn}</span>
            </div>
            {order.map((day, col) => (
              <div key={day} role="columnheader" className="pb-1.5 text-center">
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={disabled}
                  aria-label={`${names.short[day] ?? ""}, ${fill(text.toggleDay, { day: names.long[day] ?? "" })}`}
                  onClick={() => toggleDay(col)}
                  className="w-full min-w-0 truncate rounded-md px-0.5 py-1 text-xs font-medium text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground disabled:pointer-events-none motion-reduce:transition-none"
                >
                  {names.short[day]}
                </button>
              </div>
            ))}
          </div>

          {rows.map((start, row) => {
            const label = times[row];
            return (
              <div key={start} role="row" className="contents">
                <div role="rowheader" className="relative pr-2 text-right">
                  <span className={cn("tabular-nums", label?.onHour ? "absolute top-0 right-2 -translate-y-1/2 text-[0.6875rem] leading-none whitespace-nowrap text-muted-foreground" : "sr-only")}>{label?.from}</span>
                </div>
                {order.map((day, col) => {
                  const key = slotKey(day, start);
                  const on = shown.has(key);
                  // The tab stop stays on the grid even if the days or the hours shrink under it.
                  const here = col === Math.min(focus.col, order.length - 1) && row === Math.min(focus.row, rows.length - 1);
                  const inRange = covered?.has(key) ?? false;
                  // Chosen cells that touch in a column are drawn as one block with a hairline between the slots, so a day reads as hours and not as a pile of bars.
                  const above = on && row > 0 && shown.has(slotKey(day, rows[row - 1] ?? 0));
                  const below = on && row < rows.length - 1 && shown.has(slotKey(day, rows[row + 1] ?? 0));
                  return (
                    <div
                      key={key}
                      role="gridcell"
                      data-cell=""
                      data-col={col}
                      data-row={row}
                      data-on={on || undefined}
                      data-above={above || undefined}
                      data-below={below || undefined}
                      data-range={inRange ? (drag ? "drag" : "keys") : undefined}
                      tabIndex={here ? 0 : -1}
                      aria-label={fill(text.cell, { day: names.long[day] ?? "", from: label?.from ?? "", to: label?.to ?? "", state: state(on) })}
                      onFocus={() => setFocus({ col, row })}
                      // Activation by assistive technology arrives as a click without a pointer press (detail 0); a real press has been handled already.
                      onClick={(event) => {
                        if (event.detail === 0) paint({ col, row }, { col, row }, on ? "off" : "on");
                      }}
                      className={cn(
                        "group/cell relative h-(--row-h) cursor-pointer outline-none focus-visible:z-10",
                        disabled && "cursor-not-allowed",
                        row > 0 && (label?.onHour ? "border-t border-border" : "border-t border-transparent"),
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute inset-x-[1.5px] top-[1.5px] bottom-[1.5px] grid place-items-center rounded-[4px] bg-muted/60 transition-colors duration-100 motion-reduce:transition-none",
                          "group-data-[above]/cell:top-0 group-data-[above]/cell:rounded-t-none group-data-[below]/cell:bottom-0 group-data-[below]/cell:rounded-b-none",
                          "group-hover/cell:bg-muted group-data-[on]/cell:bg-foreground/90 group-data-[on]/cell:group-hover/cell:bg-foreground/75",
                          // A drag shows its result with an edge round every cell it covers; a range made with the keys is only a selection, so its cells go to a mid tone until Space applies it.
                          "group-data-[range=drag]/cell:outline-1 group-data-[range=drag]/cell:-outline-offset-1 group-data-[range=drag]/cell:outline-foreground/60 group-data-[range=keys]/cell:bg-foreground/40!",
                          "group-focus-visible/cell:outline-2 group-focus-visible/cell:outline-offset-1 group-focus-visible/cell:outline-ring",
                          "forced-colors:border forced-colors:border-[CanvasText] group-data-[on]/cell:forced-colors:bg-[Highlight] group-data-[on]/cell:forced-colors:text-[HighlightText]",
                        )}
                      >
                        {/* Forced colours drop the fill, so a chosen cell is also a check there. */}
                        {on ? <IconCheck className="hidden size-3 forced-colors:block" strokeWidth={3} /> : null}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">{text.hint}</p>

      <div className="grid gap-2.5 rounded-lg border border-border bg-muted/30 px-4 py-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-xs font-medium text-muted-foreground">{text.summary}</p>
          {empty ? null : (
            <p className="text-xs font-medium text-foreground tabular-nums">{hours === 1 ? text.totalOne : fill(text.total, { hours: new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(hours) })}</p>
          )}
        </div>
        {empty ? (
          <p className="text-sm leading-5 text-muted-foreground">{text.empty}</p>
        ) : (
          <ul role="list" className="grid gap-1.5">
            {lines.map((line) => (
              <li key={`${line.days}-${line.times}`} className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-sm leading-5">
                <span className="font-medium">{line.days}</span>
                <span className="text-muted-foreground tabular-nums">{line.times}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {name ? sorted(selected).map((key) => <input key={key} type="hidden" name={name} value={key} disabled={disabled} />) : null}
      <p role="status" aria-live="polite" className="sr-only">
        {said}
      </p>
    </div>
  );
}
