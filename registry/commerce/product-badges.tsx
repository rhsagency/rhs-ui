import { cn } from "@/lib/utils";

export type ProductBadgeKind = "new" | "sale" | "bestseller" | "limited" | "sold-out" | "eco";

export interface ProductBadgesProps {
  badges: readonly { kind: ProductBadgeKind; label?: string }[];
  /** "stack" sits in the corner of a product image; "row" sits in text. */
  layout?: "stack" | "row";
  className?: string;
}

const STYLE: Record<ProductBadgeKind, { label: string; className: string }> = {
  new: { label: "New", className: "bg-foreground text-background" },
  sale: { label: "Sale", className: "bg-destructive text-destructive-foreground" },
  bestseller: { label: "Bestseller", className: "border border-border bg-background text-foreground" },
  limited: { label: "Limited", className: "bg-background text-foreground ring-1 ring-foreground" },
  "sold-out": { label: "Sold out", className: "bg-muted text-muted-foreground" },
  eco: { label: "Recycled", className: "border border-border bg-background text-foreground" },
};

/**
 * The small labels on a product: New, Sale, Bestseller, Limited, Sold out,
 * Recycled. One shape, a style per kind that does not lean on colour alone
 * (each says its word), stacked in an image corner or in a row in text.
 * Your own label overrides the word, so "-30%" works too.
 */
export function ProductBadges({ badges, layout = "stack", className }: ProductBadgesProps) {
  return (
    <ul data-slot="product-badges" aria-label="Labels" className={cn("flex gap-1.5", layout === "stack" ? "flex-col items-start" : "flex-wrap items-center", className)}>
      {badges.map((badge) => (
        <li key={`${badge.kind}-${badge.label ?? ""}`} className={cn("rounded-full px-2.5 py-1 text-[11px] leading-none font-medium tracking-wide", STYLE[badge.kind].className)}>
          {badge.label ?? STYLE[badge.kind].label}
        </li>
      ))}
    </ul>
  );
}
