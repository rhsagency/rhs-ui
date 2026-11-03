import type { ComponentProps } from "react";

import { Card } from "@rhs-ui/primitives/card";
import { cn } from "@/lib/utils";

/** The padding of the panel: `sm` 16px, `md` 24px, `lg` 32px. */
export type InsetPanelPadding = "sm" | "md" | "lg";

/** Which edges an inset reaches: all four, the left and right (`x`), the top and bottom (`y`), or one edge with the two sides next to it. */
export type InsetSide = "all" | "x" | "y" | "top" | "bottom" | "start" | "end";

export interface InsetPanelProps extends ComponentProps<"div"> {
  /** How much room the content has from the edge: `sm` 16px, `md` 24px, `lg` 32px. Every `InsetPanel.Inset` reads it, so they always reach the edge. Default `md`. */
  padding?: InsetPanelPadding;
}

const PADDING: Record<InsetPanelPadding, string> = {
  sm: "[--inset-panel-padding:1rem]",
  md: "[--inset-panel-padding:1.5rem]",
  lg: "[--inset-panel-padding:2rem]",
};

/**
 * A padded surface whose images, tables and code can reach its edges. Wrap a
 * child in `InsetPanel.Inset` and it cancels the panel's padding on the sides
 * you pick: a screenshot at the top of a card, a table at the bottom, a code
 * block between two paragraphs. The panel keeps its padding in one CSS
 * variable that every inset reads, so the negative margins always match, and
 * an inset rounds only the corners that touch the panel's edge, with the
 * inner radius so no sliver of background shows.
 */
export function InsetPanel({ padding = "md", className, ...props }: InsetPanelProps) {
  return (
    <Card
      data-slot="inset-panel"
      data-padding={padding}
      className={cn("min-w-0 max-w-full gap-4 p-(--inset-panel-padding)", PADDING[padding], className)}
      {...props}
    />
  );
}

export interface InsetProps extends ComponentProps<"div"> {
  /** Which edges to reach. `top` and `bottom` reach the sides next to them as well (a picture across the whole top), `start` and `end` reach the top and bottom (a picture down one side). Default `x`. */
  side?: InsetSide;
}

/**
 * The margins that cancel the padding, and the corners that touch the panel's edge. The corner radius is the panel's own less its 1px
 * line, so an inset fits the corner exactly. Written out whole, because Tailwind reads class names from the source.
 */
const SIDES: Record<InsetSide, string> = {
  all: "-m-(--inset-panel-padding) rounded-[calc(var(--radius-xl,0.75rem)-1px)]",
  x: "-mx-(--inset-panel-padding)",
  y: "-my-(--inset-panel-padding)",
  top: "-mx-(--inset-panel-padding) -mt-(--inset-panel-padding) rounded-t-[calc(var(--radius-xl,0.75rem)-1px)]",
  bottom: "-mx-(--inset-panel-padding) -mb-(--inset-panel-padding) rounded-b-[calc(var(--radius-xl,0.75rem)-1px)]",
  start: "-my-(--inset-panel-padding) -ms-(--inset-panel-padding) rounded-s-[calc(var(--radius-xl,0.75rem)-1px)]",
  end: "-my-(--inset-panel-padding) -me-(--inset-panel-padding) rounded-e-[calc(var(--radius-xl,0.75rem)-1px)]",
};

/**
 * Content that bleeds to the edge of an `InsetPanel`. It scrolls sideways
 * inside itself when it is wider than the panel, such as a table, so the
 * panel never grows. Where scrollbars are classic (Windows, Linux) the one it
 * shows is thin and soft, so it reads as a quiet hint and not as a stray control.
 */
function Inset({ side = "x", className, ...props }: InsetProps) {
  return (
    <div
      data-slot="inset-panel-inset"
      data-side={side}
      className={cn(
        "relative min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-color:color-mix(in_oklab,var(--foreground)_28%,transparent)_transparent] [scrollbar-width:thin]",
        SIDES[side],
        className,
      )}
      {...props}
    />
  );
}

InsetPanel.Inset = Inset;
