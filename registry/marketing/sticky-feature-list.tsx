import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface StickyFeature {
  icon: ReactNode;
  title: string;
  description: string;
}

export interface StickyFeatureListProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Under the intro, stays in view with it: a button or a link. */
  action?: ReactNode;
  features: readonly StickyFeature[];
  className?: string;
}

/**
 * A long feature list next to an intro that stays put: on wide screens the
 * heading sticks while the list scrolls past, so the promise stays in view
 * the whole way down. Plain CSS sticky, no scroll script; on a phone it is
 * simply the intro and then the list.
 */
export function StickyFeatureList({ eyebrow, title, description, action, features, className }: StickyFeatureListProps) {
  return (
    <section data-slot="sticky-feature-list" className={cn("relative grid gap-12 py-16 sm:py-24 lg:grid-cols-[1fr_1.3fr] lg:gap-20", className)}>
      <div className="lg:sticky lg:top-24 lg:self-start">
        {eyebrow ? <p className="text-xs font-medium tracking-[.14em] text-muted-foreground uppercase">{eyebrow}</p> : null}
        <h2 className="mt-3 text-3xl font-medium tracking-[-.04em] text-balance sm:text-5xl">{title}</h2>
        {description ? <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">{description}</p> : null}
        {action ? <div className="mt-8">{action}</div> : null}
      </div>
      <ul className="grid divide-y divide-border border-y border-border">
        {features.map((feature) => (
          <li key={feature.title} className="grid grid-cols-[2.5rem_1fr] gap-5 py-7">
            <span aria-hidden="true" className="inline-flex size-10 items-center justify-center rounded-xl bg-muted [&_svg]:size-5">{feature.icon}</span>
            <div>
              <h3 className="text-lg font-medium tracking-tight">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
