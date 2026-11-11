"use client";

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { IconChevronDown, IconChevronRight } from "@rhs-ui/icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

/** One column under a group heading. */
export interface GroupedColumn<Row> {
  /** Names the column, and reads the value from each row when there is no `cell` or `accessor`: `key: "revenue"` reads `row.revenue`. Unique inside its group. */
  key: string;
  /** The heading of the column, under the heading of its group. */
  header: string;
  /** Which side the figures sit on. Default "right", where numbers read best. */
  align?: "left" | "right" | "center";
  /** Reads the value of a row when it is not `row[key]`. */
  accessor?: (row: Row) => unknown;
  /** Draws the cell, when the value is not what should show: a percentage, a badge. Without it numbers are written in the locale and anything else as text. */
  cell?: (row: Row) => ReactNode;
  /** Classes for the cells of the column and its heading. */
  className?: string;
}

/** A heading that spans several columns, with the columns under it. */
export interface ColumnGroup<Row> {
  /** Unique in the table. */
  id: string;
  /** The heading that spans the columns: "Q2", "EMEA". */
  label: string;
  /** The columns under it, in order. */
  columns: readonly GroupedColumn<Row>[];
  /** The `key` of the column that stays when the group is collapsed. A group with a summary gets a button on its heading to collapse and expand it. */
  summary?: string;
}

/** The first column, which names each row. */
export interface RowHeaderColumn<Row> {
  /** Reads the name of each row when there is no `cell`: `key: "region"` reads `row.region`. */
  key: string;
  /** The heading of the column. */
  header: string;
  /** Draws the name of a row when it is not plain text. */
  cell?: (row: Row) => ReactNode;
}

/** The words the table says on its own, for another language or your own wording. `{group}` is the heading of the group. */
export interface ColumnGroupTableLabels {
  /** The name of the button that folds a group down to its summary column. Default "Collapse {group}". */
  collapse: string;
  /** The name of the button that shows all the columns of a group again. Default "Expand {group}". */
  expand: string;
  /** What a screen reader hears for a cell with no value. Default "No data". */
  empty: string;
}

export interface ColumnGroupTableProps<Row> extends Omit<ComponentProps<"div">, "children" | "aria-label" | "ref"> {
  /** Names the scrolling table for assistive technology: "Results by quarter". Required, because the box can take focus and a focusable region needs a name. */
  label: string;
  /** The groups, in order, each with the columns under its heading. */
  columnGroups: readonly ColumnGroup<Row>[];
  /** The data, one object per row. */
  rows: readonly Row[];
  /** The column that names each row, kept at the left edge while the figures scroll. It is a row header for a screen reader. */
  rowHeader?: RowHeaderColumn<Row>;
  /** A key for each row that stays with the row. Default `row.id`, then the place in `rows`. */
  getRowId?: (row: Row, index: number) => string | number;
  /** The ids of the collapsed groups, when you control them. */
  collapsed?: readonly string[];
  /** The ids collapsed to start with, when you do not control them. */
  defaultCollapsed?: readonly string[];
  /** Called with the ids of the collapsed groups after a group is folded or opened. */
  onCollapsedChange?: (collapsed: string[]) => void;
  /** A note under the table that says what the figures are: "Revenue in thousands of euros". It stays in view while the table scrolls, and it describes the table for assistive technology. */
  caption?: ReactNode;
  /** How tall the box may grow before the rows scroll under the headings: a number of pixels or any CSS length. Default "24rem". */
  maxHeight?: number | string;
  /** The locale that writes the numbers. Default "en-US". */
  locale?: string;
  /** The words the table says, for translation. */
  labels?: Partial<ColumnGroupTableLabels>;
}

const DEFAULT_LABELS = {
  collapse: "Collapse {group}",
  expand: "Expand {group}",
  empty: "No data",
} satisfies ColumnGroupTableLabels;

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;

const fill = (template: string, group: string) => template.replace("{group}", group);

// Borders live on the cells: the separate border model keeps a cell's border with it when it sticks, where a collapsed
// one would scroll away from a pinned cell.
const TABLE = cn(
  "border-separate border-spacing-0",
  "[&_th]:border-b [&_th]:border-border [&_td]:border-b [&_td]:border-border [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:last-child_th]:border-b-0",
);

/**
 * A table with grouped column headings: a heading that spans its sub-columns ("Q2" over Revenue, Orders, Margin). Both
 * levels are real header cells: the group is a `th` with `colspan` and `scope="colgroup"` over `colgroup` elements,
 * the columns are `th scope="col"`, and the first column names the row, so a screen reader says "Q2, Revenue, 1,204" for a
 * figure. A thin rule marks each group boundary, and both heading levels and the row names stay in place while the
 * table scrolls, with solid backgrounds so nothing shows through. A group given a `summary` can be folded down to that
 * one column and opened again, from a button on its heading. Use it for results by period, plans by region or any
 * figures that share a heading. With `rowHeader` the label of a group and its button stay beside the row names while its
 * columns scroll under them, so the button is never left on its own. Give the table `label` for the scroll box; it takes
 * the keyboard focus. Columns that take functions need a client component to render them.
 */
export function ColumnGroupTable<Row>({
  label,
  columnGroups,
  rows,
  rowHeader,
  getRowId,
  collapsed,
  defaultCollapsed,
  onCollapsedChange,
  caption,
  maxHeight = "24rem",
  locale = "en-US",
  labels,
  className,
  style,
  ...props
}: ColumnGroupTableProps<Row>) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const captionId = useId();
  const [own, setOwn] = useState<readonly string[]>(defaultCollapsed ?? []);
  const folded = collapsed ?? own;
  const numbers = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const box = useRef<HTMLDivElement>(null);
  const rowHead = useRef<HTMLTableCellElement>(null);
  const hasRowHeader = rowHeader !== undefined;

  // The width of the pinned row names, as a variable on the box, so a group heading can stick just beside them while its columns scroll under them.
  useEffect(() => {
    const head = rowHead.current;
    const root = box.current;
    if (!head || !root) return;
    const apply = () => root.style.setProperty("--row-header-width", `${head.getBoundingClientRect().width}px`);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(head);
    return () => observer.disconnect();
  }, [hasRowHeader]);

  // What each group shows now: all its columns, or only its summary column while it is folded.
  const shown = columnGroups.map((group) => {
    const isFolded = group.summary !== undefined && folded.includes(group.id);
    const only = isFolded ? group.columns.filter((column) => column.key === group.summary) : group.columns;
    return { group, isFolded, columns: only.length > 0 ? only : group.columns.slice(0, 1) };
  });

  function toggle(id: string) {
    const next = folded.includes(id) ? folded.filter((entry) => entry !== id) : [...folded, id];
    if (collapsed === undefined) setOwn(next);
    onCollapsedChange?.([...next]);
  }

  const write = (row: Row, column: GroupedColumn<Row>): ReactNode => {
    if (column.cell) return column.cell(row);
    const value = column.accessor ? column.accessor(row) : (row as Record<string, unknown>)[column.key];
    if (value === null || value === undefined || value === "") {
      return (
        <>
          <span aria-hidden="true" className="text-muted-foreground">
            -
          </span>
          <span className="sr-only">{words.empty}</span>
        </>
      );
    }
    return typeof value === "number" ? numbers.format(value) : String(value);
  };

  return (
    <div
      ref={box}
      data-slot="column-group-table"
      className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-xs", className)}
      style={{ "--row-tint": "color-mix(in oklab, var(--card), var(--muted) 50%)", ...style } as CSSProperties}
      {...props}
    >
      <div
        role="region"
        aria-label={label}
        tabIndex={0}
        style={{ maxHeight }}
        className={cn(
          "relative overflow-auto overscroll-contain [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]",
          "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset",
          // The Table brings a scroll container of its own; here the box is the one that scrolls, or the headings would have nothing to stick to.
          "[&>[data-slot=table-container]]:overflow-visible",
        )}
      >
        <Table className={TABLE} aria-describedby={caption ? captionId : undefined}>
          {/* The column groups of the table itself: scope="colgroup" on a heading refers to these. */}
          {rowHeader ? (
            <colgroup>
              <col />
            </colgroup>
          ) : null}
          {shown.map(({ group, columns }) => (
            <colgroup key={group.id} span={columns.length} />
          ))}
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {rowHeader ? (
                <TableHead ref={rowHead} rowSpan={2} scope="col" className="sticky top-0 left-0 z-30 min-w-36 border-r border-border bg-card align-bottom font-medium text-foreground">
                  {rowHeader.header}
                </TableHead>
              ) : null}
              {shown.map(({ group, isFolded, columns }, index) => (
                <TableHead
                  key={group.id}
                  colSpan={columns.length}
                  scope="colgroup"
                  className={cn("sticky top-0 z-20 h-9 bg-card px-3 text-center font-semibold text-foreground", index > 0 && "border-l border-border")}
                >
                  {/* With pinned row names the label and its button stick beside them, so scrolling a group under the names never leaves the button alone. */}
                  <span className={cn("inline-flex max-w-full items-center justify-center gap-1", rowHeader && "sticky left-[calc(var(--row-header-width,0px)+0.75rem)]")}>
                    <span className="truncate">{group.label}</span>
                    {group.summary !== undefined ? (
                      <button
                        type="button"
                        aria-expanded={!isFolded}
                        aria-label={fill(isFolded ? words.expand : words.collapse, group.label)}
                        onClick={() => toggle(group.id)}
                        className="inline-grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                      >
                        {isFolded ? <IconChevronRight aria-hidden="true" className="size-3.5" /> : <IconChevronDown aria-hidden="true" className="size-3.5" />}
                      </button>
                    ) : null}
                  </span>
                </TableHead>
              ))}
            </TableRow>
            <TableRow className="hover:bg-transparent">
              {shown.flatMap(({ group, columns }, index) =>
                columns.map((column, position) => (
                  <TableHead
                    key={`${group.id}:${column.key}`}
                    scope="col"
                    className={cn(
                      "sticky top-9 z-20 h-9 min-w-20 bg-card text-xs",
                      ALIGN[column.align ?? "right"],
                      position === 0 && index > 0 && "border-l border-border",
                      column.className,
                    )}
                  >
                    {column.header}
                  </TableHead>
                )),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={getRowId ? getRowId(row, rowIndex) : ((row as { id?: string | number }).id ?? rowIndex)} className="group/row">
                {rowHeader ? (
                  <TableHead
                    scope="row"
                    className="sticky left-0 z-10 border-r border-border bg-card text-left font-medium text-foreground transition-colors duration-150 group-hover/row:bg-(--row-tint) motion-reduce:transition-none"
                  >
                    {rowHeader.cell ? rowHeader.cell(row) : String((row as Record<string, unknown>)[rowHeader.key] ?? "")}
                  </TableHead>
                ) : null}
                {shown.flatMap(({ group, columns }, index) =>
                  columns.map((column, position) => (
                    <TableCell
                      key={`${group.id}:${column.key}`}
                      className={cn("whitespace-nowrap tabular-nums", ALIGN[column.align ?? "right"], position === 0 && index > 0 && "border-l border-border", column.className)}
                    >
                      {write(row, column)}
                    </TableCell>
                  )),
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {caption ? (
        <p id={captionId} className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          {caption}
        </p>
      ) : null}
    </div>
  );
}
