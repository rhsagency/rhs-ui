import type { ComponentProps, ReactNode } from "react";

import { IconArrowDown, IconArrowUp } from "@rhs-ui/icons";
import { extremes, formatFigure, makeFormatter, toNumber, totalOf, type NumericKind, type TotalRule } from "@rhs-ui/primitives/numeric-table/format";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export type { NumericKind, TotalRule } from "@rhs-ui/primitives/numeric-table/format";

export interface NumericColumn<Row> {
  /** Names the column, and reads the value from `row[key]` when there is no `accessor`. Unique in the table. */
  key: string;
  /** The heading, as plain text. */
  header: string;
  /** What the column holds: `number`, `currency`, `percent` (the value is a fraction: 0.124 is 12.4%) or `text`. Default "number". */
  kind?: NumericKind;
  /** Digits after the point, the same in every row so the points line up. Default 0 for numbers, 1 for percentages, the currency's own for money. */
  precision?: number;
  /** A unit for the heading ("kg", "ms", "pts"): it is written there once instead of after every figure. */
  unit?: string;
  /** An ISO code for `currency`, for example "EUR". Default "USD". */
  currency?: string;
  /** Reads the value of a row when it is not `row[key]`. */
  accessor?: (row: Row) => number | string | null | undefined;
  /** Mark the highest value of the column, the lowest, or both: an arrow beside the figure, a heavier weight, and the words for a screen reader. */
  mark?: "highest" | "lowest" | "both";
  /** How the totals row fills this column: `"sum"`, `"average"`, or a function that takes the figures that exist and returns the total (or null). Without it the cell stays empty. */
  total?: TotalRule;
  /** Classes for the cells of the column and its header: a width, `whitespace-nowrap`. */
  className?: string;
}

/** The words the table says on its own, for another language or your own wording. */
export interface NumericTableLabels {
  /** The row header of the totals row. Default "Total". */
  total: string;
  /** What a missing value says, instead of a zero. Default "no data". */
  noData: string;
  /** What a screen reader hears before a negative figure. Default "negative". */
  negative: string;
  /** What a screen reader hears after the highest figure of a column. Default "highest in column". */
  highest: string;
  /** What a screen reader hears after the lowest figure of a column. Default "lowest in column". */
  lowest: string;
}

export interface NumericTableProps<Row> extends Omit<ComponentProps<"table">, "children"> {
  /** The columns, in order. */
  columns: readonly NumericColumn<Row>[];
  /** The data, one object per row. */
  rows: readonly Row[];
  /** A key for each row. Default `row.id`, then the place in `rows`. */
  getRowId?: (row: Row, index: number) => string;
  /** The `key` of the column that names a row: it becomes the row header. Default the first column when it is text. */
  rowHeader?: string;
  /** The locale that writes the numbers: 1,234.5 or 1.234,5. Default "en-US". */
  locale?: string;
  /** What the table is, under it: "Quarterly revenue by region". It names the table for assistive technology. */
  caption?: ReactNode;
  /** Show the totals row when a column has a `total`. Default true. */
  totals?: boolean;
  /** The words the table says, for translation. */
  labels?: Partial<NumericTableLabels>;
}

const DEFAULT_LABELS = {
  total: "Total",
  noData: "no data",
  negative: "negative",
  highest: "highest in column",
  lowest: "lowest in column",
} satisfies NumericTableLabels;

/** The cell of a figure that is not there: said in words, never a zero, so a gap cannot be mistaken for a measurement. */
function NoData({ children }: { children: ReactNode }) {
  return <span className="text-xs text-muted-foreground">{children}</span>;
}

/**
 * A table of figures, set the way figures should be: every number right-aligned in tabular digits so the places line up,
 * written by Intl for the locale you give (1,234.5 or 1.234,5), with a true minus sign and, for a screen reader, the word
 * "negative" instead of a dash. The unit goes in the heading once, a column can mark its highest and lowest value (in
 * weight, an arrow and words, never in colour), and a totals row in a real `<tfoot>` sums, averages or runs your function
 * under the row header "Total". A value that is missing reads "no data" and is left out of the sums: it is never written
 * as a zero, so a gap in the data cannot pass for a measurement. It renders on the server and takes plain data.
 */
export function NumericTable<Row>({ columns, rows, getRowId, rowHeader, locale = "en-US", caption, totals = true, labels, className, ...props }: NumericTableProps<Row>) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const headerKey = rowHeader ?? (columns[0]?.kind === "text" ? columns[0].key : undefined);
  const read = (column: NumericColumn<Row>, row: Row): unknown => (column.accessor ? column.accessor(row) : (row as Record<string, unknown>)[column.key]);

  // Everything a column needs once: how it writes figures, which figures it has, and which of them stand out.
  const prepared = columns.map((column) => {
    const kind = column.kind ?? "number";
    const numeric = kind !== "text";
    const figures = numeric ? rows.map((row) => toNumber(read(column, row))).filter((value): value is number => value !== null) : [];
    return {
      column,
      numeric,
      formatter: numeric ? makeFormatter({ kind, precision: column.precision, currency: column.currency, locale }) : null,
      figures,
      extremes: column.mark && numeric ? extremes(figures) : null,
    };
  });
  const showTotals = totals && columns.some((column) => column.total !== undefined);

  function figure(index: number, value: number, mark?: "highest" | "lowest"): ReactNode {
    const entry = prepared[index];
    if (!entry?.formatter) return String(value);
    const written = formatFigure(entry.formatter, value);
    return (
      <span className={cn("relative inline-block", mark && "font-semibold")}>
        {mark ? (
          // A bare arrow reads as a change, and it is not one: the title says what it marks, for a pointer (a screen reader gets the words after the figure).
          <span aria-hidden="true" title={mark === "highest" ? words.highest : words.lowest} className="absolute top-1/2 right-full mr-1 -translate-y-1/2 text-muted-foreground">
            {mark === "highest" ? <IconArrowUp size={12} /> : <IconArrowDown size={12} />}
          </span>
        ) : null}
        {written.negative ? <span className="sr-only">{words.negative} </span> : null}
        <span aria-hidden={written.negative || undefined}>{written.text}</span>
        {written.negative ? <span className="sr-only">{written.spoken}</span> : null}
        {mark ? <span className="sr-only">, {mark === "highest" ? words.highest : words.lowest}</span> : null}
      </span>
    );
  }

  return (
    <div data-slot="numeric-table" className="w-full min-w-0">
      <Table className={className} {...props}>
        {caption ? <TableCaption>{caption}</TableCaption> : null}
        <TableHeader>
          <TableRow>
            {prepared.map(({ column, numeric }) => (
              <TableHead key={column.key} scope="col" className={cn("whitespace-normal", numeric && "text-right", column.className)}>
                {column.header}
                {column.unit ? <span className="ml-1 font-normal text-muted-foreground/80">({column.unit})</span> : null}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={getRowId ? getRowId(row, rowIndex) : String((row as { id?: string | number }).id ?? rowIndex)}>
              {prepared.map(({ column, numeric, extremes: marked }, index) => {
                const value = read(column, row);
                if (!numeric) {
                  const text = value === null || value === undefined || value === "" ? null : String(value);
                  return column.key === headerKey ? (
                    <th key={column.key} scope="row" className={cn("px-3 py-2.5 text-left align-middle font-medium", column.className)}>
                      {text ?? <NoData>{words.noData}</NoData>}
                    </th>
                  ) : (
                    <TableCell key={column.key} className={column.className}>
                      {text ?? <NoData>{words.noData}</NoData>}
                    </TableCell>
                  );
                }
                const number = toNumber(value);
                const mark =
                  number === null || !marked
                    ? undefined
                    : number === marked.highest && column.mark !== "lowest"
                      ? "highest"
                      : number === marked.lowest && column.mark !== "highest"
                        ? "lowest"
                        : undefined;
                return (
                  <TableCell key={column.key} className={cn("text-right tabular-nums", column.className)}>
                    {number === null ? <NoData>{words.noData}</NoData> : figure(index, number, mark)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
        {showTotals ? (
          <TableFooter>
            <TableRow className="hover:bg-transparent">
              {prepared.map(({ column, numeric, figures }, index) => {
                if (index === 0 || column.key === headerKey) {
                  return (
                    <th key={column.key} scope="row" className={cn("px-3 py-2.5 text-left align-middle font-semibold", column.className)}>
                      {words.total}
                    </th>
                  );
                }
                if (!numeric || column.total === undefined) return <TableCell key={column.key} className={column.className} />;
                const total = totalOf(column.total, figures);
                return (
                  <TableCell key={column.key} className={cn("text-right tabular-nums", column.className)}>
                    {total === null ? <NoData>{words.noData}</NoData> : figure(index, total)}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableFooter>
        ) : null}
      </Table>
    </div>
  );
}
