import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface EditorialHeroProps {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** The issue or section: "Issue 14, Spring". */
  kicker?: string;
  title: string;
  /** The standfirst: one or two sentences that sell the read. */
  standfirst?: string;
  byline?: ReactNode;
  /** A wide photo or illustration under the type. */
  visual?: ReactNode;
  caption?: string;
  className?: string;
}

/**
 * A magazine opening: kicker, a very large serif-free headline set tight, the
 * standfirst in a narrow column beside the byline, and a full-width picture
 * with its caption. For journals, case studies and long reads.
 */
export function EditorialHero({ titleAs: Title = "h2", kicker, title, standfirst, byline, visual, caption, className }: EditorialHeroProps) {
  return (
    <section data-slot="editorial-hero" className={cn("py-16 sm:py-20", className)}>
      {kicker ? <p className="border-t border-foreground pt-3 text-xs font-medium tracking-[.14em] uppercase">{kicker}</p> : null}
      <Title className="mt-8 text-5xl font-medium leading-[.98] tracking-[-.06em] text-balance sm:text-7xl lg:text-8xl">{title}</Title>
      <div className="mt-10 grid gap-6 sm:grid-cols-[1fr_2fr] sm:gap-12">
        {byline ? <div className="text-sm text-muted-foreground">{byline}</div> : <span />}
        {standfirst ? <p className="max-w-2xl text-lg leading-relaxed text-pretty sm:text-xl">{standfirst}</p> : null}
      </div>
      {visual ? (
        <figure className="mt-12">
          <div className="aspect-[21/9] overflow-hidden rounded-2xl bg-muted [&_img]:size-full [&_img]:object-cover">{visual}</div>
          {caption ? <figcaption className="mt-3 text-xs text-muted-foreground">{caption}</figcaption> : null}
        </figure>
      ) : null}
    </section>
  );
}
