import { Fragment, useId, type ComponentProps, type ElementType } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { ProductCard, type ProductCardProps } from "@rhs-ui/commerce/product-card";
import type { ProductCardProduct } from "@rhs-ui/commerce/product-card/types";
import { Button } from "@rhs-ui/primitives/button";
import { Separator } from "@rhs-ui/primitives/separator";
import { cn } from "@/lib/utils";

export type { ProductCardProduct } from "@rhs-ui/commerce/product-card/types";

/** One category in the page: what it is called, where it lives and a few of its products. */
export interface CategoryRow {
  /** The category's name. It is the section's heading: "Kitchen knives". */
  name: string;
  /** The category page. */
  href: string;
  /** One line under the name: what is in it and who it is for. */
  description?: string;
  /** How many products the category holds in all. It is the number in "View all 48", whatever the row shows. */
  total: number;
  /** The products to preview. The first `perRow` are drawn; a category with fewer shows what it has. */
  products: readonly ProductCardProduct[];
}

export interface CategoryProductRowsLabels {
  /** The link beside each heading. `{total}` is how many products the category holds. */
  viewAll?: string;
  /** What a screen reader hears for that link, so six "View all" links are not six of the same. `{total}` and `{name}`. */
  viewAllName?: string;
  /** Where the products would be, for a category that has none yet. */
  empty?: string;
}

const WORDS = {
  viewAll: "View all {total}",
  viewAllName: "View all {total} in {name}",
  empty: "Nothing in here yet.",
} satisfies Required<CategoryProductRowsLabels>;

export interface CategoryProductRowsProps extends Omit<ComponentProps<"div">, "children"> {
  /** The categories, in the order they are shown. */
  categories: readonly CategoryRow[];
  /** Called with the product and the variant that was picked. Return a promise and the card shows it is working. */
  onAddToCart?: ProductCardProps["onAddToCart"];
  /** How many cards a row holds on a wide screen, from 2 to 6. Defaults to 4; a phone always shows two across. */
  perRow?: number;
  /** Renders the "View all" links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Draws a product picture: plug in next/image or any optimiser. */
  renderImage?: ProductCardProps["renderImage"];
  /** Always pass your application locale, so the totals are written the same on the server and in the browser. */
  locale?: string;
  /** The words, for another language. */
  labels?: CategoryProductRowsLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

// Whole class names, because Tailwind reads the source text. The grid answers to the width of the block itself, not of the screen, so it also works beside a sidebar.
const COLUMNS: Record<number, string> = {
  2: "",
  3: "@xl:grid-cols-3",
  4: "@2xl:grid-cols-4",
  5: "@2xl:grid-cols-3 @4xl:grid-cols-5",
  6: "@2xl:grid-cols-3 @5xl:grid-cols-6",
};

/**
 * Several categories on one page, each a short row: its name as a heading, a line about it, a "View all 48" link
 * and its first few products as cards, two across on a phone and `perRow` on a wide screen. Hairlines divide the
 * sections and each one is a region named by its own heading. A category with fewer products than a row shows
 * what it has, with no placeholders, and one with none says so. It reads as a catalogue at a glance, so a
 * shopper sees what the shop sells before choosing a category to go into.
 */
export function CategoryProductRows({ categories, onAddToCart, perRow = 4, linkAs: Link = "a", renderImage, locale = "en-US", labels, className, ...props }: CategoryProductRowsProps) {
  const words = { ...WORDS, ...labels };
  const id = useId();
  const numbers = new Intl.NumberFormat(locale);
  const columns = Math.min(6, Math.max(2, Math.round(perRow)));

  return (
    <div data-slot="category-product-rows" className={cn("@container grid min-w-0", className)} {...props}>
      {categories.map((category, index) => {
        const headingId = `${id}-${index}`;
        const total = numbers.format(category.total);
        const shown = category.products.slice(0, columns);
        return (
          <Fragment key={`${category.name}-${category.href}`}>
            {index > 0 ? <Separator /> : null}
            <section data-slot="category-product-row" aria-labelledby={headingId} className="py-8 first:pt-0 last:pb-0 @3xl:py-10">
              {/* The link sits on the heading's line, so a long description can use the whole width under both of them, on a phone too. */}
              <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1.5">
                <h2 id={headingId} className="text-xl leading-tight font-medium tracking-[-0.03em] text-balance @3xl:text-2xl">
                  {category.name}
                </h2>
                {category.total > 0 ? (
                  <Button asChild variant="outline" size="sm" className="group/view col-start-2 row-start-1 shrink-0 tabular-nums">
                    <Link href={category.href} aria-label={fill(words.viewAllName, { total, name: category.name })}>
                      {fill(words.viewAll, { total })}
                      <IconArrowRight className="transition-transform duration-150 group-hover/view:translate-x-0.5 motion-reduce:transition-none" />
                    </Link>
                  </Button>
                ) : null}
                {category.description ? <p className="col-span-2 max-w-prose text-sm leading-relaxed text-pretty text-muted-foreground">{category.description}</p> : null}
              </header>

              {shown.length ? (
                <ul role="list" className={cn("mt-6 grid grid-cols-2 gap-3 @2xl:gap-4", COLUMNS[columns])}>
                  {shown.map((product) => (
                    <li key={product.id} className="min-w-0">
                      <ProductCard product={product} onAddToCart={onAddToCart} renderImage={renderImage} className="h-full" />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-6 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">{words.empty}</p>
              )}
            </section>
          </Fragment>
        );
      })}
    </div>
  );
}
