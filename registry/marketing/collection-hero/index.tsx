import { Fragment, type ComponentProps, type ReactNode } from "react";

import { CollectionChips, type CollectionSubcollection } from "@rhs-ui/marketing/collection-hero/chips";
import { CollectionIntro } from "@rhs-ui/marketing/collection-hero/intro";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@rhs-ui/primitives/breadcrumb";
import { cn } from "@/lib/utils";

export type { CollectionSubcollection } from "@rhs-ui/marketing/collection-hero/chips";

export interface CollectionHeroCrumb {
  /** The crumb's text: "Bedroom". */
  label: string;
  /** Where it leads. The last crumb is the current page and needs none. */
  href?: string;
}

export interface CollectionHeroImage {
  /** The address of the picture. A data: URI works too. */
  src: string;
  /** What the picture shows. Leave it empty when the caption says enough. */
  alt: string;
  /** A line under the picture: where it was taken, or what it shows. */
  caption?: string;
  /** Intrinsic size, so the browser can reserve the space. */
  width?: number;
  height?: number;
  /** Candidate files for the browser to choose from, as in an <img srcset>. */
  srcSet?: string;
  /** How wide the picture is shown, as in an <img sizes>. Set it with `srcSet`. The default is half the screen from md, the whole width below. */
  sizes?: string;
  /** A tiny picture, as a data: URI of a few hundred bytes, that stands in blurred while the real one loads. */
  blurDataUrl?: string;
}

export interface CollectionHeroLabels {
  /** The breadcrumb's accessible name. */
  breadcrumb: string;
  /** The sub-collection chips' accessible name. */
  subcollections: string;
  /** The intro toggle while the text is cut short. */
  more: string;
  /** The intro toggle while the text is open. */
  less: string;
  /** The count's unit, singular and plural: "product", "products". */
  product: { one: string; other: string };
}

const LABELS: CollectionHeroLabels = {
  breadcrumb: "Breadcrumb",
  subcollections: "Sub-collections",
  more: "Read more",
  less: "Show less",
  product: { one: "product", other: "products" },
};

export interface CollectionHeroProps extends Omit<ComponentProps<"section">, "title"> {
  /** The title's element. A collection page's own heading, so "h1" by default; pass "h2" when the page has another. */
  titleAs?: "h1" | "h2";
  /** The collection's name. */
  title: string;
  /** How many products are listed now. Change it when a filter does: the count is a polite live region, so the change is announced. */
  count: number;
  /** The editorial intro. It is cut at three lines with a Read more button when it needs it. */
  intro?: string;
  /** The tall picture beside the heading. */
  image?: CollectionHeroImage;
  /** The path to this collection, ending with the current page. */
  breadcrumbs?: readonly CollectionHeroCrumb[];
  /** Quick links into the sub-collections. They scroll sideways on a phone and wrap from sm up. */
  subcollections?: readonly CollectionSubcollection[];
  /** Your sort and filter toolbar. It sits under the chips and above the product grid. */
  children?: ReactNode;
  /** Locale for the count and the chips' figures. */
  locale?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<CollectionHeroLabels>;
}

/**
 * The top of a collection page in a shop: breadcrumb, the collection's name,
 * how many products it holds and a short editorial intro on the left, one
 * tall picture with its caption on the right, then a row of quick links into
 * the sub-collections and a slot for your own sort and filter toolbar. The
 * count is a polite live region, so when a filter changes it a screen reader
 * hears the new number; the intro folds behind a real Read more button, shown
 * only when the text is really cut; the chips scroll sideways on a phone with
 * a soft edge on the side that has more. It fills the gap between a banner and
 * a product grid for any catalogue.
 */
export function CollectionHero({
  titleAs: Title = "h1",
  title,
  count,
  intro,
  image,
  breadcrumbs = [],
  subcollections = [],
  children,
  locale = "en-US",
  labels,
  className,
  ...props
}: CollectionHeroProps) {
  const words = { ...LABELS, ...labels, product: { ...LABELS.product, ...labels?.product } };
  const unit = new Intl.PluralRules(locale).select(count) === "one" ? words.product.one : words.product.other;
  const last = breadcrumbs.length - 1;

  return (
    <section data-slot="collection-hero" className={cn("py-10 sm:py-14", className)} {...props}>
      <div className={cn("grid grid-cols-1 gap-8 md:gap-10 lg:gap-16", image && "md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]")}>
        <div className="flex min-w-0 flex-col gap-8 md:justify-between md:gap-12">
          {breadcrumbs.length ? (
            <Breadcrumb aria-label={words.breadcrumb}>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <Fragment key={`${index}-${crumb.label}`}>
                    <BreadcrumbItem>
                      {index === last ? <BreadcrumbPage>{crumb.label}</BreadcrumbPage> : crumb.href ? <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink> : <span>{crumb.label}</span>}
                    </BreadcrumbItem>
                    {index < last ? <BreadcrumbSeparator /> : null}
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          ) : null}
          <div>
            <Title className="text-4xl leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">{title}</Title>
            <p aria-live="polite" aria-atomic="true" className="mt-3 text-sm font-medium tabular-nums">
              {new Intl.NumberFormat(locale).format(count)} {unit}
            </p>
            {intro ? <CollectionIntro text={intro} moreLabel={words.more} lessLabel={words.less} className="mt-5" /> : null}
          </div>
        </div>
        {image ? (
          <figure data-slot="collection-hero-image" className="flex min-w-0 flex-col">
            <div className="relative aspect-[4/3] flex-1 overflow-hidden rounded-2xl bg-muted sm:aspect-[16/9] md:aspect-auto md:min-h-[24rem]">
              {image.blurDataUrl ? <span aria-hidden="true" className="absolute inset-0 scale-110 bg-cover bg-center blur-xl" style={{ backgroundImage: `url("${image.blurDataUrl}")` }} /> : null}
              {/* eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the picture is any URL or data URI */}
              <img
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                srcSet={image.srcSet}
                sizes={image.sizes ?? "(min-width: 768px) 45vw, 100vw"}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 size-full object-cover"
              />
            </div>
            {image.caption ? <figcaption className="mt-3 text-xs text-muted-foreground">{image.caption}</figcaption> : null}
          </figure>
        ) : null}
      </div>
      {subcollections.length ? <CollectionChips items={subcollections} label={words.subcollections} locale={locale} className="mt-8" /> : null}
      {children ? (
        <div data-slot="collection-hero-toolbar" className="mt-6 border-t border-border pt-4">
          {children}
        </div>
      ) : null}
    </section>
  );
}
