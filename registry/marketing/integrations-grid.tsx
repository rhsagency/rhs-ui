import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface Integration {
  id: string;
  name: string;
  description: string;
  /** The partner mark, 24px. */
  mark: ReactNode;
  category?: string;
  href?: string;
}

export interface IntegrationsGridProps {
  eyebrow?: string;
  title: string;
  description?: string;
  integrations: readonly Integration[];
  className?: string;
}

/**
 * The tools you connect to: a mark, the name, one line on what the
 * connection does. Cells with a link become one click target each.
 */
export function IntegrationsGrid({ eyebrow, title, description, integrations, className }: IntegrationsGridProps) {
  return (
    <section data-slot="integrations-grid" className={cn("py-16 sm:py-24", className)}>
      <header className="mx-auto max-w-2xl text-center">
        {eyebrow ? <p className="mb-4 text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p> : null}
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
        {description ? <p className="mt-5 text-base leading-relaxed text-muted-foreground">{description}</p> : null}
      </header>
      <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <li key={integration.id} className="group relative flex gap-4 rounded-2xl border border-border bg-card p-5 transition-colors duration-200 hover:bg-muted">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background [&_svg]:size-6">{integration.mark}</span>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                {integration.href ? (
                  <a href={integration.href} className="text-sm font-medium outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40">{integration.name}</a>
                ) : (
                  <span className="text-sm font-medium">{integration.name}</span>
                )}
                {integration.category ? <span className="rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] text-muted-foreground group-hover:bg-background">{integration.category}</span> : null}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{integration.description}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
