/** A variant down the side of the grid: a colour, or a width. */
export interface OrderMatrixRow {
  /** Identity of the row, the key in `stock` and `value`. */
  id: string;
  /** What the shopper reads: "Navy". */
  label: string;
  /** A CSS colour for a small swatch beside the label. Leave it out for rows that are not colours. */
  swatch?: string;
}

/** A size across the top of the grid. */
export interface OrderMatrixColumn {
  /** Identity of the column, the key in `stock` and `value`. */
  id: string;
  /** What the shopper reads: "M", "42". */
  label: string;
}

/** Quantities by row, then by column: `{ navy: { m: 6 } }`. A cell that is missing is zero. */
export type OrderMatrixQuantities = Record<string, Record<string, number>>;

/** What can be ordered, in the same shape. A cell that is missing is not made in that size; zero is sold out. */
export type OrderMatrixStock = Record<string, Record<string, number>>;

export interface OrderMatrixLine {
  rowId: string;
  columnId: string;
  quantity: number;
}

/** What "Add all" hands over. */
export interface OrderMatrixOrder {
  /** Every cell with something in it, row by row. */
  lines: OrderMatrixLine[];
  /** How many pieces in all. */
  pieces: number;
  /** What they cost, in minor units. Only there when a unit price was given. */
  total?: number;
}

export interface OrderMatrixTotals {
  rows: Record<string, number>;
  columns: Record<string, number>;
  pieces: number;
  lines: OrderMatrixLine[];
}

/** The most one cell can hold when there is no stock data. */
export const CELL_MAX = 9999;

/** How many of a cell can be ordered: no limit without stock data, a number from it, or null when the stock does not list the cell. */
export function limitOf(stock: OrderMatrixStock | undefined, rowId: string, columnId: string): number | null {
  if (!stock) return CELL_MAX;
  const value = stock[rowId]?.[columnId];
  return typeof value === "number" && Number.isFinite(value) ? Math.min(CELL_MAX, Math.max(0, Math.floor(value))) : null;
}

/** Whether a cell can still be ordered but is nearly gone: something is left, and no more than `lowStockAt`. */
export function isLow(limit: number | null, lowStockAt: number): boolean {
  return limit !== null && limit > 0 && limit <= lowStockAt;
}

/** The quantity in a cell, never negative and always whole. */
export function quantityOf(value: OrderMatrixQuantities, rowId: string, columnId: string): number {
  const quantity = value[rowId]?.[columnId];
  return typeof quantity === "number" && Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0;
}

/** A copy of the quantities with one cell changed. A cell set to zero is removed, so the object only holds what is ordered. */
export function withQuantity(value: OrderMatrixQuantities, rowId: string, columnId: string, quantity: number): OrderMatrixQuantities {
  const row = { ...value[rowId] };
  if (quantity > 0) row[columnId] = quantity;
  else delete row[columnId];
  const next = { ...value, [rowId]: row };
  if (Object.keys(row).length === 0) delete next[rowId];
  return next;
}

/** Row totals, column totals, the whole and the lines, counting only cells that exist in the grid. */
export function totalsOf(rows: readonly OrderMatrixRow[], columns: readonly OrderMatrixColumn[], value: OrderMatrixQuantities): OrderMatrixTotals {
  const totals: OrderMatrixTotals = { rows: {}, columns: Object.fromEntries(columns.map((column) => [column.id, 0])), pieces: 0, lines: [] };
  for (const row of rows) {
    totals.rows[row.id] = 0;
    for (const column of columns) {
      const quantity = quantityOf(value, row.id, column.id);
      if (quantity === 0) continue;
      totals.rows[row.id] = (totals.rows[row.id] ?? 0) + quantity;
      totals.columns[column.id] = (totals.columns[column.id] ?? 0) + quantity;
      totals.pieces += quantity;
      totals.lines.push({ rowId: row.id, columnId: column.id, quantity });
    }
  }
  return totals;
}

/** Whether a quantity is above zero but below the smallest the supplier sells. */
export function belowMinimum(quantity: number, minPerCell: number): boolean {
  return quantity > 0 && quantity < minPerCell;
}

/** A quantity held to what is allowed: whole, not below zero, not above the limit of its cell. */
export function clampQuantity(requested: number, limit: number): number {
  return Math.min(limit, Math.max(0, Math.floor(Number.isFinite(requested) ? requested : 0)));
}

/**
 * Reads a block of numbers copied from a spreadsheet: rows on line breaks, cells on tabs (or semicolons, or commas
 * and spaces when every piece is a whole number). An empty or unreadable cell is null and leaves the grid alone.
 * A single value is not a block: it comes back as null, so the field takes it as if it were typed.
 */
export function parseBlock(text: string): (number | null)[][] | null {
  const lines = text.replace(/\r/g, "").split("\n");
  while (lines.length > 1 && lines[lines.length - 1]?.trim() === "") lines.pop();
  const split = (line: string): string[] => {
    if (line.includes("\t")) return line.split("\t");
    if (line.includes(";")) return line.split(";");
    const loose = line.trim().split(/[\s,]+/);
    return loose.length > 1 && loose.every((piece) => /^\d+$/.test(piece)) ? loose : [line];
  };
  const block = lines.map((line) => split(line).map((piece) => (/^\s*\d+\s*$/.test(piece) ? Number.parseInt(piece, 10) : null)));
  const cells = block.reduce((count, line) => count + line.length, 0);
  return cells > 1 ? block : null;
}

/**
 * Lays a pasted block on the grid from one cell, going right and down. Cells that are sold out or not made keep what
 * they had, and the rest are held to their stock. It says how many cells it filled.
 */
export function fillBlock(
  block: readonly (readonly (number | null)[])[],
  start: { row: number; column: number },
  rows: readonly OrderMatrixRow[],
  columns: readonly OrderMatrixColumn[],
  stock: OrderMatrixStock | undefined,
  value: OrderMatrixQuantities,
): { next: OrderMatrixQuantities; filled: number } {
  let next = value;
  let filled = 0;
  block.forEach((line, down) => {
    line.forEach((piece, across) => {
      const row = rows[start.row + down];
      const column = columns[start.column + across];
      if (!row || !column || piece === null) return;
      const limit = limitOf(stock, row.id, column.id);
      if (limit === null || limit === 0) return;
      next = withQuantity(next, row.id, column.id, clampQuantity(piece, limit));
      filled += 1;
    });
  });
  return { next, filled };
}
