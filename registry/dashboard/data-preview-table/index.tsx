"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type ReactElement, type ReactNode } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { TYPE_LABEL, clearOfPinned, copyText, valueAt, viewOf, type CellView, type PreviewColumn, type PreviewRow } from "@rhs-ui/dashboard/data-preview-table/cells";
import { cn } from "@/lib/utils";

export type { PreviewColumn, PreviewColumnType, PreviewRow } from "@rhs-ui/dashboard/data-preview-table/cells";

export interface DataPreviewTableProps extends Omit<ComponentProps<"div">, "children"> {
  /** The columns, each with its name and type. The type decides alignment and how a value is written. */
  columns: readonly PreviewColumn[];
  /** The rows to show: arrays in the order of `columns`, or objects keyed by column name. */
  rows: readonly PreviewRow[];
  /** How many rows the data has in all. The footer says "Showing 10 of 12,430 rows"; without it, it counts what it was given. */
  total?: number;
  /** Text and JSON longer than this many characters are cut with an ellipsis. The whole value is in a tooltip, on hover, on focus and on a tap. */
  truncateAt?: number;
  /** Called when a column header is pressed. Giving it turns every header into a button. */
  onColumnClick?: (column: PreviewColumn, index: number) => void;
  /** Names the table and the scrolling region around it. */
  caption?: string;
  /** BCP 47 locale for numbers and dates. */
  locale?: string;
  /** IANA zone for dates that carry a time. A date without a time is never moved to another day. */
  timeZone?: string;
  /** Cap the height (a number is px, or any CSS length) and the header stays put while the rows scroll. */
  maxHeight?: number | string;
}

/** The same quiet fill for the header and the row numbers, solid so what scrolls beneath them is hidden. */
const FILL = "bg-[color-mix(in_oklch,var(--card),var(--muted)_55%)]";

/** The row numbers stay put while the table scrolls sideways; a soft edge appears once they have something to hide. */
const PINNED = "sticky left-0 border-r border-border group-data-[scrolled]/preview:shadow-[4px_0_6px_-4px_oklch(0_0_0/0.14)]";

const TYPE_CHIP = "h-[1.125rem] rounded-[5px] border-border px-1.5 font-mono text-[0.6875rem] leading-none font-normal text-muted-foreground";

function CellText({ view }: { view: CellView }) {
  switch (view.kind) {
    case "null":
      return <span className="text-muted-foreground italic">null</span>;
    case "empty":
      return (
        <>
          <span aria-hidden="true" className="text-muted-foreground italic">
            empty
          </span>
          <span className="sr-only">empty string</span>
        </>
      );
    case "boolean":
      return <span className={cn("font-mono text-xs", view.text === "false" && "text-muted-foreground")}>{view.text}</span>;
    case "json":
      return <span className="font-mono text-xs">{view.text}</span>;
    default:
      return <>{view.text}</>;
  }
}

/**
 * The whole value behind a cut-off one. Radix opens a tooltip on hover and on keyboard focus only, and closes it
 * on every click, so on a touch screen the rest of the value would never show. Here a tap toggles it too, and
 * hover and focus work as they do in every tooltip.
 */
function CellTip({ content, children }: { content: ReactNode; children: ReactElement }) {
  const [open, setOpen] = useState(false);
  const wasOpen = useRef(false);
  const pressing = useRef(false);
  return (
    <Tooltip
      open={open}
      onOpenChange={(next) => {
        // The trigger closes its own tooltip on every click; while a tap is toggling it, that close is not wanted.
        if (!next && pressing.current) return;
        setOpen(next);
      }}
    >
      <TooltipTrigger
        asChild
        // iOS Safari only sends a click to an element it takes for clickable, and a pointer cursor says so. Touch only: a mouse keeps its arrow.
        className="[@media(hover:none)]:cursor-pointer"
        // A press closes an open tooltip before its click arrives, so the click has to know how it started.
        onPointerDown={() => {
          wasOpen.current = open;
        }}
        onClick={() => {
          pressing.current = true;
          setOpen(!wasOpen.current);
          queueMicrotask(() => {
            pressing.current = false;
          });
        }}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start" collisionPadding={8} className="max-w-[calc(100vw-1rem)] text-[0.8125rem] leading-snug break-words whitespace-pre-wrap sm:max-w-sm">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * A peek at tabular data before you commit to it: an import step, a query
 * result, an API explorer. Every column carries its type in a small chip, row
 * numbers run down a pinned gutter, numbers are right-aligned in tabular
 * numerals, and a null and an empty string are told apart in italic ("null"
 * and "empty"). Long values are cut at `truncateAt` characters and shown in
 * full in a tooltip on hover, on focus and on a tap. Values stay as they are: a number
 * that arrives as text keeps every digit and trailing zero, and a date that
 * does not exist is shown as written. The footer says exactly what you
 * are looking at ("Showing 10 of 12,430 rows"). The table scrolls inside a
 * labelled region you can focus; its cells are one tab stop with arrow-key
 * movement, and Ctrl+C copies the focused cell's raw value.
 */
export function DataPreviewTable({
  columns,
  rows,
  total,
  truncateAt = 48,
  onColumnClick,
  caption = "Data preview",
  locale = "en-US",
  timeZone = "UTC",
  maxHeight,
  className,
  ...props
}: DataPreviewTableProps) {
  const [focus, setFocus] = useState({ row: 0, col: 0 });
  const [copied, setCopied] = useState<{ column: string; row: number } | null>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const region = useRef<HTMLDivElement>(null);
  const table = useRef<HTMLTableElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const footerId = useId();
  const number = new Intl.NumberFormat(locale);
  const context = { locale, timeZone, truncateAt: Math.max(1, Math.floor(truncateAt)) };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Which edges have more to scroll to, so the row numbers can lift off and the right edge can say there are more columns.
  useEffect(() => {
    const viewport = region.current;
    if (!viewport) return;
    const measure = (): void => {
      const left = viewport.scrollLeft > 0;
      const right = viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 1;
      setEdges((before) => (before.left === left && before.right === right ? before : { left, right }));
    };
    measure();
    viewport.addEventListener("scroll", measure, { passive: true });
    if (typeof ResizeObserver === "undefined") return () => viewport.removeEventListener("scroll", measure);
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    if (viewport.firstElementChild) observer.observe(viewport.firstElementChild);
    return () => {
      viewport.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, []);

  const views = rows.map((row) => columns.map((column, index) => viewOf(valueAt(row, column, index), column.type, context)));
  const lastRow = rows.length - 1;
  const lastColumn = columns.length - 1;
  // One cell is in the tab order: the one last focused, kept inside the table when the data shrinks.
  const stop = { row: Math.min(focus.row, Math.max(0, lastRow)), col: Math.min(focus.col, Math.max(0, lastColumn)) };

  const copy = async (row: number, col: number): Promise<void> => {
    const view = views[row]?.[col];
    const column = columns[col];
    if (!view || !column || !(await copyText(view.copy))) return;
    setCopied({ column: column.name, row: row + 1 });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 2400);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTableSectionElement>): void => {
    const cell = (event.target as HTMLElement).closest<HTMLElement>("td[data-row]");
    if (!cell) return;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    // Ctrl+C or Cmd+C copies the cell, unless someone has selected text inside it and means that.
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
      if (!window.getSelection()?.toString()) void copy(row, col);
      return;
    }
    if (event.altKey || event.shiftKey) return;
    let next: [number, number] | null = null;
    switch (event.key) {
      case "ArrowRight":
        next = [row, Math.min(lastColumn, col + 1)];
        break;
      case "ArrowLeft":
        next = [row, Math.max(0, col - 1)];
        break;
      case "ArrowDown":
        next = [Math.min(lastRow, row + 1), col];
        break;
      case "ArrowUp":
        next = [Math.max(0, row - 1), col];
        break;
      case "PageDown":
        next = [Math.min(lastRow, row + 10), col];
        break;
      case "PageUp":
        next = [Math.max(0, row - 10), col];
        break;
      case "Home":
        next = event.ctrlKey ? [0, 0] : [row, 0];
        break;
      case "End":
        next = event.ctrlKey ? [lastRow, lastColumn] : [row, lastColumn];
        break;
      default:
        return;
    }
    event.preventDefault();
    table.current?.querySelector<HTMLElement>(`td[data-row="${next[0]}"][data-col="${next[1]}"]`)?.focus();
  };

  const partial = total !== undefined && total > rows.length;
  const count = (value: number): ReactNode => <span className="font-medium text-foreground">{number.format(value)}</span>;
  const heightCap: CSSProperties | undefined = maxHeight === undefined ? undefined : ({ "--preview-max": typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight } as CSSProperties);

  return (
    <div
      data-slot="data-preview-table"
      data-scrolled={edges.left || undefined}
      className={cn(
        "group/preview @container w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card text-card-foreground",
        // The focus ring of the scrolling region is drawn on the card: nothing inside it, such as the pinned row numbers, can clip or cover it.
        "has-[[role=region]:focus-visible]:ring-[3px] has-[[role=region]:focus-visible]:ring-ring/40",
        className,
      )}
      {...props}
    >
      <TooltipProvider>
        <div className="relative">
          {/* One element is the region, its name and the tab stop. The scroll padding is the width of the pinned row numbers (w-12), so a cell that is
              scrolled into view lands beside them and not beneath them. The pinned header is dealt with on the cells (scroll-mt-10): padding up here
              would also scroll the rows whenever a header button takes focus. A browser leaves a cell that is only half under the row numbers where it
              is, so a cell the keyboard reaches is also cleared of them in script (clearOfPinned). */}
          <div
            ref={region}
            role="region"
            aria-label={caption}
            aria-describedby={footerId}
            tabIndex={0}
            style={heightCap}
            className={cn("relative scroll-pl-12 overflow-auto outline-none", maxHeight !== undefined && "max-h-(--preview-max)")}
          >
            <table ref={table} role="grid" aria-readonly="true" aria-label={caption} data-slot="table" className="w-full border-separate border-spacing-0 text-[0.8125rem] leading-5">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="col" className={cn(FILL, PINNED, "top-0 z-30 h-10 w-12 min-w-12 border-b px-3")}>
                    <span className="sr-only">Row number</span>
                  </TableHead>
                  {columns.map((column, c) => {
                    const numeric = column.type === "number";
                    const label = (
                      <>
                        <span className="font-medium text-foreground">{column.name}</span>
                        <Badge variant="outline" className={TYPE_CHIP}>
                          <span className="sr-only">type </span>
                          {TYPE_LABEL[column.type]}
                        </Badge>
                      </>
                    );
                    return (
                      <TableHead key={`${column.name}:${c}`} scope="col" className={cn(FILL, "sticky top-0 z-20 h-10 border-b border-border px-3 whitespace-nowrap", numeric && "text-right")}>
                        {onColumnClick ? (
                          <button
                            type="button"
                            onClick={() => onColumnClick(column, c)}
                            className={cn(
                              "-mx-2 flex h-7 items-center gap-2 rounded-md px-2 outline-none motion-safe:transition-colors motion-safe:duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40",
                              numeric && "ml-auto",
                            )}
                          >
                            {label}
                          </button>
                        ) : (
                          <span className={cn("flex items-center gap-2", numeric && "justify-end")}>{label}</span>
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>

              <TableBody onKeyDown={onKeyDown} className="[&>tr:last-child>*]:border-b-0">
                {rows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={columns.length + 1} className="px-3 py-10 text-center text-sm text-muted-foreground">
                      No rows to show.
                    </TableCell>
                  </TableRow>
                ) : null}
                {rows.map((_, r) => (
                  <TableRow key={r} className="group/row hover:bg-[color-mix(in_oklch,var(--card),var(--muted)_45%)]">
                    <TableHead
                      scope="row"
                      className={cn(PINNED, "z-10 h-auto w-12 min-w-12 border-b bg-card px-3 py-2 text-right text-xs font-normal text-muted-foreground tabular-nums group-hover/row:bg-[color-mix(in_oklch,var(--card),var(--muted)_45%)] group-focus-within/row:text-foreground")}
                    >
                      <span className="sr-only">Row </span>
                      {number.format(r + 1)}
                    </TableHead>
                    {columns.map((column, c) => {
                      const view = views[r]?.[c];
                      if (!view) return null;
                      const numeric = column.type === "number";
                      const key = `${column.name}:${c}`;
                      const cell = (
                        <TableCell
                          key={key}
                          data-row={r}
                          data-col={c}
                          data-copied={copied?.row === r + 1 && copied.column === column.name ? "" : undefined}
                          tabIndex={stop.row === r && stop.col === c ? 0 : -1}
                          onFocus={(event) => {
                            setFocus({ row: r, col: c });
                            if (region.current) clearOfPinned(region.current, event.currentTarget);
                          }}
                          className={cn(
                            "scroll-mt-10 border-b border-border px-3 py-2 whitespace-nowrap outline-none motion-safe:transition-colors motion-safe:duration-300",
                            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-[copied]:bg-muted",
                            numeric && "text-right tabular-nums",
                          )}
                        >
                          <CellText view={view} />
                        </TableCell>
                      );
                      return view.truncated ? (
                        <CellTip key={key} content={view.kind === "json" ? <span className="font-mono text-xs">{view.full}</span> : view.full}>
                          {cell}
                        </CellTip>
                      ) : (
                        cell
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </table>
          </div>
          {/* The right edge lifts while more columns wait off screen. */}
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 w-px shadow-[-4px_0_6px_-4px_oklch(0_0_0/0.14)] motion-safe:transition-opacity motion-safe:duration-150",
              edges.right ? "opacity-100" : "opacity-0",
            )}
          />
        </div>
      </TooltipProvider>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        <p id={footerId} className="tabular-nums">
          {partial ? (
            <>
              Showing {count(rows.length)} of {count(total)} rows
            </>
          ) : (
            <>
              Showing all {count(rows.length)} {rows.length === 1 ? "row" : "rows"}
            </>
          )}
          <span aria-hidden="true"> &middot; </span>
          <span className="sr-only">, </span>
          {columns.length} {columns.length === 1 ? "column" : "columns"}
        </p>
        <p aria-hidden="true" className="hidden items-center gap-1.5 @md:flex">
          {copied ? (
            <>
              <IconCheck size={14} className="text-foreground" />
              <span className="text-foreground">
                Copied {copied.column}, row {copied.row}
              </span>
            </>
          ) : (
            <>
              <KbdGroup>
                <Kbd>Ctrl</Kbd>
                <Kbd>C</Kbd>
              </KbdGroup>
              copies the focused cell
            </>
          )}
        </p>
        <p role="status" className="sr-only">
          {copied ? `Copied ${copied.column}, row ${copied.row}` : ""}
        </p>
      </div>
    </div>
  );
}
