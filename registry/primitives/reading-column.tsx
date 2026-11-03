import type { ComponentProps, CSSProperties } from "react";

import { cn } from "@/lib/utils";

export interface ReadingColumnProps extends ComponentProps<"div"> {
  /** The width of the text column in `ch`, which is the width of a zero in the column's font, not a count of characters. A zero is wider than the average letter, so 50ch holds about 60 to 75 characters of text on a line, depending on the font. Default 50. */
  measure?: number;
  /** The space between blocks: `sm` 1rem, `md` 1.5rem, `lg` 2.5rem, or any CSS length. Default `md`. */
  gap?: "sm" | "md" | "lg" | (string & {});
  /** How wide `ReadingColumn.Wide` gets, any CSS length. It defaults to 72rem, the page content width of a default Container, so wide blocks line up with the rest of the page. */
  wideWidth?: string;
  /** The element to render. Default `div`. */
  as?: "div" | "article" | "main" | "section";
}

const GAPS: Record<string, string> = { sm: "1rem", md: "1.5rem", lg: "2.5rem" };

/**
 * The named lines of the grid, from edge to edge: the outer gutters flex, the
 * two wide strips grow up to the page content width, and the text column sits
 * in the middle at its measure (never wider than the room minus the gutters).
 * Every track is sized from the grid itself, never from viewport units.
 */
const TRACKS = [
  "[full-start] minmax(var(--rc-pad), 1fr)",
  "[wide-start] minmax(0, calc((var(--rc-wide) - var(--rc-measure)) / 2))",
  "[content-start] min(var(--rc-measure), 100% - 2 * var(--rc-pad))",
  "[content-end] minmax(0, calc((var(--rc-wide) - var(--rc-measure)) / 2))",
  "[wide-end] minmax(var(--rc-pad), 1fr)",
  "[full-end]",
].join(" ");

/**
 * A comfortable reading measure where figures, tables and code can break out
 * wider, or all the way to the edge. The column is a page grid with named
 * lines: every child sits in the text column (50ch, which is 60 to 75
 * characters a line in most fonts), a `ReadingColumn.Wide` child takes the
 * width of the page content, and a `ReadingColumn.Full` child runs edge to
 * edge. Because they size from the grid and not from viewport units, none of
 * them can cause horizontal scroll, and on a phone everything collapses into
 * one column with gutters.
 */
export function ReadingColumn({ measure = 50, gap = "md", wideWidth = "72rem", as = "div", className, style, ...props }: ReadingColumnProps) {
  const Tag = as as "div";
  return (
    <Tag
      data-slot="reading-column"
      style={
        {
          "--rc-measure": `${Math.max(20, measure)}ch`,
          "--rc-wide": wideWidth,
          "--rc-gap": GAPS[gap] ?? gap,
          "--rc-gutter": "clamp(1rem, 0.385rem + 2.525vw, 2rem)",
          "--rc-pad": "calc(var(--rc-gutter) + max(env(safe-area-inset-left, 0px), env(safe-area-inset-right, 0px)))",
          gridTemplateColumns: TRACKS,
          ...style,
        } as CSSProperties
      }
      // Every child goes in the text column unless it says otherwise; zero specificity, so a Wide or a Full (or your own class) wins.
      className={cn("grid w-full gap-y-(--rc-gap) [:where(&>*)]:col-[content-start/content-end] [:where(&>*)]:min-w-0", className)}
      {...props}
    />
  );
}

export interface ReadingColumnBlockProps extends ComponentProps<"div"> {
  /** The element to render, `figure` for a picture with a caption. Default `div`. */
  as?: "div" | "figure" | "section" | "aside" | "blockquote";
}

/** A child as wide as the page content: a screenshot, a table, a code sample. It never wraps wider than the room the grid has. */
function ReadingColumnWide({ as = "div", className, ...props }: ReadingColumnBlockProps) {
  const Tag = as as "div";
  return <Tag data-slot="reading-column-wide" className={cn("col-[wide-start/wide-end] min-w-0", className)} {...props} />;
}

/** A child that runs edge to edge: a full-width picture, a pull quote on a band. */
function ReadingColumnFull({ as = "div", className, ...props }: ReadingColumnBlockProps) {
  const Tag = as as "div";
  return <Tag data-slot="reading-column-full" className={cn("col-[full-start/full-end] min-w-0", className)} {...props} />;
}

ReadingColumn.Wide = ReadingColumnWide;
ReadingColumn.Full = ReadingColumnFull;
