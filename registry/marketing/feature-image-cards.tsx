import type { ReactNode } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface ImageCardFeature {
  title: string;
  description: string;
  /** The picture on top: always visible, never animated in. */
  image: ReactNode;
  href?: string;
  linkLabel?: string;
}

export interface FeatureImageCardsProps {
  title: string;
  description?: string;
  features: readonly ImageCardFeature[];
  className?: string;
}

/**
 * Features shown rather than told: a card per feature with a picture on top,
 * a title and a line, and an optional link at the bottom. Three across on
 * wide screens; the link text names the feature for screen readers.
 */
export function FeatureImageCards({ title, description, features, className }: FeatureImageCardsProps) {
  return (
    <section data-slot="feature-image-cards" className={cn("py-16 sm:py-24", className)}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
        {description ? <p className="mt-4 text-base text-muted-foreground">{description}</p> : null}
      </div>
      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <li key={feature.title} className="flex flex-col overflow-clip rounded-3xl border border-border bg-card">
            <div className="aspect-[4/3] bg-muted [&_img]:size-full [&_img]:object-cover">{feature.image}</div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="text-lg font-medium tracking-tight">{feature.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              {feature.href ? (
                <a href={feature.href} className="mt-5 inline-flex items-center gap-1.5 self-start rounded-sm text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40">
                  {feature.linkLabel ?? "Learn more"}<span className="sr-only"> about {feature.title}</span>
                  <IconArrowRight aria-hidden="true" className="size-3.5" />
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
