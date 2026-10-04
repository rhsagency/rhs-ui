import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface Fact {
  icon: ReactNode;
  /** Short: "45 min", "Free parking", "Up to 8 people". */
  label: string;
}

export interface FactChipsProps {
  facts: readonly Fact[];
  /** Names the list for screen readers: "Class details". */
  label?: string;
  size?: "sm" | "default";
  className?: string;
}

/**
 * The scannable alternative to a paragraph: the facts of a class, a room or
 * a product as a row of chips, an icon and two or three words each. A list,
 * so a screen reader hears how many facts there are; wraps on a phone.
 */
export function FactChips({ facts, label, size = "default", className }: FactChipsProps) {
  return (
    <ul data-slot="fact-chips" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {facts.map((fact) => (
        <li key={fact.label} className={cn("inline-flex items-center gap-1.5 rounded-full border border-border bg-card [&_svg]:shrink-0 [&_svg]:text-muted-foreground", size === "sm" ? "h-7 px-2.5 text-xs [&_svg]:size-3.5" : "h-9 px-3.5 text-sm [&_svg]:size-4")}>
          <span aria-hidden="true" className="contents">{fact.icon}</span>
          {fact.label}
        </li>
      ))}
    </ul>
  );
}
