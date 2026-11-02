"use client";

import { useRef, useState, type ComponentProps, type KeyboardEvent } from "react";

import { movePosition, POSITIONS, positionLabel, type ArrowKey, type Position } from "@rhs-ui/primitives/position-picker/positions";
import { cn } from "@/lib/utils";

export type { Position } from "@rhs-ui/primitives/position-picker/positions";

export interface PositionPickerProps extends Omit<ComponentProps<"div">, "value" | "defaultValue" | "onChange" | "children"> {
  /** The place, from `top-left` to `bottom-right`, when you control it. */
  value?: Position;
  /** The place to start with, when you do not control it. Default: the center if it is on offer, otherwise the first place. */
  defaultValue?: Position;
  /** Called with the place whenever the choice changes. */
  onValueChange?: (value: Position) => void;
  /** What is being placed, for the name of the group: "Watermark position". The group is named with the choice as well ("Watermark position: Top right"). Default "Position". */
  label?: string;
  /** The places that can be chosen, to limit the picker to a subset such as the four corners. The others are drawn as faint dots and cannot be reached. Default all nine. */
  positions?: readonly Position[];
  /** `sm` (112px wide), `default` (128px) or `lg` (160px). */
  size?: "sm" | "default" | "lg";
  /** Show the choice in words under the frame ("Top right"). Default true. */
  showValue?: boolean;
  /** The field's name for a plain form submit: the place goes out as "top-right" in a hidden input. */
  name?: string;
  /** Turn the whole picker off. */
  disabled?: boolean;
}

const FRAME = { sm: "w-28", default: "w-32", lg: "w-40" } as const;
const DOT = { sm: "size-2.5", default: "size-3", lg: "size-3.5" } as const;
const DOT_ON = { sm: "size-3", default: "size-3.5", lg: "size-4" } as const;

// Each dot sits toward its own edge or corner of its cell, so the nine of them read as the places on a surface.
const ROW = ["items-start", "items-center", "items-end"] as const;
const COLUMN = ["justify-items-start", "justify-items-center", "justify-items-end"] as const;

const ARROWS: readonly string[] = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];

/**
 * Picks where something sits: an image anchor, a watermark corner, the place
 * of a toast. Nine places in a thin frame that reads as a small version of the
 * surface; the chosen one is a filled dot and the others are hollow. It is a
 * radio group in two dimensions: the arrow keys move along the row and down the
 * column, going round the edge and passing over any place that cannot be
 * chosen, and the group is named with the choice in words ("Watermark
 * position: Top right"). `positions` limits the choice to a subset, such as the
 * four corners.
 */
export function PositionPicker({
  value,
  defaultValue,
  onValueChange,
  label = "Position",
  positions = POSITIONS,
  size = "default",
  showValue = true,
  name,
  disabled,
  className,
  ...props
}: PositionPickerProps) {
  const group = useRef<HTMLDivElement>(null);
  const offered = POSITIONS.filter((position) => positions.includes(position));
  const [own, setOwn] = useState<Position>(() => defaultValue ?? (offered.includes("center") ? "center" : (offered[0] ?? "center")));
  const current = value ?? own;
  // The one place Tab goes to: the chosen one, or the first that can be chosen when the choice is not one of those on offer.
  const stop = offered.includes(current) ? current : offered[0];

  function select(position: Position, focus: boolean) {
    if (value === undefined) setOwn(position);
    if (position !== current) onValueChange?.(position);
    if (focus) group.current?.querySelector<HTMLButtonElement>(`[data-position="${position}"]`)?.focus();
  }

  function keyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    const from = (event.target as HTMLElement).closest<HTMLElement>("[data-position]")?.dataset.position as Position | undefined;
    let next: Position | null | undefined;
    if (ARROWS.includes(event.key)) next = from ? movePosition(from, event.key as ArrowKey, offered) : undefined;
    else if (event.key === "Home") next = offered[0];
    else if (event.key === "End") next = offered[offered.length - 1];
    else return;
    event.preventDefault();
    if (next) select(next, true);
  }

  return (
    <div data-slot="position-picker" className={cn("grid w-fit justify-items-center gap-2.5", className)} {...props}>
      <div
        ref={group}
        role="radiogroup"
        aria-label={`${label}: ${positionLabel(current)}`}
        aria-disabled={disabled || undefined}
        onKeyDown={keyDown}
        className={cn(
          "grid aspect-[4/3] grid-cols-3 grid-rows-3 rounded-md border border-border bg-muted/40 p-1 shadow-xs",
          FRAME[size],
          disabled && "opacity-50",
        )}
      >
        {POSITIONS.map((position, index) => {
          const placement = cn("grid p-1.5", ROW[Math.floor(index / 3)], COLUMN[index % 3]);
          if (!offered.includes(position)) {
            // Not on offer: a faint dot keeps the lattice readable, and nothing can reach it.
            return (
              <span key={position} aria-hidden="true" className={placement}>
                <span className="size-1 rounded-full bg-muted-foreground/25" />
              </span>
            );
          }
          const selected = position === current;
          return (
            <button
              key={position}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={positionLabel(position)}
              data-position={position}
              tabIndex={position === stop ? 0 : -1}
              disabled={disabled}
              onClick={() => select(position, false)}
              className={cn(
                "group/cell rounded-sm outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/50 enabled:hover:bg-foreground/5 disabled:cursor-not-allowed motion-reduce:transition-none",
                placement,
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "block rounded-full transition-[width,height,background-color,border-color] duration-150 motion-reduce:transition-none",
                  selected ? cn("bg-foreground", DOT_ON[size]) : cn("border-2 border-muted-foreground/60 bg-background group-hover/cell:border-foreground", DOT[size]),
                )}
              />
            </button>
          );
        })}
      </div>
      {showValue ? (
        <p aria-hidden="true" className="text-xs font-medium text-muted-foreground">
          {positionLabel(current)}
        </p>
      ) : null}
      {name ? <input type="hidden" name={name} value={current} disabled={disabled} /> : null}
    </div>
  );
}
