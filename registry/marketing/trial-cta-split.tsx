import type { ReactNode } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface TrialCtaSplitProps {
  title: string;
  description?: string;
  /** What the trial includes, a line each. */
  includes: readonly string[];
  actions: ReactNode;
  /** The fine print that removes the last doubt: "No card. Cancel in one click." */
  note?: string;
  /** A product shot that bleeds off the right edge. */
  visual: ReactNode;
  className?: string;
}

/**
 * A closing call to action with a product shot: dark band, the trial offer
 * and what is in it on the left, the product bleeding off the right edge.
 * The dark band is an island (class "dark"), so it stays dark in light mode
 * and keeps its contrast in dark mode.
 */
export function TrialCtaSplit({ title, description, includes, actions, note, visual, className }: TrialCtaSplitProps) {
  return (
    <section data-slot="trial-cta-split" className={cn("dark overflow-hidden rounded-3xl bg-background text-foreground", className)}>
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="px-8 pt-12 sm:px-12 lg:py-16">
          <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
          {description ? <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">{description}</p> : null}
          <ul className="mt-7 space-y-2.5 text-sm">
            {includes.map((item) => (
              <li key={item} className="flex items-center gap-2.5"><IconCheck className="size-4 shrink-0" />{item}</li>
            ))}
          </ul>
          <div className="mt-9 flex flex-wrap gap-3">{actions}</div>
          {note ? <p className="mt-4 text-xs text-muted-foreground">{note}</p> : null}
        </div>
        <div className="relative h-72 sm:h-96 lg:h-full lg:min-h-[28rem]">
          <div className="absolute inset-y-8 left-8 right-0 overflow-hidden rounded-l-2xl border border-r-0 border-border bg-muted lg:inset-y-12 lg:left-0">{visual}</div>
        </div>
      </div>
    </section>
  );
}
