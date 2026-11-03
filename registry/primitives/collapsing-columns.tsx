import type { ComponentProps, CSSProperties } from "react";

import { cn } from "@/lib/utils";

/** The space between the cells, in a row and once stacked: a step, or any CSS length such as `2.5rem`. `none` 0, `sm` 0.75rem, `md` 1.5rem, `lg` 2.5rem. */
export type CollapsingColumnsGap = "none" | "sm" | "md" | "lg" | (string & {});

/** How the cells line up across the row: top, middle, bottom, or all as tall as the tallest. */
export type CollapsingColumnsAlign = "start" | "center" | "end" | "stretch";

export interface CollapsingColumnsProps extends ComponentProps<"div"> {
  /** The width of the container below which the cells stack, any CSS length. It is measured on the content box of this element, never on the window. Default `40rem`. */
  threshold?: string;
  /** The space between cells. Default `md`. */
  gap?: CollapsingColumnsGap;
  /** The cross-axis alignment of the cells in a row. Default `stretch`. */
  align?: CollapsingColumnsAlign;
  /** The element to render. Use `ul` or `ol` with `li` cells for a list. Default `div`. */
  as?: "div" | "section" | "ul" | "ol";
}

const GAPS: Record<string, string> = { none: "0px", sm: "0.75rem", md: "1.5rem", lg: "2.5rem" };

const ALIGN: Record<CollapsingColumnsAlign, string> = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" };

/**
 * A row of two to five equal cells that stays a row until its own width drops
 * below a threshold, and then becomes a single column in one step. A wrapping
 * grid cannot do that: three cards become two and one, and the lone card is
 * an orphan. Here every cell's basis is a number that is zero while the
 * container is wide enough and enormous once it is not, so either they all
 * share one line or each takes a line of its own. The threshold reads the
 * container, not the viewport, so the same component works on a wide page, in
 * a narrow sidebar and in a dialog, with no media query and no script. The
 * source order is the stacked order, and the cells share the width evenly
 * with a minimum of zero, so a long word breaks instead of pushing a cell
 * wider than its share.
 */
export function CollapsingColumns({ threshold = "40rem", gap = "md", align = "stretch", as = "div", className, style, ...props }: CollapsingColumnsProps) {
  const Root = as as "div";
  return (
    <Root
      data-slot="collapsing-columns"
      // A list keeps its meaning where the reset of its bullets would take it away (Safari).
      role={as === "ul" || as === "ol" ? "list" : undefined}
      style={{ "--cc-threshold": threshold, "--cc-gap": GAPS[gap] ?? gap, ...style } as CSSProperties}
      className={cn(
        "flex flex-wrap gap-(--cc-gap)",
        ALIGN[align],
        // (threshold - width) is negative while the row is wide enough, and the basis clamps to zero; below it the basis is up to 999 times the shortfall, far more than a line can hold.
        "[&>*]:min-w-0 [&>*]:grow [&>*]:basis-[calc((var(--cc-threshold)_-_100%)_*_999)] [&>*]:[overflow-wrap:anywhere]",
        as === "ul" || as === "ol" ? "m-0 list-none p-0" : undefined,
        className,
      )}
      {...props}
    />
  );
}
