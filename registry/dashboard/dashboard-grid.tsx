import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** A widget's width as a share of the grid's columns on a desktop: 3 of 12, 4, 6, 8 and 12. */
const SHARE = { sm: 0.25, md: 1 / 3, lg: 0.5, wide: 2 / 3, full: 1 } as const;

export type DashboardGridSize = keyof typeof SHARE;

/** A number is pixels; a string is any CSS length. */
const length = (value: number | string): string => (typeof value === "number" ? `${value}px` : value);

export interface DashboardGridProps extends Omit<ComponentProps<"div">, "children"> {
  /** Names the dashboard for screen readers: "Sales overview". */
  label: string;
  /** Columns when the grid is wide. A tablet gets half as many, a phone one. */
  columns?: number;
  /** The height of one row. A number is pixels, a string any CSS length. A row grows when its content needs more. */
  rowHeight?: number | string;
  /** The space between widgets, in the same units. */
  gap?: number | string;
  /** Fill the holes a tall widget leaves by pulling later widgets up. The look can then differ from the DOM order, which is what a screen reader keeps. */
  dense?: boolean;
  /** The widgets, each a `DashboardGrid.Widget`. */
  children: ReactNode;
}

export interface DashboardGridWidgetProps extends Omit<ComponentProps<"section">, "aria-label"> {
  /** Names the widget for screen readers. Every widget is a region, so people can jump between them. */
  label: string;
  /** A width by name: sm is a quarter of the grid, md a third, lg a half, wide two thirds, full all of it. */
  size?: DashboardGridSize;
  /** A width in columns instead of a name, for a wide grid. On a tablet a span of 4 or less takes half the row, more takes all of it. */
  span?: number;
  /** How many rows tall on a tablet and wider: a row is the grid's `rowHeight`. On a phone a widget is as tall as its content. */
  rowSpan?: number;
}

/**
 * A grid for dashboard widgets that nobody has to write grid-template for.
 * Wide, it has twelve columns; widgets take a size by name (sm, md, lg, wide,
 * full) or a span, and a height in rows of one fixed height, so tall and
 * short widgets line up. From 896px wide it has twelve columns, from 672px
 * six, and below that one, in DOM order, as tall as their content. Those
 * widths are the grid's own, not the screen's, so it adapts beside a sidebar
 * too. Every widget is a labelled region. It only lays things out; the cards,
 * tables and charts inside are yours, and a widget's only child grows to
 * fill it.
 */
export function DashboardGrid({ label, columns = 12, rowHeight = 112, gap = 16, dense = false, className, style, children, ...props }: DashboardGridProps) {
  const wide = Math.max(1, Math.round(columns));
  const medium = Math.max(1, Math.ceil(wide / 2));
  const vars = {
    "--dg-gap": length(gap),
    "--dg-row": length(rowHeight),
    "--dg-columns": wide,
    "--dg-tablet": medium,
    "--dg-template-wide": `repeat(${wide}, minmax(0, 1fr))`,
    "--dg-template-tablet": `repeat(${medium}, minmax(0, 1fr))`,
  } as CSSProperties;
  return (
    <div data-slot="dashboard-grid" className={cn("@container w-full", className)} style={{ ...vars, ...style }} {...props}>
      <div
        role="group"
        aria-label={label}
        data-dense={dense || undefined}
        className="grid grid-cols-1 auto-rows-[minmax(var(--dg-row),auto)] gap-(--dg-gap) @2xl:grid-cols-(--dg-template-tablet) @4xl:grid-cols-(--dg-template-wide) data-[dense]:grid-flow-dense"
      >
        {children}
      </div>
    </div>
  );
}

/** One place on the grid: a labelled region that spans columns and rows. */
export function DashboardGridWidget({ label, size = "md", span, rowSpan = 1, className, style, children, ...props }: DashboardGridWidgetProps) {
  const half = span === undefined ? size === "sm" || size === "md" : span <= 4;
  const vars = {
    "--dg-span-wide": span === undefined ? `calc(var(--dg-columns) * ${SHARE[size]})` : Math.max(1, Math.round(span)),
    "--dg-span-tablet": half ? "calc(var(--dg-tablet) / 2)" : "var(--dg-tablet)",
    "--dg-rows": Math.max(1, Math.round(rowSpan)),
  } as CSSProperties;
  return (
    <section
      aria-label={label}
      data-slot="dashboard-grid-widget"
      data-size={span === undefined ? size : undefined}
      className={cn("col-span-1 min-w-0 @2xl:col-span-(--dg-span-tablet) @2xl:row-span-(--dg-rows) @4xl:col-span-(--dg-span-wide) *:only:h-full", className)}
      style={{ ...vars, ...style }}
      {...props}
    >
      {children}
    </section>
  );
}

DashboardGrid.Widget = DashboardGridWidget;
