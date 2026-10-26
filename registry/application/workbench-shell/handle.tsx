"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from "react";

import { clamp, type WorkbenchPanel } from "@rhs-ui/application/workbench-shell/layout";
import { cn } from "@/lib/utils";

/** What a handle asks the shell to draw: whether its panel is collapsed, and how wide it is or gets back when it opens. */
export interface HandleState {
  /** Whether the panel is collapsed. */
  collapsed: boolean;
  /** The width the panel has, or gets back when it opens again. */
  width: number;
}

export interface WorkbenchHandleProps {
  /** Which panel the handle resizes. */
  panel: WorkbenchPanel;
  /** The id of the panel the handle resizes. */
  controls: string;
  /** The handle's name for screen readers: "Resize explorer". */
  label: string;
  /** How the handle's value is said: the collapsed state, and the width with `{width}` filled in. */
  words: {
    /** What the handle reads out for a collapsed panel. */
    collapsed: string;
    /** What it reads out for an open one, with `{width}` for the width in px. */
    width: string;
  };
  /** The panel's width in px; kept while it is collapsed. */
  width: number;
  /** Whether the panel is collapsed. */
  collapsed: boolean;
  /** The least width of the panel in px. */
  min: number;
  /** The most width the panel may have in px. */
  max: number;
  /** The width a double click brings the panel back to. */
  reset: number;
  /** The edge of the row the panel hangs from: the explorer from the start, the inspector from the end. */
  edge: "start" | "end";
  /** The row the panel sits in, for the pointer maths. */
  row: RefObject<HTMLElement | null>;
  /** A new state. Not final while a pointer is still dragging, final for a key press and when the pointer is released. */
  onChange: (state: HandleState, final: boolean) => void;
  /** A drag began or ended. */
  onDragChange: (dragging: boolean) => void;
  /** Extra classes, such as the one that hides the handle where the panels are sheets. */
  className?: string;
}

const STEP = 16;
const BIG_STEP = 64;

/**
 * The drag handle between two parts of the workbench, and a keyboard separator
 * too. The arrow that moves the handle toward the canvas grows its panel by 16px
 * (64 with Shift), the other shrinks it down to its minimum, Home collapses the
 * panel, End restores it (or opens it to the largest it may be), Enter toggles,
 * and a double click brings it back to its starting width. A drag past half the
 * minimum collapses the panel, and a drag out of the collapsed hairline opens it
 * again. The arrows and the pointer follow the reading direction, so a mirrored
 * layout (dir="rtl") resizes the way it looks.
 */
export function WorkbenchHandle({ panel, controls, label, words, width, collapsed, min, max, reset, edge, row, onChange, onDragChange, className }: WorkbenchHandleProps) {
  const [dragging, setDragging] = useState(false);
  const active = useRef(false);
  const last = useRef<HandleState>({ collapsed, width });
  const open = collapsed ? 0 : width;
  const top = Number.isFinite(max) ? max : Math.max(width, min);

  /** Whether the layout is mirrored: then the explorer hangs from the right and the arrows swap. */
  const mirrored = (element: Element | null) => (element ? getComputedStyle(element).direction === "rtl" : false);

  function down(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    active.current = true;
    last.current = { collapsed, width };
    setDragging(true);
    onDragChange(true);
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    if (!active.current) return;
    const rect = row.current?.getBoundingClientRect();
    if (!rect) return;
    const fromLeft = event.clientX - rect.left;
    const fromRight = rect.right - event.clientX;
    const raw = (edge === "start") !== mirrored(row.current) ? fromLeft : fromRight;
    const next: HandleState = raw < min * 0.5 ? { collapsed: true, width: last.current.width } : { collapsed: false, width: clamp(Math.round(raw), min, top) };
    if (next.collapsed === last.current.collapsed && next.width === last.current.width) return;
    last.current = next;
    onChange(next, false);
  }

  function up(event: PointerEvent<HTMLDivElement>) {
    if (!active.current) return;
    active.current = false;
    setDragging(false);
    onDragChange(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    onChange(last.current, true);
  }

  function key(event: KeyboardEvent<HTMLDivElement>) {
    const toward = (edge === "start") !== mirrored(event.currentTarget) ? "ArrowRight" : "ArrowLeft";
    const away = toward === "ArrowRight" ? "ArrowLeft" : "ArrowRight";
    const step = event.shiftKey ? BIG_STEP : STEP;
    let next: HandleState | null = null;
    if (event.key === toward) next = collapsed ? { collapsed: false, width } : { collapsed: false, width: clamp(width + step, min, top) };
    else if (event.key === away) next = collapsed ? null : { collapsed: false, width: clamp(width - step, min, top) };
    else if (event.key === "Home") next = collapsed ? null : { collapsed: true, width };
    else if (event.key === "End") next = collapsed ? { collapsed: false, width } : { collapsed: false, width: top };
    else if (event.key === "Enter") next = { collapsed: !collapsed, width };
    else return;
    event.preventDefault();
    if (next && (next.collapsed !== collapsed || next.width !== width)) onChange(next, true);
  }

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-controls={controls}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(top)}
      aria-valuenow={Math.round(open)}
      aria-valuetext={collapsed ? words.collapsed : words.width.replace("{width}", String(Math.round(width)))}
      data-slot="workbench-shell-handle"
      data-panel={panel}
      data-state={collapsed ? "collapsed" : "open"}
      data-dragging={dragging ? "true" : undefined}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={key}
      onDoubleClick={() => onChange({ collapsed: false, width: clamp(reset, min, top) }, true)}
      className={cn(
        "relative z-20 w-px shrink-0 cursor-col-resize bg-border outline-none [touch-action:none]",
        // A hairline to look at, a wider strip to grab: 5px for a mouse, so the scrollbar of the panel beside it stays fully usable, and 24px for a finger, which has no scrollbar to hit.
        "before:absolute before:inset-y-0 before:-inset-x-0.5 before:content-[''] [@media(pointer:coarse)]:before:-inset-x-[0.6875rem]",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-[3px] after:-translate-x-1/2 after:bg-transparent after:transition-colors after:duration-150 motion-reduce:after:transition-none",
        "hover:after:bg-foreground/20 focus-visible:after:bg-ring data-[dragging=true]:after:bg-foreground/35",
        className,
      )}
    />
  );
}
