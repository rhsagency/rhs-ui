"use client";

import { useMemo, useState, type ComponentProps, type ReactNode } from "react";

import { isEmpty, nextSort, sortEntries, toNumber, toTime, type SortState, type SortType } from "@rhs-ui/primitives/sortable-table/sort";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export type { SortDirection, SortState, SortType } from "@rhs-ui/primitives/sortable-table/sort";

export interface SortableColumn<Row> {
  /** Names the column in `sort` and reads the value from each row when there is no `accessor`: `key: "amount"` reads `row.amount`. Unique in the table. */
  key: string;
  /** The header: text, or an element. */
  header: ReactNode;
  /** A plain-text name for the status line ("Sorted by Amount, descending"). Default the header when it is a string, otherwise the key. */
  label?: string;
  /** Which side the column's text sits on. Numbers read best on the right. Default "left". */
  align?: "left" | "right" | "center";
  /** How its values are compared: `text` (by the locale, numbers inside the text in natural order), `number`, or `date` (ISO strings, Dates or timestamps). `false` makes the column plain, with no sort button. Default "text". */
  sortType?: SortType | false;
  /** Reads the value a row is sorted by, when it is not `row[key]`. */
  accessor?: (row: Row) => unknown;
  /** Draws the cell, when the value is not what should show: a badge, a link, a formatted amount. Without it numbers and dates are written in the locale. */
  cell?: (row: Row) => ReactNode;
  /** Classes for the cells of the column and its header: a width, `font-mono`, `whitespace-nowrap`. */
  className?: string;
}

/** The words the table says on its own, for another language or your own wording. `{column}` and `{direction}` are filled in. */
export interface SortableTableLabels {
  /** The direction word in the status line. Default "ascending". */
  ascending: string;
  /** The direction word in the status line. Default "descending". */
  descending: string;
  /** What the status line says when a header is pressed. Default "Sorted by {column}, {direction}". */
  sorted: string;
  /** What it says when the third press turns sorting off. Default "Sorting removed. The rows are in their original order." */
  off: string;
  /** What a screen reader reads for an empty cell. Default "Empty". */
  empty: string;
  /** What shows when there are no rows. Default "No rows to show". */
  noRows: string;
}

export interface SortableTableProps<Row> extends Omit<ComponentProps<"table">, "children"> {
  /** The columns, in order. */
  columns: readonly SortableColumn<Row>[];
  /** The data, one object per row, in the order they should show when nothing is sorted. */
  rows: readonly Row[];
  /** A key for each row that stays with the row when it moves. Default `row.id`, then the place in `rows`, which still follows the row through a sort. */
  getRowId?: (row: Row, index: number) => string | number;
  /** The sort in force, when you control it: `{ key: "amount", direction: "descending" }`, or `null` for none. */
  sort?: SortState | null;
  /** The sort to start with, when you do not control it. */
  defaultSort?: SortState | null;
  /** Called with the new sort when a header is pressed: ascending, then descending, then `null`. */
  onSortChange?: (sort: SortState | null) => void;
  /** The locale that orders text and writes numbers and dates. Default "en-US". */
  locale?: string;
  /** The time zone dates are written in. Default "UTC", so the server and the browser agree. */
  timeZone?: string;
  /** What the table is, under it: "Invoices for October". It names the table for assistive technology. */
  caption?: ReactNode;
  /** What shows in place of the rows when there are none. */
  empty?: ReactNode;
  /** The words the table says, for translation. */
  labels?: Partial<SortableTableLabels>;
}

const DEFAULT_LABELS = {
  ascending: "ascending",
  descending: "descending",
  sorted: "Sorted by {column}, {direction}",
  off: "Sorting removed. The rows are in their original order.",
  empty: "Empty",
  noRows: "No rows to show",
} satisfies SortableTableLabels;

const ALIGN = { left: "", right: "text-right", center: "text-center" } as const;

/** The name of a column in a sentence. */
const nameOf = <Row,>(column: SortableColumn<Row>) => column.label ?? (typeof column.header === "string" ? column.header : column.key);

/**
 * A table driven by a list of columns, that sorts when a header is pressed. It is the RHS UI Table with a sort header for
 * every column that can sort: pressing it goes ascending, then descending, then off. Text is ordered by the locale (so
 * "file 2" comes before "file 10"), numbers and dates by value, an empty value is always last whichever way the column
 * goes, and rows that compare equal keep their order so nothing jumps. Only the sorted header carries `aria-sort`, a
 * polite line says what was done ("Sorted by Amount, descending"), and rows are keyed so that a control inside one keeps
 * focus as the row moves. It does one job: selection, filters and paging are separate. `cell` and `accessor` are
 * functions, so a table that uses them is rendered from a client component; with plain columns it takes plain data.
 */
export function SortableTable<Row>({ columns, rows, getRowId, sort, defaultSort = null, onSortChange, locale = "en-US", timeZone = "UTC", caption, empty, labels, className, ...props }: SortableTableProps<Row>) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const [ownSort, setOwnSort] = useState<SortState | null>(defaultSort);
  const [said, setSaid] = useState("");
  const current = sort === undefined ? ownSort : sort;
  const active = current ? columns.find((column) => column.key === current.key && column.sortType !== false) : undefined;

  const numbers = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const dates = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone }), [locale, timeZone]);

  const ordered = useMemo(() => {
    if (!current || !active) return rows.map((row, index) => ({ row, index }));
    const read = active.accessor ?? ((row: Row) => (row as Record<string, unknown>)[active.key]);
    return sortEntries(rows, read, active.sortType || "text", current.direction, locale);
  }, [rows, current, active, locale]);

  function press(column: SortableColumn<Row>) {
    const next = nextSort(active ? current : null, column.key);
    if (sort === undefined) setOwnSort(next);
    onSortChange?.(next);
    setSaid(next ? words.sorted.replace("{column}", nameOf(column)).replace("{direction}", next.direction === "ascending" ? words.ascending : words.descending) : words.off);
  }

  function show(column: SortableColumn<Row>, row: Row): ReactNode {
    if (column.cell) return column.cell(row);
    const value = column.accessor ? column.accessor(row) : (row as Record<string, unknown>)[column.key];
    if (isEmpty(value)) {
      return (
        <>
          <span aria-hidden="true" className="text-muted-foreground">
            -
          </span>
          <span className="sr-only">{words.empty}</span>
        </>
      );
    }
    if (column.sortType === "number") {
      const number = toNumber(value);
      return number === null ? String(value) : numbers.format(number);
    }
    if (column.sortType === "date") {
      const time = toTime(value);
      return time === null ? String(value) : dates.format(time);
    }
    return String(value);
  }

  return (
    <div data-slot="sortable-table" className="grid gap-2">
      <Table className={className} {...props}>
        {caption ? <TableCaption>{caption}</TableCaption> : null}
        <TableHeader>
          <TableRow>
            {columns.map((column) => {
              const sortable = column.sortType !== false;
              const isActive = sortable && active?.key === column.key;
              return (
                <TableHead
                  key={column.key}
                  scope="col"
                  className={cn(ALIGN[column.align ?? "left"], column.align === "right" && "[&>button]:flex-row-reverse", column.className)}
                  {...(sortable ? { sort: isActive && current ? current.direction : "none", onSort: () => press(column) } : {})}
                  // Only the sorted header says so: the others are sort buttons with nothing to report.
                  {...(sortable && !isActive ? { "aria-sort": undefined } : {})}
                >
                  {column.header}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={Math.max(1, columns.length)} className="h-24 text-center text-muted-foreground">
                {empty ?? words.noRows}
              </TableCell>
            </TableRow>
          ) : (
            ordered.map(({ row, index }) => (
              <TableRow key={getRowId ? getRowId(row, index) : ((row as { id?: string | number }).id ?? index)}>
                {columns.map((column) => (
                  <TableCell key={column.key} className={cn(ALIGN[column.align ?? "left"], column.sortType === "number" && "tabular-nums", column.className)}>
                    {show(column, row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <p role="status" className="sr-only">
        {said}
      </p>
    </div>
  );
}
