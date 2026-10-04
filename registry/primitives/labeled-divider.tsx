import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface LabeledDividerProps {
  /** The word in the line: "or", "Today", "New". */
  children: ReactNode;
  align?: "center" | "left";
  className?: string;
}

/**
 * A rule with a word in it: "or" between sign-in options, a date between
 * messages, "New" above unread items. The lines are decoration; only the
 * label is read out.
 */
export function LabeledDivider({ children, align = "center", className }: LabeledDividerProps) {
  return (
    <div data-slot="labeled-divider" role="separator" className={cn("flex items-center gap-3 text-xs text-muted-foreground", className)}>
      {align === "center" ? <span aria-hidden="true" className="h-px flex-1 bg-border" /> : null}
      <span className="shrink-0">{children}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
    </div>
  );
}
