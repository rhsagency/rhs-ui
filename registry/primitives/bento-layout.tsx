import { Children, isValidElement, type ComponentProps, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** The arrangement: one large tile on the left, one across the top, a six-tile mosaic, two panels side by side, or four tiles in a checkerboard. */
export type BentoPattern = "feature-left" | "feature-top" | "mosaic" | "split" | "quartet";

/** The space between tiles: `sm` (8px), `md` (16px) or `lg` (24px). */
export type BentoGap = "sm" | "md" | "lg";

/** The height of one row of the pattern: `sm` (10rem), `md` (13rem) or `lg` (16rem). A tile that spans two rows is twice as tall, plus the gap. */
export type BentoRowHeight = "sm" | "md" | "lg";

export interface BentoLayoutProps extends Omit<ComponentProps<"div">, "children"> {
  /** The tiles, in order: each child fills the next cell of the pattern. Put the one that matters most first, because it gets the largest cell. */
  children?: ReactNode;
  /** The arrangement. Default `feature-left`. */
  pattern?: BentoPattern;
  /** The space between tiles. Default `md`. */
  gap?: BentoGap;
  /** The height of one row. Default `md`. */
  rowHeight?: BentoRowHeight;
}

interface Cell {
  cols: number;
  rows: number;
}

const cell = (cols: number, rows = 1): Cell => ({ cols, rows });

/**
 * One run of each pattern on a 12 column grid, in the order the children fill
 * it. `lead` says the first cell is a feature that keeps a whole row to
 * itself on a tablet.
 */
const PATTERNS: Record<BentoPattern, { lead: boolean; cells: readonly Cell[] }> = {
  "feature-left": { lead: true, cells: [cell(6, 2), cell(3), cell(3), cell(3), cell(3)] },
  "feature-top": { lead: true, cells: [cell(12, 2), cell(4), cell(4), cell(4)] },
  mosaic: { lead: true, cells: [cell(5, 2), cell(4), cell(3), cell(7), cell(4), cell(8)] },
  split: { lead: false, cells: [cell(7, 2), cell(5, 2)] },
  quartet: { lead: false, cells: [cell(8), cell(4), cell(4), cell(8)] },
};

/** How a run that is cut short shares one row, so a list that grows never leaves a hole. */
const SHARE: Record<number, readonly number[]> = { 1: [12], 2: [6, 6], 3: [4, 4, 4], 4: [3, 3, 3, 3], 5: [3, 3, 2, 2, 2] };

// Every class is written out whole so Tailwind finds it.
const COLS: Record<number, string> = {
  2: "@4xl:col-span-2",
  3: "@4xl:col-span-3",
  4: "@4xl:col-span-4",
  5: "@4xl:col-span-5",
  6: "@4xl:col-span-6",
  7: "@4xl:col-span-7",
  8: "@4xl:col-span-8",
  12: "@4xl:col-span-12",
};
const ROWS: Record<number, string> = { 1: "@4xl:row-span-1", 2: "@4xl:row-span-2" };
const GAP: Record<BentoGap, string> = { sm: "gap-2", md: "gap-4", lg: "gap-6" };
const ROW: Record<BentoRowHeight, string> = { sm: "[--bento-row:10rem]", md: "[--bento-row:13rem]", lg: "[--bento-row:16rem]" };

interface Placement {
  cols: number;
  rows: number;
  /** Takes the whole row on a tablet, where the grid has two columns. */
  wide: boolean;
}

/** On two columns the feature fills its row, and when the rest do not pair up the last one does too. */
function isWide(index: number, size: number, lead: boolean): boolean {
  if (lead && index === 0) return true;
  const singles = lead ? size - 1 : size;
  return singles % 2 === 1 && index === size - 1;
}

/** Where each of `count` tiles goes: whole runs of the pattern, then the rest of the list on a row of its own. */
function place(count: number, pattern: BentoPattern): Placement[] {
  const { lead, cells } = PATTERNS[pattern];
  const placements: Placement[] = [];
  for (let start = 0; start < count; start += cells.length) {
    const size = Math.min(cells.length, count - start);
    if (size === cells.length) {
      cells.forEach((one, index) => placements.push({ ...one, wide: isWide(index, size, lead) }));
    } else {
      for (let index = 0; index < size; index++) placements.push({ cols: SHARE[size]?.[index] ?? 12, rows: 1, wide: isWide(index, size, false) });
    }
  }
  return placements;
}

/**
 * Mixed-size tiles from a named pattern, so a bento grid is a choice and not a
 * pile of span classes: pick `feature-left`, `feature-top`, `mosaic`, `split` or
 * `quartet`, pass the tiles as children, and every span is worked out. The
 * tiles fill the pattern in order, and a list that runs past it continues in a
 * second run; a last run that is cut short shares one row, so nothing is ever
 * left with a hole beside it. The layout answers to its own width, not the
 * window's: twelve columns when it is wide, two on a tablet and one on a phone,
 * with the first and largest tile still first. Each tile is a plain slot with
 * one radius that gives a card, an image or a statistic the full height of its
 * cell (an img placed straight in a tile covers it, and never makes its row
 * taller); it is the arrangement only, and what goes in the tiles is yours.
 */
export function BentoLayout({ pattern = "feature-left", gap = "md", rowHeight = "md", className, children, ...props }: BentoLayoutProps) {
  const tiles = Children.toArray(children);
  if (!tiles.length) return null;
  const placements = place(tiles.length, pattern);
  return (
    <div data-slot="bento-layout" data-pattern={pattern} className={cn("@container w-full", className)} {...props}>
      <div className={cn("grid grid-cols-1 auto-rows-[minmax(var(--bento-row),auto)] @xl:grid-cols-2 @4xl:grid-cols-12", GAP[gap], ROW[rowHeight])}>
        {tiles.map((tile, index) => {
          const spot = placements[index];
          return (
            <div
              key={isValidElement(tile) && tile.key != null ? tile.key : index}
              data-slot="bento-tile"
              className={cn("relative min-w-0 rounded-xl [&>*]:h-full [&>*]:rounded-[inherit] [&>img]:absolute [&>img]:inset-0 [&>img]:w-full [&>img]:object-cover", spot?.wide && "@xl:col-span-2", COLS[spot?.cols ?? 12], ROWS[spot?.rows ?? 1])}
            >
              {tile}
            </div>
          );
        })}
      </div>
    </div>
  );
}
