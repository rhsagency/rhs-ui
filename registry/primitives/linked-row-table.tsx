"use client";

import type { ComponentProps, MouseEvent, ReactNode } from "react";

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export interface LinkedRowColumn<Row> {
  /** Names the column, and reads the value from each row when there is no `cell`: `key: "name"` reads `row.name`. Unique in the table. */
  key: string;
  /** The header: text, or an element. */
  header: ReactNode;
  /** Which side the column's text sits on. Default "left". */
  align?: "left" | "right" | "center";
  /** Draws the cell, when the value is not what should show: a badge, a date, an avatar with a name. Without it the value is written as text. */
  cell?: (row: Row) => ReactNode;
  /** The cell holds buttons, checkboxes or a menu. Its content sits above the stretched link, so a press on it never navigates. */
  interactive?: boolean;
  /** Classes for the cells of the column and its header: a width, `font-mono`, `whitespace-nowrap`. */
  className?: string;
}

export interface LinkedRowTableProps<Row> extends Omit<ComponentProps<"table">, "children" | "className"> {
  /** Classes for the box that carries `data-slot` and holds the table: a width, a margin, `max-w-3xl`. The other props (`aria-label`, `id`, `style`) go to the `<table>`. */
  className?: string;
  /** Classes for the `<table>` itself: `table-fixed`, `min-w-[40rem]`. */
  tableClassName?: string;
  /** The columns, in order. */
  columns: readonly LinkedRowColumn<Row>[];
  /** The data, one object per row. */
  rows: readonly Row[];
  /** The address of the page a row opens. It becomes the `href` of a real anchor, so it can be opened in a new tab and copied. */
  getRowHref: (row: Row) => string;
  /** The `key` of the column whose cell holds the link. Make it the column with the row's name: that text is what a screen reader hears as the link. */
  linkColumn: string;
  /** Called with the row when the link is followed with a plain click, instead of the browser loading the page: use it to route on the client. Cmd, Ctrl, Shift and middle clicks still open the address natively. */
  onRowClick?: (row: Row, event: MouseEvent<HTMLAnchorElement>) => void;
  /** A plain-text name for the link, for when the cell holds more than the name (an avatar and an email). Without it the link is named by the text of the cell. */
  getRowLabel?: (row: Row) => string;
  /** A key for each row that stays with the row. Default `row.id`, then the place in `rows`. */
  getRowId?: (row: Row, index: number) => string | number;
  /** What the table is, under it: "Projects". It names the table for assistive technology. */
  caption?: ReactNode;
  /** What shows in place of the rows when there are none. Default "Nothing to show". */
  empty?: ReactNode;
}

const ALIGN = { left: "", right: "text-right", center: "text-center" } as const;

// The link's ::after is stretched over the row, which is the nearest positioned ancestor (the row is `relative`), so the
// whole row is the pointer target while the page has exactly one link for it. The focus ring is drawn on that same
// layer, inset, so it wraps the row and the scroll box of the table does not clip it.
const LINK = cn(
  "font-medium text-foreground underline-offset-4 outline-none",
  "after:absolute after:inset-0 after:content-['']",
  "group-hover/row:underline",
  "focus-visible:after:ring-[3px] focus-visible:after:ring-inset focus-visible:after:ring-ring/50",
);

/**
 * A table whose rows open a page, done the way that works for everyone. The cell with the row's name holds one real
 * anchor, and that anchor's `::after` is stretched over the whole row: the pointer target is the row, middle-click and
 * Cmd or Ctrl-click open a new tab, the address can be copied, and a screen reader finds exactly one link per row, named
 * for the row ("Halcyon Labs", never "View"). Columns marked `interactive` (a checkbox, a menu, a button) sit above that
 * layer, so pressing them never navigates. The row takes a tint on hover and while anything in it has focus, and the
 * focus ring of the link wraps the full row. Pass `onRowClick` to route on the client; a modified click still opens the
 * address in the browser. Text in the row cannot be selected with the pointer, which is the price of a whole-row target.
 */
export function LinkedRowTable<Row>({ columns, rows, getRowHref, linkColumn, onRowClick, getRowLabel, getRowId, caption, empty = "Nothing to show", className, tableClassName, ...props }: LinkedRowTableProps<Row>) {
  const read = (row: Row, column: LinkedRowColumn<Row>): ReactNode => {
    if (column.cell) return column.cell(row);
    const value = (row as Record<string, unknown>)[column.key];
    return value === null || value === undefined ? "" : String(value);
  };

  return (
    <div data-slot="linked-row-table" className={cn("min-w-0", className)}>
      <Table className={tableClassName} {...props}>
        {caption ? <TableCaption>{caption}</TableCaption> : null}
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} scope="col" className={cn(ALIGN[column.align ?? "left"], column.className)}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={Math.max(1, columns.length)} className="h-24 text-center text-muted-foreground">
                {empty}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={getRowId ? getRowId(row, index) : ((row as { id?: string | number }).id ?? index)} className="group/row relative cursor-pointer focus-within:bg-muted/50">
                {columns.map((column) => {
                  const content = read(row, column);
                  return (
                    <TableCell key={column.key} className={cn(ALIGN[column.align ?? "left"], column.className)}>
                      {column.key === linkColumn ? (
                        <a
                          href={getRowHref(row)}
                          aria-label={getRowLabel?.(row)}
                          className={LINK}
                          onClick={(event) => {
                            // A modified or middle click is the browser's: it opens the address where the person asked.
                            if (!onRowClick || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                            event.preventDefault();
                            onRowClick(row, event);
                          }}
                        >
                          {content}
                        </a>
                      ) : column.interactive ? (
                        // A box of its own that is only as wide as its controls (so the rest of the cell still opens the row), centred in the cell like the text beside it: inline, a checkbox would sit on the text baseline.
                        <span className={cn("relative z-10 flex w-fit items-center gap-1", column.align === "right" && "ms-auto", column.align === "center" && "mx-auto")}>{content}</span>
                      ) : (
                        content
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
