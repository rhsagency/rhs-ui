import type { ReactNode } from "react";

import { IconAward } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface Award {
  /** "Product of the Day", "Best Workplace". */
  title: string;
  /** Who gave it: "Design Week Awards". */
  by: string;
  year: string;
  icon?: ReactNode;
}

export interface AwardsRowProps {
  title?: string;
  awards: readonly Award[];
  className?: string;
}

/**
 * Recognition as laurel-free tiles: the award, who gave it and the year, in
 * a row that scrolls sideways on a phone instead of wrapping into a wall.
 */
export function AwardsRow({ title, awards, className }: AwardsRowProps) {
  return (
    <section data-slot="awards-row" aria-label={title ?? "Awards"} className={cn("py-12", className)}>
      {title ? <h2 className="mb-8 text-center text-xs font-medium tracking-[.14em] text-muted-foreground uppercase">{title}</h2> : null}
      <ul className="relative -mx-6 flex snap-x gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {awards.map((award) => (
          <li key={`${award.title}-${award.year}`} className="flex w-60 shrink-0 snap-start items-center gap-4 rounded-2xl border border-border p-5 sm:w-auto">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-muted [&_svg]:size-5">{award.icon ?? <IconAward />}</span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{award.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{award.by}, {award.year}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
