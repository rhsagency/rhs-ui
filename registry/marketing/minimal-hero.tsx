import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface MinimalHeroProps {
  /** The title's element: "h2" (the default) inside a page, "h1" when this opens the page. */
  titleAs?: "h1" | "h2";
  /** A short statement, set very large. */
  title: string;
  /** One quiet line under it. */
  subtitle?: string;
  /** A text link or two, not buttons: this hero whispers. */
  links?: readonly { label: string; href: string }[];
  /** A small line at the bottom: location, year, availability. */
  meta?: ReactNode;
  className?: string;
}

/**
 * Type and nothing else, for studios, architects and portfolios: one
 * statement as large as the screen allows, a quiet subtitle, a couple of
 * text links with arrows, and a meta line pinned at the bottom of a tall
 * section. The restraint is the design.
 */
export function MinimalHero({ titleAs: Title = "h2", title, subtitle, links = [], meta, className }: MinimalHeroProps) {
  return (
    <section data-slot="minimal-hero" className={cn("flex min-h-[70svh] flex-col justify-between gap-16 py-16", className)}>
      <div className="max-w-5xl">
        <Title className="text-5xl leading-[.98] font-medium tracking-[-.06em] text-balance sm:text-7xl lg:text-8xl">{title}</Title>
        {subtitle ? <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">{subtitle}</p> : null}
        {links.length ? (
          <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-base">
            {links.map((link) => <li key={`${link.href}-${link.label}`}><a href={link.href} className="underline decoration-1 underline-offset-[6px] hover:decoration-2">{link.label} →</a></li>)}
          </ul>
        ) : null}
      </div>
      {meta ? <div className="flex flex-wrap justify-between gap-4 border-t border-border pt-4 text-sm text-muted-foreground">{meta}</div> : null}
    </section>
  );
}
