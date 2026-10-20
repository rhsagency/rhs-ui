"use client";

import { useId, useState, type ComponentProps } from "react";

import { IconChevronDown } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

export type BulkSelectState = "none" | "some" | "all";

export interface BulkSelectCriterion {
  /** Identity of the criterion. */
  id: string;
  /** What it selects, in a word or two: "Unread", "Starred". */
  label: string;
  /** Runs when it is chosen. Select the matching rows in your own state. */
  onSelect: () => void;
  /** How many rows it would select. Shown next to the label, and an empty criterion is disabled. */
  count?: number;
}

export interface BulkSelectMenuProps extends Omit<ComponentProps<"div">, "children"> {
  /** How much of the list is selected: nothing, some of it, or all of it. */
  state: BulkSelectState;
  /** Select every row. Runs from the checkbox when nothing is selected, and from the "All" item. */
  onSelectAll: () => void;
  /** Clear the selection. Runs from the checkbox when some or all rows are selected, and from the "None" item. */
  onSelectNone: () => void;
  /** More ways to choose rows, each with the number it would select. */
  criteria?: readonly BulkSelectCriterion[];
  /** How many rows there are. Shown next to "All" and in the count. */
  total?: number;
  /** How many rows are selected now, for the count beside the checkbox. */
  selectedCount?: number;
  /** Language of the numbers. Default "en-US". */
  locale?: string;
  /** The checkbox's accessible name. Default "Select all". */
  label?: string;
  /** The chevron's accessible name. Default "Choose what to select". */
  menuLabel?: string;
  /** Show "12 of 248 selected" beside the control. Default true. */
  showCount?: boolean;
  /** The height: 32 or 36px. */
  size?: "sm" | "default";
  /** Turns the checkbox and the menu off, for a list that is loading or has no rows. */
  disabled?: boolean;
}

/**
 * The select-all control of an inbox, a table or a file list: a checkbox that
 * toggles between all and none and shows a dash while only some rows are
 * chosen, joined to a chevron whose menu offers other ways to choose (All,
 * None, Unread, Starred) with the number each would select. A count in words
 * sits beside it ("12 of 248 selected"), and after every choice a polite
 * message says what was selected. The menu is a real menu: arrow keys move,
 * typing jumps to an item and Escape closes it.
 */
export function BulkSelectMenu({
  state,
  onSelectAll,
  onSelectNone,
  criteria = [],
  total,
  selectedCount,
  locale = "en-US",
  label = "Select all",
  menuLabel = "Choose what to select",
  showCount = true,
  size = "default",
  disabled = false,
  className,
  ...props
}: BulkSelectMenuProps) {
  const id = useId();
  // The key changes with every message, so a repeated one ("12 selected" twice) is read out again.
  const [note, setNote] = useState({ text: "", turn: 0 });
  const say = (text: string) => setNote((previous) => ({ text, turn: previous.turn + 1 }));
  const numbers = new Intl.NumberFormat(locale);
  const format = (value: number) => numbers.format(value);

  const selected = selectedCount ?? (state === "all" ? total : state === "none" ? 0 : undefined);
  const everything = state === "all" && total !== undefined && selected === total;

  function selectAll() {
    onSelectAll();
    say(total === undefined ? "All selected" : `All ${format(total)} selected`);
  }

  function selectNone() {
    onSelectNone();
    say("Selection cleared");
  }

  function choose(criterion: BulkSelectCriterion) {
    criterion.onSelect();
    say(criterion.count === undefined ? `${criterion.label} selected` : `${format(criterion.count)} selected`);
  }

  const itemClass = "justify-between gap-6";
  const countClass = "text-xs text-muted-foreground tabular-nums";

  return (
    <div data-slot="bulk-select-menu" className={cn("inline-flex items-center gap-3", className)} {...props}>
      <div role="group" aria-label="Selection" className={cn("inline-flex items-stretch rounded-md border border-border bg-background shadow-xs", size === "sm" ? "h-8" : "h-9")}>
        <label htmlFor={`${id}-checkbox`} className={cn("grid cursor-pointer place-items-center rounded-l-[5px] transition-colors duration-150 hover:bg-muted/60 has-disabled:cursor-not-allowed has-disabled:hover:bg-transparent", size === "sm" ? "w-8" : "w-9")}>
          <span className="sr-only">{label}</span>
          <Checkbox
            id={`${id}-checkbox`}
            disabled={disabled}
            checked={state === "all" ? true : state === "some" ? "indeterminate" : false}
            onCheckedChange={() => (state === "none" ? selectAll() : selectNone())}
          />
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              disabled={disabled}
              aria-label={menuLabel}
              className="h-auto w-8 self-stretch rounded-none rounded-r-[5px] border-0 border-l border-border px-0 text-muted-foreground hover:text-foreground focus-visible:ring-inset data-[state=open]:bg-muted data-[state=open]:text-foreground active:not-disabled:translate-y-0"
            >
              <IconChevronDown size={14} className="transition-transform duration-200 group-data-[state=open]/button:rotate-180 motion-reduce:transition-none" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-52">
            <DropdownMenuItem textValue="All" disabled={total === 0} className={itemClass} onSelect={selectAll}>
              <span>All</span>
              {total === undefined ? null : (
                <>
                  <span className="sr-only">,</span>
                  <span className={countClass}>{format(total)}</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem textValue="None" className={itemClass} onSelect={selectNone}>
              <span>None</span>
            </DropdownMenuItem>
            {criteria.length ? <DropdownMenuSeparator /> : null}
            {criteria.map((criterion) => (
              <DropdownMenuItem key={criterion.id} textValue={criterion.label} disabled={criterion.count === 0} className={itemClass} onSelect={() => choose(criterion)}>
                <span>{criterion.label}</span>
                {criterion.count === undefined ? null : (
                  <>
                    <span className="sr-only">,</span>
                    <span className={countClass}>{format(criterion.count)}</span>
                  </>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {showCount && selected !== undefined && selected > 0 ? (
        <p className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
          {everything ? (
            <>
              <span className="font-medium text-foreground">All {format(selected)}</span> selected
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">{format(selected)}</span>
              {total === undefined ? "" : ` of ${format(total)}`} selected
            </>
          )}
        </p>
      ) : null}
      <span role="status" className="sr-only">
        <span key={note.turn}>{note.text}</span>
      </span>
    </div>
  );
}
