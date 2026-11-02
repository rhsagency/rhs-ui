export interface PriceMatrixRow {
  /** Identifies the row in `prices` and in the value. */
  id: string;
  /** What the row is called: "A3". */
  label: string;
}

export interface PriceMatrixColumn {
  /** Identifies the column in `prices` and in the value. */
  id: string;
  /** What the column is called: "250 g silk". */
  label: string;
}

/** Prices by row id, then by column id, in minor units: 1450 is 14.50. `null` or a missing entry means that combination is not offered. */
export type PriceMatrixPrices = Readonly<Record<string, Readonly<Record<string, number | null | undefined>>>>;

/** The chosen combination. */
export interface PriceMatrixValue {
  row: string;
  column: string;
}

export interface PriceMatrixLabels {
  /** The corner of the grid, above the row names: "Size". Without it the corner is empty on screen and a screen reader hears `option`. */
  corner?: string;
  /** What a screen reader hears in an empty corner. */
  option?: string;
  /** Names the grid for a screen reader when there is no title. */
  group?: string;
  /** Said in a cell that is not offered. */
  unavailable?: string;
  /** The tag on the cheapest cell, and the last words of its name for a screen reader. */
  cheapest?: string;
  /** What a screen reader hears for a cell. `{row}`, `{column}` and `{price}`: "A3, 250 g paper, 14.50". */
  cell?: string;
  /** What a screen reader hears for a cell that is not offered. `{row}`, `{column}` and `{unavailable}`. */
  cellUnavailable?: string;
  /** The sentence about the currency, added to the caption. `{currency}`: "Euro (EUR)". */
  currencyNote?: string;
  /** Above the chosen combination, under the grid. */
  chosen?: string;
  /** Where the chosen combination goes while nothing is chosen. */
  choose?: string;
}

export const WORDS = {
  corner: "",
  option: "Option",
  group: "Price by option",
  unavailable: "Not available",
  cheapest: "Lowest price",
  cell: "{row}, {column}, {price}",
  cellUnavailable: "{row}, {column}, {unavailable}",
  currencyNote: "Prices in {currency}.",
  chosen: "Your choice",
  choose: "Choose an option",
} satisfies Required<PriceMatrixLabels>;

export const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** The price of a combination, or null when it is not offered. */
export function priceOf(prices: PriceMatrixPrices, row: string, column: string): number | null {
  const amount = prices[row]?.[column];
  return typeof amount === "number" && Number.isFinite(amount) ? amount : null;
}

export interface Cell {
  row: number;
  column: number;
}

/** Which combinations can be chosen, as a grid of booleans in the order of the rows and columns. */
export function openCells(rows: readonly { id: string }[], columns: readonly { id: string }[], prices: PriceMatrixPrices): boolean[][] {
  return rows.map((row) => columns.map((column) => priceOf(prices, row.id, column.id) !== null));
}

/** The keys (`row:column`) of the cheapest combinations. More than one when they tie. */
export function cheapestKeys(rows: readonly { id: string }[], columns: readonly { id: string }[], prices: PriceMatrixPrices): Set<string> {
  let lowest = Number.POSITIVE_INFINITY;
  for (const row of rows) for (const column of columns) lowest = Math.min(lowest, priceOf(prices, row.id, column.id) ?? Number.POSITIVE_INFINITY);
  const keys = new Set<string>();
  if (!Number.isFinite(lowest)) return keys;
  for (const row of rows) for (const column of columns) if (priceOf(prices, row.id, column.id) === lowest) keys.add(`${row.id}:${column.id}`);
  return keys;
}

/** Every combination that can be chosen, in the order they are read: left to right, top to bottom. */
export function readingOrder(open: readonly (readonly boolean[])[]): Cell[] {
  return open.flatMap((line, row) => line.flatMap((isOpen, column) => (isOpen ? [{ row, column }] : [])));
}

/**
 * The next combination that can be chosen from a cell, one step down and across, going round at the edge. Along a row
 * it stays in the row, along a column in the column; null when there is no other one to go to.
 */
export function stepFrom(open: readonly (readonly boolean[])[], from: Cell, down: number, across: number): Cell | null {
  const rows = open.length;
  const columns = open[0]?.length ?? 0;
  let row = from.row;
  let column = from.column;
  for (let step = 0; step < Math.max(rows, columns); step++) {
    row = (row + down + rows) % rows;
    column = (column + across + columns) % columns;
    if ((row !== from.row || column !== from.column) && open[row]?.[column]) return { row, column };
  }
  return null;
}

/** The price without its currency sign, as it is written in the grid: "14.50". The same digits as the full price, so the two always agree. */
export function plainAmount(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency })
    .formatToParts(amount / 100)
    .filter((part) => part.type !== "currency")
    .map((part) => part.value)
    .join("")
    .trim();
}

/** The currency as people name it, with its code: "Euro (EUR)". Falls back to the code alone. */
export function currencyName(currency: string, locale: string): string {
  try {
    const name = new Intl.DisplayNames(locale, { type: "currency" }).of(currency);
    return name && name !== currency ? `${name} (${currency})` : currency;
  } catch {
    return currency;
  }
}
