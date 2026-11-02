"use client";

import { useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";

import { formatMoney } from "@rhs-ui/commerce/money";
import {
  WORDS,
  cheapestKeys,
  currencyName,
  fill,
  openCells,
  plainAmount,
  priceOf,
  readingOrder,
  stepFrom,
  type Cell,
  type PriceMatrixColumn,
  type PriceMatrixLabels,
  type PriceMatrixPrices,
  type PriceMatrixRow,
  type PriceMatrixValue,
} from "@rhs-ui/commerce/price-matrix/matrix";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export type { PriceMatrixColumn, PriceMatrixLabels, PriceMatrixPrices, PriceMatrixRow, PriceMatrixValue } from "@rhs-ui/commerce/price-matrix/matrix";

export interface PriceMatrixProps extends Omit<ComponentProps<"div">, "children" | "title" | "defaultValue" | "onChange"> {
  /** What goes down the side: sizes, models. */
  rows: readonly PriceMatrixRow[];
  /** What goes across the top: materials, quantities. */
  columns: readonly PriceMatrixColumn[];
  /** The price of every combination, by row id and then column id, in minor units. `null`, or no entry, means the combination is not offered: it says so and cannot be chosen. */
  prices: PriceMatrixPrices;
  /** ISO 4217 code. The grid shows plain numbers; the currency is stated once, in the caption. */
  currency?: string;
  /** Always pass your application locale, so prices are written the same on the server and in the browser. */
  locale?: string;
  /** The chosen combination, when you control it. `null` is nothing chosen. */
  value?: PriceMatrixValue | null;
  /** The combination to begin with, when the grid keeps its own state. */
  defaultValue?: PriceMatrixValue | null;
  /** Called when a combination is chosen, with it and its price in minor units. */
  onValueChange?: (value: PriceMatrixValue, amount: number) => void;
  /** Marks the cheapest combination in words. It suits sizes and materials; leave it off when the cheapest cell is only the smallest quantity. */
  markCheapest?: boolean;
  /** A heading above the grid. It also names the grid for a screen reader. */
  title?: string;
  /** The line under the heading. */
  description?: string;
  /** What the table is about, shown above the grid. The sentence about the currency follows it. */
  caption?: string;
  /** The heading's element: "h2" by default, "h3" inside a section that has its own h2. */
  headingAs?: "h2" | "h3";
  /** The words, for another language. */
  labels?: PriceMatrixLabels;
}

const cell =
  "relative flex w-full items-center justify-center rounded-lg text-sm font-medium tabular-nums outline-none transition-[background-color,color] duration-150 motion-reduce:transition-none focus-visible:z-10 focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed";

/**
 * A price grid for anything priced on two dimensions: print sizes against paper, signage against material, a tailored
 * garment against its cloth. Every price that is offered is a radio in one group named "A3, 250 g paper, 14.50", so the
 * arrow keys move between the cells (left and right along a row, up and down along a column, past combinations that are
 * not offered) and Space chooses; those combinations say "Not available" and cannot be picked. The row and the column
 * of the choice are quietly emphasised, the cheapest combination can be marked in words, and the chosen price is
 * repeated under the grid in a polite status. The currency is stated once, in the caption, and the numbers are
 * tabular. On a phone the grid becomes one list of options per row.
 */
export function PriceMatrix({
  rows,
  columns,
  prices,
  currency = "EUR",
  locale = "en-US",
  value,
  defaultValue = null,
  onValueChange,
  markCheapest = true,
  title,
  description,
  caption,
  headingAs: Heading = "h2",
  labels,
  className,
  ...props
}: PriceMatrixProps) {
  const words = { ...WORDS, ...labels };
  const id = useId();
  const [own, setOwn] = useState<PriceMatrixValue | null>(defaultValue);
  const cells = useRef(new Map<string, HTMLButtonElement>());

  const open = openCells(rows, columns, prices);
  const order = readingOrder(open);
  const cheapest = markCheapest ? cheapestKeys(rows, columns, prices) : new Set<string>();
  const money = (amount: number): string => formatMoney({ amount, currency }, locale);

  const wanted = value === undefined ? own : value;
  const wantedRow = wanted ? rows.findIndex((row) => row.id === wanted.row) : -1;
  const wantedColumn = wanted ? columns.findIndex((column) => column.id === wanted.column) : -1;
  const wantedAmount = wanted && wantedRow >= 0 && wantedColumn >= 0 ? priceOf(prices, wanted.row, wanted.column) : null;
  // A choice that points at a combination that is not offered (any more) counts as no choice.
  const chosen = wantedAmount === null ? null : { row: wantedRow, column: wantedColumn, amount: wantedAmount };
  // One tab stop for the whole grid: the chosen cell, or the first one that can be chosen.
  const stop: Cell | null = chosen ?? order[0] ?? null;

  const select = (at: Cell) => {
    const row = rows[at.row];
    const column = columns[at.column];
    const amount = row && column ? priceOf(prices, row.id, column.id) : null;
    if (!row || !column || amount === null) return;
    if (chosen && chosen.row === at.row && chosen.column === at.column) return;
    const next = { row: row.id, column: column.id };
    if (value === undefined) setOwn(next);
    onValueChange?.(next, amount);
  };

  /** Moves focus to a cell and chooses it, as the arrow keys do in any radio group. */
  const go = (layout: "grid" | "list", at: Cell | null | undefined) => {
    if (!at) return;
    cells.current.get(`${layout}:${at.row}:${at.column}`)?.focus();
    select(at);
  };

  const keys = (layout: "grid" | "list", at: Cell, event: KeyboardEvent<HTMLButtonElement>) => {
    let target: Cell | null | undefined;
    if (layout === "grid") {
      const rowCells = order.filter((candidate) => candidate.row === at.row);
      if (event.key === "ArrowRight") target = stepFrom(open, at, 0, 1);
      else if (event.key === "ArrowLeft") target = stepFrom(open, at, 0, -1);
      else if (event.key === "ArrowDown") target = stepFrom(open, at, 1, 0);
      else if (event.key === "ArrowUp") target = stepFrom(open, at, -1, 0);
      else if (event.key === "Home") target = event.ctrlKey ? order[0] : rowCells[0];
      else if (event.key === "End") target = event.ctrlKey ? order[order.length - 1] : rowCells[rowCells.length - 1];
    } else {
      // A list per row: the arrows walk the options in the order they are read, going on into the next row.
      const index = order.findIndex((candidate) => candidate.row === at.row && candidate.column === at.column);
      if (event.key === "ArrowRight" || event.key === "ArrowDown") target = order[(index + 1) % order.length];
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") target = order[(index - 1 + order.length) % order.length];
      else if (event.key === "Home") target = order[0];
      else if (event.key === "End") target = order[order.length - 1];
    }
    if (target === undefined) return;
    event.preventDefault();
    go(layout, target);
  };

  /** One combination as a radio button, for the grid and for the list. */
  const option = (layout: "grid" | "list", r: number, c: number): ReactNode => {
    const row = rows[r];
    const column = columns[c];
    if (!row || !column) return null;
    const amount = priceOf(prices, row.id, column.id);
    const offered = amount !== null;
    const selected = chosen?.row === r && chosen.column === c;
    const lowest = offered && cheapest.has(`${row.id}:${column.id}`);
    const plain = amount === null ? "" : plainAmount(amount, currency, locale);
    const name = offered
      ? `${fill(words.cell, { row: row.label, column: column.label, price: plain })}${lowest ? `, ${words.cheapest}` : ""}`
      : fill(words.cellUnavailable, { row: row.label, column: column.label, unavailable: words.unavailable });
    const key = `${layout}:${r}:${c}`;
    return (
      <button
        ref={(node) => {
          if (node) cells.current.set(key, node);
          else cells.current.delete(key);
        }}
        type="button"
        role="radio"
        aria-checked={selected}
        aria-label={name}
        disabled={!offered}
        tabIndex={stop?.row === r && stop.column === c ? 0 : -1}
        onClick={() => select({ row: r, column: c })}
        onKeyDown={(event) => keys(layout, { row: r, column: c }, event)}
        className={cn(
          cell,
          // In the list the options sit edge to edge inside a clipped card, so the ring is drawn inside the option or the card would cut it off.
          layout === "grid" ? "h-14" : "h-auto min-h-12 justify-between gap-3 rounded-none px-4 py-2 text-left focus-visible:ring-inset",
          selected ? "bg-foreground text-background" : offered ? "hover:bg-muted" : "text-muted-foreground",
          // The chosen option is filled with the text colour, and a ring of that colour inside it would not show: here it is the page colour.
          layout === "list" && selected && "focus-visible:ring-background/60",
        )}
      >
        {layout === "grid" ? (
          <>
            <span aria-hidden="true" className={cn(!offered && "text-xs font-normal")}>
              {offered ? plain : words.unavailable}
            </span>
            {lowest ? (
              <span aria-hidden="true" className={cn("absolute inset-x-0 bottom-1.5 text-center text-[0.6875rem] leading-none font-medium", selected ? "text-background/75" : "text-muted-foreground")}>
                {words.cheapest}
              </span>
            ) : null}
          </>
        ) : (
          <>
            <span aria-hidden="true" className={cn("min-w-0 text-pretty break-words", !offered && "font-normal")}>
              {column.label}
            </span>
            <span aria-hidden="true" className="flex shrink-0 items-center gap-2.5">
              {lowest ? <span className={cn("text-[0.6875rem] leading-none font-medium", selected ? "text-background/75" : "text-muted-foreground")}>{words.cheapest}</span> : null}
              <span className={cn(!offered && "text-xs font-normal")}>{offered ? plain : words.unavailable}</span>
            </span>
          </>
        )}
      </button>
    );
  };

  const note = [caption, fill(words.currencyNote, { currency: currencyName(currency, locale) })].filter(Boolean).join(" ");
  const rowName = (r: number): string => rows[r]?.label ?? "";
  const columnName = (c: number): string => columns[c]?.label ?? "";

  return (
    <div data-slot="price-matrix" className={cn("@container min-w-0", className)} {...props}>
      {title || description ? (
        <div className="mb-4">
          {title ? (
            <Heading id={`${id}-title`} className="text-xl leading-tight font-semibold tracking-[-0.03em] text-balance">
              {title}
            </Heading>
          ) : null}
          {description ? <p className="mt-1 text-sm text-pretty text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div role="radiogroup" aria-labelledby={title ? `${id}-title` : undefined} aria-label={title ? undefined : words.group}>
          <div className="hidden @2xl:block">
            <Table className="table-fixed caption-top">
              <TableCaption className="mt-0 px-5 pt-4 pb-3 text-left text-xs text-pretty">{note}</TableCaption>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="col" className="w-36 pl-5 @4xl:w-44">
                    {words.corner || <span className="sr-only">{words.option}</span>}
                  </TableHead>
                  {columns.map((column, c) => (
                    <TableHead key={column.id} scope="col" className={cn("px-1.5 text-center whitespace-normal transition-colors duration-150 motion-reduce:transition-none", c === columns.length - 1 && "pr-3.5", chosen?.column === c && "bg-muted/60 font-semibold text-foreground")}>
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, r) => (
                  <TableRow key={row.id} className="hover:bg-transparent">
                    <TableHead scope="row" className={cn("h-auto py-1.5 pr-3 pl-5 align-middle text-sm whitespace-normal text-pretty break-words transition-colors duration-150 motion-reduce:transition-none", chosen?.row === r ? "bg-muted/60 font-semibold text-foreground" : "font-medium text-foreground")}>
                      {row.label}
                    </TableHead>
                    {columns.map((column, c) => (
                      <TableCell key={column.id} className={cn("p-1.5 align-middle transition-colors duration-150 motion-reduce:transition-none", c === columns.length - 1 && "pr-3.5", chosen && (chosen.row === r || chosen.column === c) && "bg-muted/60")}>
                        {option("grid", r, c)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="@2xl:hidden">
            <p className="px-4 pt-4 text-xs text-pretty text-muted-foreground">{note}</p>
            {/* The tracks are minmax(0, 1fr), not auto: a long label then wraps inside the card and never widens it past its edge. */}
            <div className="grid grid-cols-[minmax(0,1fr)] gap-5 p-4">
              {rows.map((row, r) => (
                <div key={row.id} role="group" aria-labelledby={`${id}-row-${r}`}>
                  <p id={`${id}-row-${r}`} className={cn("mb-2 text-sm text-pretty break-words text-foreground", chosen?.row === r ? "font-semibold" : "font-medium")}>
                    {row.label}
                  </p>
                  <div className="grid grid-cols-[minmax(0,1fr)] divide-y divide-border overflow-hidden rounded-xl border border-border bg-background">
                    {columns.map((column, c) => (
                      <div key={column.id}>{option("list", r, c)}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div role="status" aria-live="polite" aria-atomic="true" className="flex items-center justify-between gap-4 border-t border-border bg-muted/30 px-5 py-4">
          {chosen ? (
            <>
              <p className="min-w-0 text-sm">
                <span className="block text-xs text-muted-foreground">{words.chosen}</span>
                <span className="block font-medium text-pretty">
                  {rowName(chosen.row)}, {columnName(chosen.column)}
                </span>
              </p>
              <p className="shrink-0 text-xl leading-none font-semibold tracking-[-0.02em] tabular-nums">{money(chosen.amount)}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{words.choose}</p>
          )}
        </div>
      </div>
    </div>
  );
}
