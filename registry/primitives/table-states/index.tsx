"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconFilter, IconInbox, IconRefresh } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { TableCell, TableRow } from "@rhs-ui/primitives/table";
import { BAR_WIDTHS, DEFAULT_STATE_LABELS, defaultCopy, fillNoun, type TableBodyStateKind, type TableStateLabels } from "@rhs-ui/primitives/table-states/words";
import { cn } from "@/lib/utils";

export type { TableBodyStateKind, TableStateLabels } from "@rhs-ui/primitives/table-states/words";

export interface TableBodyStateProps extends Omit<ComponentProps<"tbody">, "children" | "title" | "ref"> {
  /** Which state to show: `loading` (skeleton rows), `empty` (nothing exists yet), `filtered-empty` (filters hide everything) or `error` (the load failed). */
  state: TableBodyStateKind;
  /** How many columns the table has. The message spans all of them and each skeleton row draws this many cells, so loading has the shape of the rows that follow. */
  columnCount: number;
  /** How many skeleton rows to draw while loading. Make it about as many as a page shows. Default 5. */
  rowCount?: number;
  /** Which columns hold figures on the right, by place from 0: `[2]` for a table whose third column is right-aligned. Their skeleton bars sit on the right too, under the heading. */
  alignEnd?: readonly number[];
  /** What the rows are, in the plural: "orders". It writes the default words and what a screen reader hears. Default "rows". */
  noun?: string;
  /** The heading of a message state, when the default ("No orders yet") is not what you want to say. */
  title?: string;
  /** The line under the heading. For `error` say what failed in plain words. */
  description?: string;
  /** An action under the message: "Create an order". It shows in every message state, next to the built-in buttons. */
  action?: ReactNode;
  /** The filters that are on, as short phrases ("Status: Shipped"). They are listed in the `filtered-empty` state so people see why nothing matched. */
  filters?: readonly string[];
  /** Called by the Retry button of the `error` state. Without it there is no button. */
  onRetry?: () => void;
  /** Called by the "Clear filters" button of the `filtered-empty` state. Without it there is no button. */
  onClear?: () => void;
  /** The words the state says, for translation. */
  labels?: Partial<TableStateLabels>;
}

const ICONS = { empty: IconInbox, "filtered-empty": IconFilter, error: IconAlertCircle } as const;

/** The words of a live region, handed over a moment after it mounts: a region that is born with its text is often never read. */
function useLateText(text: string): string {
  const [said, setSaid] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setSaid(text), 120);
    return () => window.clearTimeout(timer);
  }, [text]);
  return said;
}

/**
 * What a table body shows when it has no rows to show, kept inside the table: it is a `<tbody>` you put where the
 * `TableBody` would be, so the header stays where it is from one state to the next. Loading draws skeleton rows with the
 * table's own column count and says "Loading orders" once to a screen reader. Empty gives a title, a line and an optional
 * action. Filtered-empty names the filters that are on and offers "Clear filters". Error says what failed in plain words
 * and offers Retry. A message is one cell across all columns, so it reads as one message and not as an empty row; its text
 * goes to assistive technology through a status region that exists before the words do, and the buttons stay outside it.
 * For the columns to hold their widths when the rows arrive too, give the table `table-fixed` and widths on its header
 * cells: a table that sizes its columns to what is in them re-flows whenever that changes, and no body can prevent it.
 * Retry and Clear filters leave with the state they cause, and the focus on them would drop to the page: while this body
 * stays mounted it takes that focus itself. When you swap it for your own rows, move focus yourself, to the table or its first row.
 */
export function TableBodyState({
  state,
  columnCount,
  rowCount = 5,
  alignEnd = [],
  noun = "rows",
  title,
  description,
  action,
  filters = [],
  onRetry,
  onClear,
  labels,
  className,
  ...props
}: TableBodyStateProps) {
  const words = { ...DEFAULT_STATE_LABELS, ...labels };
  const span = Math.max(1, columnCount);
  const copy = state === "loading" ? null : defaultCopy(state, noun);
  const heading = title ?? copy?.title ?? "";
  const detail = description ?? copy?.description ?? "";
  const said = useLateText(state === "loading" ? fillNoun(words.loading, noun) : [heading, detail].filter(Boolean).join(". "));

  // Retry and Clear filters are removed by the state change they cause, and a removed element takes the focus with it: the browser leaves the
  // focus on the page and a keyboard user starts again from the top. The body is one element through every state, so it takes the focus instead.
  const body = useRef<HTMLTableSectionElement>(null);
  const focused = useRef<Element | null>(null);
  useEffect(() => {
    const node = body.current;
    if (!node) return;
    const remember = (event: FocusEvent) => {
      focused.current = event.target instanceof Element ? event.target : null;
    };
    node.addEventListener("focusin", remember);
    return () => node.removeEventListener("focusin", remember);
  }, []);
  // After every render: if what had focus inside the body is gone and nothing else has the focus, the body takes it. Focus that went
  // somewhere else stays there; only an element that was removed sets this off.
  useLayoutEffect(() => {
    const was = focused.current;
    if (!was || was.isConnected) return;
    focused.current = null;
    const now = document.activeElement;
    if (now === null || now === document.body) body.current?.focus({ preventScroll: true });
  });

  if (state === "loading") {
    return (
      <tbody ref={body} tabIndex={-1} data-slot="table-states" data-state="loading" aria-busy="true" className={cn("outline-none [&_tr:last-child]:border-0", className)} {...props}>
        {Array.from({ length: Math.max(1, rowCount) }, (_, row) => (
          // The first cell carries the one announcement; everything else is decoration and stays out of the accessibility tree.
          <TableRow key={row} aria-hidden={row === 0 ? undefined : true} className="hover:bg-transparent">
            {Array.from({ length: span }, (_, column) => (
              <TableCell key={column} aria-hidden={row === 0 && column === 0 ? undefined : true}>
                {/* A line box as tall as a line of text, so the rows are as tall as the rows that replace them. */}
                <div className={cn("flex h-5 items-center", alignEnd.includes(column) && "justify-end")}>
                  <Skeleton delay={row * 90 + column * 30} className={cn("h-3.5 w-full", BAR_WIDTHS[column === 0 ? 0 : (column + row) % BAR_WIDTHS.length])} />
                </div>
                {row === 0 && column === 0 ? (
                  <span role="status" className="sr-only">
                    {said}
                  </span>
                ) : null}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </tbody>
    );
  }

  const Icon = ICONS[state];
  return (
    <tbody ref={body} tabIndex={-1} data-slot="table-states" data-state={state} className={cn("outline-none [&_tr:last-child]:border-0", className)} {...props}>
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={span} data-density-skip className="relative px-4 py-12 whitespace-normal">
          <div className="mx-auto flex max-w-sm flex-col items-center text-center">
            <span
              aria-hidden="true"
              className={cn(
                "grid size-10 place-items-center rounded-full border [&_svg]:size-[1.125rem]",
                state === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-border bg-muted text-muted-foreground",
              )}
            >
              <Icon />
            </span>
            {/* What is drawn here is also in the status region below, which is the copy assistive technology reads. */}
            <p aria-hidden="true" className="mt-4 text-sm font-medium text-balance text-foreground">
              {heading}
            </p>
            {detail ? (
              <p aria-hidden="true" className="mt-1 text-sm text-pretty text-muted-foreground">
                {detail}
              </p>
            ) : null}
            {state === "filtered-empty" && filters.length > 0 ? (
              <ul aria-label={words.filters} className="mt-4 flex flex-wrap justify-center gap-1.5">
                {filters.map((filter, index) => (
                  <li key={`${index}-${filter}`} className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-foreground">
                    {filter}
                  </li>
                ))}
              </ul>
            ) : null}
            {(state === "error" && onRetry) || (state === "filtered-empty" && onClear) || action ? (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {state === "error" && onRetry ? (
                  <Button type="button" size="sm" variant="outline" onClick={onRetry}>
                    <IconRefresh aria-hidden="true" />
                    {words.retry}
                  </Button>
                ) : null}
                {state === "filtered-empty" && onClear ? (
                  <Button type="button" size="sm" variant="outline" onClick={onClear}>
                    {words.clear}
                  </Button>
                ) : null}
                {action}
              </div>
            ) : null}
            <span role="status" className="sr-only">
              {said}
            </span>
          </div>
        </TableCell>
      </TableRow>
    </tbody>
  );
}
