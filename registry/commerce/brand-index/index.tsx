import { useId, type ComponentProps, type ElementType } from "react";

import { BrandList, type BrandEntry } from "@rhs-ui/commerce/brand-index/brand-list";
import { letterOf, monogram, normalise, type Brand } from "@rhs-ui/commerce/brand-index/groups";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { cn } from "@/lib/utils";

export type { Brand } from "@rhs-ui/commerce/brand-index/groups";

export interface BrandIndexLabels {
  /** The heading. */
  title?: string;
  /** Under the heading when no description is passed. `{count}` brands. */
  summaryOne?: string;
  summaryOther?: string;
  /** The small heading above the tiles. */
  popular?: string;
  /** The name and the placeholder of the search field. */
  search?: string;
  /** The name of the A to Z bar. */
  jump?: string;
  /** What a screen reader hears as a group's heading. `{letter}`. */
  group?: string;
  /** The same for the group of names that start with a number or a symbol. */
  groupOther?: string;
  /** After a brand's number: `{count}` products. It is read out, not drawn. */
  countOne?: string;
  countOther?: string;
  /** Under the search while it filters. `{count}` brands match `{query}`. */
  matchOne?: string;
  matchOther?: string;
  /** In place of the list when nothing matches. `{query}`. */
  none?: string;
  /** Under it. */
  noneHint?: string;
  /** The button that empties the search and brings the whole list back. */
  clear?: string;
  /** In place of the list when there are no brands at all. */
  empty?: string;
}

const WORDS = {
  title: "Shop by brand",
  summaryOne: "{count} brand",
  summaryOther: "{count} brands, from A to Z",
  popular: "Popular brands",
  search: "Search brands",
  jump: "Jump to a letter",
  group: "Brands starting with {letter}",
  groupOther: "Brands starting with a number or a symbol",
  countOne: "{count} product",
  countOther: "{count} products",
  matchOne: "{count} brand matches “{query}”",
  matchOther: "{count} brands match “{query}”",
  none: "No brands match “{query}”",
  noneHint: "Check the spelling, or try fewer letters.",
  clear: "Show all brands",
  empty: "There are no brands to show yet.",
} satisfies Required<BrandIndexLabels>;

export interface BrandIndexProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** Every brand the shop sells, in any order: they are sorted and grouped by their first letter. */
  brands: readonly Brand[];
  /** The names of the brands to feature as tiles above the list, in this order. A name that is not in `brands` is left out. */
  popular?: readonly string[];
  /** The heading. Defaults to "Shop by brand". */
  title?: string;
  /** The line under it. Without one, it says how many brands there are. */
  description?: string;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** The heading's element: "h2" by default, "h3" inside a section that has its own h2. */
  headingAs?: "h2" | "h3";
  /** Always pass your application locale, so the names sort the same on the server and in the browser. */
  locale?: string;
  /** The words, for another language. */
  labels?: BrandIndexLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/**
 * A shop-by-brand page for shops with more brands than a menu can hold: the popular brands as tiles (a logo or
 * the brand's initials), then every brand under its first letter with its product count, and an A to Z bar that
 * jumps to each group, where a letter with no brand is shown but is not a link. A search field filters the list
 * as you type and says how many brands match, the groups are real headings so a screen reader can move from
 * letter to letter, and the columns balance on a wide screen and become one on a phone, where the bar scrolls
 * sideways. Without JavaScript the whole list is there.
 */
export function BrandIndex({ brands, popular = [], title, description, linkAs: Link = "a", headingAs: Heading = "h2", locale = "en-US", labels, className, ...props }: BrandIndexProps) {
  const words = { ...WORDS, ...labels };
  const id = useId();
  const numbers = new Intl.NumberFormat(locale);
  const plural = new Intl.PluralRules(locale);
  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  const countText = (value: number): string => fill(plural.select(value) === "one" ? words.countOne : words.countOther, { count: numbers.format(value) });

  const entries: BrandEntry[] = [...brands]
    .sort((a, b) => collator.compare(a.name, b.name))
    .map((brand) => ({
      key: `${brand.name}-${brand.href}`,
      name: brand.name,
      letter: letterOf(brand.name),
      search: normalise(brand.name),
      link: (
        <Link
          href={brand.href}
          className="-mx-2 flex items-baseline justify-between gap-4 rounded-md px-2 py-1.5 text-sm outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
        >
          <span className="min-w-0 [overflow-wrap:anywhere]">{brand.name}</span>
          {brand.count !== undefined ? (
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              <span aria-hidden="true">{numbers.format(brand.count)}</span>
              <span className="sr-only">{countText(brand.count)}</span>
            </span>
          ) : null}
        </Link>
      ),
    }));

  const featured = popular.map((name) => brands.find((brand) => brand.name === name)).filter((brand): brand is Brand => brand !== undefined);

  const tiles = featured.length ? (
    <div>
      <h3 className="mb-3 text-xs font-medium tracking-[.18em] text-muted-foreground uppercase">{words.popular}</h3>
      <ul role="list" className="grid grid-cols-2 gap-3 @xl:grid-cols-3 @4xl:grid-cols-6">
        {featured.map((brand) => (
          <li key={`${brand.name}-${brand.href}`} className="min-w-0">
            <Link
              href={brand.href}
              className="group/tile flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card outline-none transition-[border-color] duration-150 hover:border-foreground/30 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
            >
              <AspectRatio ratio={4 / 3} className="bg-muted/50">
                <span className="grid size-full place-items-center p-4">
                  {brand.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- framework-neutral; a mark is a small vector or PNG
                    <img
                      src={brand.logo.src}
                      alt={brand.logo.alt}
                      loading="lazy"
                      decoding="async"
                      className="max-h-9 max-w-[78%] object-contain opacity-75 brightness-0 transition-opacity duration-150 group-hover/tile:opacity-100 motion-reduce:transition-none dark:invert"
                    />
                  ) : (
                    <span aria-hidden="true" className="text-3xl leading-none font-medium tracking-[-0.05em] text-foreground/75">
                      {monogram(brand.name)}
                    </span>
                  )}
                </span>
              </AspectRatio>
              <span className="flex items-baseline justify-between gap-3 border-t border-border px-3.5 py-2.5 text-sm">
                <span aria-hidden={brand.logo ? true : undefined} className="min-w-0 truncate font-medium">
                  {brand.name}
                </span>
                {brand.count !== undefined ? (
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    <span aria-hidden="true">{numbers.format(brand.count)}</span>
                    <span className="sr-only">{countText(brand.count)}</span>
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  // With no brands at all there is nothing to count: "0 brands, from A to Z" would sit right above the line that says there are none.
  const summary = description ?? (entries.length > 0 ? fill(plural.select(entries.length) === "one" ? words.summaryOne : words.summaryOther, { count: numbers.format(entries.length) }) : null);

  const heading = (
    <header className="grid min-w-0 gap-1.5">
      <Heading id={`${id}-title`} className="text-2xl leading-tight font-medium tracking-[-0.035em] text-balance @3xl:text-3xl">
        {title ?? words.title}
      </Heading>
      {summary ? <p className="text-sm text-muted-foreground tabular-nums">{summary}</p> : null}
    </header>
  );

  return (
    <section data-slot="brand-index" aria-labelledby={`${id}-title`} className={cn("@container grid min-w-0 grid-cols-[minmax(0,1fr)] gap-8", className)} {...props}>
      <BrandList
        entries={entries}
        heading={heading}
        popular={tiles}
        locale={locale}
        words={{
          searchLabel: words.search,
          searchPlaceholder: words.search,
          jump: words.jump,
          group: words.group,
          groupOther: words.groupOther,
          matchOne: words.matchOne,
          matchOther: words.matchOther,
          none: words.none,
          noneHint: words.noneHint,
          clear: words.clear,
          empty: words.empty,
        }}
      />
    </section>
  );
}
