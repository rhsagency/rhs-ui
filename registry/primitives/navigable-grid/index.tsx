"use client";

import { memo, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";

import {
  CELL,
  COLUMN,
  ROW,
  cellsOf,
  controlsIn,
  destination,
  heirOf,
  misplacedStop,
  placeOf,
  screenful,
  shapeOf,
  syncStops,
  type GridPosition,
} from "@rhs-ui/primitives/navigable-grid/navigation";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export interface NavigableGridColumn<Row> {
  /** Names the column, and reads the cell from `row[key]` when there is no `cell`. Unique in the grid. */
  key: string;
  /** The header: text, or an element. A control in it joins the keyboard model like a control in any other cell. */
  header: ReactNode;
  /** Draws the cell, when the value is not what should show: an input, a checkbox, a button, a formatted amount. */
  cell?: (row: Row, rowIndex: number) => ReactNode;
  /** Which side the column's text sits on. Numbers read best on the right. Default "left". */
  align?: "left" | "right" | "center";
  /** Makes the cells of this column row headers, so a screen reader says whose row it is while you move along it. Use it for the column that names the row. */
  rowHeader?: boolean;
  /** Classes for the cells of the column and its header: a width, `font-mono`, `hidden @xl:table-cell`. A column hidden by CSS is stepped over by the keyboard. */
  className?: string;
}

/** The cell that has the focus, as `onCellFocus` reports it. */
export interface NavigableGridCell {
  /** The place of the row in `rows`, or -1 for the header row. */
  rowIndex: number;
  /** The place of the column in `columns`. */
  columnIndex: number;
  /** The id of the row (from `getRowId`), or null for the header row. */
  rowId: string | null;
  /** The `key` of the column. */
  columnKey: string;
}

/** The words the grid says on its own, for another language or your own wording. */
export interface NavigableGridLabels {
  /** Read once by a screen reader when the grid is entered. Default "Use the arrow keys to move between cells. Press Enter or F2 to work inside a cell and Escape to step back out." */
  instructions: string;
  /** What a screen reader reads for an empty cell. Default "Empty". */
  empty: string;
  /** What shows when there are no rows. Default "No rows to show". */
  noRows: string;
}

export interface NavigableGridProps<Row> extends Omit<ComponentProps<"table">, "children" | "role" | "ref"> {
  /** The columns, in order. Keep it the same array between renders (a constant, or `useMemo`) and moving the cursor draws two rows, not all of them. */
  columns: readonly NavigableGridColumn<Row>[];
  /** The data, one object per row. */
  rows: readonly Row[];
  /** A key for each row that stays with the row, and the id `onCellFocus` reports. Default `row.id`, then the place in `rows`. */
  getRowId?: (row: Row, index: number) => string | number;
  /** Called when the focus moves onto a cell, by key or by pointer, when it comes back after leaving the grid, and when a row removed under the cursor hands it to the cell that takes its place (that is another row, so it is reported). Not called while it moves inside the same cell. */
  onCellFocus?: (cell: NavigableGridCell) => void;
  /** How many rows PageUp and PageDown move. Default a screenful: what fits in the scroll box the grid sits in, or in the window, less one row. */
  pageSize?: number;
  /** What the grid is, under it: "Stock room". It names the grid for assistive technology when you give no `aria-label`. */
  caption?: ReactNode;
  /** What shows in place of the rows when there are none. */
  empty?: ReactNode;
  /** The words the grid says, for translation. */
  labels?: Partial<NavigableGridLabels>;
}

const DEFAULT_LABELS = {
  instructions: "Use the arrow keys to move between cells. Press Enter or F2 to work inside a cell and Escape to step back out.",
  empty: "Empty",
  noRows: "No rows to show",
} satisfies NavigableGridLabels;

const ALIGN = { left: "", right: "text-right tabular-nums", center: "text-center" } as const;

/** Keys that mean something with Ctrl or Cmd held; every other Ctrl or Cmd chord belongs to the browser. */
const JUMPS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]);

// The cursor is an outline drawn inside the cell: a ring outside it would be cut off by the table's own scroll box, and an outline survives forced colours.
// It is for the keyboard, as every focus ring in the kit is. A click or a tap, and focus inside the cell on a control, are shown by the cell's fill.
const CURSOR = cn(
  "relative outline-none",
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring",
  "focus-within:bg-muted/60",
);

interface GridRowProps<Row> {
  row: Row;
  /** The place of the row in `rows`. */
  index: number;
  columns: readonly NavigableGridColumn<Row>[];
  /** The column whose cell is the Tab stop in this row, or -1 when none is. */
  stop: number;
  /** What a screen reader reads for an empty cell. */
  emptyLabel: string;
}

/** What a cell shows: the column's `cell`, or the value of the row at the column's key, or a dash that a screen reader reads as the empty label. */
function show<Row>(column: NavigableGridColumn<Row>, row: Row, index: number, emptyLabel: string): ReactNode {
  if (column.cell) return column.cell(row, index);
  const value = (row as Record<string, unknown>)[column.key];
  if (value === undefined || value === null || value === "") {
    return (
      <>
        <span aria-hidden="true" className="text-muted-foreground">
          -
        </span>
        <span className="sr-only">{emptyLabel}</span>
      </>
    );
  }
  return String(value);
}

/**
 * One body row. It is memoized, so moving the cursor re-renders the row it leaves and the row it enters and not the other
 * thousand: a row only draws again when its data, the columns or the Tab stop in it change.
 */
function GridRowView<Row>({ row, index, columns, stop, emptyLabel }: GridRowProps<Row>) {
  return (
    <TableRow>
      {columns.map((column, c) => {
        const place = { [ROW]: index + 1, [COLUMN]: c, tabIndex: c === stop ? 0 : -1 };
        const align = ALIGN[column.align ?? "left"];
        return column.rowHeader ? (
          <TableHead key={column.key} scope="row" {...place} className={cn(CURSOR, "h-auto py-2.5 font-medium whitespace-normal text-foreground", align, column.className)}>
            {show(column, row, index, emptyLabel)}
          </TableHead>
        ) : (
          <TableCell key={column.key} {...place} className={cn(CURSOR, align, column.className)}>
            {show(column, row, index, emptyLabel)}
          </TableCell>
        );
      })}
    </TableRow>
  );
}

const GridRow = memo(GridRowView) as unknown as typeof GridRowView;

/**
 * A table with the keyboard of a spreadsheet, built on the RHS UI Table: a WAI-ARIA grid that is one stop in the Tab order.
 * The arrows move one cell, Home and End go to the ends of the row, Ctrl+Home and Ctrl+End to the corners, PageUp and
 * PageDown by a screenful, and the cursor is drawn inside the cell so the scroll box never clips it. Buttons, checkboxes and
 * inputs in cells leave the Tab order until you press Enter or F2 on their cell; Escape hands the focus back, and Tab walks
 * that cell's controls and then leaves the grid. Columns hidden by CSS are stepped over, and a removed row hands its focus to
 * the cell that takes its place. Read where the person is from `onCellFocus`, and name the grid with a `caption` or an `aria-label`.
 */
export function NavigableGrid<Row>({
  columns,
  rows,
  getRowId,
  onCellFocus,
  pageSize,
  caption,
  empty,
  labels,
  className,
  onKeyDown,
  onFocus,
  onBlur,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  ...props
}: NavigableGridProps<Row>) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const captionId = `${id}-caption`;
  const hintId = `${id}-hint`;
  const table = useRef<HTMLTableElement>(null);
  // The cell the focus is inside, when it is on a control and not on the cell: the one cell whose controls may be tabbed to.
  const engaged = useRef<HTMLElement | null>(null);
  // The last cell that had the focus, and whether the person walked away from it: a row that is removed under the focus is not a walk.
  const lastCell = useRef<HTMLElement | null>(null);
  const left = useRef(true);
  const reported = useRef("");
  const [active, setActive] = useState<GridPosition>(() => ({ row: rows.length > 0 ? 1 : 0, column: 0 }));
  // The cell whose control has the focus. For as long as it does, the controls hold the Tab stop and the cell lets go of it.
  const [engagedAt, setEngagedAt] = useState<GridPosition | null>(null);

  const ids = rows.map((row, index) => String(getRowId ? getRowId(row, index) : ((row as { id?: string | number }).id ?? index)));
  // Rows and columns come and go: the Tab stop stays on a cell that exists.
  const here: GridPosition = { row: Math.min(active.row, rows.length), column: Math.min(active.column, Math.max(0, columns.length - 1)) };

  // Where the Tab stop is meant to be, for the observers below, which outlive a render.
  const stopAt = useRef(here);
  useLayoutEffect(() => {
    stopAt.current = here;
  });

  useEffect(() => {
    const grid = table.current;
    if (!grid) return;

    /** The focus was in a row that is gone: put it on the cell that is now in that place. */
    function keepTheFocus(root: HTMLElement) {
      const lost = lastCell.current;
      if (left.current || !lost || lost.isConnected) return;
      const focused = document.activeElement;
      if (focused && focused !== document.body) return;
      lastCell.current = null;
      heirOf(root, lost)?.focus();
    }

    function settle(root: HTMLElement) {
      // The cell whose control had the focus is gone with its row.
      if (engaged.current && !engaged.current.isConnected) {
        engaged.current = null;
        setEngagedAt(null);
      }
      syncStops(root, engaged.current);
      const stop = misplacedStop(root, stopAt.current);
      if (stop) setActive(stop);
      keepTheFocus(root);
    }

    settle(grid);
    // Rows, cells and the controls inside them are rendered by you, at any time: whatever is new is put in line, whatever was lost is looked after.
    // A control can also set its own tabindex after the focus has moved (a roving group does, once its state has updated), so that is watched too.
    const changes = new MutationObserver((records) => {
      // The cells' tabindex moves with the cursor, with every arrow key: nothing to put in line there.
      if (records.every((record) => record.type === "attributes" && (record.target as Element).matches(CELL))) return;
      settle(grid);
      // What settling just wrote is not news.
      changes.takeRecords();
    });
    changes.observe(grid, { childList: true, subtree: true, attributes: true, attributeFilter: ["tabindex"] });
    // A media query can hide the cell that holds the Tab stop without touching the DOM.
    const resizes = new ResizeObserver(() => {
      const stop = misplacedStop(grid, stopAt.current);
      if (stop) setActive(stop);
    });
    resizes.observe(grid);
    if (grid.parentElement) resizes.observe(grid.parentElement);
    return () => {
      changes.disconnect();
      resizes.disconnect();
    };
  }, []);

  // A prop can hide the cell that holds the Tab stop too (a class on a column): look after every render, it costs one cell.
  useEffect(() => {
    const grid = table.current;
    const stop = grid ? misplacedStop(grid, here) : null;
    if (stop) setActive(stop);
  });

  function report(row: number, column: number) {
    // The row is part of the key, not only its place: a row removed under the cursor hands the focus to the cell at the same place, which belongs to another row.
    const key = [row, column, row === 0 ? "" : (ids[row - 1] ?? "")].join(",");
    if (reported.current === key) return;
    reported.current = key;
    const spec = columns[column];
    if (onCellFocus && spec) onCellFocus({ rowIndex: row - 1, columnIndex: column, rowId: row === 0 ? null : (ids[row - 1] ?? null), columnKey: spec.key });
  }

  function handleFocus(event: FocusEvent<HTMLTableElement>) {
    onFocus?.(event);
    const grid = table.current;
    const target = event.target as HTMLElement;
    // Focus events also bubble up through React portals (a menu opened from a cell): only what is in the grid is the grid's.
    if (!grid || !grid.contains(target)) return;
    const cell = target.closest<HTMLElement>(CELL);
    if (!cell || !grid.contains(cell)) return;
    const { row, column } = placeOf(cell);
    const inside = target !== cell;
    const before = engaged.current;
    engaged.current = inside ? cell : null;
    // Moving from cell to cell with the arrows changes nothing about whose controls may be tabbed to, so nothing is scanned.
    if (before !== engaged.current) syncStops(grid, engaged.current);
    lastCell.current = cell;
    left.current = false;
    setActive((now) => (now.row === row && now.column === column ? now : { row, column }));
    setEngagedAt((now) => (inside ? (now && now.row === row && now.column === column ? now : { row, column }) : now === null ? now : null));
    report(row, column);
  }

  function handleBlur(event: FocusEvent<HTMLTableElement>) {
    onBlur?.(event);
    const grid = table.current;
    const target = event.target as HTMLElement;
    if (!grid || !grid.contains(target)) return;
    const next = event.relatedTarget as Node | null;
    if (next && grid.contains(next)) return;
    if (engaged.current) {
      engaged.current = null;
      syncStops(grid, null);
    }
    setEngagedAt((now) => (now === null ? now : null));
    reported.current = "";
    // Some browsers blur an element that is removed, others do not: only an element still in the page that no longer has the focus was walked away from.
    queueMicrotask(() => {
      left.current = target.isConnected && document.activeElement !== target;
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    onKeyDown?.(event);
    const grid = table.current;
    const target = event.target as HTMLElement;
    if (event.defaultPrevented || event.nativeEvent.isComposing || !grid || !grid.contains(target)) return;
    const cell = target.closest<HTMLElement>(CELL);
    if (!cell || !grid.contains(cell)) return;
    const plain = !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey;

    // The focus is on a control inside the cell: its keys are its own, and Escape steps back out to the cell.
    if (target !== cell) {
      if (event.key === "Escape" && plain) {
        event.preventDefault();
        cell.focus();
      }
      return;
    }

    if (event.key === "Enter" || event.key === "F2") {
      const control = plain ? controlsIn(cell)[0] : undefined;
      if (!control) return;
      event.preventDefault();
      engaged.current = cell;
      syncStops(grid, cell);
      control.focus();
      return;
    }

    const jump = event.ctrlKey || event.metaKey;
    if (event.shiftKey || event.altKey || (jump && !JUMPS.has(event.key))) return;
    const cells = cellsOf(grid);
    const from = placeOf(cell);
    const page = event.key === "PageDown" || event.key === "PageUp" ? (pageSize ?? screenful(grid, cell.closest("tr") ?? cell)) : 0;
    const to = destination(shapeOf(cells), from, event.key, { jump, rtl: getComputedStyle(grid).direction === "rtl", page: Math.max(1, Math.floor(page)) });
    if (to === undefined) return;
    // The page does not scroll under a key the grid took, even at an edge where the focus has nowhere to go.
    event.preventDefault();
    if (to) cells[to.row]?.[to.column]?.focus();
  }

  // With the focus on one of its controls a cell is not a Tab stop: Tab and Shift+Tab walk that cell's controls and then leave the grid. Escape brings the stop back.
  const headerStop = engagedAt?.row === 0 && engagedAt.column === here.column ? -1 : here.row === 0 ? here.column : -1;

  return (
    <div data-slot="navigable-grid" className="relative grid gap-2">
      <Table
        {...props}
        ref={table}
        role="grid"
        aria-label={ariaLabel}
        aria-labelledby={labelledBy ?? (!ariaLabel && caption ? captionId : undefined)}
        aria-describedby={[describedBy, hintId].filter(Boolean).join(" ")}
        className={className}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {caption ? <TableCaption id={captionId}>{caption}</TableCaption> : null}
        <TableHeader>
          <TableRow>
            {columns.map((column, c) => (
              <TableHead key={column.key} scope="col" {...{ [ROW]: 0, [COLUMN]: c, tabIndex: c === headerStop ? 0 : -1 }} className={cn(CURSOR, ALIGN[column.align ?? "left"], column.className)}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            // The message is not a row of data: it must not light up under the pointer like one.
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={Math.max(1, columns.length)} className="h-24 text-center text-muted-foreground">
                {empty ?? words.noRows}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, r) => (
              <GridRow
                key={ids[r]}
                row={row}
                index={r}
                columns={columns}
                // The stop is in this row, unless the focus is on one of its controls and the controls hold it.
                stop={r + 1 === here.row && !(engagedAt?.row === here.row && engagedAt.column === here.column) ? here.column : -1}
                emptyLabel={words.empty}
              />
            ))
          )}
        </TableBody>
      </Table>
      <p id={hintId} className="sr-only">
        {words.instructions}
      </p>
    </div>
  );
}
