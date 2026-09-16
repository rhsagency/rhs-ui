/**
 * Plain data shapes for the product card. No framework types, no fetching:
 * map your store's product to this once and the card stays yours.
 */
export interface ProductCardImage {
  src: string;
  alt: string;
  /** Intrinsic size, so the card can reserve space and never shift. */
  width?: number;
  height?: number;
}

export interface ProductCardVariant {
  id: string;
  /** Visible label and accessible name, for example "Sage green". */
  label: string;
  /** A CSS colour for a swatch. Omit for a text chip (sizes, materials). */
  swatch?: string;
  available?: boolean;
}

export interface ProductCardProduct {
  id: string;
  title: string;
  /** Optional secondary line: brand, category or a short subtitle. */
  subtitle?: string;
  /** Link to the product page. Omit for a card that is not a link. */
  href?: string;
  image: ProductCardImage;
  /** Already formatted for the visitor's locale, for example "EUR 49,00". */
  price: string | number;
  currency?: string;
  locale?: string;
  /** Formatted strike-through price. Renders a sale state when present. */
  compareAtPrice?: string;
  /** Short badge text: "New", "-20%", "Bestseller". Keep it under 12 characters. */
  badge?: string;
  variants?: ProductCardVariant[];
  /** False renders the sold-out state and disables add to cart. Defaults to true. */
  available?: boolean;
}
