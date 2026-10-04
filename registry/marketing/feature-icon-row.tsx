import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface IconRowItem {
  icon: ReactNode;
  title: string;
  description?: string;
}

export interface FeatureIconRowProps {
  /** Optional heading; leave it out when the row sits under a hero. */
  title?: string;
  items: readonly IconRowItem[];
  className?: string;
}

/**
 * A quiet strip of reassurances: free delivery, 30-day returns, support in
 * your language. Icon, a few words, an optional line, in a row that wraps to
 * two columns on a phone. Not a feature grid; it is meant to be glanced at.
 */
export function FeatureIconRow({ title, items, className }: FeatureIconRowProps) {
  return (
    <section data-slot="feature-icon-row" aria-label={title ? undefined : "Highlights"} className={cn("border-y border-border py-10", className)}>
      {title ? <h2 className="mb-8 text-center text-sm font-medium tracking-[.14em] text-muted-foreground uppercase">{title}</h2> : null}
      <ul className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.title} className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-muted [&_svg]:size-5">{item.icon}</span>
            <span>
              <span className="block text-sm font-medium">{item.title}</span>
              {item.description ? <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.description}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
