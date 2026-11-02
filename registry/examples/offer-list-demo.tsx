"use client";

import { useState, type ReactNode } from "react";

import { OfferList, type Offer } from "@rhs-ui/commerce/offer-list";

/** The Salt Road, hardcover: the same book from five sellers, in every condition. Boekenwurm has the lowest total even though its copy is only "Good". */
const BOOKS: readonly Offer[] = [
  {
    id: "kestrel",
    seller: "Kestrel Books",
    rating: 4.9,
    ratingCount: 1284,
    condition: "new",
    price: 2490,
    shipping: 0,
    delivery: { from: "2026-11-04", to: "2026-11-05" },
    note: "Sealed copy. Ships from Utrecht the same day.",
  },
  {
    id: "greta",
    seller: "Greta's Used Books",
    rating: 4.7,
    ratingCount: 612,
    condition: "like-new",
    price: 1650,
    shipping: 395,
    delivery: { from: "2026-11-05", to: "2026-11-07" },
    note: "Read once. Spine uncracked, no marks.",
  },
  {
    id: "pagefire",
    seller: "Pagefire",
    rating: 4.4,
    ratingCount: 203,
    condition: "very-good",
    price: 1320,
    shipping: 395,
    delivery: { from: "2026-11-06", to: "2026-11-09" },
    note: "Light shelf wear on the dust jacket.",
  },
  {
    id: "outlet",
    seller: "Halcyon Outlet",
    rating: 4.1,
    ratingCount: 88,
    condition: "good",
    price: 980,
    shipping: 650,
    delivery: { from: "2026-11-11", to: "2026-11-16" },
    note: "Name written inside the cover. Ships from Poland.",
  },
  {
    id: "boekenwurm",
    seller: "Boekenwurm",
    rating: 4.6,
    ratingCount: 1017,
    condition: "good",
    price: 1100,
    shipping: 395,
    delivery: { from: "2026-11-05", to: "2026-11-07" },
    note: "Corners slightly bumped. The text is clean.",
  },
];

/** A used 85 mm lens: one seller has no ratings yet, and nobody wrote a note. */
const LENSES: readonly Offer[] = [
  { id: "ridge", seller: "Ridge Camera Exchange", rating: 4.8, ratingCount: 2310, condition: "like-new", price: 41900, shipping: 0, delivery: { from: "2026-11-04" } },
  { id: "foxglove", seller: "Foxglove Photo", rating: 4.5, ratingCount: 146, condition: "very-good", price: 36900, shipping: 1200, delivery: { from: "2026-11-05", to: "2026-11-06" }, note: "Faint dust inside, no effect on pictures." },
  { id: "tern", seller: "Tern Optics", condition: "good", price: 31500, shipping: 1500, delivery: { from: "2026-11-09", to: "2026-11-12" } },
];

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [cart, setCart] = useState<readonly string[]>([]);

  const addToCart = async (offer: Offer): Promise<void> => {
    await new Promise((resolve) => window.setTimeout(resolve, 800));
    setCart((current) => [...current, offer.seller]);
  };

  return (
    <div className="mx-auto grid w-full max-w-5xl min-w-0 gap-14 px-4 py-10 sm:px-6">
      <Example caption="Sorted by price with shipping. The lowest total carries the words Best price, and Add to cart takes a moment while your app does its work">
        <OfferList
          title="Other offers for The Salt Road"
          offers={BOOKS}
          defaultSort={{ key: "price", direction: "ascending" }}
          currency="EUR"
          locale="en-GB"
          onAdd={addToCart}
        />
        <p role="status" className="text-xs text-muted-foreground">
          {cart.length === 0 ? "Your cart is empty." : `In your cart: ${cart.join(", ")}.`}
        </p>
      </Example>

      <Example caption="Used lenses in dollars, sorted by condition, with no best-price mark and one seller without ratings">
        <OfferList
          headingAs="h3"
          title="Used offers"
          offers={LENSES}
          defaultSort={{ key: "condition", direction: "ascending" }}
          highlightBest={false}
          currency="USD"
          locale="en-US"
          onAdd={() => undefined}
        />
      </Example>

      <Example caption="When nobody else sells it yet">
        <OfferList headingAs="h3" title="Other offers" offers={[]} locale="en-GB" />
      </Example>
    </div>
  );
}
