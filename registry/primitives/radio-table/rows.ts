/** What a cell holds. A missing value is written as a hyphen. */
export type CellValue = string | number | null | undefined;

export interface RadioTableColumn {
  /** The key of the cell in each row's `cells`. */
  key: string;
  /** The heading of the column, and what names a value on a phone and to a screen reader: "Memory". */
  label: string;
  /** Where the figures sit under the heading. The first column is always at the start, and the others default to the end. */
  align?: "start" | "center" | "end";
  /** How a value is written: `(v) => v + " GB"`. Default numbers in the locale of the table, text as it is. */
  format?: (value: CellValue) => string;
  /** How a value is read out when it is not the same as how it is written: `(v) => v + " euros per month"`. Default the written value, then the label: "8 GB Memory". */
  speak?: (value: CellValue) => string;
}

export interface RadioTableRow {
  /** What the row reports when it is chosen. */
  value: string;
  /** The cells of the row by column key. The cell of the first column is the name of the row. */
  cells: Readonly<Record<string, CellValue>>;
  /** A line under the name, such as who the row suits. */
  note?: string;
  /** The row cannot be chosen. Pass a string to say why: it is written under the name and read with the row. */
  disabled?: boolean | string;
}

const HYPHEN = "-";

/** A cell as written. */
export function cellText(column: RadioTableColumn, value: CellValue, locale: string): string {
  if (column.format) return column.format(value);
  if (value === null || value === undefined || value === "") return HYPHEN;
  return typeof value === "number" ? new Intl.NumberFormat(locale).format(value) : value;
}

/** A cell as it is read out: its own words when the column has them, otherwise the written value and then the heading. */
function cellSpeech(column: RadioTableColumn, value: CellValue, locale: string): string {
  if (column.speak) return column.speak(value);
  return `${cellText(column, value, locale)} ${column.label}`;
}

/** The whole row in one sentence, columns in order: "8 GB memory, 4 CPUs, 160 GB disk, 48 euros per month". The first column is the name, so it is left out. */
export function describeRow(columns: readonly RadioTableColumn[], row: RadioTableRow, locale: string): string {
  const parts = columns.slice(1).map((column) => cellSpeech(column, row.cells[column.key], locale));
  if (typeof row.disabled === "string") parts.push(row.disabled);
  return parts.join(", ");
}

/** The columns of the wide layout: the name takes a little more room than a figure does. */
export const gridColumns = (count: number): string => (count > 1 ? `minmax(0,2fr) repeat(${count - 1},minmax(0,1fr))` : "minmax(0,1fr)");
