"use client";

import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { IconArrowDown, IconArrowRight, IconChevronDown, IconChevronRight } from "@rhs-ui/icons";
import { TableBody, TableCell, TableHead, TableRow } from "@rhs-ui/primitives/table";
import { ROW_GRID, type FieldChangeKind } from "@rhs-ui/dashboard/field-diff-table/diff";
import { cn } from "@/lib/utils";

/** The values arrive drawn: formatters are plain functions, so they run on the server, and only the two small interactions below run in the browser. */
export interface DiffRowProps {
  kind: FieldChangeKind;
  /** The field's name, for the toggle's accessible name. */
  label: string;
  /** The first cell: the name, and a badge for an added or removed value. */
  field: ReactNode;
  /** The old value. Leave it out for an unchanged field, which shows one value. */
  before?: ReactNode;
  /** The new value, or for an unchanged field its only value. */
  after: ReactNode;
  /** On a narrow container, put the old value above the new one instead of beside it. */
  stacked?: boolean;
  /** How many lines of text show before it is clamped. */
  lines: number;
}

const CELL = "min-w-0 p-0 text-sm leading-5 [overflow-wrap:anywhere]";
const CAPTION = "mb-0.5 block text-xs text-muted-foreground @xl:hidden";

/**
 * One field of the diff. A value of more than a few lines is clamped, and a
 * "Show full text" button appears only when something is actually hidden; it
 * opens both sides of the row together so they stay side by side.
 */
export function DiffRow({ kind, label, field, before, after, stacked = false, lines }: DiffRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [clipped, setClipped] = useState(false);
  const beforeBox = useRef<HTMLDivElement>(null);
  const afterBox = useRef<HTMLDivElement>(null);
  const single = before === undefined;

  useLayoutEffect(() => {
    // Open, the text is all there; keep the button so it can be closed again.
    if (expanded) return;
    const boxes = [beforeBox.current, afterBox.current].filter((box): box is HTMLDivElement => box !== null);
    const measure = (): void => setClipped(boxes.some((box) => box.scrollHeight > box.clientHeight + 1));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    for (const box of boxes) observer.observe(box);
    return () => observer.disconnect();
  }, [expanded]);

  const clamp: CSSProperties | undefined = expanded ? undefined : { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lines, overflow: "hidden" };

  return (
    <TableRow role="row" data-kind={kind} className={cn(ROW_GRID, "items-start px-4 py-3", stacked && "@max-xl:grid-cols-1")}>
      <TableHead role="rowheader" scope="row" className="col-span-full h-auto p-0 text-left font-normal whitespace-normal text-foreground @xl:col-span-1">
        {field}
      </TableHead>
      {single ? (
        <TableCell role="cell" className={cn(CELL, "col-span-full @xl:col-span-3")}>
          <div ref={afterBox} style={clamp} className="whitespace-pre-line">
            {after}
          </div>
        </TableCell>
      ) : (
        <>
          <TableCell role="cell" className={CELL}>
            <span aria-hidden="true" className={CAPTION}>
              Before
            </span>
            <div ref={beforeBox} style={clamp} className="whitespace-pre-line">
              {before}
            </div>
          </TableCell>
          <TableCell role="cell" aria-hidden="true" className={cn("flex h-5 items-center p-0 text-muted-foreground", stacked ? "justify-start @xl:justify-center" : "justify-center")}>
            {stacked ? <IconArrowDown size={14} className="@xl:hidden" /> : null}
            <IconArrowRight size={14} className={stacked ? "hidden @xl:block" : undefined} />
          </TableCell>
          <TableCell role="cell" className={CELL}>
            <span aria-hidden="true" className={CAPTION}>
              After
            </span>
            <div ref={afterBox} style={clamp} className="whitespace-pre-line">
              {after}
            </div>
          </TableCell>
        </>
      )}
      {clipped ? (
        <TableCell role="cell" className="col-span-full p-0 @xl:col-span-3 @xl:col-start-2">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((open) => !open)}
            className="inline-flex items-center gap-1 rounded-sm text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            {expanded ? "Show less" : "Show full text"}
            <span className="sr-only"> of {label}</span>
            <IconChevronDown size={12} aria-hidden="true" className={cn("motion-safe:transition-transform motion-safe:duration-150", expanded && "rotate-180")} />
          </button>
        </TableCell>
      ) : null}
    </TableRow>
  );
}

export interface UnchangedFieldsProps {
  /** How many fields are folded away. */
  count: number;
  /** The rows of the unchanged fields. */
  children: ReactNode;
}

/** The fields that did not change, folded under one line that says how many there are. */
export function UnchangedFields({ count, children }: UnchangedFieldsProps) {
  const [open, setOpen] = useState(false);
  const rows = useId();
  return (
    <>
      <TableBody role="rowgroup" className="block border-t border-border">
        <TableRow role="row" className="block">
          <TableCell role="cell" className="block p-0">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={rows}
              onClick={() => setOpen((value) => !value)}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-[0.8125rem] font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40"
            >
              <IconChevronRight size={14} aria-hidden="true" className={cn("shrink-0 motion-safe:transition-transform motion-safe:duration-150", open && "rotate-90")} />
              {count} unchanged {count === 1 ? "field" : "fields"}
            </button>
          </TableCell>
        </TableRow>
      </TableBody>
      <TableBody id={rows} role="rowgroup" hidden={!open} className={cn("border-t border-border bg-muted/30 text-muted-foreground", open ? "block" : "hidden")}>
        {children}
      </TableBody>
    </>
  );
}
