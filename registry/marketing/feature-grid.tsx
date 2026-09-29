import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface Feature {
  id: string;
  /** A 20px icon from @rhs-ui/icons, or your own mark. */
  icon: ReactNode;
  title: string;
  description: string;
  /** An optional link or small note under the description. */
  footer?: ReactNode;
}

export interface FeatureGridProps {
  eyebrow?: string;
  title: string;
  description?: string;
  features: readonly Feature[];
  /** Two columns for four features or fewer, three for more. */
  columns?: 2 | 3;
  className?: string;
}

/**
 * What the product does, in scannable cells: an icon, a short title and one
 * or two lines each, on a hairline grid instead of floating cards. The heading
 * sits above, centred; the cells read left to right.
 */
export function FeatureGrid({ eyebrow, title, description, features, columns, className }: FeatureGridProps) {
  const cols = columns ?? (features.length <= 4 ? 2 : 3);
  return (
    <section data-slot="feature-grid" className={cn("py-16 sm:py-24", className)}>
      <header className="mx-auto max-w-2xl text-center">
        {eyebrow ? <p className="mb-4 text-xs font-medium tracking-[.18em] text-muted-foreground uppercase">{eyebrow}</p> : null}
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
        {description ? <p className="mt-5 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </header>
      <ul
        className={cn(
          "mt-14 grid overflow-hidden rounded-2xl border border-border bg-border gap-px sm:grid-cols-2",
          cols === 3 && "lg:grid-cols-3",
        )}
      >
        {features.map((feature) => (
          <li key={feature.id} className="flex flex-col gap-3 bg-background p-7 sm:p-8">
            <span className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-foreground [&_svg]:size-5">
              {feature.icon}
            </span>
            <h3 className="pt-2 text-base font-medium">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            {feature.footer ? <div className="mt-auto pt-2 text-sm">{feature.footer}</div> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
