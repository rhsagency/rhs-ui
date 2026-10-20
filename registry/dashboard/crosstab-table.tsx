import type { ComponentProps } from "react";

import { TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export interface CrosstabAxisItem {
  /** Identity of the row or column. */
  id: string;
  /** What the row or column is called: "Germany", "Q2". It is the header cell, so it is read out with every value. */
  label: string;
}

/** A value, or nothing: a missing value shows a dash and is left out of the totals and the shading. */
export type CrosstabValue = number | null | undefined;

export interface CrosstabTableProps extends Omit<ComponentProps<"div">, "children"> {
  /** One row per item; its label is the row header. */
  rows: readonly CrosstabAxisItem[];
  /** One column per item; its label is the column header. */
  columns: readonly CrosstabAxisItem[];
  /** The measure, as a matrix (`values[rowIndex][columnIndex]`) or a function of a row and a column. */
  values: readonly (readonly CrosstabValue[])[] | ((row: CrosstabAxisItem, column: CrosstabAxisItem) => CrosstabValue);
  /** How a number is written: Intl options (these work from a Server Component) or a function. */
  format?: Intl.NumberFormatOptions | ((value: number) => string);
  /** BCP 47 locale for the numbers. */
  locale?: string;
  /** What to total. `"row"` adds a Total column with the sum of each row, `"column"` adds a Total row with the sum of each column, `"both"` adds both and the grand total. */
  totals?: "row" | "column" | "both";
  /** The word on the total row and column. */
  totalLabel?: string;
  /** Shade every cell in five steps of the foreground colour, a stronger tint for higher values. The number always stays. */
  intensity?: boolean;
  /** Names the table. It is read out first, and drawn above the table when `showCaption` is on. */
  caption: string;
  /** Draw the caption above the table instead of keeping it for screen readers. */
  showCaption?: boolean;
  /** The top left cell, over the row headers: "Region". */
  cornerLabel?: string;
}

const SHADES = ["bg-foreground/[0.04]", "bg-foreground/[0.08]", "bg-foreground/[0.13]", "bg-foreground/[0.19]", "bg-foreground/[0.27]"] as const;

/** The same quiet fill for every total, solid so a label that sticks while the table scrolls hides what passes beneath it. */
const TOTAL_FILL = "bg-[color-mix(in_oklch,var(--card),var(--muted)_45%)]";

/** The line after the sticky label column. A collapsed border stays where the column started while the table scrolls; an inset shadow travels with the cell, so the line always sits between the labels and the numbers. */
const STICKY_DIVIDER = "[box-shadow:inset_-1px_0_0_var(--border)]";

const sum = (list: readonly (number | null)[]): number | null => {
  const numbers = list.filter((value): value is number => value !== null);
  return numbers.length ? numbers.reduce((total, value) => total + value, 0) : null;
};

/**
 * One measure by two dimensions, as a real table: sales by region and
 * quarter, tickets by team and status, hours by person and week. Row labels
 * are row headers and column labels column headers, so every cell is read out
 * with both ("Germany, Q2, 1,204"), and the total row and column carry their
 * scope. An optional shading in five steps of the foreground colour marks the
 * high values without ever hiding the number. The row labels stay put while
 * a wide table scrolls sideways. It needs no client code.
 */
export function CrosstabTable({
  rows,
  columns,
  values,
  format,
  locale = "en-US",
  totals,
  totalLabel = "Total",
  intensity = false,
  caption,
  showCaption = false,
  cornerLabel,
  className,
  ...props
}: CrosstabTableProps) {
  const number = new Intl.NumberFormat(locale, typeof format === "object" ? format : undefined);
  const write = (value: number): string => (typeof format === "function" ? format(value) : number.format(value));

  const grid = rows.map((row, r) =>
    columns.map((column, c) => {
      const value = typeof values === "function" ? values(row, column) : values[r]?.[c];
      return typeof value === "number" && Number.isFinite(value) ? value : null;
    }),
  );
  const rowTotals = grid.map(sum);
  const columnTotals = columns.map((_, c) => sum(grid.map((line) => line[c] ?? null)));
  const grand = sum(grid.flat());
  const perRow = totals === "row" || totals === "both";
  const perColumn = totals === "column" || totals === "both";

  const present = grid.flat().filter((value): value is number => value !== null);
  const low = present.reduce((least, value) => Math.min(least, value), Infinity);
  const high = present.reduce((most, value) => Math.max(most, value), -Infinity);
  // With no spread there is nothing to tell apart, so no shading and no legend.
  const shaded = intensity && present.length > 1 && high !== low;
  const shade = (value: number): number => (shaded ? Math.min(4, Math.floor(((value - low) / (high - low)) * 5)) : -1);

  const empty = (
    <>
      <span aria-hidden="true">&ndash;</span>
      <span className="sr-only">No data</span>
    </>
  );

  return (
    <div data-slot="crosstab-table" className={cn("w-full overflow-hidden rounded-xl border border-border bg-card text-card-foreground", className)} {...props}>
      {/* A table that scrolls sideways takes the keyboard too: the region can be focused and scrolled with the arrow keys. */}
      <div
        role="region"
        aria-label={caption}
        tabIndex={0}
        className="relative overflow-x-auto bg-inherit outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40"
      >
        <table data-slot="table" className={cn("w-full border-collapse bg-inherit text-sm", showCaption ? "caption-top" : "caption-bottom")}>
          <TableCaption className={showCaption ? "mt-0 px-3 py-3 text-left font-medium text-foreground" : "sr-only"}>{caption}</TableCaption>
          <TableHeader className="bg-inherit">
            <TableRow className="bg-inherit hover:bg-inherit">
              {cornerLabel ? (
                <TableHead scope="col" className={cn("sticky left-0 z-10 bg-inherit text-left", STICKY_DIVIDER)}>
                  {cornerLabel}
                </TableHead>
              ) : (
                <TableCell className={cn("sticky left-0 z-10 bg-inherit", STICKY_DIVIDER)} />
              )}
              {columns.map((column) => (
                <TableHead key={column.id} scope="col" className="text-right">
                  {column.label}
                </TableHead>
              ))}
              {perRow ? (
                <TableHead scope="col" className={cn("border-l border-border text-right text-foreground", TOTAL_FILL)}>
                  {totalLabel}
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody className="bg-inherit">
            {rows.map((row, r) => (
              <TableRow key={row.id} className="bg-inherit hover:bg-inherit">
                <TableHead scope="row" className={cn("sticky left-0 z-10 bg-inherit text-left text-foreground", STICKY_DIVIDER)}>
                  {row.label}
                </TableHead>
                {columns.map((column, c) => {
                  const value = grid[r]?.[c] ?? null;
                  const step = value === null ? -1 : shade(value);
                  return (
                    <TableCell key={column.id} className={cn("text-right tabular-nums", step >= 0 && SHADES[step], step === 4 && "font-medium")}>
                      {value === null ? empty : write(value)}
                    </TableCell>
                  );
                })}
                {perRow ? (
                  <TableCell className={cn("border-l border-border text-right font-medium tabular-nums", TOTAL_FILL)}>
                    {rowTotals[r] === null || rowTotals[r] === undefined ? empty : write(rowTotals[r])}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
          {perColumn ? (
            <TableFooter className={cn("border-t border-border font-medium", TOTAL_FILL)}>
              <TableRow className={cn("hover:bg-inherit", TOTAL_FILL)}>
                <TableHead scope="row" className={cn("sticky left-0 z-10 text-left text-foreground", STICKY_DIVIDER, TOTAL_FILL)}>
                  {totalLabel}
                </TableHead>
                {columns.map((column, c) => (
                  <TableCell key={column.id} className="text-right tabular-nums">
                    {columnTotals[c] === null || columnTotals[c] === undefined ? empty : write(columnTotals[c])}
                  </TableCell>
                ))}
                {perRow ? <TableCell className="border-l border-border text-right font-semibold tabular-nums">{grand === null ? empty : write(grand)}</TableCell> : null}
              </TableRow>
            </TableFooter>
          ) : null}
        </table>
      </div>
      {shaded ? (
        <div aria-hidden="true" className="flex items-center gap-2 border-t border-border px-3 py-2 text-xs text-muted-foreground">
          <span>Lower</span>
          <span className="flex gap-0.5">
            {SHADES.map((fill) => (
              <span key={fill} className={cn("size-3.5 rounded-[3px] border border-border", fill)} />
            ))}
          </span>
          <span>Higher</span>
        </div>
      ) : null}
    </div>
  );
}
