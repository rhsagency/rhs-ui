import type { ReactNode } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface UseCase {
  href: string;
  icon: ReactNode;
  /** Who it is for: "Agencies", "Finance teams". */
  audience: string;
  title: string;
  description: string;
}

export interface UseCasesGridProps {
  title: string;
  description?: string;
  cases: readonly UseCase[];
  className?: string;
}

/**
 * "Built for teams like yours": one card per audience, each a whole link to
 * its own page, with who it is for, the job it does for them and an arrow
 * that moves on hover.
 */
export function UseCasesGrid({ title, description, cases, className }: UseCasesGridProps) {
  return (
    <section data-slot="use-cases-grid" className={cn("py-16 sm:py-24", className)}>
      <div className="max-w-2xl">
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
        {description ? <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cases.map((useCase) => (
          <li key={`${useCase.href}-${useCase.audience}`}>
            <a href={useCase.href} className="group flex h-full flex-col rounded-2xl border border-border p-6 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/40">
              <span className="flex items-center gap-3 text-xs font-medium tracking-[.1em] text-muted-foreground uppercase [&_svg]:size-4.5 [&_svg]:text-foreground">{useCase.icon}{useCase.audience}</span>
              <span className="mt-5 text-lg font-medium tracking-[-.02em]">{useCase.title}</span>
              <span className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{useCase.description}</span>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium">
                Learn more
                <IconArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
