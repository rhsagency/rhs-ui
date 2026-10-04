import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface AlternatingFeature {
  id: string;
  eyebrow?: string;
  title: string;
  description: string;
  /** Two or three short facts under the text. */
  points?: readonly string[];
  visual: ReactNode;
}

export interface FeatureAlternatingProps {
  features: readonly AlternatingFeature[];
  className?: string;
}

/**
 * Features as a zig-zag: text and picture side by side, swapping sides every
 * row, stacking text-first on a phone. The classic for three to five
 * features that each deserve a picture.
 */
export function FeatureAlternating({ features, className }: FeatureAlternatingProps) {
  return (
    <section data-slot="feature-alternating" className={cn("space-y-20 py-16 sm:space-y-28 sm:py-24", className)}>
      {features.map((feature, index) => (
        <article key={feature.id} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <div className={cn(index % 2 === 1 && "lg:order-2")}>
            {feature.eyebrow ? <p className="text-xs font-medium tracking-[.14em] text-muted-foreground uppercase">{feature.eyebrow}</p> : null}
            <h3 className="mt-3 text-3xl font-medium leading-[1.1] tracking-[-.04em] text-balance sm:text-4xl">{feature.title}</h3>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">{feature.description}</p>
            {feature.points?.length ? (
              <ul className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
                {feature.points.map((point) => (
                  <li key={point} className="flex items-center gap-2"><span aria-hidden="true" className="size-1.5 rounded-full bg-foreground" />{point}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-muted">{feature.visual}</div>
        </article>
      ))}
    </section>
  );
}
