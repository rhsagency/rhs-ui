import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface CenteredHeroProps {
  /** A short pill above the title: a release, a launch, a number. */
  announcement?: ReactNode;
  title: string;
  description?: string;
  /** One or two actions; the first is the one you want clicked. */
  actions?: ReactNode;
  /** A line under the actions: "No card needed", "Free for teams of three". */
  note?: string;
  /** A product shot or a live component under the copy. */
  visual?: ReactNode;
  className?: string;
}

/**
 * The classic opening: one centred promise, one line of proof, the action,
 * and the product underneath. The title is an h2 so the page keeps its own h1.
 */
export function CenteredHero({ announcement, title, description, actions, note, visual, className }: CenteredHeroProps) {
  return (
    <section data-slot="centered-hero" className={cn("py-16 text-center sm:py-24", className)}>
      {announcement ? (
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground [&_a]:font-medium [&_a]:text-foreground">
          {announcement}
        </div>
      ) : null}
      <h2 className="mx-auto max-w-3xl text-5xl font-medium leading-[1.04] tracking-[-.055em] text-balance sm:text-6xl lg:text-7xl">{title}</h2>
      {description ? <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}
      {actions ? <div className="mt-9 flex flex-wrap items-center justify-center gap-3">{actions}</div> : null}
      {note ? <p className="mt-4 text-xs text-muted-foreground">{note}</p> : null}
      {visual ? <div className="relative mx-auto mt-14 max-w-5xl overflow-hidden rounded-2xl border border-border bg-muted text-left sm:mt-20">{visual}</div> : null}
    </section>
  );
}
