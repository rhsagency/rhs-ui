"use client";

import { useRef, useState, type ComponentProps, type ReactNode } from "react";

import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { DisabledReason } from "@rhs-ui/primitives/disabled-reason";
import { fill, idsBetween, selectionState, setSelected } from "@rhs-ui/primitives/selectable-table/selection";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export type { SelectionState } from "@rhs-ui/primitives/selectable-table/selection";

export interface SelectableColumn<Row> {
  /** Names the column, and reads the cell from `row[key]` when there is no `cell`. Unique in the table. */
  key: string;
  /** The header: text, or an element. */
  header: ReactNode;
  /** Draws the cell, when the value is not what should show: a badge, a link, a formatted amount. */
  cell?: (row: Row) => ReactNode;
  /** Which side the column's text sits on. Numbers read best on the right. Default "left". */
  align?: "left" | "right" | "center";
  /** Classes for the cells of the column and its header: a width, `font-mono`, `whitespace-nowrap`. */
  className?: string;
}

/** The words the table says on its own, for another language or your own wording. `{noun}`, `{count}`, `{total}`, `{row}` and `{n}` are filled in. */
export interface SelectableTableLabels {
  /** The name of the header checkbox. Default "Select all {noun} on this page". */
  selectAll: string;
  /** The name of a row's checkbox: `{row}` is what `getRowLabel` gives. Default "Select {row}". */
  selectRow: string;
  /** What a row is called when you give no `getRowLabel`: `{n}` is its place on the page. Default "row {n}". */
  rowName: string;
  /** The sentence a screen reader hears after every change. Default "{count} of {total} {noun} selected". */
  summary: string;
  /** What shows when there are no rows. Default "No rows to show". */
  noRows: string;
}

export interface SelectableTableProps<Row> extends Omit<ComponentProps<"table">, "children"> {
  /** The columns after the checkbox column, in order. */
  columns: readonly SelectableColumn<Row>[];
  /** The rows on screen, one object each. The header checkbox acts on these and only these. */
  rows: readonly Row[];
  /** A key for each row that stays with the row, and the id the selection holds. Default `row.id`, then the place in `rows`. */
  getRowId?: (row: Row, index: number) => string;
  /** What names a row to a screen reader: "Invoice 1042". Its checkbox is then "Select Invoice 1042". Default "row 3". */
  getRowLabel?: (row: Row, index: number) => string;
  /** The ids that are selected, when you control the table. Ids that are not on screen are kept as they are, so a selection can span pages. */
  selected?: ReadonlySet<string>;
  /** The ids to start with, when you do not control the table. */
  defaultSelected?: Iterable<string>;
  /** Called with the whole new selection (a new Set) after every change. */
  onSelectedChange?: (selected: Set<string>) => void;
  /** Marks a row that cannot be picked. Return a sentence instead of `true` to say why: it shows in a tooltip on the checkbox and is read with it, and the checkbox stays reachable by keyboard. */
  isRowDisabled?: (row: Row) => boolean | string;
  /** What the rows are, in the plural: "orders". It names the header checkbox and the sentence a screen reader hears. Default "rows". */
  noun?: string;
  /** What the table is, under it: "Orders from October". It names the table for assistive technology. */
  caption?: ReactNode;
  /** What shows in place of the rows when there are none. */
  empty?: ReactNode;
  /** The words the table says, for translation. */
  labels?: Partial<SelectableTableLabels>;
}

const DEFAULT_LABELS = {
  selectAll: "Select all {noun} on this page",
  selectRow: "Select {row}",
  rowName: "row {n}",
  summary: "{count} of {total} {noun} selected",
  noRows: "No rows to show",
} satisfies SelectableTableLabels;

const ALIGN = { left: "", right: "text-right", center: "text-center" } as const;

// The box is 18px; the pseudo-element makes the press target about 42px square, so a finger or a quick mouse lands on it.
const HIT_AREA = "relative after:absolute after:-inset-3 after:content-['']";

/**
 * A table with a checkbox in front of every row, built on the RHS UI Table. The header checkbox is empty, checked, or
 * mixed when only some rows are picked, and it acts on the rows on screen that can be picked. Shift-click a second row
 * to pick (or clear) everything between the two, Space toggles the checkbox that has focus, and a row that cannot be
 * picked stays in the tab order and says why instead of going dead. A picked row gets a quiet background and
 * `aria-selected`, and a polite status line tells a screen reader "3 of 25 rows selected" after every change. The
 * selection is a Set of ids that you hold (or let the table hold), and it is complete without a bulk bar: build the
 * actions that apply to it from `onSelectedChange`. `cell` is a function, so a table that uses it is rendered from a
 * client component.
 */
export function SelectableTable<Row>({
  columns,
  rows,
  getRowId,
  getRowLabel,
  selected,
  defaultSelected,
  onSelectedChange,
  isRowDisabled,
  noun = "rows",
  caption,
  empty,
  labels,
  className,
  ...props
}: SelectableTableProps<Row>) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const [own, setOwn] = useState<ReadonlySet<string>>(() => new Set(defaultSelected));
  const current = selected ?? own;
  // The row a Shift-click counts from: the last one that was picked or cleared on its own.
  const anchor = useRef<string | null>(null);
  const shift = useRef(false);

  const entries = rows.map((row, index) => {
    const verdict = isRowDisabled?.(row) ?? false;
    return {
      row,
      id: getRowId ? getRowId(row, index) : String((row as { id?: string | number }).id ?? index),
      label: getRowLabel ? getRowLabel(row, index) : fill(words.rowName, { n: index + 1 }),
      off: verdict !== false,
      reason: typeof verdict === "string" && verdict !== "" ? verdict : undefined,
    };
  });
  const pickable = entries.filter((entry) => !entry.off).map((entry) => entry.id);
  const state = selectionState(pickable, current);
  const picked = entries.filter((entry) => current.has(entry.id)).length;

  function commit(next: Set<string>) {
    if (selected === undefined) setOwn(next);
    onSelectedChange?.(next);
  }

  function pick(id: string, on: boolean, range: boolean) {
    const from = anchor.current;
    const ids = range && from !== null && from !== id ? idsBetween(pickable, from, id) : [id];
    anchor.current = id;
    commit(setSelected(current, ids, on));
  }

  return (
    <div data-slot="selectable-table" className="relative grid gap-2">
      <Table className={className} {...props}>
        {caption ? <TableCaption>{caption}</TableCaption> : null}
        <TableHeader>
          <TableRow>
            <TableHead scope="col">
              <span className="flex items-center">
                <Checkbox
                  aria-label={fill(words.selectAll, { noun })}
                  checked={state === "all" ? true : state === "some" ? "indeterminate" : false}
                  disabled={pickable.length === 0}
                  onCheckedChange={() => {
                    anchor.current = null;
                    commit(setSelected(current, pickable, state !== "all"));
                  }}
                  className={HIT_AREA}
                />
              </span>
            </TableHead>
            {columns.map((column) => (
              <TableHead key={column.key} scope="col" className={cn(ALIGN[column.align ?? "left"], column.className)}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="h-24 text-center text-muted-foreground">
                {empty ?? words.noRows}
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry) => {
              const on = current.has(entry.id);
              const box = (
                <Checkbox
                  aria-label={fill(words.selectRow, { row: entry.label })}
                  checked={on}
                  // A row with a reason is refused by DisabledReason instead, so it keeps its place in the tab order.
                  disabled={entry.off && !entry.reason}
                  onClick={(event) => {
                    shift.current = event.shiftKey;
                  }}
                  onCheckedChange={(next) => {
                    pick(entry.id, next === true, shift.current);
                    shift.current = false;
                  }}
                  className={cn(HIT_AREA, "aria-disabled:hover:border-muted-foreground")}
                />
              );
              return (
                <TableRow key={entry.id} data-state={on ? "selected" : undefined} aria-selected={on}>
                  <TableCell className="select-none">
                    <span className="flex items-center">
                      {entry.off && entry.reason ? (
                        <DisabledReason disabled reason={entry.reason}>
                          {box}
                        </DisabledReason>
                      ) : (
                        box
                      )}
                    </span>
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={cn(ALIGN[column.align ?? "left"], column.className)}>
                      {column.cell ? column.cell(entry.row) : String((entry.row as Record<string, unknown>)[column.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      <p role="status" className="sr-only">
        {fill(words.summary, { count: picked, total: entries.length, noun })}
      </p>
    </div>
  );
}
