"use client";

import { useId, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { IconCheck, IconInfo } from "@rhs-ui/icons";
import { cellText, describeRow, gridColumns, type RadioTableColumn, type RadioTableRow } from "@rhs-ui/primitives/radio-table/rows";
import { cn } from "@/lib/utils";

export type { CellValue, RadioTableColumn, RadioTableRow } from "@rhs-ui/primitives/radio-table/rows";

export interface RadioTableProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** What is being chosen: "Server size". It is the legend of the group and names the table for a screen reader. */
  legend: string;
  /** Keep the legend for screen readers only, when the page already says it. */
  hideLegend?: boolean;
  /** A line under the legend that says more. */
  description?: ReactNode;
  /** The columns, first the name of the choice and then the things worth comparing. */
  columns: readonly RadioTableColumn[];
  /** The rows to choose from, in the order they are shown. */
  rows: readonly RadioTableRow[];
  /** The chosen row, when you control it. `null` is no choice. */
  value?: string | null;
  /** The row to start with, when you do not control the table. */
  defaultValue?: string | null;
  /** Called with the `value` of the row that was chosen. */
  onValueChange?: (value: string) => void;
  /** The locale that writes the numbers, when a column has no `format` of its own. Default "en-US". */
  locale?: string;
  /** The field's name for a plain form submit. The rows are real radio buttons that share it. A name is made up when you give none. */
  name?: string;
  /** A choice is needed: the browser will not submit a form with the table until a row is chosen. */
  required?: boolean;
  /** Turn every row off. */
  disabled?: boolean;
}

const ALIGN = { start: "text-start", center: "text-center", end: "text-end" } as const;

/**
 * A choice list for options that have things worth comparing: server sizes,
 * storage tiers, delivery slots. The first column holds the radio and the name,
 * the others are figures under visible headings, so the options line up for the
 * eye. To a screen reader it is a table with headers, and underneath it is one
 * group of real radio buttons: one tab stop, the arrow keys move and choose, and
 * every radio is described by its row read out in order ("8 GB memory, 4 CPUs,
 * 160 GB disk, 48 euros per month"). The chosen row has a heavier border and a
 * check, a row that cannot be chosen says why, and where the container is
 * narrower than 560px each row becomes a card with the headings beside the
 * values, so nothing scrolls sideways.
 */
export function RadioTable({
  legend,
  hideLegend,
  description,
  columns,
  rows,
  value,
  defaultValue = null,
  onValueChange,
  locale = "en-US",
  name,
  required,
  disabled,
  className,
  style,
  ...props
}: RadioTableProps) {
  const base = useId();
  const legendId = `${base}-legend`;
  const [own, setOwn] = useState<string | null>(defaultValue);
  const current = value === undefined ? own : value;
  const group = name ?? `${base}-choice`;
  const [first, ...rest] = columns;

  return (
    <div data-slot="radio-table" className={cn("@container w-full min-w-0", className)} style={{ "--table-columns": gridColumns(columns.length), ...style } as CSSProperties} {...props}>
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend id={legendId} className={cn("p-0 text-sm font-medium", hideLegend ? "sr-only" : description ? "mb-1" : "mb-4")}>
          {legend}
        </legend>
        {description ? <p className={cn("mb-4 text-sm text-muted-foreground", hideLegend && "sr-only")}>{description}</p> : null}

        <div role="table" aria-labelledby={legendId} className="grid gap-2">
          {/* The headings are on screen where the figures line up in columns, and read out in either layout. */}
          <div role="rowgroup" className="sr-only @[560px]:not-sr-only">
            <div role="row" className="grid items-end gap-x-4 px-[17px] pb-1 text-xs font-medium text-muted-foreground @[560px]:[grid-template-columns:var(--table-columns)]">
              {columns.map((column, index) => (
                <div key={column.key} role="columnheader" className={cn("min-w-0 truncate", index === 0 ? "pl-8" : ALIGN[column.align ?? "end"])}>
                  {column.label}
                </div>
              ))}
            </div>
          </div>

          <div role="rowgroup" className="grid gap-2">
            {rows.map((row, index) => {
              const id = `${base}-row-${index}`;
              const off = disabled || Boolean(row.disabled);
              const reason = typeof row.disabled === "string" ? row.disabled : null;
              return (
                <div
                  key={row.value}
                  role="row"
                  data-slot="radio-table-row"
                  data-disabled={off || undefined}
                  className={cn(
                    "relative grid gap-y-1 rounded-xl border border-border bg-card px-4 py-3.5 shadow-xs transition-[background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none",
                    "@[560px]:items-center @[560px]:gap-x-4 @[560px]:gap-y-0 @[560px]:[grid-template-columns:var(--table-columns)]",
                    "has-[input:checked]:bg-muted/40 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/40 has-[input:checked:focus-visible]:border-foreground",
                    // A chosen row has a heavier border: the border and a line inside it. A row that is off keeps the shape and loses the strength.
                    off
                      ? "has-[input:checked]:border-muted-foreground/60 has-[input:checked]:shadow-[inset_0_0_0_1px_var(--muted-foreground)]"
                      : "has-[input:enabled]:hover:bg-muted/40 has-[input:checked]:border-foreground has-[input:checked]:shadow-[inset_0_0_0_1px_var(--foreground)]",
                  )}
                >
                  <div role="rowheader" className="flex min-w-0 items-start gap-3">
                    <input
                      id={id}
                      type="radio"
                      name={group}
                      value={row.value}
                      checked={current === row.value}
                      disabled={off}
                      required={required}
                      aria-describedby={`${id}-description`}
                      onChange={() => {
                        if (value === undefined) setOwn(row.value);
                        onValueChange?.(row.value);
                      }}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className="mt-px grid size-5 shrink-0 place-items-center rounded-full border border-muted-foreground/60 bg-background text-background transition-[background-color,border-color] duration-150 peer-checked:border-foreground peer-checked:bg-foreground peer-disabled:opacity-50 motion-reduce:transition-none [&_svg]:size-3 [&_svg]:scale-50 [&_svg]:opacity-0 [&_svg]:transition-[opacity,scale] [&_svg]:duration-150 peer-checked:[&_svg]:scale-100 peer-checked:[&_svg]:opacity-100"
                    >
                      <IconCheck />
                    </span>
                    <div className="min-w-0">
                      {/* The label's ::after covers the whole row, so any part of it chooses the row. */}
                      <label htmlFor={id} className={cn("block text-sm leading-5 font-medium after:absolute after:inset-0 after:content-['']", off ? "cursor-not-allowed opacity-50" : "cursor-pointer")}>
                        {first ? cellText(first, row.cells[first.key], locale) : row.value}
                      </label>
                      {reason ? (
                        <p className="mt-0.5 flex items-start gap-1 text-xs leading-4 text-muted-foreground">
                          <IconInfo aria-hidden="true" className="mt-px size-3 shrink-0" />
                          {reason}
                        </p>
                      ) : row.note ? (
                        <p className={cn("mt-0.5 text-xs leading-4 text-muted-foreground", off && "opacity-50")}>{row.note}</p>
                      ) : null}
                    </div>
                    <span id={`${id}-description`} className="sr-only">
                      {describeRow(columns, row, locale)}
                    </span>
                  </div>
                  {rest.map((column, columnIndex) => (
                    <div
                      key={column.key}
                      role="cell"
                      className={cn(
                        "flex min-w-0 items-baseline justify-between gap-3 text-sm tabular-nums",
                        columnIndex === 0 && "mt-2 border-t border-border pt-3 @[560px]:mt-0 @[560px]:border-t-0 @[560px]:pt-0",
                        "@[560px]:block",
                        ALIGN[column.align ?? "end"],
                        off && "opacity-50",
                      )}
                    >
                      {/* The heading beside the value, for a card. The column heading says it in the table, so a screen reader skips this one. */}
                      <span aria-hidden="true" className="text-muted-foreground @[560px]:hidden">
                        {column.label}
                      </span>
                      <span>{cellText(column, row.cells[column.key], locale)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </fieldset>
    </div>
  );
}
