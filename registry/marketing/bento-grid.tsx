import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface BentoCell {
  id: string;
  title: string;
  description?: string;
  /** A live component, an illustration or an image filling the top of the cell. */
  visual?: ReactNode;
  /** Wide cells span two columns on desktop; tall cells two rows. */
  size?: "default" | "wide" | "tall" | "large";
}

export interface BentoGridProps {
  eyebrow?: string;
  title: string;
  description?: string;
  cells: readonly BentoCell[];
  className?: string;
}

const SPAN: Record<NonNullable<BentoCell["size"]>, string> = {
  default: "",
  wide: "md:col-span-2",
  tall: "md:row-span-2",
  large: "md:col-span-2 md:row-span-2",
};

/**
 * Features as a bento: cells of mixed size on a three-column grid, each with
 * a visual on top and a title with a line under it. Every cell collapses to
 * one column on a phone in source order.
 */
export function BentoGrid({ eyebrow, title, description, cells, className }: BentoGridProps) {
  return (
    <section data-slot="bento-grid" className={cn("py-16 sm:py-24", className)}>
      <header className="mx-auto max-w-2xl text-center">
        {eyebrow ? <p className="mb-4 text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p> : null}
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
        {description ? <p className="mt-5 text-base leading-relaxed text-muted-foreground">{description}</p> : null}
      </header>
      <ul className="mt-14 grid auto-rows-[minmax(15rem,auto)] gap-4 md:grid-cols-3">
        {cells.map((cell) => (
          <li key={cell.id} className={cn("flex flex-col overflow-hidden rounded-2xl border border-border bg-card", SPAN[cell.size ?? "default"])}>
            {cell.visual ? <div className="relative min-h-36 flex-1 overflow-hidden border-b border-border bg-muted">{cell.visual}</div> : null}
            <div className="p-6">
              <h3 className="text-base font-medium">{cell.title}</h3>
              {cell.description ? <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{cell.description}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
