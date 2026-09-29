"use client";

import { useState } from "react";

import { CartLine } from "@rhs-ui/commerce/cart-line";

const svg = (body: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 96'>${body}</svg>`);

const LINES = [
  { id: "apron", title: "Linen bib apron", variant: "Stone / M", price: { amount: 3900, currency: "EUR" }, compareAt: { amount: 4900, currency: "EUR" }, max: 6, image: { src: svg("<rect width='80' height='96' fill='#e8e4dc'/><path d='M24 24h32l6 52H18z' fill='#8b7f6a'/>"), alt: "Linen bib apron in stone" } },
  { id: "roll", title: "Waxed canvas knife roll", variant: "Slate", price: { amount: 8900, currency: "EUR" }, max: 2, image: { src: svg("<rect width='80' height='96' fill='#dcdfe4'/><rect x='16' y='30' width='48' height='40' rx='4' fill='#3b4252'/>"), alt: "Knife roll in slate" } },
];

export default function CartLineDemo() {
  const [quantities, setQuantities] = useState<Record<string, number>>({ apron: 2, roll: 1 });
  const lines = LINES.filter((line) => quantities[line.id]);
  return (
    <div className="w-full max-w-md divide-y divide-border rounded-xl border border-border px-4">
      {lines.length ? (
        lines.map((line) => (
          <CartLine
            key={line.id}
            {...line}
            href="#cart"
            quantity={quantities[line.id]!}
            onQuantityChange={(quantity) => setQuantities((current) => ({ ...current, [line.id]: quantity }))}
            onRemove={() => setQuantities((current) => ({ ...current, [line.id]: 0 }))}
          />
        ))
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">Your cart is empty.</p>
      )}
    </div>
  );
}
