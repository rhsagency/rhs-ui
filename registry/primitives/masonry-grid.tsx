import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface MasonryGridProps {
  children: ReactNode;
  /** Columns at the widest; fewer on smaller screens. */
  columns?: 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

const COLUMNS = { 2: "sm:columns-2", 3: "sm:columns-2 lg:columns-3", 4: "sm:columns-2 lg:columns-3 xl:columns-4" } as const;
const GAPS = { sm: "gap-3 [&>*]:mb-3", md: "gap-5 [&>*]:mb-5", lg: "gap-8 [&>*]:mb-8" } as const;

/**
 * Items of different heights packed into columns, like a pinboard: quotes,
 * photos, notes. Pure CSS columns, so no JavaScript measures anything and
 * nothing jumps after load; items never split across columns. Reading
 * order runs down each column, so keep it for content where order is loose.
 */
export function MasonryGrid({ children, columns = 3, gap = "md", className }: MasonryGridProps) {
  return <div data-slot="masonry-grid" className={cn("columns-1 [&>*]:break-inside-avoid", COLUMNS[columns], GAPS[gap], className)}>{children}</div>;
}
