"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type ClipboardEvent, type ComponentProps, type KeyboardEvent } from "react";

import { IconAlertCircle } from "@rhs-ui/icons";
import { formatMoney } from "@rhs-ui/commerce/money";
import {
  belowMinimum,
  clampQuantity,
  fillBlock,
  isLow,
  limitOf,
  parseBlock,
  quantityOf,
  totalsOf,
  withQuantity,
  type OrderMatrixColumn,
  type OrderMatrixOrder,
  type OrderMatrixQuantities,
  type OrderMatrixRow,
  type OrderMatrixStock,
} from "@rhs-ui/commerce/order-matrix/matrix";
import { Button } from "@rhs-ui/primitives/button";
import { fieldSurface } from "@rhs-ui/primitives/input";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export type { OrderMatrixColumn, OrderMatrixLine, OrderMatrixOrder, OrderMatrixQuantities, OrderMatrixRow, OrderMatrixStock } from "@rhs-ui/commerce/order-matrix/matrix";

export interface OrderMatrixLabels {
  /** The corner of the grid, above the row names: "Colour". */
  rowHeader?: string;
  /** The head of the totals column and the name of the totals row. */
  total?: string;
  /** The name of the grid for a screen reader. */
  caption?: string;
  /** The name of one field. `{row}` and `{column}`: "Navy, size M". */
  cell?: string;
  /** Under a cell with little stock. `{count}`. */
  left?: string;
  /** Under a cell that is sold out, in the place of "3 left". A screen reader hears it too. */
  soldOut?: string;
  /** For a screen reader, on a cell that is not made in that size. */
  unavailable?: string;
  /** Said when a quantity is held to the stock. `{cell}` and `{count}`. */
  onlyLeft?: string;
  /** Said after a cell changes, with the totals it moved. `{cell}`, `{count}`, `{rowTotal}`, `{columnTotal}` and `{pieces}`, which is "36 pieces". */
  changed?: string;
  /** Said after Clear. */
  cleared?: string;
  /** A number of pieces when there is one. `{count}`. */
  piecesOne?: string;
  /** A number of pieces for any other count. `{count}`. */
  piecesOther?: string;
  /** Under the total. `{price}`. */
  each?: string;
  /** Where the total goes while nothing is ordered. */
  none?: string;
  /** The notice for a cell below the minimum. `{min}` and `{cells}`. */
  minimum?: string;
  /** The tip under the grid, for a keyboard and a pointer. */
  hint?: string;
  /** The tip under the grid when it scrolls sideways. */
  scroll?: string;
  /** The Add button while nothing is ordered. */
  add?: string;
  /** The button with something to add. `{count}` is "36 pieces". */
  addCount?: string;
  /** The button that empties the grid. */
  clear?: string;
  /** Said after a paste. `{count}` and `{pieces}`. */
  pasted?: string;
  /** Said when a paste held nothing that fits the grid. */
  pastedNone?: string;
}

const WORDS = {
  rowHeader: "Colour",
  total: "Total",
  caption: "Quantities to order, by colour and size",
  cell: "{row}, size {column}",
  left: "{count} left",
  soldOut: "Sold out",
  unavailable: "Not available in this size",
  onlyLeft: "Only {count} in stock for {cell}. The quantity is set to {count}.",
  changed: "{cell}: {count}. Row total {rowTotal}, column total {columnTotal}, order total {pieces}.",
  cleared: "The grid is cleared.",
  piecesOne: "{count} piece",
  piecesOther: "{count} pieces",
  each: "{price} each",
  none: "Nothing to order yet",
  minimum: "Order at least {min} of a size, or none. Check {cells}.",
  hint: "Paste numbers from a spreadsheet to fill the grid. Arrow keys move between cells.",
  scroll: "Scroll sideways to see every size.",
  add: "Add to order",
  addCount: "Add {count} to order",
  clear: "Clear",
  pasted: "Filled {count} cells from the pasted numbers. Order total {pieces}.",
  pastedNone: "Nothing in the pasted text fits the grid.",
} satisfies Required<OrderMatrixLabels>;

export interface OrderMatrixProps extends Omit<ComponentProps<"div">, "children" | "onChange" | "defaultValue"> {
  /** The variants down the side: colours, or widths. */
  rows: readonly OrderMatrixRow[];
  /** The sizes across the top. */
  columns: readonly OrderMatrixColumn[];
  /** What can be ordered per cell, by row id and column id. A cell that is not listed is not made in that size and is disabled; zero is sold out. Without it nothing is limited. */
  stock?: OrderMatrixStock;
  /** The quantities, by row id and column id, when you control them. */
  value?: OrderMatrixQuantities;
  /** The quantities to start from, when the grid keeps its own state. */
  defaultValue?: OrderMatrixQuantities;
  /** Called with the new quantities on every change. A cell at zero is left out of the object. */
  onChange?: (value: OrderMatrixQuantities) => void;
  /** The smallest quantity the supplier sells per size. Below it, but above zero, a cell is flagged and the order cannot be added. Defaults to 0, which means no minimum. */
  minPerCell?: number;
  /** The price of one piece, in minor units. Without it the grid counts pieces and shows no money. */
  unitPrice?: number;
  /** ISO 4217 code of the price. */
  currency?: string;
  /** Always pass your application locale, so numbers and prices are written the same on the server and in the browser. */
  locale?: string;
  /** With this many left or fewer, a cell says how many are left. Defaults to 5. */
  lowStockAt?: number;
  /** A heading for the grid. */
  title?: string;
  /** Under the heading. */
  description?: string;
  /** Called by "Add all" with every line and the totals. Return a promise and the button shows it is working. Without it there is no button. */
  onAddAll?: (order: OrderMatrixOrder) => void | Promise<void>;
  /** The words, for another language. */
  labels?: OrderMatrixLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** One cell: the field surface every RHS UI input shares, with only the size, the filled and the disabled looks of the grid on top. */
const field = cn(
  fieldSurface,
  "h-10 w-14 text-center tabular-nums sm:h-9",
  "transition-[border-color,box-shadow,background-color] duration-150 motion-reduce:transition-none",
  "placeholder:text-muted-foreground/80 hover:border-foreground/30",
  "aria-invalid:bg-destructive/5",
  "disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none disabled:hover:border-transparent",
  "data-[filled]:border-foreground/50 data-[filled]:bg-muted data-[filled]:font-semibold",
);

/**
 * The pinned first column draws its divider as an inset shadow: a collapsed table border stays behind where the cell
 * started, while a shadow travels with the sticky cell, so the line is still there once the grid has scrolled. The row
 * the keyboard is in adds a bar at the left edge to the same shadow, because a second shadow class would replace it.
 */
const edge = "shadow-[inset_-1px_0_0_var(--border)]";
const edgeActive = "shadow-[inset_2px_0_0_var(--foreground),inset_-1px_0_0_var(--border)]";

/**
 * The wholesale order form for fashion and footwear: the variants down the side, the sizes across the top and a small
 * quantity field in every cell. A sold-out cell is disabled and says "Sold out" under the field, low stock says how
 * many are left, a size that is not made is a dash, and the row, column and order totals update as a polite status.
 * Arrow keys move between cells like a grid (Enter goes down), and pasting a block of numbers from a spreadsheet
 * fills the grid from the cell you are in. It is a real table with row and column headers, so every field is named
 * "Navy, size M". A quantity is held to its stock and said so, a quantity below the minimum per size is flagged, and
 * when a wide grid scrolls sideways its first column stays in view (with a divider that travels with it), a field
 * the keyboard reaches is scrolled clear of that column, and a line under the grid says that it scrolls. Rows keep
 * one height, so a grid with stock hints does not jump.
 */
export function OrderMatrix({
  rows,
  columns,
  stock,
  value,
  defaultValue,
  onChange,
  minPerCell = 0,
  unitPrice,
  currency = "EUR",
  locale = "en-US",
  lowStockAt = 5,
  title,
  description,
  onAddAll,
  labels,
  className,
  ...props
}: OrderMatrixProps) {
  const words = { ...WORDS, ...labels };
  const id = useId();
  const [own, setOwn] = useState<OrderMatrixQuantities>(defaultValue ?? {});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  // The cell the keyboard is in: its row name and its size are drawn stronger, so the eye finds them in a wide grid.
  const [at, setAt] = useState<{ row: number; column: number } | null>(null);
  const cells = useRef(new Map<string, HTMLInputElement>());
  // Whether the grid is wider than its frame, so the tip about scrolling sideways is only said when it is true.
  const frame = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(false);
  useEffect(() => {
    const scroller = frame.current?.querySelector<HTMLElement>("[data-slot=table-container]");
    if (!scroller) return;
    const pinned = scroller.querySelector<HTMLElement>("thead th");
    const measure = () => {
      setScrolls(scroller.scrollWidth > scroller.clientWidth + 1);
      // The first column stays in view, so a field the keyboard reaches has to stop short of it instead of sliding under it.
      if (pinned) scroller.style.scrollPaddingLeft = `${pinned.offsetWidth}px`;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);
    return () => observer.disconnect();
  }, []);

  const current = value ?? own;
  const totals = totalsOf(rows, columns, current);
  const number = new Intl.NumberFormat(locale);
  const plural = new Intl.PluralRules(locale);
  const pieces = (count: number): string => fill(plural.select(count) === "one" ? words.piecesOne : words.piecesOther, { count: number.format(count) });
  const nameOf = (row: OrderMatrixRow, column: OrderMatrixColumn): string => fill(words.cell, { row: row.label, column: column.label });

  const commit = (next: OrderMatrixQuantities) => {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };

  const tooSmall = minPerCell > 0 ? rows.flatMap((row) => columns.filter((column) => belowMinimum(quantityOf(current, row.id, column.id), minPerCell)).map((column) => nameOf(row, column))) : [];

  /** Moves focus along a row or a column to the next field that can be typed in. */
  const move = (rowIndex: number, columnIndex: number, down: number, across: number) => {
    let r = rowIndex + down;
    let c = columnIndex + across;
    while (r >= 0 && r < rows.length && c >= 0 && c < columns.length) {
      const target = cells.current.get(`${r}:${c}`);
      if (target && !target.disabled) {
        target.focus();
        return;
      }
      r += down;
      c += across;
    }
  };

  const change = (rowIndex: number, columnIndex: number, event: ChangeEvent<HTMLInputElement>) => {
    const row = rows[rowIndex];
    const column = columns[columnIndex];
    if (!row || !column) return;
    const limit = limitOf(stock, row.id, column.id) ?? 0;
    const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
    const asked = digits === "" ? 0 : Number.parseInt(digits, 10);
    const quantity = clampQuantity(asked, limit);
    const next = withQuantity(current, row.id, column.id, quantity);
    const after = totalsOf(rows, columns, next);
    const said = fill(words.changed, {
      cell: nameOf(row, column),
      count: number.format(quantity),
      rowTotal: number.format(after.rows[row.id] ?? 0),
      columnTotal: number.format(after.columns[column.id] ?? 0),
      pieces: pieces(after.pieces),
    });
    setNote(asked > quantity ? `${fill(words.onlyLeft, { cell: nameOf(row, column), count: number.format(limit) })} ${said}` : said);
    commit(next);
  };

  const keys = (rowIndex: number, columnIndex: number, event: KeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const go = (down: number, across: number) => {
      event.preventDefault();
      move(rowIndex, columnIndex, down, across);
    };
    if (event.key === "ArrowUp") go(-1, 0);
    else if (event.key === "ArrowDown") go(1, 0);
    else if (event.key === "Enter") go(event.shiftKey ? -1 : 1, 0);
    else if (event.key === "ArrowLeft" && input.selectionStart === 0) go(0, -1);
    else if (event.key === "ArrowRight" && input.selectionEnd === input.value.length) go(0, 1);
  };

  const paste = (rowIndex: number, columnIndex: number, event: ClipboardEvent<HTMLInputElement>) => {
    const block = parseBlock(event.clipboardData.getData("text"));
    // One value is not a block: the field takes it as if it were typed.
    if (!block) return;
    event.preventDefault();
    const { next, filled } = fillBlock(block, { row: rowIndex, column: columnIndex }, rows, columns, stock, current);
    if (filled > 0) commit(next);
    setNote(filled > 0 ? fill(words.pasted, { count: number.format(filled), pieces: pieces(totalsOf(rows, columns, next).pieces) }) : words.pastedNone);
  };

  const order: OrderMatrixOrder = { lines: totals.lines, pieces: totals.pieces, ...(unitPrice === undefined ? {} : { total: totals.pieces * unitPrice }) };
  const addAll = async () => {
    if (!onAddAll) return;
    const result = onAddAll(order);
    if (result && typeof (result as Promise<void>).then === "function") {
      setBusy(true);
      try {
        await result;
      } finally {
        setBusy(false);
      }
    }
  };

  const clear = () => {
    commit({});
    setNote(words.cleared);
  };

  const sticky = "sticky left-0 z-10";
  const money = unitPrice === undefined ? undefined : formatMoney({ amount: totals.pieces * unitPrice, currency }, locale);
  // When any cell says how many are left, or that it is sold out, every row keeps room for that line, so the rows stay one height.
  const anyHint = rows.some((row) =>
    columns.some((column) => {
      const limit = limitOf(stock, row.id, column.id);
      return limit === 0 || isLow(limit, lowStockAt);
    }),
  );

  return (
    <div
      ref={frame}
      data-slot="order-matrix"
      className={cn("overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs [&_[data-slot=table-container]]:scroll-pl-28", className)}
      {...props}
    >
      {title || description ? (
        <div className="grid gap-1 px-5 pt-5 pb-4">
          {title ? <h3 className="text-base font-semibold tracking-[-0.02em]">{title}</h3> : null}
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}

      <Table className="min-w-max">
        <TableCaption className="sr-only">{words.caption}</TableCaption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" className={cn(sticky, edge, "min-w-24 bg-card pl-4 sm:min-w-28 sm:pl-5")}>
              {words.rowHeader}
            </TableHead>
            {columns.map((column, c) => (
              <TableHead key={column.id} scope="col" className={cn("px-1 text-center font-medium transition-colors duration-150 motion-reduce:transition-none", at?.column === c ? "font-semibold text-foreground" : "text-muted-foreground")}>
                {column.label}
              </TableHead>
            ))}
            <TableHead scope="col" className="pr-5 text-right">
              {words.total}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, r) => (
            <TableRow key={row.id} className="hover:bg-transparent">
              <TableHead scope="row" className={cn(sticky, at?.row === r ? edgeActive : edge, "h-auto bg-card py-1.5 pl-4 align-top text-foreground sm:pl-5")}>
                <span className="flex h-10 items-center gap-2.5 sm:h-9">
                  {row.swatch ? <span aria-hidden="true" className="size-4 shrink-0 rounded-full border border-foreground/15" style={{ background: row.swatch }} /> : null}
                  <span className={cn("font-medium", at?.row === r && "font-semibold")}>{row.label}</span>
                </span>
              </TableHead>
              {columns.map((column, c) => {
                const limit = limitOf(stock, row.id, column.id);
                const quantity = quantityOf(current, row.id, column.id);
                const out = limit === null || limit === 0;
                const soldOut = limit === 0;
                const low = isLow(limit, lowStockAt);
                const describedBy = `${id}-${r}-${c}`;
                // Said under the field, in words: sold out, or how few are left. A cell that is not made says nothing: its dash is enough, and a screen reader hears why.
                const hint = soldOut ? words.soldOut : low ? fill(words.left, { count: number.format(limit ?? 0) }) : null;
                return (
                  <TableCell key={column.id} className="px-1 py-1.5 align-top">
                    <div className="grid justify-items-center gap-1">
                      <input
                        ref={(node) => {
                          if (node) cells.current.set(`${r}:${c}`, node);
                          else cells.current.delete(`${r}:${c}`);
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        enterKeyHint="next"
                        aria-label={nameOf(row, column)}
                        aria-describedby={out || low ? describedBy : undefined}
                        aria-invalid={belowMinimum(quantity, minPerCell) || undefined}
                        data-filled={(quantity > 0 && !belowMinimum(quantity, minPerCell)) || undefined}
                        disabled={out}
                        placeholder={out ? "–" : "0"}
                        value={quantity === 0 ? "" : String(quantity)}
                        onChange={(event) => change(r, c, event)}
                        onFocus={(event) => {
                          event.currentTarget.select();
                          setAt({ row: r, column: c });
                        }}
                        onBlur={() => setAt(null)}
                        onKeyDown={(event) => keys(r, c, event)}
                        onPaste={(event) => paste(r, c, event)}
                        className={field}
                      />
                      {hint ? (
                        <span id={describedBy} className="text-[0.6875rem] leading-none whitespace-nowrap text-muted-foreground tabular-nums">
                          {hint}
                        </span>
                      ) : out ? (
                        <span id={describedBy} className="sr-only">
                          {words.unavailable}
                        </span>
                      ) : null}
                      {anyHint && !hint ? <span aria-hidden="true" className="h-[0.6875rem]" /> : null}
                    </div>
                  </TableCell>
                );
              })}
              <TableCell className={cn("py-1.5 pr-5 text-right align-top font-semibold tabular-nums", (totals.rows[row.id] ?? 0) === 0 && "font-normal text-muted-foreground")}>
                <span className="flex h-10 items-center justify-end sm:h-9">{number.format(totals.rows[row.id] ?? 0)}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter className="bg-muted">
          <TableRow className="hover:bg-transparent">
            <TableHead scope="row" className={cn(sticky, edge, "bg-muted pl-4 text-foreground sm:pl-5")}>
              {words.total}
            </TableHead>
            {columns.map((column) => {
              const sum = totals.columns[column.id] ?? 0;
              return (
                <TableCell key={column.id} className={cn("px-1 text-center tabular-nums", sum === 0 && "font-normal text-muted-foreground")}>
                  {number.format(sum)}
                </TableCell>
              );
            })}
            <TableCell className="pr-5 text-right tabular-nums">{number.format(totals.pieces)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      {tooSmall.length ? (
        <p className="flex items-start gap-2 border-t border-border px-5 py-3 text-sm leading-snug text-destructive">
          <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{fill(words.minimum, { min: number.format(minPerCell), cells: new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(tooSmall) })}</span>
        </p>
      ) : null}

      <p className={cn("border-t border-border px-5 py-3 text-xs leading-snug text-muted-foreground", !scrolls && "hidden sm:block")}>
        <span className="hidden sm:inline">{words.hint}</span>
        {scrolls ? <span className="sm:ml-1">{words.scroll}</span> : null}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border px-5 py-4">
        <p role="status" aria-live="polite" aria-atomic="true" className="grid gap-1">
          {totals.pieces === 0 ? (
            <span className="text-sm text-muted-foreground">{words.none}</span>
          ) : (
            <>
              <span className="text-xl leading-none font-semibold tracking-[-0.02em] tabular-nums">{money ?? pieces(totals.pieces)}</span>
              {money && unitPrice !== undefined ? (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {pieces(totals.pieces)} · {fill(words.each, { price: formatMoney({ amount: unitPrice, currency }, locale) })}
                </span>
              ) : null}
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          {totals.pieces > 0 ? (
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              {words.clear}
            </Button>
          ) : null}
          {onAddAll ? (
            <Button type="button" loading={busy} disabled={totals.pieces === 0 || tooSmall.length > 0} onClick={() => void addAll()}>
              {totals.pieces === 0 ? words.add : fill(words.addCount, { count: pieces(totals.pieces) })}
            </Button>
          ) : null}
        </div>
      </div>

      <p role="status" className="sr-only">
        {note}
      </p>
    </div>
  );
}
