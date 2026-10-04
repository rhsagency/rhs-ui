import type { ReactNode } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface FeatureChecklistGroup {
  title: string;
  items: readonly string[];
}

export interface FeatureChecklistProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Everything that is included, grouped by area. */
  groups: readonly FeatureChecklistGroup[];
  aside?: ReactNode;
  className?: string;
}

/**
 * Everything in the box, grouped: for the page where people check whether a
 * product does the one thing they need. Groups flow in columns; each line
 * is short and starts with a check.
 */
export function FeatureChecklist({ eyebrow, title, description, groups, aside, className }: FeatureChecklistProps) {
  return (
    <section data-slot="feature-checklist" className={cn("py-16 sm:py-24", className)}>
      <header className="max-w-2xl">
        {eyebrow ? <p className="mb-4 text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p> : null}
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
        {description ? <p className="mt-5 text-base leading-relaxed text-muted-foreground">{description}</p> : null}
      </header>
      <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <div key={group.title} className="border-t border-border pt-6">
            <h3 className="text-sm font-medium">{group.title}</h3>
            <ul className="mt-4 space-y-3">
              {group.items.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="mt-0.5 shrink-0 text-foreground [&_svg]:size-4"><IconCheck /></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {aside ? <div className="mt-12 rounded-2xl bg-muted p-6 text-sm">{aside}</div> : null}
    </section>
  );
}
