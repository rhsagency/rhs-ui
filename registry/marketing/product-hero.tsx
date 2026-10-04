import type { ReactNode } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface ProductHeroProps {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  eyebrow?: string;
  title: string;
  description?: string;
  /** Three or four short reasons, each a line with a check. */
  points?: readonly string[];
  actions?: ReactNode;
  /** The product photo or render, square-ish. */
  visual: ReactNode;
  /** A small line under the actions: price, rating, delivery. */
  note?: ReactNode;
  className?: string;
}

/**
 * A product launch opening: the object large on the right, the name, a line
 * of why, a few checked reasons and the buy action on the left. For a
 * physical product or a single app where the picture does the selling.
 */
export function ProductHero({ titleAs: Title = "h2", eyebrow, title, description, points = [], actions, visual, note, className }: ProductHeroProps) {
  return (
    <section data-slot="product-hero" className={cn("grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16", className)}>
      <div>
        {eyebrow ? <p className="text-xs font-medium tracking-[.14em] text-muted-foreground uppercase">{eyebrow}</p> : null}
        <Title className="mt-3 text-4xl font-medium leading-[1.05] tracking-[-.05em] text-balance sm:text-5xl lg:text-6xl">{title}</Title>
        {description ? <p className="mt-5 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
        {points.length ? (
          <ul className="mt-7 space-y-2.5">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 inline-flex size-4.5 shrink-0 items-center justify-center rounded-full bg-foreground text-background [&_svg]:size-3"><IconCheck /></span>
                {point}
              </li>
            ))}
          </ul>
        ) : null}
        {actions ? <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div> : null}
        {note ? <div className="mt-4 text-xs text-muted-foreground">{note}</div> : null}
      </div>
      <div className="relative aspect-[5/4] overflow-hidden rounded-3xl bg-muted [&_img]:size-full [&_img]:object-cover">{visual}</div>
    </section>
  );
}
