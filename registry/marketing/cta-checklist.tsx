import type { ReactNode } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface CtaChecklistProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** What you get, three to six short lines. */
  points: readonly string[];
  actions: ReactNode;
  note?: string;
  className?: string;
}

/**
 * The close that removes the last doubts: the ask on the left, a checklist of
 * what is included on the right, on one bordered surface.
 */
export function CtaChecklist({ eyebrow, title, description, points, actions, note, className }: CtaChecklistProps) {
  return (
    <section data-slot="cta-checklist" className={cn("grid gap-10 rounded-2xl border border-border bg-card p-8 sm:p-12 lg:grid-cols-2 lg:gap-16", className)}>
      <div>
        {eyebrow ? <p className="mb-4 text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p> : null}
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
        {description ? <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">{description}</p> : null}
        <div className="mt-8 flex flex-wrap gap-3">{actions}</div>
        {note ? <p className="mt-4 text-xs text-muted-foreground">{note}</p> : null}
      </div>
      <ul className="flex flex-col justify-center gap-4 border-border lg:border-l lg:pl-16">
        {points.map((point) => (
          <li key={point} className="flex gap-3 text-sm">
            <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background [&_svg]:size-3">
              <IconCheck />
            </span>
            {point}
          </li>
        ))}
      </ul>
    </section>
  );
}
