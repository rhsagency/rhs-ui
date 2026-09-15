"use client";

import { useId, useState, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Badge } from "@rhs-ui/ui/badge";
import { Button } from "@rhs-ui/ui/button";
import { IconBag, IconCheck } from "@rhs-ui/ui/icons";
import { Skeleton } from "@rhs-ui/ui/skeleton";
import { cn } from "@/lib/utils";

import type { ProductCardImage, ProductCardProduct, ProductCardVariant } from "@rhs-ui/components/product-card/types";

const productCardVariants = cva(
  "group/product-card relative flex flex-col gap-3 rounded-xl border border-border bg-card text-card-foreground transition-[border-color,box-shadow] duration-200 focus-within:border-ring/60 hover:border-ring/40",
  {
    variants: {
      size: {
        default: "p-3",
        compact: "gap-2 p-2",
      },
    },
    defaultVariants: { size: "default" },
  },
);

export interface ProductCardProps extends VariantProps<typeof productCardVariants> {
  product: ProductCardProduct;
  /** Controlled selected variant. Omit to let the card manage it. */
  selectedVariantId?: string;
  onVariantChange?: (variant: ProductCardVariant) => void;
  /** Called with the product and the selected variant id. Return a promise to show the busy state. */
  onAddToCart?: (product: ProductCardProduct, variantId?: string) => void | Promise<void>;
  /** Plug in next/image or any optimiser. Defaults to a plain <img>. */
  renderImage?: (image: ProductCardImage, className: string) => ReactNode;
  /** Label of the primary action. */
  addToCartLabel?: string;
  /** Renders the skeleton in the same footprint. */
  loading?: boolean;
  className?: string;
}

function DefaultImage(image: ProductCardImage, className: string) {
  // eslint-disable-next-line @next/next/no-img-element -- framework-neutral default; pass renderImage to use next/image
  return <img src={image.src} alt={image.alt} width={image.width} height={image.height} loading="lazy" decoding="async" className={className} />;
}

export function ProductCard({
  product,
  selectedVariantId,
  onVariantChange,
  onAddToCart,
  renderImage = DefaultImage,
  addToCartLabel = "Add to cart",
  loading = false,
  size,
  className,
}: ProductCardProps) {
  const [internalVariant, setInternalVariant] = useState<string | undefined>(product.variants?.find((v) => v.available !== false)?.id);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const titleId = useId();
  const groupId = useId();

  if (loading) return <ProductCardSkeleton size={size} className={className} />;

  const available = product.available !== false;
  const variantId = selectedVariantId ?? internalVariant;
  const selectedVariant = product.variants?.find((v) => v.id === variantId);
  const canAdd = available && (!product.variants?.length || selectedVariant?.available !== false);
  const onSale = Boolean(product.compareAtPrice);

  const selectVariant = (variant: ProductCardVariant) => {
    if (variant.available === false) return;
    if (selectedVariantId === undefined) setInternalVariant(variant.id);
    onVariantChange?.(variant);
  };

  const add = async () => {
    if (!canAdd || busy) return;
    try {
      setBusy(true);
      await onAddToCart?.(product, variantId);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1800);
    } finally {
      setBusy(false);
    }
  };

  const imageClass = cn(
    "size-full object-cover transition-transform duration-500 ease-out motion-reduce:transition-none",
    available ? "group-hover/product-card:scale-[1.04] motion-reduce:group-hover/product-card:scale-100" : "opacity-60 grayscale",
  );

  return (
    <article data-slot="product-card" aria-labelledby={titleId} className={cn(productCardVariants({ size }), className)}>
      <div data-slot="product-card-media" className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
        {renderImage(product.image, imageClass)}
        <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          {product.badge ? <Badge variant={onSale ? "default" : "secondary"}>{product.badge}</Badge> : <span />}
          {!available ? (
            <Badge variant="outline" className="bg-background/90">
              Sold out
            </Badge>
          ) : null}
        </div>
      </div>

      <div data-slot="product-card-body" className="flex flex-1 flex-col gap-2">
        <div className="min-w-0">
          <h3 id={titleId} className="truncate text-sm leading-tight font-medium">
            {product.href ? (
              <a
                href={product.href}
                className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
              >
                {product.title}
              </a>
            ) : (
              product.title
            )}
          </h3>
          {product.subtitle ? <p className="truncate text-xs text-muted-foreground">{product.subtitle}</p> : null}
        </div>

        <p data-slot="product-card-price" className="flex items-baseline gap-2 text-sm tabular-nums">
          <span className={cn("font-semibold", onSale && "text-primary")}>{product.price}</span>
          {product.compareAtPrice ? (
            <>
              <span className="sr-only">was</span>
              <s className="text-xs text-muted-foreground">{product.compareAtPrice}</s>
            </>
          ) : null}
        </p>

        {product.variants?.length ? (
          <div role="radiogroup" aria-labelledby={groupId} className="relative z-10 flex flex-wrap items-center gap-1.5">
            <span id={groupId} className="sr-only">
              Variant
            </span>
            {product.variants.map((variant) => {
              const selected = variant.id === variantId;
              const disabled = variant.available === false;
              return (
                <button
                  key={variant.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={disabled ? `${variant.label} (unavailable)` : variant.label}
                  aria-disabled={disabled || undefined}
                  title={variant.label}
                  data-variant-id={variant.id}
                  onClick={() => selectVariant(variant)}
                  onKeyDown={(e) => {
                    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                    e.preventDefault();
                    const list = product.variants ?? [];
                    const i = list.findIndex((v) => v.id === variantId);
                    const step = e.key === "ArrowRight" ? 1 : -1;
                    for (let n = 1; n <= list.length; n++) {
                      const next = list[(i + step * n + list.length * n) % list.length];
                      if (next && next.available !== false) {
                        selectVariant(next);
                        e.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-variant-id="${CSS.escape(next.id)}"]`)?.focus();
                        break;
                      }
                    }
                  }}
                  className={cn(
                    "relative inline-flex h-7 min-w-7 items-center justify-center rounded-md border text-xs transition-[border-color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none",
                    variant.swatch ? "w-7 border-border p-0.5" : "border-border px-2",
                    selected && "border-foreground ring-1 ring-foreground",
                    disabled && "cursor-not-allowed opacity-45",
                  )}
                >
                  {variant.swatch ? <span aria-hidden="true" className="block size-full rounded-[4px]" style={{ background: variant.swatch }} /> : variant.label}
                  {disabled ? <span aria-hidden="true" className="absolute inset-0 m-auto h-px w-[130%] rotate-45 bg-foreground/50" /> : null}
                  {selected && variant.swatch ? <IconCheck size={12} className="absolute inset-0 m-auto text-white mix-blend-difference" /> : null}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="relative z-10 mt-auto pt-1">
          <Button type="button" size="sm" className="w-full" variant={added ? "secondary" : "default"} disabled={!canAdd} loading={busy} aria-live="polite" onClick={add}>
            {added ? <IconCheck /> : busy ? null : <IconBag />}
            {added ? "Added" : busy ? "Adding" : canAdd ? addToCartLabel : "Unavailable"}
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton({ size, className }: VariantProps<typeof productCardVariants> & { className?: string }) {
  return (
    <div data-slot="product-card-skeleton" aria-busy="true" className={cn(productCardVariants({ size }), className)}>
      <Skeleton className="aspect-[4/5] w-full rounded-lg" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-3/4" delay={80} />
        <Skeleton className="h-3 w-1/2" delay={120} />
        <Skeleton className="h-4 w-1/3" delay={160} />
        <div className="flex gap-1.5">
          <Skeleton className="size-7 rounded-md" delay={200} />
          <Skeleton className="size-7 rounded-md" delay={240} />
          <Skeleton className="size-7 rounded-md" delay={280} />
        </div>
        <Skeleton className="mt-1 h-8 w-full rounded-md" delay={320} />
      </div>
    </div>
  );
}

export { productCardVariants };
