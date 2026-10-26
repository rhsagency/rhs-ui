"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type Key, type KeyboardEvent, type ReactNode } from "react";

import { TableBody, TableCell, TableHead, TableHeader, TableRow, type TableSort } from "@rhs-ui/primitives/table";
import { HEADER_HEIGHT, sameWindow, windowOf, type RowWindow } from "@rhs-ui/dashboard/virtualized-table/window";
import { cn } from "@/lib/utils";

export interface VirtualizedColumn<Row> {
  /** Identity of the column. Without a `cell` function the cell shows `row[id]`. */
  id: string;
  /** The header: text, or any node, such as a "select all" checkbox. */
  header: ReactNode;
  /** Draws the cell. Return one line: a row is exactly `rowHeight` tall and anything longer is cut with an ellipsis. */
  cell?: (row: Row, index: number) => ReactNode;
  /** A number is px. A column without a width shares what the others leave. */
  width?: number | string;
  /** Which side the header and the cells sit on. Put numbers on the right. */
  align?: "left" | "center" | "right";
  /** The sort state of this column. With `onSort` the header becomes the Table's sort button and sets `aria-sort`. */
  sort?: TableSort;
  /** Called when the header is pressed. Sort `rows` yourself and pass the new order. */
  onSort?: () => void;
}

export interface VirtualRange {
  /** The first row in the DOM (0-based). */
  start: number;
  /** One past the last row in the DOM. `end - start` is how many rows are rendered. */
  end: number;
  /** The first row in view. */
  firstVisible: number;
  /** The last row in view. */
  lastVisible: number;
  /** How many rows there are in all. */
  total: number;
}

/** The props of a row's `<tr>`, including `data-*` attributes such as `data-state="selected"`. */
export type VirtualRowProps = ComponentProps<"tr"> & { [attribute: `data-${string}`]: string | number | boolean | undefined };

export interface VirtualizedTableProps<Row> extends Omit<ComponentProps<"div">, "children"> {
  /** Every row. Thousands are fine: only the ones in view are in the DOM. */
  rows: readonly Row[];
  /** What to show, in order: a header and, unless the cell is just `row[id]`, a function that draws it. */
  columns: readonly VirtualizedColumn<Row>[];
  /** The height of every row in px. Rows are all the same height, which is what lets the scrollbar stay honest. */
  rowHeight?: number;
  /** The height of the scroll box: a number is px, or any CSS length ("60vh"). */
  height?: number | string;
  /** Rows kept in the DOM beyond the edge of the view, so a fast scroll never shows a gap. */
  overscan?: number;
  /** Names the table and the scrolling region around it. */
  caption: string;
  /** A stable key for a row. Without it the row's index is the key. */
  getRowKey?: (row: Row, index: number) => Key;
  /** Props for a row's `<tr>`: `data-state="selected"`, a class, a click handler. This is where selection plugs in. */
  getRowProps?: (row: Row, index: number) => VirtualRowProps | undefined;
  /** Called when the rows in the DOM change, so you can load the next page near the end. */
  onRangeChange?: (range: VirtualRange) => void;
  /** BCP 47 locale for the row counts. */
  locale?: string;
}

const ALIGN = { left: "justify-start text-left", center: "justify-center text-center", right: "justify-end text-right" } as const;
const HEAD_ALIGN = { left: "text-left", center: "text-center", right: "text-right" } as const;

/** If the focused row is about to leave the DOM, keep focus in the box instead of letting it fall to the page. */
function keepFocus(box: HTMLElement, next: RowWindow): void {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || active === box || !box.contains(active)) return;
  const row = active.closest<HTMLElement>("tr[data-row-index]");
  const index = row ? Number(row.dataset.rowIndex) : Number.NaN;
  if (!Number.isNaN(index) && (index < next.start || index >= next.end)) box.focus({ preventScroll: true });
}

/**
 * Thousands of rows rendered as a few dozen. Every row has the same height, so
 * the table knows where row 4,812 is without drawing the 4,811 above it: only
 * the rows in view plus an overscan are in the DOM, between two spacers that
 * keep the scrollbar the length of the whole list. It stays a real table. It
 * sets `aria-rowcount` to the true total (the header is row 1) and
 * `aria-rowindex` on every rendered row, so a screen reader says "row 4,813 of
 * 12,431" and not "row 7 of 31". The header is sticky, the box is a focusable
 * region, and Page Up, Page Down, Home and End move through the data. Focus
 * never falls to the page when its row scrolls away. It needs no dependency:
 * a scroll listener and a ResizeObserver. Selection and sorting plug in
 * through `getRowProps` and a column's `sort`.
 */
export function VirtualizedTable<Row>({
  rows,
  columns,
  rowHeight = 44,
  height = 420,
  overscan = 6,
  caption,
  getRowKey,
  getRowProps,
  onRangeChange,
  locale = "en-US",
  className,
  ...props
}: VirtualizedTableProps<Row>) {
  const box = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const total = rows.length;
  // Whole pixels, so a row is exactly as tall as the maths says and the error cannot add up over thousands of rows.
  const rh = Math.max(20, Math.round(rowHeight));
  const keep = Math.max(0, Math.round(overscan));
  const [view, setView] = useState({ top: 0, viewport: typeof height === "number" ? height : 480 });
  const win = windowOf({ scrollTop: view.top, viewport: view.viewport, total, rowHeight: rh, overscan: keep });
  const number = new Intl.NumberFormat(locale);
  const latest = useRef(onRangeChange);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const read = (): void => {
      const next = { top: element.scrollTop, viewport: element.clientHeight };
      const after = windowOf({ scrollTop: next.top, viewport: next.viewport, total, rowHeight: rh, overscan: keep });
      keepFocus(element, after);
      // Scrolling inside a row's worth of pixels changes nothing on screen, so it does not render.
      setView((before) => {
        const was = windowOf({ scrollTop: before.top, viewport: before.viewport, total, rowHeight: rh, overscan: keep });
        return sameWindow(was, after) && before.viewport === next.viewport && (before.top > 0) === (next.top > 0) ? before : next;
      });
    };
    read();
    element.addEventListener("scroll", read, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(read);
    observer?.observe(element);
    return () => {
      element.removeEventListener("scroll", read);
      observer?.disconnect();
    };
  }, [total, rh, keep]);

  useEffect(() => {
    latest.current = onRangeChange;
  });
  useEffect(() => {
    latest.current?.({ start: win.start, end: win.end, firstVisible: win.first, lastVisible: win.last, total });
  }, [win.start, win.end, win.first, win.last, total]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    // Only when the box itself has focus: inside a cell, those keys belong to whatever is focused there.
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return;
    const element = event.currentTarget;
    const page = Math.max(rh, Math.floor((element.clientHeight - HEADER_HEIGHT) / rh) * rh);
    switch (event.key) {
      case "PageDown":
        element.scrollTop += page;
        break;
      case "PageUp":
        element.scrollTop -= page;
        break;
      case "ArrowDown":
        element.scrollTop += rh;
        break;
      case "ArrowUp":
        element.scrollTop -= rh;
        break;
      case "Home":
        element.scrollTop = 0;
        break;
      case "End":
        element.scrollTop = element.scrollHeight;
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const minWidth = columns.reduce((sum, column) => sum + (typeof column.width === "number" ? column.width : 140), 0);
  const spaceAbove = win.start * rh;
  const spaceBelow = Math.max(0, (total - win.end) * rh);
  const scrolled = view.top > 0;

  return (
    <div
      data-slot="virtualized-table"
      className={cn(
        "@container w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card text-card-foreground",
        // The focus ring of the scrolling box is drawn on the card: nothing inside it, such as the sticky header, can cover it.
        "has-[[role=region]:focus-visible]:ring-[3px] has-[[role=region]:focus-visible]:ring-ring/40",
        className,
      )}
      {...props}
    >
      {/* The box is a region you can focus and scroll with the keyboard. It runs one pixel under the footer, so the last row's line and the footer's are one line. */}
      <div ref={box} role="region" aria-label={caption} aria-describedby={hintId} tabIndex={0} onKeyDown={onKeyDown} style={{ height }} className="relative -mb-px overflow-auto outline-none">
        {/* Once rows have scrolled under the header it casts a soft line. One strip across the whole header, so the shadow has no seams. */}
        <div aria-hidden="true" className="pointer-events-none sticky top-10 left-0 z-20 h-0 w-full">
          <div className={cn("h-px w-full shadow-[0_2px_4px_0_oklch(0_0_0/0.10)] motion-safe:transition-opacity motion-safe:duration-150", scrolled ? "opacity-100" : "opacity-0")} />
        </div>
        <table
          data-slot="table"
          aria-label={caption}
          aria-rowcount={total === 0 ? 2 : total + 1}
          aria-colcount={columns.length}
          style={{ tableLayout: "fixed", minWidth }}
          className="w-full border-separate border-spacing-0 text-sm"
        >
          <colgroup>
            {columns.map((column) => (
              <col key={column.id} style={column.width === undefined ? undefined : { width: typeof column.width === "number" ? `${column.width}px` : column.width }} />
            ))}
          </colgroup>
          <TableHeader>
            <TableRow aria-rowindex={1} className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  scope="col"
                  sort={column.sort}
                  onSort={column.onSort}
                  className={cn("sticky top-0 z-10 h-10 bg-card px-3 shadow-[inset_0_-1px_0_var(--border)]", HEAD_ALIGN[column.align ?? "left"])}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          {/* A row that takes focus is scrolled in below the sticky header (h-10) with a little room for its focus ring (scroll-mt-11), and not beneath it.
              The margin sits on what is in the rows, not on the scroller: padding there would also scroll the list whenever a header control takes focus. */}
          <TableBody className="[&_*]:scroll-mt-11">
            {total === 0 ? (
              <tr aria-rowindex={2}>
                <td colSpan={columns.length} className="h-32 text-center text-sm text-muted-foreground">
                  No rows to show.
                </td>
              </tr>
            ) : null}
            {spaceAbove > 0 ? (
              <tr aria-hidden="true" style={{ height: spaceAbove }}>
                <td colSpan={columns.length} style={{ height: spaceAbove, padding: 0 }} />
              </tr>
            ) : null}
            {rows.slice(win.start, win.end).map((row, offset) => {
              const index = win.start + offset;
              const extra = getRowProps?.(row, index);
              return (
                <TableRow
                  key={getRowKey?.(row, index) ?? index}
                  {...extra}
                  aria-rowindex={index + 2}
                  data-row-index={index}
                  style={{ ...extra?.style, height: rh }}
                  className={extra?.className}
                >
                  {columns.map((column) => {
                    const align = column.align ?? "left";
                    const content = column.cell ? column.cell(row, index) : String((row as Record<string, unknown>)[column.id] ?? "");
                    return (
                      <TableCell key={column.id} className="p-0">
                        <div className={cn("flex min-w-0 items-center px-3 shadow-[inset_0_-1px_0_var(--border)]", ALIGN[align])} style={{ height: rh }}>
                          {/* The ellipsis clips, so the wrapper is padded and pulled back out by the same 4px: a focus ring (a checkbox in a cell) has room to show. */}
                          <div className="-mx-1 -my-1 min-w-0 truncate px-1 py-1">{content}</div>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
            {spaceBelow > 0 ? (
              <tr aria-hidden="true" style={{ height: spaceBelow }}>
                <td colSpan={columns.length} style={{ height: spaceBelow, padding: 0 }} />
              </tr>
            ) : null}
          </TableBody>
        </table>
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        <p className="tabular-nums">
          {total === 0 ? (
            "No rows"
          ) : (
            <>
              Rows <span className="font-medium text-foreground">{number.format(win.first + 1)}</span> to <span className="font-medium text-foreground">{number.format(win.last + 1)}</span> of{" "}
              <span className="font-medium text-foreground">{number.format(total)}</span>
            </>
          )}
        </p>
        <p aria-hidden="true" className="hidden @md:block">
          Page Up, Page Down, Home and End move through the rows
        </p>
        <p id={hintId} className="sr-only">
          {`Table with ${number.format(total)} rows. Use Page Up, Page Down, Home and End to move through them.`}
        </p>
      </div>
    </div>
  );
}
