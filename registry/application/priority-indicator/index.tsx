"use client";

import type { ComponentProps, ReactElement } from "react";

import { IconChevronDown } from "@rhs-ui/icons";
import { PRIORITIES, PRIORITY_WORDS, PriorityGlyph, type Priority } from "@rhs-ui/application/priority-indicator/glyph";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { AS_CHILD } from "@rhs-ui/primitives/render-prop";
import { cn } from "@/lib/utils";

export interface PriorityIndicatorProps extends Omit<ComponentProps<"span">, "children"> {
  /** The level: "urgent", "high", "medium", "low" or "none". */
  priority: Priority;
  /** Write the word next to the mark. Turn it off in a narrow column; the word then sits in a tooltip and in the text a screen reader reads. Default true. */
  showLabel?: boolean;
  /** "sm" draws the mark at 14px beside 12px type, "md" at 16px beside 14px, "lg" at 20px beside 16px. Default "md". */
  size?: "sm" | "md" | "lg";
  /** Make it a button that opens the five levels. Pressing one calls `onPriorityChange`; the mark follows `priority`, so the value stays yours. */
  editable?: boolean;
  /** The level that was chosen from the menu. */
  onPriorityChange?: (priority: Priority) => void;
  /** Other words for the levels, for translation or your own voice. */
  labels?: Partial<Record<Priority, string>>;
  /** The word a screen reader hears before the level: "Priority: High". Default "Priority". */
  label?: string;
  /** The heading of the menu. Default "Set priority". */
  menuLabel?: string;
}

const SIZE = {
  sm: { glyph: 14, text: "text-xs", gap: "gap-1.5" },
  md: { glyph: 16, text: "text-sm", gap: "gap-2" },
  lg: { glyph: 20, text: "text-base", gap: "gap-2.5" },
} as const;

const isPriority = (value: string): value is Priority => (PRIORITIES as readonly string[]).includes(value);

/**
 * How urgent something is, as a drawn mark and a word: three ascending bars
 * for low, medium and high, a filled square with an exclamation mark for
 * urgent, three dashes for none. Each level has a shape of its own, so it
 * reads in monochrome and without colour vision, and the word is real text.
 * The mark sits on a 16 unit grid and was checked at 14, 16 and 20px. With
 * `showLabel` off it shrinks to the mark, the word moves into a tooltip and
 * into the text a screen reader hears. With `editable` it becomes a button
 * that opens a menu of the five levels (arrow keys, typing to jump, Escape to
 * close), so one component serves the read-only cell and the one you click.
 */
export function PriorityIndicator({ priority, showLabel = true, size = "md", editable = false, onPriorityChange, labels, label = "Priority", menuLabel = "Set priority", className, ...props }: PriorityIndicatorProps) {
  const words = { ...PRIORITY_WORDS, ...labels };
  const word = words[priority];
  const look = SIZE[size];
  const quiet = priority === "none";
  // "No priority" says what it is by itself; the others need the noun, "Priority: High", when the word stands alone in a cell.
  const noun = quiet ? "" : `${label}: `;

  const content = (
    <>
      <PriorityGlyph priority={priority} size={look.glyph} className={quiet ? "text-muted-foreground" : "text-foreground"} />
      {showLabel ? (
        <span className={cn("leading-none tabular-nums", look.text, quiet ? "text-muted-foreground" : priority === "urgent" ? "font-semibold text-foreground" : "text-foreground")}>
          <span className="sr-only">{noun}</span>
          {word}
        </span>
      ) : (
        <span className="sr-only">{`${noun}${word}`}</span>
      )}
    </>
  );

  // The mark alone has no word on show, so hovering it says which level it is.
  const tip = (element: ReactElement) =>
    showLabel ? (
      element
    ) : (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger {...AS_CHILD}>{element}</TooltipTrigger>
          <TooltipContent>{word}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

  if (!editable) {
    return tip(
      <span data-slot="priority-indicator" data-priority={priority} className={cn("inline-flex items-center", look.gap, className)} {...props}>
        {content}
      </span>,
    );
  }

  return (
    <DropdownMenu>
      {tip(
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-slot="priority-indicator"
            data-priority={priority}
            data-editable="true"
            className={cn(
              "group/priority -mx-1.5 inline-flex items-center rounded-md px-1.5 py-1 transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=open]:bg-muted motion-reduce:transition-none",
              look.gap,
              className,
            )}
            {...(props as ComponentProps<"button">)}
          >
            {content}
            <IconChevronDown aria-hidden="true" className="size-3 shrink-0 text-muted-foreground transition-transform duration-150 group-data-[state=open]/priority:rotate-180 motion-reduce:transition-none" />
          </button>
        </DropdownMenuTrigger>,
      )}
      <DropdownMenuContent align="start" className="min-w-44">
        <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={priority} onValueChange={(value) => isPriority(value) && onPriorityChange?.(value)}>
          {PRIORITIES.map((level) => (
            <DropdownMenuRadioItem key={level} value={level} className="gap-2.5">
              <PriorityGlyph priority={level} size={16} className={level === "none" ? "text-muted-foreground" : "text-foreground"} />
              {words[level]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
