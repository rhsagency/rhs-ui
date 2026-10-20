"use client";

import type { ComponentProps } from "react";

import { IconPlus } from "@rhs-ui/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export interface InsertBetweenButtonProps extends Omit<ComponentProps<"button">, "children" | "onClick" | "title" | "aria-label"> {
  /** Called with `index` when the gap is pressed. Insert your item there, then move focus to it. */
  onInsert: (index: number) => void;
  /** The position the new item takes in the list, from 0. The gap sits between the item now at `index - 1` and the one at `index`, so it is named "between `index` and `index + 1`" counting from 1. */
  index: number;
  /** What it does, shown in a tooltip: "Insert step here". A trailing "here" is replaced by the position in the accessible name: "Insert step between 2 and 3". */
  label?: string;
  /** The neighbours' own names for the accessible name, instead of their numbers: ["Welcome email", "Product tour"]. */
  between?: readonly [string, string];
  /** The direction of the line. `horizontal` (default) crosses a gap between stacked items; `vertical` sits between items in a row. */
  orientation?: "horizontal" | "vertical";
  /** Keep the line and the plus in view. They always are on touch screens, where there is no hover. */
  alwaysVisible?: boolean;
}

// The line and the plus come into view together: on hover, on keyboard focus, when pinned open, and always on a coarse pointer.
// These rules live on the button and reach down to its two parts; the parts only carry their hidden state.
const REVEAL = [
  "[&:is(:hover,:focus-visible,[data-visible=true])>[data-part]]:opacity-100",
  "[@media(pointer:coarse)]:[&>[data-part]]:opacity-100",
  "motion-safe:[&:is(:hover,:focus-visible,[data-visible=true])>[data-part=plus]]:scale-100",
  "motion-safe:[@media(pointer:coarse)]:[&>[data-part=plus]]:scale-100",
].join(" ");
const REVEAL_ACROSS = {
  horizontal: "motion-safe:[&:is(:hover,:focus-visible,[data-visible=true])>[data-part=line]]:scale-x-100 motion-safe:[@media(pointer:coarse)]:[&>[data-part=line]]:scale-x-100",
  vertical: "motion-safe:[&:is(:hover,:focus-visible,[data-visible=true])>[data-part=line]]:scale-y-100 motion-safe:[@media(pointer:coarse)]:[&>[data-part=line]]:scale-y-100",
} as const;

const LINE = "pointer-events-none absolute bg-[color-mix(in_oklch,var(--border),var(--foreground)_22%)] opacity-0 transition-[opacity,scale] duration-200 motion-reduce:transition-opacity";
const LINE_ACROSS = {
  horizontal: "inset-x-0 top-1/2 h-px -translate-y-1/2 motion-safe:scale-x-0",
  vertical: "inset-y-0 left-1/2 w-px -translate-x-1/2 motion-safe:scale-y-0",
} as const;
const PLUS = [
  "relative grid size-6 place-items-center rounded-full border border-border bg-background text-muted-foreground opacity-0 shadow-xs motion-safe:scale-50",
  "transition-[opacity,scale,background-color,border-color,color,box-shadow] duration-200 motion-reduce:transition-[opacity,background-color,border-color,color,box-shadow]",
  "hover:border-foreground hover:bg-foreground hover:text-background",
  "group-focus-visible/insert:border-ring group-focus-visible/insert:ring-[3px] group-focus-visible/insert:ring-ring/40",
].join(" ");

/**
 * The plus between two items that adds one right there: for builders, step
 * lists, timelines and form editors where a new item goes in the middle, not
 * only at the end. It is a hairline across the gap with a small round button
 * in the middle that grows into view on hover and on keyboard focus, and stays
 * in view on touch screens. The whole gap is the hit target, so the plus is
 * easy to reach, and the button is a real tab stop named by its position
 * ("Insert step between 2 and 3"). Under reduced motion the reveal is a plain
 * fade.
 */
export function InsertBetweenButton({ onInsert, index, label = "Insert here", between, orientation = "horizontal", alwaysVisible = false, className, ...props }: InsertBetweenButtonProps) {
  const horizontal = orientation === "horizontal";
  const [before, after] = between ?? [String(index), String(index + 1)];
  const action = label.replace(/\s*\bhere\b\s*$/i, "").trim() || "Insert";
  return (
    <TooltipProvider delayDuration={500}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            data-slot="insert-between-button"
            data-orientation={orientation}
            data-visible={alwaysVisible || undefined}
            type="button"
            aria-label={`${action} between ${before} and ${after}`}
            onClick={() => onInsert(index)}
            className={cn(
              "group/insert relative flex shrink-0 cursor-pointer items-center justify-center outline-none",
              horizontal ? "h-8 w-full" : "min-h-12 w-8 self-stretch",
              REVEAL,
              REVEAL_ACROSS[orientation],
              className,
            )}
            {...props}
          >
            <span data-part="line" aria-hidden="true" className={cn(LINE, LINE_ACROSS[orientation])} />
            <span data-part="plus" aria-hidden="true" className={PLUS}>
              <IconPlus className="size-3.5" />
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side={horizontal ? "top" : "right"}>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
