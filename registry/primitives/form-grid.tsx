import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The widths a column count can change at, measured on the grid itself (not the viewport):
 * `base` is any width, `sm` from 28rem, `md` from 36rem and `lg` from 48rem.
 */
export type FormGridBreakpoint = "base" | "sm" | "md" | "lg";

/** A number of columns, or a different number at each width. A plain number applies from `sm` up. Below it the item takes the whole row. */
export type FormGridSpan = number | Partial<Record<FormGridBreakpoint, number>>;

export type FormGridGap = "sm" | "md" | "lg";

export interface FormGridProps extends ComponentProps<"div"> {
  /** How many columns the grid has. Spans count them. Default 12. */
  columns?: number;
  /** The space between fields: `sm` 12px across and 16px down, `md` 16 and 24, `lg` 24 and 32. Default `md`. */
  gap?: FormGridGap;
  /** `fieldset` groups the fields under a legend and lets `disabled` switch them all off together. Default `div`. */
  as?: "div" | "fieldset";
  /** The caption of a fieldset, read before its fields. Only used with `as="fieldset"`. */
  legend?: ReactNode;
  /** Switches off every field inside, with `as="fieldset"`. */
  disabled?: boolean;
}

const GAPS: Record<FormGridGap, string> = {
  sm: "gap-x-3 gap-y-4",
  md: "gap-x-4 gap-y-6",
  lg: "gap-x-6 gap-y-8",
};

const BREAKPOINTS: readonly FormGridBreakpoint[] = ["base", "sm", "md", "lg"];

/**
 * A form laid out on a 12-column grid: related fields share a row (first and
 * last name at six columns each, a street at eight with a number at four, a
 * note at full width) and stack on their own when the room runs out. The
 * grid answers to its own width through container queries, so it behaves the
 * same in a page, a dialog and a sheet. Items align to the top: a hint or an
 * error under one field never pushes its neighbour out of line. The DOM order
 * is the reading order at every width. Render it `as="fieldset"` to group the
 * fields under a legend.
 */
export function FormGrid({ columns = 12, gap = "md", as = "div", legend, disabled, className, style, children, ...props }: FormGridProps) {
  // Set once on the grid, so an item inside another item never inherits the spans of the item around it.
  const vars: Record<string, string | number> = { "--fg-columns": Math.max(1, Math.round(columns)) };
  for (const kind of ["span", "start"]) for (const bp of BREAKPOINTS) vars[`--fg-${kind}-${bp}`] = "initial";
  const grid = cn("@container grid grid-cols-[repeat(var(--fg-columns),minmax(0,1fr))] items-start", GAPS[gap]);
  if (as === "fieldset") {
    return (
      <fieldset data-slot="form-grid" disabled={disabled} className={cn("m-0 min-w-0 border-0 p-0", className)} {...(props as ComponentProps<"fieldset">)}>
        {legend ? <legend className="mb-4 p-0 text-sm font-medium tracking-[-0.01em] text-foreground">{legend}</legend> : null}
        <div data-slot="form-grid-fields" style={{ ...vars, ...style } as CSSProperties} className={grid}>
          {children}
        </div>
      </fieldset>
    );
  }
  return (
    <div data-slot="form-grid" style={{ ...vars, ...style } as CSSProperties} className={cn(grid, className)} {...props}>
      {children}
    </div>
  );
}

export interface FormGridItemProps extends ComponentProps<"div"> {
  /** How many columns the item takes: a number from `sm` up (full row below), or a map such as `{ base: 12, sm: 6, lg: 4 }`. Default: the whole row. */
  span?: FormGridSpan;
  /** The column the item starts in, to leave room in front of it. A number applies from `sm` up; a map sets it per width. Default: the next free column. */
  start?: FormGridSpan;
  /** Take the whole row at every width, whatever `span` says. */
  fullWidth?: boolean;
}

/** The variables an item sets for one of `span` or `start`: only the widths it names. */
function itemVars(kind: "span" | "start", value: FormGridSpan | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  if (value === undefined) return out;
  const map = typeof value === "number" ? { sm: value } : value;
  for (const bp of BREAKPOINTS) {
    const n = map[bp];
    if (n !== undefined && Number.isFinite(n)) out[`--fg-${kind}-${bp}`] = Math.max(1, Math.min(12, Math.round(n)));
  }
  return out;
}

/** One field, or a group of fields, in a FormGrid. Put the label, control, hint and error of one field inside it. */
function FormGridItem({ span, start, fullWidth = false, className, style, ...props }: FormGridItemProps) {
  return (
    <div
      data-slot="form-grid-item"
      style={{ ...itemVars("span", span), ...itemVars("start", start), ...style } as CSSProperties}
      className={cn(
        "min-w-0",
        // The widths read the span set for them, else the one set for a narrower width, else the whole row.
        fullWidth
          ? "col-span-full"
          : "[grid-column-end:span_var(--fg-span-base,var(--fg-columns))] @md:[grid-column-end:span_var(--fg-span-sm,var(--fg-span-base,var(--fg-columns)))] @xl:[grid-column-end:span_var(--fg-span-md,var(--fg-span-sm,var(--fg-span-base,var(--fg-columns))))] @3xl:[grid-column-end:span_var(--fg-span-lg,var(--fg-span-md,var(--fg-span-sm,var(--fg-span-base,var(--fg-columns)))))]",
        start !== undefined &&
          !fullWidth &&
          "[grid-column-start:var(--fg-start-base,auto)] @md:[grid-column-start:var(--fg-start-sm,var(--fg-start-base,auto))] @xl:[grid-column-start:var(--fg-start-md,var(--fg-start-sm,var(--fg-start-base,auto)))] @3xl:[grid-column-start:var(--fg-start-lg,var(--fg-start-md,var(--fg-start-sm,var(--fg-start-base,auto))))]",
        className,
      )}
      {...props}
    />
  );
}

FormGrid.Item = FormGridItem;
