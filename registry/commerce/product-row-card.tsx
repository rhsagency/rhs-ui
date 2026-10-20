"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconBan, IconCalendar, IconCart, IconCheck, IconClock, IconSpinner } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Rating } from "@rhs-ui/primitives/rating";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { formatMoney, type Money } from "@rhs-ui/commerce/money";
import { cn } from "@/lib/utils";

export interface ProductRowCardStock {
  /** How the stock is said, with a small icon next to it. */
  status: "in-stock" | "low-stock" | "sold-out" | "preorder";
  /** Units left, for "low-stock": "Only 3 left". */
  left?: number;
  /** Your own words, such as "Ships tomorrow". They replace the default text. */
  label?: string;
}

export interface ProductRowCardProduct {
  /** Tells products apart in callbacks such as onAddToCart. */
  id: string;
  /** The name of the product. It is the text of the link. */
  title: string;
  /** The picture, with its intrinsic size when you know it. */
  image: { src: string; alt: string; width?: number; height?: number };
  /** The average score and the number of reviews. Left out, the rating line is not shown. */
  rating?: { value: number; count: number };
  /** Two lines of it show on wider screens; the rest is clamped. */
  description?: string;
  /** Short facts in one muted line: ["Stoneware", "28 cm", "Dishwasher safe"]. */
  attributes?: readonly string[];
  /** In minor units, with its currency: `{ amount: 12900, currency: "EUR" }`. */
  price: Money;
  /** The regular price. A figure above `price` makes it a sale and shows the saving. */
  compareAtPrice?: Money;
  /** How many are left, in words with a small icon. Left out, no stock line is shown. */
  stock?: ProductRowCardStock;
}

export interface ProductRowCardLabels {
  /** The stock line and the button of a sold-out product. */
  soldOut?: string;
  /** The stock line of a product that is available. */
  inStock?: string;
  /** The stock line when stock is low and no number is given. */
  lowStock?: string;
  /** The stock line with a number. {count} is the number left. */
  onlyLeft?: string;
  /** The stock line of a pre-order. */
  preorder?: string;
  /** Said before the current price of a sale. */
  sale?: string;
  /** Said before the struck-through price. */
  regular?: string;
  /** {percent} is the saving. */
  save?: string;
  /** On the button while the add runs. */
  adding?: string;
  /** On the button once the item is in the cart. */
  added?: string;
  /** What a screen reader hears after the add. {title} is the product. */
  addedAnnouncement?: string;
  /** The rating for a screen reader. {value} is the score and {count} the number of reviews. */
  rated?: string;
}

export interface ProductRowCardProps extends Omit<ComponentProps<"article">, "children"> {
  /** The product to show. Map your store's product to this shape once. */
  product: ProductRowCardProduct;
  /** Where the card goes. The title is this link, stretched over the whole card. */
  href?: string;
  /** Called when "Add to cart" is pressed. Return a promise to show the busy state; the card shows "Added" when it resolves. */
  onAddToCart?: (product: ProductRowCardProduct) => void | Promise<void>;
  /** Room for a wishlist button or any other small control beside "Add to cart". On a phone that button is 40px high, so a control of the same height sits level with it. */
  wishlist?: ReactNode;
  /** A short label on the picture: "New", "Bestseller". */
  badge?: string;
  /** Width over height of the picture: 1 (square) by default. */
  ratio?: number;
  /** The words on the button. */
  addToCartLabel?: string;
  /** Always pass your application locale, so the server and the browser print the same price and numbers. */
  locale?: string;
  /** The level of the title, so the page outline stays in order. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** The other words on the card, for another language. */
  labels?: ProductRowCardLabels;
}

const WORDS = {
  soldOut: "Sold out",
  inStock: "In stock",
  lowStock: "Low stock",
  onlyLeft: "Only {count} left",
  preorder: "Pre-order",
  sale: "Sale price",
  regular: "Regular price",
  save: "Save {percent}%",
  adding: "Adding",
  added: "Added",
  addedAnnouncement: "{title} added to your cart",
  rated: "Rated {value} out of 5, from {count} reviews",
} satisfies Required<ProductRowCardLabels>;

const STOCK_ICON = { "in-stock": IconCheck, "low-stock": IconClock, "sold-out": IconBan, preorder: IconCalendar } as const;

/** Every label sits in the same grid cell, so the button is as wide as the longest and nothing moves when the words change. */
function Faces({ active, faces }: { active: number; faces: readonly ReactNode[] }) {
  return (
    <span className="inline-grid">
      {faces.map((face, index) => (
        <span key={index} aria-hidden={index === active ? undefined : true} className={cn("col-start-1 row-start-1 inline-flex items-center justify-center gap-2 whitespace-nowrap transition-opacity duration-150 motion-reduce:transition-none", index === active ? "opacity-100" : "pointer-events-none opacity-0")}>
          {face}
        </span>
      ))}
    </span>
  );
}

/**
 * The list-view product card: a picture on the left, then the title, a
 * one-line rating, two lines of description and a line of facts, and on the
 * right the price block, the stock in words and the actions. On a phone the
 * price block and the actions stack below the text, always in that order, with
 * Add to cart filling the row. The title is the card's stretched link while
 * the buttons stay separate controls above it.
 * ProductRowCardSkeleton is the matching placeholder.
 */
export function ProductRowCard({ product, href, onAddToCart, wishlist, badge, ratio = 1, addToCartLabel = "Add to cart", locale = "en-US", headingLevel = 3, labels, className, ...props }: ProductRowCardProps) {
  const words = { ...WORDS, ...labels };
  const titleId = useId();
  const [phase, setPhase] = useState<"idle" | "busy" | "added">("idle");
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const Heading = `h${headingLevel}` as "h3";
  const soldOut = product.stock?.status === "sold-out";
  const saving = product.compareAtPrice && product.compareAtPrice.amount > product.price.amount ? Math.round((1 - product.price.amount / product.compareAtPrice.amount) * 100) : 0;
  const stock = product.stock;
  const StockIcon = stock ? STOCK_ICON[stock.status] : null;
  const stockWords = !stock ? "" : stock.label ?? (stock.status === "low-stock" ? (stock.left ? words.onlyLeft.replace("{count}", String(stock.left)) : words.lowStock) : stock.status === "in-stock" ? words.inStock : stock.status === "sold-out" ? words.soldOut : words.preorder);
  const rating = product.rating;
  const score = rating ? new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(rating.value) : "";
  const reviews = rating ? new Intl.NumberFormat(locale).format(rating.count) : "";

  async function add() {
    if (phase !== "idle" || soldOut) return;
    setPhase("busy");
    try {
      await onAddToCart?.(product);
      setPhase("added");
      timer.current = window.setTimeout(() => setPhase("idle"), 1800);
    } catch {
      // The page that owns onAddToCart reports the failure; the button just comes back.
      setPhase("idle");
    }
  }

  return (
    <article
      data-slot="product-row-card"
      aria-labelledby={titleId}
      className={cn(
        "group/row relative grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 gap-y-4 rounded-xl border border-border bg-card p-3 text-card-foreground transition-[border-color] duration-200 hover:border-ring/40 motion-reduce:transition-none sm:grid-cols-[9.5rem_minmax(0,1fr)_auto] sm:p-4",
        className,
      )}
      {...props}
    >
      <div className="relative self-start overflow-hidden rounded-lg bg-muted" style={{ aspectRatio: ratio }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- framework-neutral; a list card has no use for an optimiser it cannot configure */}
        <img src={product.image.src} alt={product.image.alt} width={product.image.width} height={product.image.height} loading="lazy" decoding="async" className={cn("absolute inset-0 size-full object-cover transition-[opacity,transform] duration-500 ease-out group-hover/row:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover/row:scale-100", soldOut && "opacity-50")} />
        {badge ? (
          <Badge variant="outline" className="absolute top-2 left-2 bg-background">
            {badge}
          </Badge>
        ) : null}
      </div>

      <div className="min-w-0 sm:self-start">
        <Heading id={titleId} className="text-[0.9375rem] leading-snug font-medium tracking-[-0.01em] text-pretty sm:text-base">
          {href ? (
            <a href={href} className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40">
              {product.title}
            </a>
          ) : (
            product.title
          )}
        </Heading>
        {rating ? (
          <div className="mt-1.5 flex items-center text-xs text-muted-foreground">
            {/* The stars round to the half, so a screen reader gets the exact score in a sentence instead. */}
            <span aria-hidden="true" className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <Rating readOnly size={14} value={rating.value} />
              <span className="whitespace-nowrap">
                <span className="font-medium text-foreground tabular-nums">{score}</span> <span className="tabular-nums">({reviews})</span>
              </span>
            </span>
            <span className="sr-only">{words.rated.replace("{value}", score).replace("{count}", reviews)}</span>
          </div>
        ) : null}
        {product.description ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground max-sm:hidden">{product.description}</p> : null}
        {product.attributes?.length ? (
          // Every fact leads with its own dot and the row clips the first one: a dot that lands at the start of a wrapped line is clipped too, so none ever dangles at the end of a line.
          <div className="mt-2 overflow-hidden">
            <ul className="-ml-4 flex flex-wrap gap-y-0.5 text-xs text-muted-foreground">
              {product.attributes.map((attribute) => (
                <li key={attribute} className="relative pl-4 whitespace-nowrap">
                  <span aria-hidden="true" className="absolute left-0 w-4 text-center">
                    ·
                  </span>
                  {attribute}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="relative z-10 col-span-2 grid gap-3 sm:col-span-1 sm:flex sm:flex-col sm:items-end sm:justify-between">
        <div className="grid gap-1 sm:justify-items-end sm:text-right">
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0 tabular-nums sm:justify-end">
            {saving ? <span className="sr-only">{words.sale}: </span> : null}
            <span className="text-lg leading-tight font-semibold tracking-[-0.02em]">{formatMoney(product.price, locale)}</span>
            {saving && product.compareAtPrice ? (
              <>
                <span className="sr-only">{words.regular}: </span>
                <s className="text-xs text-muted-foreground">{formatMoney(product.compareAtPrice, locale)}</s>
                <span className="text-xs font-medium">{words.save.replace("{percent}", String(saving))}</span>
              </>
            ) : null}
          </p>
          {stock && StockIcon ? (
            <p className={cn("flex items-center gap-1.5 text-xs sm:justify-end", stock.status === "low-stock" ? "font-medium text-foreground" : "text-muted-foreground")}>
              <StockIcon aria-hidden="true" size={14} className="shrink-0" />
              {stockWords}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant={phase === "added" ? "secondary" : soldOut ? "outline" : "default"} disabled={soldOut} aria-busy={phase === "busy" || undefined} aria-disabled={phase !== "idle" || undefined} onClick={() => void add()} className="max-sm:h-10 max-sm:flex-1">
            <Faces
              active={soldOut ? 3 : phase === "idle" ? 0 : phase === "busy" ? 1 : 2}
              faces={[
                <>
                  <IconCart />
                  {addToCartLabel}
                </>,
                <>
                  <IconSpinner />
                  {words.adding}
                </>,
                <>
                  <IconCheck />
                  {words.added}
                </>,
                words.soldOut,
              ]}
            />
          </Button>
          <span role="status" className="sr-only">
            {phase === "added" ? words.addedAnnouncement.replace("{title}", product.title) : ""}
          </span>
          {wishlist}
        </div>
      </div>
    </article>
  );
}

/** The placeholder for a card that is still loading: the same picture, lines and actions, so a list does not shift when the data arrives. */
export function ProductRowCardSkeleton({ ratio = 1, className, ...props }: Omit<ComponentProps<"div">, "children"> & { ratio?: number }) {
  return (
    <div
      data-slot="product-row-card-skeleton"
      aria-busy="true"
      className={cn("grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 gap-y-4 rounded-xl border border-border bg-card p-3 sm:grid-cols-[9.5rem_minmax(0,1fr)_auto] sm:p-4", className)}
      {...props}
    >
      <Skeleton className="self-start rounded-lg" style={{ aspectRatio: ratio }} />
      <div className="grid content-start gap-2.5">
        <Skeleton className="h-4 w-3/4" delay={60} />
        <Skeleton className="h-3 w-2/5" delay={120} />
        <Skeleton className="h-3 w-full max-sm:hidden" delay={180} />
        <Skeleton className="h-3 w-3/5" delay={240} />
      </div>
      <div className="col-span-2 grid gap-3 sm:col-span-1 sm:flex sm:flex-col sm:items-end sm:justify-between">
        <div className="grid gap-2 sm:justify-items-end">
          <Skeleton className="h-5 w-20" delay={120} />
          <Skeleton className="h-3 w-14" delay={180} />
        </div>
        <Skeleton className="h-10 w-full rounded-md sm:h-8 sm:w-32" delay={240} />
      </div>
    </div>
  );
}
