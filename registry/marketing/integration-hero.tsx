import type { ComponentProps, ReactNode } from "react";

import { IconArrowLeftRight, IconArrowRight, IconBook, IconCheck, IconFlask } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { DescriptionList, type DescriptionItem } from "@rhs-ui/primitives/description-list";
import { cn } from "@/lib/utils";

export interface IntegrationHeroParty {
  /** The name read out for the pair of marks: "Acme". */
  name: string;
  /** The mark: an inline SVG or an <img>. It fills a square tile; nothing is drawn for you. */
  mark: ReactNode;
}

export interface IntegrationHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** Your product, on the left tile. */
  product: IntegrationHeroParty;
  /** The partner, on the right tile. */
  partner: IntegrationHeroParty;
  /** The page title: "Acme for Northwind". */
  title: string;
  /** What the connection does, in a line or two. */
  description?: string;
  /** Facts as term and value, three being the design: setup time, what syncs, the plan needed. Two to four fit. */
  facts: readonly DescriptionItem[];
  /** Where the connect action leads. */
  connectHref: string;
  /** Where the guide lives. */
  guideHref: string;
  /** Defaults to "Connect" followed by the partner's name. */
  connectLabel?: string;
  /** Defaults to "Read the guide". */
  guideLabel?: string;
  /** Shown as a tag beside the eyebrow. Leave out for a plain page. */
  status?: "available" | "beta";
  /** The word above the title. */
  eyebrow?: string;
}

/* Written out so Tailwind sees every class: the facts share the row evenly. */
const FACT_COLUMNS = ["sm:grid-cols-1", "sm:grid-cols-1", "sm:grid-cols-2", "sm:grid-cols-3", "sm:grid-cols-4"] as const;

function Tile({ children }: { children: ReactNode }) {
  return (
    <div className="grid size-20 shrink-0 place-items-center rounded-2xl border border-border bg-card text-foreground shadow-xs sm:size-24 [&>img]:size-10 [&>img]:object-contain [&>svg]:size-10">
      {children}
    </div>
  );
}

/**
 * A co-branded opening for an integration page: your mark and the partner's
 * on one axis, joined by a hairline with a small badge, then the title, what
 * the connection does, three facts and the connect action. The two tiles are
 * one image to a screen reader ("Acme and Northwind") and nothing is drawn
 * with the partner's brand beyond the mark you pass, so one template can give
 * every integration its own landing page without copied badges.
 */
export function IntegrationHero({
  titleAs: Title = "h2",
  product,
  partner,
  title,
  description,
  facts,
  connectHref,
  guideHref,
  connectLabel,
  guideLabel = "Read the guide",
  status,
  eyebrow = "Integration",
  className,
  ...props
}: IntegrationHeroProps) {
  return (
    <section data-slot="integration-hero" className={cn("py-16 text-center sm:py-24", className)} {...props}>
      <div role="img" aria-label={`${product.name} and ${partner.name}`} className="mx-auto flex w-fit flex-col items-center md:flex-row">
        <Tile>{product.mark}</Tile>
        <div aria-hidden="true" className="relative flex h-14 w-px items-center justify-center bg-border sm:h-16 md:h-px md:w-28 lg:w-36">
          <span className="absolute grid size-8 place-items-center rounded-full border border-border bg-background text-muted-foreground shadow-xs">
            <IconArrowLeftRight className="size-3.5" />
          </span>
        </div>
        <Tile>{partner.mark}</Tile>
      </div>
      <p className="mt-10 flex items-center justify-center gap-2.5 text-sm text-muted-foreground">
        {eyebrow}
        {status ? (
          <Badge variant={status === "beta" ? "outline" : "secondary"}>
            {status === "beta" ? <IconFlask /> : <IconCheck />}
            {status === "beta" ? "Beta" : "Available"}
          </Badge>
        ) : null}
      </p>
      <Title className="mx-auto mt-4 max-w-3xl text-4xl leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">{title}</Title>
      {description ? <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}
      <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-2xl border border-border bg-card">
        <DescriptionList
          items={facts}
          layout="grid"
          className={cn("grid-cols-1 gap-0 divide-y divide-border sm:divide-x sm:divide-y-0 [&>div]:content-start [&>div]:gap-1 [&>div]:px-5 [&>div]:py-4 [&>div]:text-center [&_dt]:text-xs", FACT_COLUMNS[Math.min(facts.length, 4)])}
        />
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <a href={connectHref}>
            {connectLabel ?? `Connect ${partner.name}`}
            <IconArrowRight />
          </a>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href={guideHref}>
            <IconBook />
            {guideLabel}
          </a>
        </Button>
      </div>
    </section>
  );
}
