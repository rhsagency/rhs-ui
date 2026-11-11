import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { Slot } from "radix-ui";

import { renderAs, type RenderProp } from "@rhs-ui/primitives/render-prop";
import { cn } from "@/lib/utils";

/** The breakpoints a column map speaks. They are Tailwind's: `base` is everything below `sm`. */
export type HairlineGridBreakpoint = "base" | "sm" | "md" | "lg" | "xl";

/** A fixed number of columns, or one number per breakpoint such as `{ base: 1, sm: 2, lg: 4 }`. A breakpoint you leave out keeps the value of the one before it. */
export type HairlineGridColumns = number | Partial<Record<HairlineGridBreakpoint, number>>;

/** The padding inside every cell: `none`, `sm` (16px), `md` (20px, 24px from `sm`) or `lg` (24px, 32px from `sm`). */
export type HairlineGridPadding = "none" | "sm" | "md" | "lg";

/** The element the grid is. A `ul` or `ol` wants `li` cells (`as="li"` on each HairlineGridCell). */
export type HairlineGridElement = "div" | "ul" | "ol" | "section";

export interface HairlineGridProps extends Omit<ComponentProps<"div">, "children"> {
  /** The cells: HairlineGridCell elements. */
  children?: ReactNode;
  /** How many columns, as a number or a map per breakpoint. Default `{ base: 1, sm: 2, lg: 3 }`. Ignored when `minCell` is set. */
  columns?: HairlineGridColumns;
  /** Let the width decide: as many columns as fit when every cell is at least this wide (a number in rem, or any CSS length). Cells grow to fill the row, and the grid reads its own width, not the window's. */
  minCell?: number | string;
  /** Draw a frame with rounded corners around the grid. Without it the hairlines only run between cells and nothing marks the outer edge. Default false. */
  bordered?: boolean;
  /** The padding inside every cell. Default `md`. */
  padding?: HairlineGridPadding;
  /** The element to render. Default `div`. */
  as?: HairlineGridElement;
}

export interface HairlineGridCellProps extends ComponentProps<"div"> {
  /** Render the cell onto your own element, such as a link or a Next `Link`: the cell then answers hover and keyboard focus inside its own box. */
  asChild?: boolean;
  /** The element to render when `asChild` is off. Use `li` inside a `ul` or `ol` grid. Default `div`. */
  as?: "div" | "li" | "article" | "section";
}

const ORDER = ["base", "sm", "md", "lg", "xl"] as const;

const whole = (n: number) => (Number.isFinite(n) ? Math.max(1, Math.round(n)) : 1);

/** One column count for every breakpoint, carrying each value forward until the map names a new one. */
function resolveColumns(columns: HairlineGridColumns): Record<HairlineGridBreakpoint, number> {
  const out = {} as Record<HairlineGridBreakpoint, number>;
  let current = 1;
  for (const key of ORDER) {
    const value = typeof columns === "number" ? columns : columns[key];
    current = value === undefined ? current : whole(value);
    out[key] = current;
  }
  return out;
}

// The track lists are written out whole so Tailwind finds them; the numbers arrive as custom properties.
const FIXED =
  "[grid-template-columns:repeat(var(--hg-cols),minmax(0,1fr))] sm:[grid-template-columns:repeat(var(--hg-cols-sm),minmax(0,1fr))] md:[grid-template-columns:repeat(var(--hg-cols-md),minmax(0,1fr))] lg:[grid-template-columns:repeat(var(--hg-cols-lg),minmax(0,1fr))] xl:[grid-template-columns:repeat(var(--hg-cols-xl),minmax(0,1fr))]";
const FIT = "[grid-template-columns:repeat(auto-fit,minmax(min(var(--hg-min),100%),1fr))]";

const PADDING: Record<HairlineGridPadding, string> = {
  none: "[--hg-pad:0px]",
  sm: "[--hg-pad:1rem]",
  md: "[--hg-pad:1.25rem] sm:[--hg-pad:1.5rem]",
  lg: "[--hg-pad:1.5rem] sm:[--hg-pad:2rem]",
};

/**
 * Cells divided by single hairlines, the layout behind feature grids, logo
 * walls and stat strips. The lines are the 1px gap between cells showing the
 * border colour through, so two cells never draw a double rule, nothing is
 * drawn on the outer edge unless you ask for a frame with `bordered`, and the
 * lines use no colour but the border token, so both themes just work. A last
 * row that is short does not leave a grey slot or a line that goes nowhere: its
 * final cell carries on, in the cell colour, to the end of the row. Give it `columns` (a
 * number, or a map per breakpoint) or `minCell` (as many columns as fit), set
 * the padding of every cell with `padding`, and fill it with HairlineGridCell.
 * A cell made with `asChild` around a link answers hover and focus inside its
 * own box and nowhere else. The cells are painted in `--hg-cell` (the page
 * background by default); set it on the grid to sit on a card or a tinted band.
 */
export function HairlineGrid({ columns = { base: 1, sm: 2, lg: 3 }, minCell, bordered = false, padding = "md", as = "div", className, style, ...props }: HairlineGridProps) {
  const Tag = as as "div";
  const fit = minCell !== undefined;
  const cols = resolveColumns(columns);
  const vars = fit
    ? { "--hg-min": typeof minCell === "number" ? `${minCell}rem` : minCell }
    : { "--hg-cols": cols.base, "--hg-cols-sm": cols.sm, "--hg-cols-md": cols.md, "--hg-cols-lg": cols.lg, "--hg-cols-xl": cols.xl };
  return (
    <Tag
      data-slot="hairline-grid"
      data-bordered={bordered || undefined}
      // Without its bullets a list can lose its role in Safari, so it says so.
      role={as === "ul" || as === "ol" ? "list" : undefined}
      className={cn("grid gap-px overflow-hidden bg-border", fit ? FIT : FIXED, PADDING[padding], bordered && "rounded-xl border border-border", className)}
      style={{ ...vars, ...style } as CSSProperties}
      {...props}
    />
  );
}

/** One cell of a HairlineGrid: the grid's padding, the cell colour, and nothing else, so it holds any content. */
export function HairlineGridCell(input: HairlineGridCellProps & RenderProp) {
  const { as: Tag = "div", asChild = false, className, ...props } = renderAs(input);
  const Comp = asChild ? Slot.Root : (Tag as "div");
  return (
    <Comp
      data-slot="hairline-grid-cell"
      className={cn(
        "relative min-w-0 bg-[var(--hg-cell,var(--background))] p-[var(--hg-pad,1.5rem)]",
        // A short last row: the final cell paints on past its own edge, so the end of the row is never left showing the line colour.
        "last:after:pointer-events-none last:after:absolute last:after:inset-y-0 last:after:start-full last:after:w-screen last:after:bg-[var(--hg-cell,var(--background))] last:after:content-['']",
        // A link or a button answers the pointer and the keyboard inside its own box, never over its neighbours.
        "[&:is(a,button)]:cursor-pointer [&:is(a,button)]:text-left [&:is(a,button)]:transition-colors [&:is(a,button)]:duration-150 motion-reduce:[&:is(a,button)]:transition-none",
        "[&:is(a,button)]:hover:bg-[color-mix(in_oklch,var(--hg-cell,var(--background)),var(--foreground)_4%)]",
        "[&:is(a,button)]:outline-none [&:is(a,button)]:focus-visible:ring-[3px] [&:is(a,button)]:focus-visible:ring-inset [&:is(a,button)]:focus-visible:ring-ring/60",
        className,
      )}
      {...props}
    />
  );
}
