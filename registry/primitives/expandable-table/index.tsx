"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";

import { IconChevronRight, IconChevronsDown, IconChevronsUp } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export interface ExpandableColumn<Row> {
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

/** The words the table says on its own, for another language or your own wording. `{row}` is what `getRowLabel` gives. */
export interface ExpandableTableLabels {
  /** The name of a row's button. It stays the same open or closed: `aria-expanded` says which. Default "Expand row {row}". */
  expandRow: string;
  /** The name of the header button that opens every row. Default "Expand all rows". */
  expandAll: string;
  /** The name of an open detail panel. Default "Details for {row}". */
  details: string;
  /** What a screen reader hears as the heading of the button column. Default "Details". */
  detailsHeader: string;
  /** What a row is called when you give no `getRowLabel`: `{n}` is its place in the table. Default "{n}". */
  rowName: string;
  /** What shows when there are no rows. Default "No rows to show". */
  noRows: string;
}

export interface ExpandableTableProps<Row> extends Omit<ComponentProps<"table">, "children"> {
  /** The columns after the button column, in order. */
  columns: readonly ExpandableColumn<Row>[];
  /** The rows, one object each. */
  rows: readonly Row[];
  /** A key for each row that stays with the row, and the id the open set holds. Default `row.id`, then the place in `rows`. */
  getRowId?: (row: Row, index: number) => string;
  /** What names a row for a screen reader: "Invoice 1042". Its button is then "Expand row Invoice 1042". Default its place in the table. */
  getRowLabel?: (row: Row, index: number) => string;
  /** Draws the panel under an open row. It spans every column and gets the row's data. */
  renderDetail: (row: Row) => ReactNode;
  /** The ids of the open rows, when you control the table. */
  expanded?: ReadonlySet<string>;
  /** The ids to start open, when you do not control the table. */
  defaultExpanded?: Iterable<string>;
  /** Called with the new set of open rows (a new Set) after every change. */
  onExpandedChange?: (expanded: Set<string>) => void;
  /** `multiple` lets any number of rows be open and adds an expand-all button to the header. `single` keeps one open: opening a row closes the other. Default "multiple". */
  mode?: "single" | "multiple";
  /** What the table is, under it: "Invoices with their lines". It names the table for assistive technology. */
  caption?: ReactNode;
  /** What shows in place of the rows when there are none. */
  empty?: ReactNode;
  /** The words the table says, for translation. */
  labels?: Partial<ExpandableTableLabels>;
}

const DEFAULT_LABELS = {
  expandRow: "Expand row {row}",
  expandAll: "Expand all rows",
  details: "Details for {row}",
  detailsHeader: "Details",
  rowName: "{n}",
  noRows: "No rows to show",
} satisfies ExpandableTableLabels;

const ALIGN = { left: "", right: "text-right", center: "text-center" } as const;

const fill = (template: string, values: Readonly<Record<string, string>>) => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

/**
 * A table whose rows open a panel underneath: for the lines of an invoice, the entries of a log, the contents of an order,
 * whatever is too wide or too long for a cell. Every row starts with a real button named "Expand row Invoice 1042" that
 * reports `aria-expanded` and points at its panel with `aria-controls`; the panel is a row of its own that spans every
 * column, and while it is closed it is out of the accessibility tree and cannot take focus. Opening eases the height,
 * and happens at once under reduced motion. The header offers an expand-all button that shows a mixed state while only
 * some rows are open, and `mode="single"` keeps one row open at a time. `renderDetail` is a function, so a table that
 * uses it is rendered from a client component.
 */
export function ExpandableTable<Row>({
  columns,
  rows,
  getRowId,
  getRowLabel,
  renderDetail,
  expanded,
  defaultExpanded,
  onExpandedChange,
  mode = "multiple",
  caption,
  empty,
  labels,
  className,
  ...props
}: ExpandableTableProps<Row>) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const [own, setOwn] = useState<ReadonlySet<string>>(() => new Set(defaultExpanded));
  const current = expanded ?? own;
  // A panel is drawn the first time its row opens and kept, so the closing ease has something to close and a reopen costs nothing.
  const [drawn, setDrawn] = useState<ReadonlySet<string>>(() => new Set(current));
  if ([...current].some((id) => !drawn.has(id))) setDrawn(new Set([...drawn, ...current]));

  const entries = rows.map((row, index) => {
    const id = getRowId ? getRowId(row, index) : String((row as { id?: string | number }).id ?? index);
    return { row, id, label: getRowLabel ? getRowLabel(row, index) : fill(words.rowName, { n: String(index + 1) }), panel: `${base}-${index}` };
  });
  const openCount = entries.filter((entry) => current.has(entry.id)).length;
  const all = entries.length > 0 && openCount === entries.length;

  function commit(next: Set<string>) {
    if (expanded === undefined) setOwn(next);
    onExpandedChange?.(next);
  }

  function toggle(id: string) {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else {
      if (mode === "single") next.clear();
      next.add(id);
    }
    commit(next);
  }

  function toggleAll() {
    const next = new Set(current);
    for (const entry of entries) {
      if (all) next.delete(entry.id);
      else next.add(entry.id);
    }
    commit(next);
  }

  // Down to open everything, up once everything is open. Never the up-and-down pair of a sortable column header: that one means sort, and sits right next to the first heading.
  const AllIcon = all ? IconChevronsUp : IconChevronsDown;

  return (
    <div data-slot="expandable-table" className="w-full min-w-0">
      <Table className={className} {...props}>
        {caption ? <TableCaption>{caption}</TableCaption> : null}
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="w-px pr-0">
              {mode === "multiple" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={words.expandAll}
                  // A toggle with three states: nothing open, some open (mixed), everything open.
                  aria-pressed={all ? true : openCount > 0 ? "mixed" : false}
                  disabled={entries.length === 0}
                  onClick={toggleAll}
                  className="-ml-1 size-7 text-muted-foreground aria-pressed:text-foreground"
                >
                  <AllIcon aria-hidden="true" />
                </Button>
              ) : (
                <span className="sr-only">{words.detailsHeader}</span>
              )}
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
              const open = current.has(entry.id);
              return (
                <RowPair
                  key={entry.id}
                  open={open}
                  columns={columns}
                  entry={entry}
                  button={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={fill(words.expandRow, { row: entry.label })}
                      aria-expanded={open}
                      aria-controls={entry.panel}
                      onClick={() => toggle(entry.id)}
                      className="-ml-1 size-7 text-muted-foreground aria-expanded:text-foreground [&_svg]:transition-transform [&_svg]:duration-200 aria-expanded:[&_svg]:rotate-90 motion-reduce:[&_svg]:transition-none"
                    >
                      <IconChevronRight aria-hidden="true" />
                    </Button>
                  }
                  detail={drawn.has(entry.id) ? renderDetail(entry.row) : null}
                  detailLabel={fill(words.details, { row: entry.label })}
                />
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

interface RowPairProps<Row> {
  open: boolean;
  columns: readonly ExpandableColumn<Row>[];
  entry: { row: Row; id: string; panel: string };
  button: ReactNode;
  detail: ReactNode;
  detailLabel: string;
}

/** A row and the panel that belongs to it, as two rows of the table. */
function RowPair<Row>({ open, columns, entry, button, detail, detailLabel }: RowPairProps<Row>) {
  return (
    <>
      <TableRow data-state={open ? "open" : "closed"} className={cn(open && "bg-muted/40")}>
        <TableCell className="w-px pr-0">{button}</TableCell>
        {columns.map((column) => (
          <TableCell key={column.key} className={cn(ALIGN[column.align ?? "left"], column.className)}>
            {column.cell ? column.cell(entry.row) : String((entry.row as Record<string, unknown>)[column.key] ?? "")}
          </TableCell>
        ))}
      </TableRow>
      {/* Out of the accessibility tree and out of the tab order while it is closed; the row stays so `aria-controls` always has something to point at. */}
      <TableRow id={entry.panel} data-state={open ? "open" : "closed"} aria-hidden={open ? undefined : true} inert={!open} className={cn("hover:bg-transparent", open ? "bg-muted/25" : "border-b-0")}>
        <TableCell colSpan={columns.length + 1} data-density-skip className="p-0">
          <div className={cn("grid transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
            <div className="min-h-0 overflow-hidden">
              <div role="group" aria-label={detailLabel} className="px-4 py-4 sm:pl-12">
                {detail}
              </div>
            </div>
          </div>
        </TableCell>
      </TableRow>
    </>
  );
}
