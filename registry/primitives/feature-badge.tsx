import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface FeatureBadgeProps {
  /** "new" for a fresh feature, "beta" for one still settling, "soon" for one on its way. */
  kind: "new" | "beta" | "soon";
  /** The navigation item or button it labels. */
  children: ReactNode;
  className?: string;
}

const COPY = { new: "New", beta: "Beta", soon: "Soon" } as const;

/**
 * The little "New", "Beta" or "Soon" next to a menu item or a button, so
 * people notice what changed without a tour. The word is part of the
 * accessible name ("Reports, new"), and the style differs per kind in shape
 * and fill, not colour alone.
 */
export function FeatureBadge({ kind, children, className }: FeatureBadgeProps) {
  return (
    <span data-slot="feature-badge" className={cn("inline-flex items-center gap-2", className)}>
      {children}
      <span className={cn("relative rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold tracking-wide uppercase", kind === "new" ? "bg-foreground text-background" : kind === "beta" ? "border border-foreground text-foreground" : "border border-dashed border-border text-muted-foreground")}>
        <span className="sr-only">, </span>{COPY[kind]}
      </span>
    </span>
  );
}
