import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface HeroMetric {
  value: string;
  label: string;
}

export interface MetricsHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Three or four numbers that prove the promise. */
  metrics: readonly HeroMetric[];
  className?: string;
}

/**
 * A left-aligned opening for products that win on numbers: the promise and
 * the action on top, then a row of large figures on a hairline, each with a
 * label that says what was measured.
 */
export function MetricsHero({ eyebrow, title, description, actions, metrics, className }: MetricsHeroProps) {
  return (
    <section data-slot="metrics-hero" className={cn("py-16 sm:py-24", className)}>
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          {eyebrow ? <p className="mb-6 text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p> : null}
          <h2 className="max-w-2xl text-5xl font-medium leading-[1.04] tracking-[-.055em] text-balance sm:text-6xl">{title}</h2>
        </div>
        <div>
          {description ? <p className="max-w-md text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
          {actions ? <div className="mt-7 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </div>
      <dl className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex flex-col-reverse gap-2 bg-background p-6 sm:p-8">
            <dt className="text-sm text-muted-foreground">{metric.label}</dt>
            <dd className="text-4xl font-medium tracking-[-.05em] tabular-nums sm:text-5xl">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
