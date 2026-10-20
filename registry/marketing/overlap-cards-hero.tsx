import type { ComponentProps, ReactNode } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface OverlapCard {
  /** An icon from @rhs-ui/icons, or your own; it is drawn at 20px. */
  icon: ReactNode;
  /** The destination's name; it is the card's link text. */
  title: string;
  /** One line. */
  description: string;
  /** Where the whole card leads. */
  href: string;
}

export interface OverlapCardsHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. The card titles sit one level below it. */
  titleAs?: "h1" | "h2";
  /** A short label above the title. */
  eyebrow?: string;
  /** The headline in the panel. */
  title: string;
  /** One or two sentences under the headline. */
  description?: string;
  /** The one action in the panel. */
  cta?: { label: string; href: string };
  /** Two or three link cards. They straddle the panel's bottom edge by half their height. */
  cards: readonly [OverlapCard, OverlapCard] | readonly [OverlapCard, OverlapCard, OverlapCard];
  /** An optional background image (an <img> or your image component). A scrim keeps the text readable in both themes. */
  media?: ReactNode;
}

/* Written out so Tailwind sees every class. On a phone the cards stack and only the first overlaps the panel. */
const COLUMNS = { 2: "grid-cols-1 md:grid-cols-2", 3: "grid-cols-1 md:grid-cols-3" } as const;
/* Every card has a definite row and column: only explicit items may overlap the panel, an auto-placed one would be pushed out of its cells. */
const PLACE = [
  "col-start-1 row-start-2 row-span-2",
  "col-start-1 row-start-4 mt-4 md:col-start-2 md:row-start-2 md:row-span-2 md:mt-0",
  "col-start-1 row-start-5 mt-4 md:col-start-3 md:row-start-2 md:row-span-2 md:mt-0",
] as const;

/**
 * A corporate opening whose link cards straddle the panel's bottom edge, so
 * the first scroll already has somewhere to go. The panel and the cards share
 * one grid: the two rows under the copy are each half the height of the
 * tallest card, the panel ends between them, and the next section starts
 * after the cards, so nothing collides whatever the card text is. For
 * insurers, clinics, councils and banks, where the visitor chooses between a
 * few big destinations.
 */
export function OverlapCardsHero({ titleAs: Title = "h2", eyebrow, title, description, cta, cards, media, className, ...props }: OverlapCardsHeroProps) {
  const CardTitle = Title === "h1" ? "h2" : "h3";
  return (
    <section data-slot="overlap-cards-hero" className={cn("py-6 sm:py-10", className)} {...props}>
      <div className={cn("grid grid-rows-[auto_1fr_1fr] gap-x-5 px-4 sm:px-6 lg:px-10", COLUMNS[cards.length])}>
        <div className="relative col-span-full row-start-1 row-span-2 -mx-4 overflow-hidden rounded-3xl bg-muted sm:-mx-6 lg:-mx-10">
          {media ? (
            <>
              <div className="absolute inset-0 [&_img]:size-full [&_img]:object-cover [&_svg]:size-full">{media}</div>
              <div aria-hidden="true" className="absolute inset-0 bg-background/80" />
            </>
          ) : null}
        </div>
        <div className="relative col-span-full row-start-1 flex min-h-[24rem] flex-col items-start justify-center pt-12 pb-16 sm:min-h-[28rem] sm:pt-16 sm:pb-20">
          {eyebrow ? <p className="mb-5 text-xs font-medium tracking-[.14em] text-muted-foreground uppercase">{eyebrow}</p> : null}
          <Title className="max-w-3xl text-4xl leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">{title}</Title>
          {description ? <p className="mt-5 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}
          {cta ? (
            <Button asChild size="lg" className="mt-8">
              <a href={cta.href}>
                {cta.label}
                <IconArrowRight />
              </a>
            </Button>
          ) : null}
        </div>
        {cards.map((card, index) => (
          <article
            key={card.title}
            data-slot="overlap-cards-hero-card"
            className={cn(
              "group/card relative flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none sm:p-7",
              "hover:border-foreground/30 has-[a:focus-visible]:border-ring has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/40",
              PLACE[index],
            )}
          >
            <span className="grid size-11 place-items-center rounded-xl bg-muted text-foreground [&_svg]:size-5">{card.icon}</span>
            <div>
              <CardTitle className="text-lg font-medium tracking-[-0.02em]">
                <a href={card.href} className="outline-none after:absolute after:inset-0 after:rounded-2xl">
                  {card.title}
                </a>
              </CardTitle>
              <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">{card.description}</p>
            </div>
            <IconArrowRight
              className="absolute top-6 right-6 size-5 text-muted-foreground transition-[translate,color] duration-200 group-hover/card:text-foreground motion-reduce:transition-none motion-safe:group-hover/card:translate-x-1 motion-safe:group-has-[a:focus-visible]/card:translate-x-1 sm:top-7 sm:right-7"
            />
          </article>
        ))}
      </div>
    </section>
  );
}
