import { cn } from "@/lib/utils";

export interface Stat {
  value: string;
  label: string;
  /** One line of context: "since launch", "median across 4,000 shops". */
  detail?: string;
}

export interface StatsGridProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  stats: readonly Stat[];
  className?: string;
}

/**
 * Proof in numbers, each with the context that makes it honest. Four cells
 * on desktop, two on a phone; the figure is the visual, the label the claim.
 */
export function StatsGrid({ eyebrow, title, description, stats, className }: StatsGridProps) {
  return (
    <section data-slot="stats-grid" className={cn("py-16 sm:py-24", className)}>
      {title ? (
        <header className="mx-auto mb-14 max-w-2xl text-center">
          {eyebrow ? <p className="mb-4 text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p> : null}
          <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
          {description ? <p className="mt-5 text-base leading-relaxed text-muted-foreground">{description}</p> : null}
        </header>
      ) : null}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col border-l border-border pl-6">
            <dt className="mt-3 text-sm font-medium">{stat.label}</dt>
            <dd className="order-first text-5xl font-medium tracking-[-.06em] tabular-nums">{stat.value}</dd>
            {stat.detail ? <dd className="mt-1 text-xs text-muted-foreground">{stat.detail}</dd> : null}
          </div>
        ))}
      </dl>
    </section>
  );
}
