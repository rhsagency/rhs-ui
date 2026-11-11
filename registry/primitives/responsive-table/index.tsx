import type { ComponentProps, ReactNode } from "react";

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export interface ResponsiveColumn<Row> {
  /** Names the column, and reads the cell from `row[key]` when there is no `cell`. Unique in the table. */
  key: string;
  /** The heading of the column, as plain text: as a card it is also the label in front of the value. */
  header: string;
  /** Draws the cell, when the value is not what should show: a badge, a formatted amount. */
  cell?: (row: Row) => ReactNode;
  /** Which side the figures sit on in the table. Numbers read best on the right. In a card every value is on the right. Default "left". */
  align?: "left" | "right";
  /** How much the column matters: 1 always shows, 2 drops out of the table below 48rem, 3 below 60rem. In a card they all show. Default 1. */
  priority?: 1 | 2 | 3;
  /** Classes for the cells of the column and its header: a width, `font-mono`, `tabular-nums`. */
  className?: string;
}

export interface ResponsiveTableProps<Row> extends Omit<ComponentProps<"table">, "children"> {
  /** The columns, in order. */
  columns: readonly ResponsiveColumn<Row>[];
  /** The data, one object per row. */
  rows: readonly Row[];
  /** A key for each row. Default `row.id`, then the place in `rows`. */
  getRowId?: (row: Row, index: number) => string;
  /** The `key` of the column that names the row. It becomes the title of the card and the row header for assistive technology. Default the first column. */
  primary?: string;
  /** Where a row leads. The name of the row becomes a link, and as a card the whole card is the link. Put any other control inside a card on its own stacking level (`relative z-10`). */
  getRowHref?: (row: Row) => string | undefined;
  /** What the table is, under it: "Orders from October". It names the table for assistive technology. */
  caption?: ReactNode;
  /** What shows in place of the rows when there are none. */
  empty?: ReactNode;
}

// Under 40rem of its own width each row is a card. The container query reads the width of the box the table sits in, not the window, so a sidebar, a dialog and a page behave alike.
const STACKED_TABLE = "@max-[40rem]:grid";
const STACKED_HEAD = "@max-[40rem]:sr-only";
const STACKED_BODY = "@max-[40rem]:grid @max-[40rem]:gap-3 @max-[40rem]:[&_tr:last-child]:border";
const STACKED_ROW = "@max-[40rem]:relative @max-[40rem]:grid @max-[40rem]:rounded-xl @max-[40rem]:border @max-[40rem]:bg-card @max-[40rem]:px-4 @max-[40rem]:py-3 @max-[40rem]:shadow-xs";
// The label in front of a value is drawn from data-label in CSS, so the markup is the table's own and exists once.
const STACKED_CELL =
  "@max-[40rem]:flex @max-[40rem]:h-auto! @max-[40rem]:items-baseline @max-[40rem]:justify-between @max-[40rem]:gap-4 @max-[40rem]:px-0 @max-[40rem]:py-1.5! @max-[40rem]:text-right @max-[40rem]:before:shrink-0 @max-[40rem]:before:text-left @max-[40rem]:before:text-xs @max-[40rem]:before:text-muted-foreground @max-[40rem]:before:content-[attr(data-label)]";
const STACKED_TITLE =
  "@max-[40rem]:mb-1.5 @max-[40rem]:justify-start @max-[40rem]:border-b @max-[40rem]:border-border @max-[40rem]:pt-0! @max-[40rem]:pb-2.5! @max-[40rem]:text-left @max-[40rem]:text-base @max-[40rem]:before:hidden";

// Between a card and a wide table the columns that matter least step aside. The range starts just above the card width so the two never apply at once.
const PRIORITY = { 1: "", 2: "@min-[40.01rem]:@max-[48rem]:hidden", 3: "@min-[40.01rem]:@max-[60rem]:hidden" } as const;
const ALIGN = { left: "", right: "text-right" } as const;

/**
 * A table that becomes a list of cards when its box is narrow, with one set of markup. Wider than 40rem it is the RHS UI
 * Table: columns marked priority 2 or 3 step aside as the box narrows, so a tablet keeps the figures that matter. Narrower
 * than that every row is a card whose title is the primary column and whose other values each carry their column heading
 * as a label, drawn from `data-label` in CSS. The table roles are written out (table, rowgroup, row, columnheader,
 * rowheader, cell), because a display change drops the native ones in some browsers, so a screen reader still hears a
 * table with headings in either layout. The switch is a container query on the table's own box, and `getRowHref` turns the
 * name of a row into a link, or the whole card in the card layout. Place it in a box that has a width: a flex item needs
 * `w-full` or `min-w-0`.
 */
export function ResponsiveTable<Row>({ columns, rows, getRowId, primary, getRowHref, caption, empty, className, ...props }: ResponsiveTableProps<Row>) {
  const primaryKey = primary ?? columns[0]?.key;
  return (
    <div data-slot="responsive-table" className="@container w-full min-w-0">
      <Table role="table" className={cn(STACKED_TABLE, className)} {...props}>
        {caption ? <TableCaption className="text-left @max-[40rem]:order-last">{caption}</TableCaption> : null}
        <TableHeader role="rowgroup" className={STACKED_HEAD}>
          <TableRow role="row">
            {columns.map((column) => (
              <TableHead key={column.key} role="columnheader" scope="col" className={cn(ALIGN[column.align ?? "left"], PRIORITY[column.priority ?? 1], column.className)}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody role="rowgroup" className={STACKED_BODY}>
          {rows.length === 0 ? (
            <TableRow role="row" className={STACKED_ROW}>
              <TableCell role="cell" colSpan={columns.length} data-density-skip className="h-24 text-center text-muted-foreground @max-[40rem]:justify-center @max-[40rem]:text-center">
                {empty ?? "No rows to show"}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => {
              const href = getRowHref?.(row);
              return (
                <TableRow key={getRowId ? getRowId(row, index) : String((row as { id?: string | number }).id ?? index)} role="row" className={STACKED_ROW}>
                  {columns.map((column) => {
                    const isPrimary = column.key === primaryKey;
                    const value = column.cell ? column.cell(row) : String((row as Record<string, unknown>)[column.key] ?? "");
                    return (
                      <TableCell
                        key={column.key}
                        role={isPrimary ? "rowheader" : "cell"}
                        data-label={column.header}
                        className={cn(STACKED_CELL, ALIGN[column.align ?? "left"], PRIORITY[column.priority ?? 1], isPrimary && cn("font-medium", STACKED_TITLE), column.className)}
                      >
                        {isPrimary && href ? (
                          <a
                            href={href}
                            className="rounded-sm outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40 @max-[40rem]:after:absolute @max-[40rem]:after:inset-0 @max-[40rem]:after:rounded-xl @max-[40rem]:focus-visible:ring-0 @max-[40rem]:focus-visible:after:ring-[3px] @max-[40rem]:focus-visible:after:ring-ring/40"
                          >
                            {value}
                          </a>
                        ) : (
                          value
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
