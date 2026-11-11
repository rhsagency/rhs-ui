"use client";

import { useId, type ComponentProps } from "react";

import { IconArrowDown, IconArrowUp, IconChevronsUpDown, IconClose, IconEyeOff, IconPushpin, IconSidebar, IconSidebarRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rhs-ui/primitives/dropdown-menu";
import { TableHead, type TableSort } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

/** The side a column is pinned to. */
export type ColumnPin = "left" | "right";

/** The words the menu says on its own, for another language or your own wording. */
export interface ColumnHeaderMenuLabels {
  /** The first sort choice. Default "Sort ascending". */
  sortAscending: string;
  /** The second sort choice. Default "Sort descending". */
  sortDescending: string;
  /** The item that removes the sort. Default "Clear sort". */
  clearSort: string;
  /** The item that hides the column. Default "Hide column". */
  hide: string;
  /** Pins the column to the left edge. Default "Pin left". */
  pinLeft: string;
  /** Pins the column to the right edge. Default "Pin right". */
  pinRight: string;
  /** The name of the group of sort choices, read when a screen reader enters it. Default "Sort". */
  sort: string;
  /** Read after the name of the button while the column is sorted ascending. Default "Sorted ascending". */
  sortedAscending: string;
  /** Read after the name of the button while the column is sorted descending. Default "Sorted descending". */
  sortedDescending: string;
  /** Read after the name of the button while the column is pinned left. Default "Pinned left". */
  pinnedLeft: string;
  /** Read after the name of the button while the column is pinned right. Default "Pinned right". */
  pinnedRight: string;
}

export interface ColumnHeaderMenuProps extends Omit<ComponentProps<"th">, "children" | "align"> {
  /** The name of the column, as the header shows it. */
  label: string;
  /** How the table is sorted by this column right now. It sets `aria-sort` on the header cell, never on the button. Default "none". */
  sort?: TableSort;
  /** Called with the sort the person chose: "ascending", "descending" or "none" for Clear sort. Without it the three sort items are left out. */
  onSortChange?: (sort: TableSort) => void;
  /** Called when Hide column is chosen. Without it the item is left out. Move the focus somewhere sensible when the column goes: this button is gone with it. */
  onHide?: () => void;
  /** Which edge the column is pinned to, or null. */
  pinned?: ColumnPin | null;
  /** Called with the edge the person chose, or null when the column was pinned there already and the item is chosen again. Without it the two pin items are left out. */
  onPinChange?: (pinned: ColumnPin | null) => void;
  /** Which side the label sits on. Numbers read best on the right. Default "left". */
  align?: "left" | "right";
  /** The words the menu says, for translation. */
  labels?: Partial<ColumnHeaderMenuLabels>;
}

const DEFAULT_LABELS = {
  sortAscending: "Sort ascending",
  sortDescending: "Sort descending",
  clearSort: "Clear sort",
  hide: "Hide column",
  pinLeft: "Pin left",
  pinRight: "Pin right",
  sort: "Sort",
  sortedAscending: "Sorted ascending",
  sortedDescending: "Sorted descending",
  pinnedLeft: "Pinned left",
  pinnedRight: "Pinned right",
} satisfies ColumnHeaderMenuLabels;

/**
 * The header cell of a column that offers more than one action. A button with the column's name and a sort glyph opens
 * a menu: sort ascending or descending as a choice of one (a screen reader hears "Sort ascending, checked"), clear the
 * sort, hide the column, pin it left or right. Each group is there only when you pass its callback, so a column that
 * can only be hidden shows one item. The component renders the header cell itself, so `aria-sort` sits on the `th`
 * where it belongs, and only while the column is sorted; the button never carries it. The sort and the pin are read
 * after the name of the button ("Customer, Sorted ascending"). For a column that only sorts, the plain sort header of
 * the Table is enough.
 */
export function ColumnHeaderMenu({ label, sort = "none", onSortChange, onHide, pinned = null, onPinChange, align = "left", labels, className, ...props }: ColumnHeaderMenuProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const noteId = useId();
  const sorted = sort !== "none";
  const hasMenu = Boolean(onSortChange || onHide || onPinChange);
  const SortGlyph = sort === "ascending" ? IconArrowUp : sort === "descending" ? IconArrowDown : IconChevronsUpDown;
  const note = [
    sort === "ascending" ? words.sortedAscending : sort === "descending" ? words.sortedDescending : "",
    pinned === "left" ? words.pinnedLeft : pinned === "right" ? words.pinnedRight : "",
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <TableHead
      data-slot="column-header-menu"
      scope="col"
      aria-sort={sorted ? sort : undefined}
      className={cn(align === "right" && "text-right", className)}
      {...props}
    >
      {hasMenu ? (
        // Not modal: a table is full of these buttons, and one press on the next header should open that menu, not only close this one.
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-describedby={note ? noteId : undefined}
              data-sorted={sorted || undefined}
              className="-mx-2 max-w-[calc(100%+1rem)] px-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[sorted]:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
            >
              <span className="min-w-0 truncate">{label}</span>
              <SortGlyph aria-hidden="true" className={cn("shrink-0", sorted ? "text-foreground" : "text-muted-foreground/70")} />
              {pinned ? <IconPushpin aria-hidden="true" className="size-3 shrink-0 text-muted-foreground" /> : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={align === "right" ? "end" : "start"} className="min-w-48">
            {onSortChange ? (
              <>
                <DropdownMenuRadioGroup aria-label={words.sort} value={sorted ? sort : ""} onValueChange={(next) => onSortChange(next === "descending" ? "descending" : "ascending")}>
                  <DropdownMenuRadioItem value="ascending">
                    <IconArrowUp />
                    {words.sortAscending}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="descending">
                    <IconArrowDown />
                    {words.sortDescending}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuItem inset disabled={!sorted} onSelect={() => onSortChange("none")}>
                  <IconClose />
                  {words.clearSort}
                </DropdownMenuItem>
              </>
            ) : null}
            {onHide ? (
              <>
                {onSortChange ? <DropdownMenuSeparator /> : null}
                <DropdownMenuItem inset onSelect={() => onHide()}>
                  <IconEyeOff />
                  {words.hide}
                </DropdownMenuItem>
              </>
            ) : null}
            {onPinChange ? (
              <>
                {onSortChange || onHide ? <DropdownMenuSeparator /> : null}
                <DropdownMenuCheckboxItem checked={pinned === "left"} onCheckedChange={(checked) => onPinChange(checked ? "left" : null)}>
                  <IconSidebar />
                  {words.pinLeft}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={pinned === "right"} onCheckedChange={(checked) => onPinChange(checked ? "right" : null)}>
                  <IconSidebarRight />
                  {words.pinRight}
                </DropdownMenuCheckboxItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span className="inline-flex h-8 items-center gap-1.5">
          {label}
          {sorted ? <SortGlyph aria-hidden="true" className="shrink-0 text-foreground" /> : null}
        </span>
      )}
      {hasMenu && note ? (
        // Hidden, not sr-only: it describes the button, and must stay out of the header's own text, where the aria-sort already says it.
        <span id={noteId} hidden>
          {note}
        </span>
      ) : null}
    </TableHead>
  );
}
