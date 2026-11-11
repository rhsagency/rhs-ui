"use client";

import { useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from "react";

import { cn } from "@/lib/utils";

/** The words the handle says on its own, for another language or your own wording. `{label}` and `{width}` are filled in. */
export interface TableColumnResizerLabels {
  /** The name of the handle. Default "Resize {label} column". */
  resize: string;
  /** What a screen reader hears as the value of the handle. Default "{width} pixels". */
  value: string;
  /** The readout that shows beside the handle while it is used. Default "{width} px". */
  readout: string;
}

export interface TableColumnResizerProps extends Omit<ComponentProps<"div">, "children" | "role" | "onChange"> {
  /** The name of the column: "Customer". It names the handle ("Resize Customer column"). */
  label: string;
  /** The width of the column now, in pixels. You hold it and put it on the header cell and the table. */
  width: number;
  /** Called with the new width, in whole pixels and within `min` and `max`, while the handle moves. */
  onWidthChange: (width: number) => void;
  /** Called once the person has let go of the pointer, or after a key, with the width that was settled on. Use it to save the widths. */
  onResizeEnd?: (width: number) => void;
  /** The narrowest the column may be, in pixels. Default 48. */
  min?: number;
  /** The widest the column may be, in pixels. Default 640. */
  max?: number;
  /** The width Enter and a double-click go back to. Without it they do nothing. */
  defaultWidth?: number;
  /** The words the handle says, for translation. */
  labels?: Partial<TableColumnResizerLabels>;
}

const DEFAULT_LABELS = {
  resize: "Resize {label} column",
  value: "{width} pixels",
  readout: "{width} px",
} satisfies TableColumnResizerLabels;

const fill = (template: string, values: Readonly<Record<string, string | number>>) => template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

/**
 * A drag handle for the edge of a column header. Drag it with the pointer, which it captures so leaving the header never
 * lets go of it, or focus it and press Left and Right for 8 pixels (32 with Shift), Home and End for the narrowest and
 * the widest, and Enter or a double-click for the default width. It is a focusable separator with `aria-valuenow`,
 * `aria-valuemin` and `aria-valuemax` in pixels, so a screen reader says the width as it changes. A hairline thickens
 * on hover and focus, a small readout shows the live width while it is used, and on a touch screen the handle is a
 * 24 pixel target that does not scroll the table. Place it inside a TableHead that is `relative`, and put the width on the
 * header cell yourself (with `table-layout: fixed` on the table, so the width is the width). In a right-to-left page it
 * moves to the other edge and the arrows follow the reading direction. In the last header cell the handle and its
 * readout stay inside the cell, so the end of the table never sticks out and the scroll box has no scrollbar of its own.
 */
export function TableColumnResizer({ label, width, onWidthChange, onResizeEnd, min = 48, max = 640, defaultWidth, labels, className, ...props }: TableColumnResizerProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; start: number; direction: 1 | -1 } | null>(null);
  // The width as the last event left it: several events can arrive before the parent has re-rendered.
  const latest = useRef(width);
  latest.current = width;

  /** Moves to a width, held between the limits and in whole pixels. Returns the width that was settled on. */
  function move(next: number): number {
    const value = Math.min(max, Math.max(min, Math.round(next)));
    if (value !== latest.current) {
      latest.current = value;
      onWidthChange(value);
    }
    return value;
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    // Captured: the pointer can leave the header, the table or the window and the handle still has it.
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, start: width, direction: getComputedStyle(event.currentTarget).direction === "rtl" ? -1 : 1 };
    setDragging(true);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (current) move(current.start + (event.clientX - current.x) * current.direction);
  }

  function finish(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    onResizeEnd?.(latest.current);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const step = event.shiftKey ? 32 : 8;
    let next: number;
    switch (event.key) {
      case "ArrowRight":
        next = width + (rtl ? -step : step);
        break;
      case "ArrowLeft":
        next = width + (rtl ? step : -step);
        break;
      case "Home":
        next = min;
        break;
      case "End":
        next = max;
        break;
      case "Enter":
        if (defaultWidth === undefined) return;
        next = defaultWidth;
        break;
      case "Escape": {
        // A drag in progress is called off: the column goes back to where it was.
        const current = drag.current;
        if (!current) return;
        drag.current = null;
        setDragging(false);
        event.preventDefault();
        move(current.start);
        return;
      }
      default:
        return;
    }
    event.preventDefault();
    const settled = move(next);
    onResizeEnd?.(settled);
  }

  return (
    <div
      data-slot="table-column-resizer"
      data-dragging={dragging || undefined}
      role="separator"
      aria-orientation="vertical"
      aria-label={fill(words.resize, { label })}
      aria-valuenow={width}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={fill(words.value, { width })}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      onLostPointerCapture={finish}
      onKeyDown={onKeyDown}
      onDoubleClick={() => {
        if (defaultWidth === undefined) return;
        const settled = move(defaultWidth);
        onResizeEnd?.(settled);
      }}
      className={cn(
        // Straddles the edge of the header cell. A hit area of 12px for a mouse and 24px for a finger, which does not pan the table.
        // In the last cell it stays inside it: half of a handle past the table is scrollable overflow, a permanent scrollbar.
        "group/resizer absolute inset-y-0 end-0 z-10 flex w-3 translate-x-1/2 cursor-col-resize touch-none justify-center select-none outline-none rtl:-translate-x-1/2 in-[th:last-child]:translate-x-0 in-[th:last-child]:rtl:translate-x-0 [@media(pointer:coarse)]:w-6",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none my-1.5 w-px bg-border transition-[width,background-color] duration-150 group-hover/resizer:w-0.5 group-hover/resizer:bg-foreground/40 group-focus-visible/resizer:w-0.5 group-focus-visible/resizer:bg-ring group-data-[dragging]/resizer:w-0.5 group-data-[dragging]/resizer:bg-ring motion-reduce:transition-none"
      />
      {/* Not laid out until it is used: `opacity-0` still counts as scrollable overflow, `display: none` does not. In the last cell it lines up with the end of the table instead of being centred on it. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-full left-1/2 z-20 mt-1 hidden -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 text-[0.6875rem] font-medium whitespace-nowrap text-background tabular-nums shadow-sm transition-opacity duration-100 starting:opacity-0 group-focus-visible/resizer:block group-data-[dragging]/resizer:block in-[th:last-child]:start-auto in-[th:last-child]:end-0 in-[th:last-child]:translate-x-0 motion-reduce:transition-none"
      >
        {fill(words.readout, { width })}
      </span>
    </div>
  );
}
