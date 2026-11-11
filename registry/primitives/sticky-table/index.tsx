"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode, type Ref } from "react";

import { Table } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export interface StickyTableProps extends Omit<ComponentProps<"div">, "children" | "aria-label" | "ref"> {
  /** Names the scroll box for assistive technology: "Orders, scrollable". Required, because the box can take focus and a focusable region needs a name. */
  label: string;
  /** How tall the box may grow before its rows scroll under the header: a number of pixels or any CSS length. Default "24rem". */
  maxHeight?: number | string;
  /** How many leading columns stay in place while the rest scrolls sideways, from 0 to 3. Default 0. */
  stickyColumns?: 0 | 1 | 2 | 3;
  /** The table parts, as you would write them inside a Table: a TableCaption, a TableHeader, a TableBody and a TableFooter. */
  children: ReactNode;
  /** Classes for the table itself. A table scrolls sideways when its columns want more room than the box has: give it a `min-w-*` or its cells `whitespace-nowrap`. */
  tableClassName?: string;
  /** A ref to the scrolling box, to move its scroll position or listen to it. */
  scrollRef?: Ref<HTMLDivElement>;
}

// Borders live on the cells here. The separate border model keeps a cell's own border with the cell when it sticks, where a collapsed one would scroll away from a pinned cell; rows have no border of their own in it.
const TABLE = cn(
  "border-separate border-spacing-0",
  "[&_th]:border-b [&_th]:border-border [&_td]:border-b [&_td]:border-border [&_tbody_tr:last-child_td]:border-b-0 [&_tfoot_td]:border-t [&_tfoot_th]:border-t [&_tfoot_td]:border-b-0",
  // The header stays under the top edge. Its cells are solid, so rows never show through it in either theme.
  "[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10 [&_thead_th]:bg-card",
  // Where a pinned cell sits: after the pinned cells before it, whose widths are measured.
  "[&_tr>:nth-child(1)]:left-0 [&_tr>:nth-child(2)]:left-[var(--pin-1)] [&_tr>:nth-child(3)]:left-[var(--pin-2)]",
);

// A pinned cell is sticky and solid, and takes the row's hover and selected tint as a solid colour, since it must not be see-through. The header corner stays above both the header and the pinned column.
const PINNED = {
  1: "data-[pinned=1]:[&_tr>:nth-child(-n+1)]:sticky data-[pinned=1]:[&_tr>:nth-child(-n+1)]:z-5 data-[pinned=1]:[&_tr>:nth-child(-n+1)]:bg-card data-[pinned=1]:[&_thead_tr>:nth-child(-n+1)]:z-20 data-[pinned=1]:[&_tbody_tr:hover>:nth-child(-n+1)]:bg-(--pin-tint) data-[pinned=1]:[&_tfoot_tr>:nth-child(-n+1)]:bg-(--pin-tint) data-[pinned=1]:[&_tr[data-state=selected]>:nth-child(-n+1)]:bg-muted",
  2: "data-[pinned=2]:[&_tr>:nth-child(-n+2)]:sticky data-[pinned=2]:[&_tr>:nth-child(-n+2)]:z-5 data-[pinned=2]:[&_tr>:nth-child(-n+2)]:bg-card data-[pinned=2]:[&_thead_tr>:nth-child(-n+2)]:z-20 data-[pinned=2]:[&_tbody_tr:hover>:nth-child(-n+2)]:bg-(--pin-tint) data-[pinned=2]:[&_tfoot_tr>:nth-child(-n+2)]:bg-(--pin-tint) data-[pinned=2]:[&_tr[data-state=selected]>:nth-child(-n+2)]:bg-muted",
  3: "data-[pinned=3]:[&_tr>:nth-child(-n+3)]:sticky data-[pinned=3]:[&_tr>:nth-child(-n+3)]:z-5 data-[pinned=3]:[&_tr>:nth-child(-n+3)]:bg-card data-[pinned=3]:[&_thead_tr>:nth-child(-n+3)]:z-20 data-[pinned=3]:[&_tbody_tr:hover>:nth-child(-n+3)]:bg-(--pin-tint) data-[pinned=3]:[&_tfoot_tr>:nth-child(-n+3)]:bg-(--pin-tint) data-[pinned=3]:[&_tr[data-state=selected]>:nth-child(-n+3)]:bg-muted",
} as const;

// A shadow is an inset shadow on a thin strip laid over the box: it runs unbroken along an edge, which one shadow per cell cannot. Black in both themes, stronger on a dark page.
const STRIP = "pointer-events-none absolute z-30 opacity-0 transition-opacity duration-150 data-[on]:opacity-100 motion-reduce:transition-none";

interface Edges {
  /** The content has moved left: something is under the pinned columns. */
  left: boolean;
  /** There is more to the right. */
  right: boolean;
  /** The content has moved up: rows are under the header. */
  top: boolean;
  /** There is more below. */
  bottom: boolean;
}

const AT_REST: Edges = { left: false, right: false, top: false, bottom: false };

/**
 * A table in its own scroll box with a header that stays under the top edge and, if you ask, leading columns that stay
 * at the left edge while the rest scrolls sideways. Soft shadows appear only while there is something to see: under the
 * header once rows have moved beneath it, beside the pinned columns once the table has moved sideways, and along the
 * right and bottom edges while there is more to scroll. Every sticky cell has a solid background, so nothing shows
 * through in either theme. The box takes keyboard focus and carries the label you give it, so a keyboard user can scroll
 * it with the arrow keys. Give it the Table parts as children (TableHeader, TableBody...), not a Table.
 */
export function StickyTable({ label, maxHeight = "24rem", stickyColumns = 0, tableClassName, scrollRef, className, style, children, ...props }: StickyTableProps) {
  const frame = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edges>(AT_REST);
  useImperativeHandle(scrollRef, () => box.current as HTMLDivElement, []);

  /** Where the box is scrolled: only a change in what is under which edge re-renders. */
  const readEdges = useCallback(() => {
    const element = box.current;
    if (!element) return;
    const next: Edges = {
      left: element.scrollLeft > 0.5,
      right: element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
      top: element.scrollTop > 0.5,
      bottom: element.scrollTop + element.clientHeight < element.scrollHeight - 1,
    };
    setEdges((previous) => (previous.left === next.left && previous.right === next.right && previous.top === next.top && previous.bottom === next.bottom ? previous : next));
  }, []);

  /** The sizes the pinned cells and the shadows are placed from: the width of each pinned column, the height of the header, the room the scrollbars take. */
  const readSizes = useCallback(() => {
    const element = box.current;
    const outer = frame.current;
    if (!element || !outer) return;
    const row = element.querySelector("tr");
    const cells = row ? Array.from(row.children).slice(0, stickyColumns) : [];
    let offset = 0;
    cells.forEach((cell, index) => {
      // A pinned cell sits after the ones before it, and the cells read these two from the box.
      if (index > 0) element.style.setProperty(`--pin-${index}`, `${offset}px`);
      offset += cell.getBoundingClientRect().width;
    });
    outer.style.setProperty("--pin-width", `${offset}px`);
    outer.style.setProperty("--pin-head", `${element.querySelector("thead tr")?.getBoundingClientRect().height ?? 0}px`);
    outer.style.setProperty("--bar-x", `${element.offsetWidth - element.clientWidth}px`);
    outer.style.setProperty("--bar-y", `${element.offsetHeight - element.clientHeight}px`);
  }, [stickyColumns]);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const update = () => {
      readSizes();
      readEdges();
    };
    update();
    // The box changes size with the window, and the table with its rows and its columns.
    const observer = new ResizeObserver(update);
    observer.observe(element);
    const table = element.querySelector("table");
    if (table) observer.observe(table);
    return () => observer.disconnect();
  }, [readSizes, readEdges, maxHeight]);

  return (
    <div
      data-slot="sticky-table"
      ref={frame}
      // The focus ring is drawn on the frame: on the scroll box inside, the sticky header would paint over its top edge and the rounded frame would cut its corners.
      className={cn(
        "relative isolate overflow-hidden rounded-xl border border-border bg-card shadow-xs",
        "has-[[role=region]:focus-visible]:border-ring has-[[role=region]:focus-visible]:ring-[3px] has-[[role=region]:focus-visible]:ring-ring/40",
        className,
      )}
      style={{ "--pin-tint": "color-mix(in oklab, var(--card), var(--muted) 50%)", ...style } as CSSProperties}
      {...props}
    >
      <div
        ref={box}
        role="region"
        aria-label={label}
        tabIndex={0}
        data-pinned={stickyColumns || undefined}
        onScroll={readEdges}
        style={{ maxHeight }}
        className={cn(
          "relative overflow-auto overscroll-contain [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]",
          "outline-none",
          // The Table brings a scroll container of its own; here the box is the one that scrolls, or the header would have nothing to stick to.
          "[&>[data-slot=table-container]]:overflow-visible",
          stickyColumns ? PINNED[stickyColumns] : undefined,
        )}
      >
        <Table className={cn(TABLE, tableClassName)}>{children}</Table>
      </div>
      <span
        aria-hidden="true"
        data-edge="header"
        data-on={edges.top || undefined}
        className={cn(STRIP, "left-0 h-3 right-[var(--bar-x,0px)] top-[var(--pin-head,0px)] shadow-[inset_0_8px_8px_-8px_rgb(0_0_0/0.16)] dark:shadow-[inset_0_8px_8px_-8px_rgb(0_0_0/0.6)]")}
      />
      {stickyColumns > 0 ? (
        <span
          aria-hidden="true"
          data-edge="pinned"
          data-on={edges.left || undefined}
          className={cn(STRIP, "top-0 w-3 bottom-[var(--bar-y,0px)] left-[var(--pin-width,0px)] shadow-[inset_8px_0_8px_-8px_rgb(0_0_0/0.16)] dark:shadow-[inset_8px_0_8px_-8px_rgb(0_0_0/0.6)]")}
        />
      ) : null}
      <span
        aria-hidden="true"
        data-edge="right"
        data-on={edges.right || undefined}
        className={cn(STRIP, "top-0 w-3 bottom-[var(--bar-y,0px)] right-[var(--bar-x,0px)] shadow-[inset_-8px_0_8px_-8px_rgb(0_0_0/0.16)] dark:shadow-[inset_-8px_0_8px_-8px_rgb(0_0_0/0.6)]")}
      />
      <span
        aria-hidden="true"
        data-edge="bottom"
        data-on={edges.bottom || undefined}
        className={cn(STRIP, "left-0 h-3 right-[var(--bar-x,0px)] bottom-[var(--bar-y,0px)] shadow-[inset_0_-8px_8px_-8px_rgb(0_0_0/0.16)] dark:shadow-[inset_0_-8px_8px_-8px_rgb(0_0_0/0.6)]")}
      />
    </div>
  );
}
