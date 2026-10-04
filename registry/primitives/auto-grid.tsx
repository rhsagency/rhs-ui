import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface AutoGridProps {
  children: ReactNode;
  /** The narrowest a column may get, in rem; the grid fits as many as the width allows. */
  min?: number;
  gap?: "sm" | "md" | "lg";
  /** "fill" keeps empty tracks so a short last row does not stretch; "fit" lets items grow into them. */
  mode?: "fill" | "fit";
  className?: string;
}

const GAP = { sm: "gap-3", md: "gap-5", lg: "gap-8" } as const;

/**
 * A responsive grid with no breakpoints: give it the smallest width a card
 * may have and it fits as many columns as there is room for, in a page, a
 * sidebar or a dialog alike (it reads its own width, not the viewport's).
 * Never narrower than the screen, so it cannot cause sideways scroll.
 */
export function AutoGrid({ children, min = 16, gap = "md", mode = "fill", className }: AutoGridProps) {
  return (
    <div
      data-slot="auto-grid"
      style={{ "--auto-grid-min": `${min}rem` } as CSSProperties}
      className={cn("grid", mode === "fill" ? "[grid-template-columns:repeat(auto-fill,minmax(min(var(--auto-grid-min),100%),1fr))]" : "[grid-template-columns:repeat(auto-fit,minmax(min(var(--auto-grid-min),100%),1fr))]", GAP[gap], className)}
    >
      {children}
    </div>
  );
}
