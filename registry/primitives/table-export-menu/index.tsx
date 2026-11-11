"use client";

import { useEffect, useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconCopy, IconDownload, IconFileCode, IconFileSheet } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { copyText, downloadText, exportColumns, fileNameFor, toCsv, toJson, toTsv, type ExportColumn, type ExportFormat } from "@rhs-ui/primitives/table-export-menu/export";
import { cn } from "@/lib/utils";

export type { ExportColumn, ExportFormat } from "@rhs-ui/primitives/table-export-menu/export";

/** The words the menu says on its own, for another language or your own wording. `{rows}` is "25 rows", `{count}` a number. */
export interface TableExportMenuLabels {
  /** The button. Default "Export". */
  trigger: string;
  /** The item that downloads CSV. Default "Download CSV". */
  csv: string;
  /** The line under it. Default "Opens in Excel, Numbers and Sheets". */
  csvHint: string;
  /** The item that copies. Default "Copy for spreadsheet". */
  copy: string;
  /** The line under it. Default "Tab-separated, ready to paste". */
  copyHint: string;
  /** The item that downloads JSON. Default "Download JSON". */
  json: string;
  /** The line under it. Default "Raw values, one object per row". */
  jsonHint: string;
  /** One row, by the plural rules of the locale. Default "{count} row". */
  rowsOne: string;
  /** Any other number of rows. Default "{count} rows". */
  rowsOther: string;
  /** One column. Default "{count} column". */
  columnsOne: string;
  /** Any other number of columns. Default "{count} columns". */
  columnsOther: string;
  /** Announced after a download, and the title of the button for a moment. Default "Downloaded {rows}". */
  downloaded: string;
  /** Announced after a copy, and the title of the button for a moment. Default "Copied {rows}". */
  copied: string;
  /** Announced when there are no rows, and the title of the button for a moment. Default "Nothing to export". */
  empty: string;
  /** Announced when the browser refused to copy, and the title of the button for a moment. Default "Copy was blocked". */
  copyFailed: string;
  /** Announced when the rows could not be built, and the title of the button for a moment. Default "Export failed". */
  failed: string;
  /** On the button for a moment after a download, next to a check. One short word: it has to fit where "Export" stands, so the toolbar does not move. Default "Saved". */
  downloadedShort: string;
  /** On the button for a moment after a copy. One short word. Default "Copied". */
  copiedShort: string;
  /** On the button for a moment when there are no rows. One short word. Default "Empty". */
  emptyShort: string;
  /** On the button for a moment when the browser refused to copy. One short word. Default "Blocked". */
  copyFailedShort: string;
  /** On the button for a moment when the rows could not be built. One short word. Default "Failed". */
  failedShort: string;
}

export interface TableExportMenuProps<Row> extends Omit<ComponentProps<"div">, "children"> {
  /** The columns of the file, in order. Hidden ones are skipped unless `includeHidden` is set. */
  columns: readonly ExportColumn<Row>[];
  /** The rows to export. A table that filters should pass the rows it shows, or all of them: it is your choice. */
  rows?: readonly Row[];
  /** Builds the rows only when an export is asked for, for a table too big to keep ready. May return a promise. Used when there is no `rows`. */
  getRows?: () => readonly Row[] | Promise<readonly Row[]>;
  /** The name of the downloaded file, without the extension. Default "export". */
  filename?: string;
  /** Which items the menu offers, in order. Default ["csv", "copy"]. */
  formats?: readonly ExportFormat[];
  /** Write the hidden columns too. Default false. */
  includeHidden?: boolean;
  /** The character between the cells of the CSV file. Use ";" for spreadsheets that write decimals with a comma. Default ",". */
  delimiter?: "," | ";";
  /** Put an apostrophe in front of text that starts like a formula, so a spreadsheet does not run it. Default true. */
  protectFormulas?: boolean;
  /** The locale that writes the counts. Default "en-US". */
  locale?: string;
  /** Which edge of the button the menu lines up with. Default "end", as the button usually sits at the right of a toolbar. */
  align?: "start" | "center" | "end";
  /** Called after an export went through, with what was done and how many rows. */
  onExported?: (result: { format: ExportFormat; count: number }) => void;
  /** Say nothing: no change on the button and no announcement. Use it when `onExported` shows your own toast. Default false. */
  quiet?: boolean;
  /** The words the menu says, for translation. */
  labels?: Partial<TableExportMenuLabels>;
}

const DEFAULT_LABELS = {
  trigger: "Export",
  csv: "Download CSV",
  csvHint: "Opens in Excel, Numbers and Sheets",
  copy: "Copy for spreadsheet",
  copyHint: "Tab-separated, ready to paste",
  json: "Download JSON",
  jsonHint: "Raw values, one object per row",
  rowsOne: "{count} row",
  rowsOther: "{count} rows",
  columnsOne: "{count} column",
  columnsOther: "{count} columns",
  downloaded: "Downloaded {rows}",
  copied: "Copied {rows}",
  empty: "Nothing to export",
  copyFailed: "Copy was blocked",
  failed: "Export failed",
  downloadedShort: "Saved",
  copiedShort: "Copied",
  emptyShort: "Empty",
  copyFailedShort: "Blocked",
  failedShort: "Failed",
} satisfies TableExportMenuLabels;

const fill = (template: string, values: Readonly<Record<string, string | number>>) => template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

const ITEMS: Record<ExportFormat, { icon: ReactNode; label: "csv" | "copy" | "json"; hint: "csvHint" | "copyHint" | "jsonHint" }> = {
  csv: { icon: <IconFileSheet />, label: "csv", hint: "csvHint" },
  copy: { icon: <IconCopy />, label: "copy", hint: "copyHint" },
  json: { icon: <IconFileCode />, label: "json", hint: "jsonHint" },
};

/**
 * An Export menu for any table, with no server involved. "Download CSV" builds a UTF-8 file with a byte order mark so
 * Excel reads accents correctly, with quotes and line breaks escaped; "Copy for spreadsheet" puts tab-separated text on
 * the clipboard; "Download JSON" writes the rows as objects. Values are exported as raw data, not as the strings the
 * table shows, and a column can set `exportValue` to differ from what it displays (an ISO date for "3 days ago", a number
 * for "€1,240.00"). Hidden columns are skipped unless `includeHidden` is set, and text that a spreadsheet would run as a
 * formula is defused. When it is done the button shows a check and one short word ("Copied", "Saved") for a moment, kept
 * to the width of the resting label so the toolbar around it never jumps or wraps, and a polite status says the whole
 * line ("Copied 25 rows") to a screen reader and in the button's title; a refusal says so in the same places. Pass
 * `rows`, or `getRows` to build them only when asked.
 */
export function TableExportMenu<Row>({
  columns,
  rows,
  getRows,
  filename = "export",
  formats = ["csv", "copy"],
  includeHidden = false,
  delimiter = ",",
  protectFormulas = true,
  locale = "en-US",
  align = "end",
  onExported,
  quiet = false,
  labels,
  className,
  ...props
}: TableExportMenuProps<Row>) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const [busy, setBusy] = useState(false);
  // What the button shows for a moment (one short word) and what the title and the status say in full.
  const [flash, setFlash] = useState<{ text: string; short: string; failed: boolean } | null>(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 2600);
    return () => window.clearTimeout(timer);
  }, [flash]);

  const plural = new Intl.PluralRules(locale);
  const number = new Intl.NumberFormat(locale);
  const count = (one: string, other: string, value: number) => fill(plural.select(value) === "one" ? one : other, { count: number.format(value) });
  const rowsText = (value: number) => count(words.rowsOne, words.rowsOther, value);

  const columnCount = exportColumns(columns, includeHidden).length;
  const summary = [rows ? rowsText(rows.length) : null, count(words.columnsOne, words.columnsOther, columnCount)].filter(Boolean).join(" · ");

  function say(text: string, short: string, failed: boolean) {
    if (quiet) return;
    setFlash({ text, short, failed });
    setAnnouncement(text);
  }

  async function run(format: ExportFormat) {
    setBusy(true);
    try {
      const list = rows ?? (getRows ? await getRows() : []);
      if (list.length === 0) {
        say(words.empty, words.emptyShort, true);
        return;
      }
      const options = { includeHidden, delimiter, protectFormulas };
      if (format === "copy") {
        try {
          await copyText(toTsv(columns, list, options));
        } catch {
          say(words.copyFailed, words.copyFailedShort, true);
          return;
        }
      } else if (format === "csv") {
        downloadText(toCsv(columns, list, options), fileNameFor(filename, "csv"), "text/csv;charset=utf-8");
      } else {
        downloadText(toJson(columns, list, options), fileNameFor(filename, "json"), "application/json;charset=utf-8");
      }
      say(fill(format === "copy" ? words.copied : words.downloaded, { rows: rowsText(list.length) }), format === "copy" ? words.copiedShort : words.downloadedShort, false);
      onExported?.({ format, count: list.length });
    } catch {
      say(words.failed, words.failedShort, true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-slot="table-export-menu" className={cn("inline-flex", className)} {...props}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" loading={busy} title={flash?.text} data-failed={flash?.failed || undefined} className="data-[failed]:border-destructive/50 data-[failed]:text-destructive">
            {flash ? flash.failed ? <IconAlertCircle aria-hidden="true" /> : <IconCheck aria-hidden="true" /> : busy ? null : <IconDownload aria-hidden="true" />}
            {/* The resting word keeps its place in the layout, hidden, while the short word is laid over it: the button is as wide as the wider of the two, so it stays about the width it rests at and nothing around it moves. */}
            <span className="grid justify-items-center">
              <span className={cn("col-start-1 row-start-1", flash && "invisible")}>{words.trigger}</span>
              {flash ? <span className="col-start-1 row-start-1">{flash.short}</span> : null}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="min-w-64">
          <DropdownMenuLabel className="pb-1.5 tabular-nums">{summary}</DropdownMenuLabel>
          {formats.map((format) => {
            const item = ITEMS[format];
            return (
              <DropdownMenuItem key={format} onSelect={() => void run(format)} className="items-start py-2 [&>svg]:mt-0.5">
                {item.icon}
                <span className="flex min-w-0 flex-col">
                  <span>{words[item.label]}</span>
                  <span className="text-xs text-muted-foreground">{words[item.hint]}</span>
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      {quiet ? null : (
        <span role="status" className="sr-only">
          {announcement}
        </span>
      )}
    </div>
  );
}
