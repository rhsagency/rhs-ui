import { useId, type ComponentProps, type ReactNode } from "react";

import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Badge } from "@rhs-ui/primitives/badge";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { formatMoney, type Money } from "@rhs-ui/commerce/money";
import { cn } from "@/lib/utils";

export interface ProductTileImage {
  /** The address of the picture. A data: URI works too. */
  src: string;
  /** What the picture shows. Leave it empty for the hover image: it repeats the product. */
  alt: string;
  /** Intrinsic size, so the browser can reserve the space. */
  width?: number;
  height?: number;
  /** Candidate files for the browser to choose from, as in an <img srcset>. */
  srcSet?: string;
  /** How wide the picture is shown, as in an <img sizes>. Set it with `srcSet`. */
  sizes?: string;
}

export interface ProductTileProduct {
  /** The name of the product. It is the text of the link. */
  title: string;
  /** Where the tile goes. The whole tile is this one link. */
  href: string;
  /** The main picture. */
  image: ProductTileImage;
  /** A second picture that fades in on hover and keyboard focus: the product from another side, or in use. */
  hoverImage?: ProductTileImage;
  /** In minor units, with its currency: `{ amount: 6800, currency: "EUR" }`. */
  price: Money;
  /** The regular price. A figure above `price` makes the tile a sale. */
  compareAtPrice?: Money;
  /** Shows "Sold out" on the picture, dims it and says so to screen readers. */
  soldOut?: boolean;
}

export interface ProductTileLabels {
  /** The label on a sold-out picture, and what a screen reader hears after the name. */
  soldOut?: string;
  /** Said before the current price of a sale. */
  sale?: string;
  /** Said before the struck-through price. */
  regular?: string;
}

export interface ProductTileProps extends Omit<ComponentProps<"article">, "children"> {
  /** The product to show. Map your store's product to this shape once. */
  product: ProductTileProduct;
  /** Width over height of the picture area: 4 / 5 (portrait, the default), 1 for a square, 3 / 2 for landscape. */
  ratio?: number;
  /** A short label in the top left corner: "New", "-20%". */
  badge?: string;
  /** Loads the picture eagerly and at high priority: set it for the first row, above the fold. */
  priority?: boolean;
  /** Always pass your application locale, so the server and the browser print the same price. */
  locale?: string;
  /** The level of the product name, so the page outline stays in order. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** The words on the tile, for another language. */
  labels?: ProductTileLabels;
  /** Plug in next/image or any optimiser. Defaults to a plain <img>. */
  renderImage?: (image: ProductTileImage, options: { className: string; priority: boolean }) => ReactNode;
}

function DefaultImage(image: ProductTileImage, { className, priority }: { className: string; priority: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element -- framework-neutral default; pass renderImage to use next/image
  return <img src={image.src} alt={image.alt} width={image.width} height={image.height} srcSet={image.srcSet} sizes={image.sizes} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" className={className} />;
}

/**
 * The quiet product tile for editorial grids: a picture, the name and the
 * price, the whole tile being one link. A second picture fades in on hover and
 * on keyboard focus; a sold-out tile says so in words and dims the picture.
 * There is no button inside, so it is safe in carousels and dense grids, and
 * the picture area keeps its proportions before anything loads, so a grid
 * never shifts. ProductTileSkeleton is the matching placeholder.
 */
export function ProductTile({ product, ratio = 4 / 5, badge, priority = false, locale = "en-US", headingLevel = 3, renderImage = DefaultImage, labels, className, ...props }: ProductTileProps) {
  const words = { soldOut: "Sold out", sale: "Sale price", regular: "Regular price", ...labels };
  const Heading = `h${headingLevel}` as "h3";
  const priceId = useId();
  const onSale = Boolean(product.compareAtPrice && product.compareAtPrice.amount > product.price.amount);
  const fill = "absolute inset-0 size-full object-cover";

  return (
    <article data-slot="product-tile" data-sold-out={product.soldOut || undefined} className={cn("group/tile relative flex min-w-0 flex-col gap-3 rounded-lg", className)} {...props}>
      <AspectRatio ratio={ratio} className="overflow-hidden rounded-lg bg-muted">
        <div className={cn("absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none", product.soldOut && "opacity-50")}>
          {renderImage(product.image, {
            priority,
            className: cn(fill, "transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none", !product.hoverImage && "group-hover/tile:scale-[1.03] motion-reduce:group-hover/tile:scale-100"),
          })}
          {product.hoverImage
            ? renderImage(product.hoverImage, {
                priority: false,
                className: cn(fill, "opacity-0 transition-opacity duration-300 ease-out group-hover/tile:opacity-100 group-has-[a:focus-visible]/tile:opacity-100 motion-reduce:transition-none"),
              })
            : null}
        </div>
        {/* The words are in the link's name below, so the pictures' labels are only for the eye. */}
        {badge ? (
          <Badge aria-hidden="true" variant="outline" className="absolute top-2 left-2 bg-background">
            {badge}
          </Badge>
        ) : null}
        {product.soldOut ? (
          <Badge aria-hidden="true" variant="outline" className="absolute bottom-2 left-2 bg-background">
            {words.soldOut}
          </Badge>
        ) : null}
      </AspectRatio>

      <div className="min-w-0">
        <Heading className="line-clamp-2 text-sm leading-snug font-medium tracking-[-0.01em] text-pretty">
          <a href={product.href} aria-describedby={priceId} className="outline-none after:absolute after:-inset-1.5 after:rounded-xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40">
            {product.title}
            {badge ? <span className="sr-only">, {badge}</span> : null}
            {product.soldOut ? <span className="sr-only">, {words.soldOut}</span> : null}
          </a>
        </Heading>
        <p id={priceId} className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm tabular-nums">
          {onSale ? <span className="sr-only">{words.sale}: </span> : null}
          <span className={cn("font-medium", product.soldOut && "text-muted-foreground")}>{formatMoney(product.price, locale)}</span>
          {onSale && product.compareAtPrice ? (
            <>
              <span className="sr-only">{words.regular}: </span>
              <s className="text-xs text-muted-foreground">{formatMoney(product.compareAtPrice, locale)}</s>
            </>
          ) : null}
        </p>
      </div>
    </article>
  );
}

export interface ProductTileSkeletonProps extends Omit<ComponentProps<"div">, "children"> {
  /** The same ratio as the tiles it stands in for. */
  ratio?: number;
}

/** The placeholder for a tile that is still loading: the same picture area and two lines, so the grid does not shift when the data arrives. */
export function ProductTileSkeleton({ ratio = 4 / 5, className, ...props }: ProductTileSkeletonProps) {
  return (
    <div data-slot="product-tile-skeleton" aria-busy="true" className={cn("flex min-w-0 flex-col gap-3", className)} {...props}>
      <Skeleton className="w-full rounded-lg" style={{ aspectRatio: ratio }} />
      <div className="grid gap-2">
        <Skeleton className="h-3.5 w-3/4" delay={80} />
        <Skeleton className="h-3.5 w-1/4" delay={160} />
      </div>
    </div>
  );
}
