"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ResizableProps {
  /** The first panel (left, or top when vertical). */
  start: ReactNode;
  /** The second panel. */
  end: ReactNode;
  orientation?: "horizontal" | "vertical";
  /** Size of the first panel in percent. */
  defaultSize?: number;
  size?: number;
  onSizeChange?: (size: number) => void;
  min?: number;
  max?: number;
  /** Names the handle for screen readers: "Resize the sidebar". */
  label?: string;
  className?: string;
}

/**
 * Two panels with a handle between them: drag it, or focus it and use the
 * arrow keys (Shift for larger steps, Home and End for the limits). The
 * handle is a separator with its value, so screen readers can resize too.
 */
export function Resizable({ start, end, orientation = "horizontal", defaultSize = 50, size, onSizeChange, min = 15, max = 85, label = "Resize panels", className }: ResizableProps) {
  const [own, setOwn] = useState(defaultSize);
  const current = size ?? own;
  const box = useRef<HTMLDivElement>(null);
  const horizontal = orientation === "horizontal";
  const set = (next: number) => {
    const clamped = Math.round(Math.min(max, Math.max(min, next)) * 10) / 10;
    if (size === undefined) setOwn(clamped);
    onSizeChange?.(clamped);
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId) || !box.current) return;
    const rect = box.current.getBoundingClientRect();
    set(horizontal ? ((event.clientX - rect.left) / rect.width) * 100 : ((event.clientY - rect.top) / rect.height) * 100);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 2;
    const moves: Record<string, number> = horizontal ? { ArrowLeft: -step, ArrowRight: step } : { ArrowUp: -step, ArrowDown: step };
    if (event.key in moves) {
      event.preventDefault();
      set(current + moves[event.key]!);
    } else if (event.key === "Home") set(min);
    else if (event.key === "End") set(max);
  };
  return (
    <div ref={box} data-slot="resizable" data-orientation={orientation} className={cn("flex overflow-hidden rounded-lg border border-border", horizontal ? "flex-row" : "flex-col", className)}>
      <div className="min-h-0 min-w-0 overflow-auto" style={{ flexBasis: `${current}%` }}>
        {start}
      </div>
      <div
        role="separator"
        tabIndex={0}
        aria-label={label}
        aria-orientation={horizontal ? "vertical" : "horizontal"}
        aria-valuenow={current}
        aria-valuemin={min}
        aria-valuemax={max}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
        className={cn(
          "group relative flex shrink-0 touch-none items-center justify-center bg-border outline-none focus-visible:bg-ring",
          horizontal ? "w-px cursor-col-resize" : "h-px cursor-row-resize",
        )}
      >
        <span className={cn("absolute z-10 rounded-full border border-border bg-background shadow-xs transition-colors group-hover:border-foreground/40 group-focus-visible:border-ring", horizontal ? "h-8 w-2" : "h-2 w-8")} />
        <span className={cn("absolute", horizontal ? "inset-y-0 -inset-x-2" : "inset-x-0 -inset-y-2")} />
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">{end}</div>
    </div>
  );
}
