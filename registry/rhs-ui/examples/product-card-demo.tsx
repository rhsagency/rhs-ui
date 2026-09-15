"use client";

import { useState } from "react";

import { ProductCard } from "@rhs-ui/components/product-card/product-card";
import type { ProductCardProduct } from "@rhs-ui/components/product-card/types";

const svg = (body: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'>${body}</svg>`);

const APRON: ProductCardProduct = {
  id: "apron-linen",
  title: "Linen bib apron",
  subtitle: "Kitchen textiles",
  href: "#",
  image: {
    src: svg("<rect width='400' height='500' fill='#e8e4dc'/><path d='M120 120h160l30 260H90z' fill='#8b7f6a'/><path d='M150 120c0-40 100-40 100 0' fill='none' stroke='#6d6353' stroke-width='10'/>"),
    alt: "Linen bib apron in stone",
    width: 400,
    height: 500,
  },
  price: "EUR 39,00",
  compareAtPrice: "EUR 49,00",
  badge: "-20%",
  variants: [
    { id: "stone", label: "Stone", swatch: "#8b7f6a" },
    { id: "ink", label: "Ink", swatch: "#1b1a25" },
    { id: "sage", label: "Sage", swatch: "#8aa38b", available: false },
  ],
};

const KNIFE_ROLL: ProductCardProduct = {
  id: "knife-roll",
  title: "Waxed canvas knife roll",
  subtitle: "Chef essentials",
  href: "#",
  image: {
    src: svg("<rect width='400' height='500' fill='#dcdfe4'/><rect x='80' y='150' width='240' height='200' rx='18' fill='#3b4252'/><rect x='110' y='190' width='180' height='16' rx='8' fill='#d8dee9'/><rect x='110' y='230' width='180' height='16' rx='8' fill='#d8dee9'/>"),
    alt: "Waxed canvas knife roll in slate",
    width: 400,
    height: 500,
  },
  price: "EUR 89,00",
  available: false,
  variants: [
    { id: "s", label: "S" },
    { id: "m", label: "M" },
    { id: "l", label: "L" },
  ],
};

export default function ProductCardDemo() {
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid w-full max-w-lg grid-cols-2 gap-4">
        <ProductCard
          product={APRON}
          onAddToCart={async (product, variantId) => {
            await new Promise((r) => setTimeout(r, 600));
            setLastAdded(`${product.title} (${variantId})`);
          }}
        />
        <ProductCard product={KNIFE_ROLL} />
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {lastAdded ? `Added: ${lastAdded}` : "Pick a colour, then add to cart."}
      </p>
    </div>
  );
}
