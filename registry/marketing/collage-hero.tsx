import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface CollageHeroProps {
  /** The title's element: "h2" (the default) inside a page, "h1" when this opens the page. */
  titleAs?: "h1" | "h2";
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Three to five photos; the first is the largest. Always visible, never animated in. */
  images: readonly ReactNode[];
  className?: string;
}

/**
 * An opening built from real photos: the promise on the left and a collage
 * of three to five pictures on the right, the first one large and the rest
 * staggered around it. For places and people (a gym, a restaurant, a
 * studio) where showing the room beats describing it.
 */
export function CollageHero({ titleAs: Title = "h2", eyebrow, title, description, actions, images, className }: CollageHeroProps) {
  const [first, ...rest] = images;
  return (
    <section data-slot="collage-hero" className={cn("grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1fr_1.15fr]", className)}>
      <div>
        {eyebrow ? <p className="text-xs font-medium tracking-[.14em] text-muted-foreground uppercase">{eyebrow}</p> : null}
        <Title className="mt-3 text-4xl leading-[1.04] font-medium tracking-[-.05em] text-balance sm:text-6xl">{title}</Title>
        {description ? <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">{description}</p> : null}
        {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      <div className="grid grid-cols-6 grid-rows-6 gap-3 [&_img]:size-full [&_img]:object-cover">
        <div className="col-span-4 row-span-6 aspect-[4/5] overflow-clip rounded-3xl bg-muted">{first}</div>
        {rest.slice(0, 2).map((image, index) => (
          <div key={index} className={cn("col-span-2 row-span-3 overflow-clip rounded-2xl bg-muted", index === 0 ? "mt-8" : "mb-8")}>{image}</div>
        ))}
      </div>
    </section>
  );
}
