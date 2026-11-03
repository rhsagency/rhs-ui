import type { ComponentProps, ReactNode } from "react";

import { IconArrowRight, IconArrowUpRight, IconGrid, IconShieldCheck } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface MarketplaceCategory {
  /** The category's name: "Home & living". */
  label: string;
  /** How many listings it holds now. */
  count: number;
  /** Where the category lives. The whole tile is this one link. */
  href: string;
  /** The category's icon: an element from @rhs-ui/icons, such as <IconSofa />. It is decoration, the name beside it says it. */
  icon: ReactNode;
}

export interface MarketplaceHeroAction {
  /** The button's text. */
  label: string;
  /** Where it leads. */
  href: string;
}

export interface MarketplaceAllCategories {
  /** The tile's name. */
  label?: string;
  /** Where it leads. It goes where the Browse action goes when you leave it out. */
  href?: string;
  /** The total, when you know it. Without it the tile says "Browse everything". */
  count?: number;
}

export interface MarketplaceHeroLabels {
  /** The category grid's accessible name. */
  categories: string;
  /** The closing tile's name. */
  allCategories: string;
  /** What the closing tile says when it has no total. */
  browseEverything: string;
  /** The listing count's unit, singular and plural. */
  listing: { one: string; other: string };
}

const LABELS: MarketplaceHeroLabels = {
  categories: "Browse by category",
  allCategories: "All categories",
  browseEverything: "Browse everything",
  listing: { one: "listing", other: "listings" },
};

export interface MarketplaceHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** The promise, in a line. */
  title: string;
  /** One or two sentences under the title. */
  description?: string;
  /** The categories to show, most wanted first. Six or seven fill the grid; the closing "All categories" tile is added for you. */
  categories: readonly MarketplaceCategory[];
  /** The primary action: look around. */
  browse: MarketplaceHeroAction;
  /** The secondary action: start selling. */
  sell: MarketplaceHeroAction;
  /** A line of reassurance under the actions: "Every seller verified". */
  trust?: string;
  /** The closing tile. */
  allCategories?: MarketplaceAllCategories;
  /** Locale for the counts. */
  locale?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<MarketplaceHeroLabels>;
}

/** The icon, the name and the count, in the shape every tile shares. */
function Tile({ icon, name, detail, href, wide }: { icon: ReactNode; name: string; detail: string; href: string; wide?: boolean }) {
  return (
    <li className={cn("flex", wide && "col-span-2")}>
      <a
        href={href}
        className={cn(
          "group/tile relative flex min-w-0 flex-1 flex-col justify-between gap-6 bg-card p-4 outline-none sm:p-5",
          "transition-colors duration-150 hover:bg-muted focus-visible:z-10 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset motion-reduce:transition-none",
          wide && "flex-row items-center gap-4",
        )}
      >
        <span className={cn("flex items-start justify-between gap-3", wide && "contents")}>
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground [&_svg]:size-5">
            {icon}
          </span>
          <IconArrowUpRight
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-[opacity,translate,color] duration-150 motion-reduce:transition-none",
              wide
                ? "order-last ml-auto group-hover/tile:translate-x-0.5 group-hover/tile:text-foreground"
                : "opacity-0 group-hover/tile:opacity-100 group-focus-visible/tile:opacity-100 motion-safe:translate-y-0.5 motion-safe:group-hover/tile:translate-y-0 motion-safe:group-focus-visible/tile:translate-y-0",
            )}
          />
        </span>
        <span className="block min-w-0">
          <span className="block text-[0.9375rem] leading-snug font-medium tracking-[-0.01em] text-balance [overflow-wrap:anywhere]">{name}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground tabular-nums">{detail}</span>
        </span>
      </a>
    </li>
  );
}

/**
 * A browse-first opening for a marketplace, for people who do not yet know
 * what they want: the promise, a primary Browse all and a secondary Start
 * selling, and a line of trust on the left, and on the right a grid of
 * category tiles ending in an All categories tile. Each tile is one whole
 * link with an icon, the name and a tabular listing count; they sit on a
 * hairline grid, equal in height within a row and two to a row on every
 * screen, and the closing tile takes a full row when the count is odd so no
 * cell is left empty. There is no search field on purpose: it belongs in
 * your header.
 */
export function MarketplaceHero({
  titleAs: Title = "h2",
  title,
  description,
  categories,
  browse,
  sell,
  trust,
  allCategories,
  locale = "en-US",
  labels,
  className,
  ...props
}: MarketplaceHeroProps) {
  const words = { ...LABELS, ...labels, listing: { ...LABELS.listing, ...labels?.listing } };
  const number = new Intl.NumberFormat(locale);
  const plural = new Intl.PluralRules(locale);
  const listings = (count: number) => `${number.format(count)} ${plural.select(count) === "one" ? words.listing.one : words.listing.other}`;
  /* With an odd number of tiles the last one fills its row; with an even number it sits in its cell like the rest. */
  const wideLast = (categories.length + 1) % 2 === 1;

  return (
    <section data-slot="marketplace-hero" className={cn("grid grid-cols-1 items-center gap-12 py-16 sm:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16", className)} {...props}>
      <div className="min-w-0">
        <Title className="text-4xl leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">{title}</Title>
        {description ? <p className="mt-5 max-w-md text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="max-sm:grow">
            <a href={browse.href}>
              {browse.label}
              <IconArrowRight />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="max-sm:grow">
            <a href={sell.href}>{sell.label}</a>
          </Button>
        </div>
        {trust ? (
          <p className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
            {/* The icon sits with the first line, so a trust line that wraps does not leave it floating between two. */}
            <IconShieldCheck className="mt-0.5 size-4 shrink-0" />
            {trust}
          </p>
        ) : null}
      </div>
      <nav aria-label={words.categories} className="min-w-0">
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-xs">
          {categories.map((category) => (
            <Tile key={`${category.label}-${category.href}`} icon={category.icon} name={category.label} detail={listings(category.count)} href={category.href} />
          ))}
          <Tile
            icon={<IconGrid />}
            name={allCategories?.label ?? words.allCategories}
            detail={allCategories?.count === undefined ? words.browseEverything : listings(allCategories.count)}
            href={allCategories?.href ?? browse.href}
            wide={wideLast}
          />
        </ul>
      </nav>
    </section>
  );
}
