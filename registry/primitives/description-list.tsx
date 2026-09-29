import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface DescriptionItem {
  term: string;
  value: ReactNode;
}

export interface DescriptionListProps extends Omit<ComponentProps<"dl">, "children"> {
  items: readonly DescriptionItem[];
  /** Term beside its value (rows) or above it (stacked, for narrow spaces and cards). */
  layout?: "rows" | "stacked" | "grid";
}

/**
 * Facts about one thing, as a real description list: an order's details, a
 * plan's limits, a profile. Screen readers announce term and value together.
 * Rows put them side by side, stacked puts the term above, grid lays the
 * facts out in columns like a spec sheet.
 */
export function DescriptionList({ items, layout = "rows", className, ...props }: DescriptionListProps) {
  return (
    <dl
      data-slot="description-list"
      data-layout={layout}
      className={cn(
        "text-sm",
        layout === "rows" && "divide-y divide-border",
        layout === "stacked" && "grid gap-4",
        layout === "grid" && "grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3",
        className,
      )}
      {...props}
    >
      {items.map((item) => (
        <div key={item.term} className={cn(layout === "rows" ? "grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(8rem,1fr)_2fr] sm:gap-4" : "grid gap-1")}>
          <dt className="text-muted-foreground">{item.term}</dt>
          <dd className={cn("font-medium text-foreground", layout === "grid" && "text-base")}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
