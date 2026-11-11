/**
 * How the export menu turns rows into files and clipboard text, as plain functions with no state and no hook. They
 * hold the details that make an export open correctly: a byte order mark so Excel reads accents, quotes doubled and
 * line breaks kept inside a quoted cell, raw values rather than the strings a table shows, and a guard against cells
 * that a spreadsheet would run as a formula.
 */

/** One column of the export. */
export interface ExportColumn<Row> {
  /** The name of the column, and where its value is read from when there is no `exportValue`: `key: "amount"` reads `row.amount`. It is the property name in a JSON export. */
  key: string;
  /** The text of the header line. */
  header: string;
  /** What to write for a row when it is not `row[key]`: the raw value (a number, an ISO date, an id), never the text the table shows ("€1,240.00", "3 days ago"). */
  exportValue?: (row: Row) => unknown;
  /** The column is hidden in the table. It is left out of the export unless `includeHidden` is set. */
  hidden?: boolean;
}

/** What the menu can do: download a CSV file, copy tab-separated text, or download JSON. */
export type ExportFormat = "csv" | "copy" | "json";

export interface ExportOptions {
  /** Write the hidden columns too. Default false. */
  includeHidden?: boolean;
  /** The character between the cells of a CSV file. Default ",". Use ";" for spreadsheets set to a locale that writes decimals with a comma. */
  delimiter?: string;
  /** Put an apostrophe in front of text that starts like a formula (=, +, -, @), so a spreadsheet shows it as text instead of running it. Default true. */
  protectFormulas?: boolean;
}

/** The columns that go into the export: the hidden ones are skipped unless asked for. */
export function exportColumns<Row>(columns: readonly ExportColumn<Row>[], includeHidden = false): ExportColumn<Row>[] {
  return columns.filter((column) => includeHidden || !column.hidden);
}

/** The raw value of one cell. */
export function rawValue<Row>(row: Row, column: ExportColumn<Row>): unknown {
  return column.exportValue ? column.exportValue(row) : (row as Record<string, unknown>)[column.key];
}

/** A value as the text of a cell: nothing is empty, a date is ISO 8601, a list is joined with commas, an object is JSON. */
export function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  if (Array.isArray(value)) return value.map(cellText).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// Text a spreadsheet may run as a formula: it starts with = or @, or with a sign followed by more than a plain number or phone number.
const FORMULA = /^[=@\t\r]|^[+-](?![\d\s().,+-]*$)/;

/** Text that a spreadsheet would run as a formula gets an apostrophe in front; any other text is returned as it is. */
export function protectFormula(text: string): string {
  return FORMULA.test(text) ? `'${text}` : text;
}

/** One cell as written between delimiters: quoted when it holds the delimiter, a quote or a line break, with quotes doubled. */
export function escapeField(text: string, delimiter: string): string {
  return text.includes(delimiter) || /["\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** The rows as delimited text with a header line. Numbers are never guarded: only text can be taken for a formula. */
export function toDelimited<Row>(columns: readonly ExportColumn<Row>[], rows: readonly Row[], { delimiter = ",", includeHidden = false, protectFormulas = true }: ExportOptions = {}, lineBreak = "\r\n"): string {
  const shown = exportColumns(columns, includeHidden);
  const header = shown.map((column) => escapeField(column.header, delimiter));
  const lines = rows.map((row) =>
    shown
      .map((column) => {
        const value = rawValue(row, column);
        const text = cellText(value);
        return escapeField(protectFormulas && typeof value === "string" ? protectFormula(text) : text, delimiter);
      })
      .join(delimiter),
  );
  return [header.join(delimiter), ...lines].join(lineBreak);
}

/** The contents of a CSV file: UTF-8 with a byte order mark, so Excel reads accents and symbols correctly, and a closing line break. */
export function toCsv<Row>(columns: readonly ExportColumn<Row>[], rows: readonly Row[], options: ExportOptions = {}): string {
  return `\uFEFF${toDelimited(columns, rows, options)}\r\n`;
}

/** Tab-separated text for the clipboard, which Excel, Numbers and Sheets paste into cells. No byte order mark and no closing line break, which would paste an empty row. */
export function toTsv<Row>(columns: readonly ExportColumn<Row>[], rows: readonly Row[], options: ExportOptions = {}): string {
  return toDelimited(columns, rows, { ...options, delimiter: "\t" }, "\n");
}

/** The rows as a JSON array of objects keyed by column `key`, with raw values: numbers stay numbers and dates become ISO strings. */
export function toJson<Row>(columns: readonly ExportColumn<Row>[], rows: readonly Row[], { includeHidden = false }: ExportOptions = {}): string {
  const shown = exportColumns(columns, includeHidden);
  return JSON.stringify(
    rows.map((row) => Object.fromEntries(shown.map((column) => [column.key, rawValue(row, column) ?? null]))),
    null,
    2,
  );
}

/** A file name that is safe on every system, with the extension the format needs. */
export function fileNameFor(name: string, extension: string): string {
  const clean = name.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "-").trim().replace(/\.+$/, "") || "export";
  return clean.toLowerCase().endsWith(`.${extension}`) ? clean : `${clean}.${extension}`;
}

/** Saves text as a file through the browser, with no request: the text goes into a Blob and a link downloads it. */
export function downloadText(text: string, fileName: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Puts text on the clipboard: the Clipboard API where the page may use it, and a selected textarea where it may not (an http page, an older browser). Rejects when both fail. */
export async function copyText(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Refused (a permission, a frame): the fallback below may still work.
    }
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  const copied = document.execCommand("copy");
  area.remove();
  if (!copied) throw new Error("The text could not be copied.");
}
