"use client";

import { useState, type ReactNode } from "react";

import { SellerCard, type Seller } from "@rhs-ui/commerce/seller-card";
import { Button } from "@rhs-ui/primitives/button";

/** A flat monogram on a dark tile, drawn as a data URI so the demo needs no picture. */
const LOGO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' fill='#1f2530'/><path d='M14 70l22-30 14 18 10-12 22 24z' fill='#6f7a8c'/><circle cx='68' cy='28' r='7' fill='#c8cfda'/></svg>",
  );

const KESTREL: Seller = { name: "Kestrel Outdoor", logo: LOGO, verified: true, rating: 4.8, reviews: 1284, itemsSold: 12431, replyMinutes: 70, memberSince: "2021-03-14" };
const WILLOW: Seller = { name: "Willow & Pine Home", rating: 4.3, reviews: 212, itemsSold: 860, replyMinutes: 1500, memberSince: "2023-08-01" };
const HALCYON: Seller = { name: "Halcyon Studio", verified: true, memberSince: "2026-10-02" };
const NORTHWIND: Seller = { name: "Northwind Surplus", rating: 4.9, reviews: 1, itemsSold: 3, replyMinutes: 12, memberSince: "2026-09-21" };
const BLUEBIRD: Seller = { name: "Bluebird Vintage", itemsSold: 48, memberSince: "2025-02-09" };

function Example({ caption, wide = false, children }: { caption: string; wide?: boolean; children: ReactNode }): React.JSX.Element {
  return (
    <div className={wide ? "grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 [grid-column:1/-1]" : "grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3"}>
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [said, setSaid] = useState("Contact is a button here; give it contactHref and it becomes a link.");
  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-x-8 gap-y-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr))]">
      <Example caption="A verified seller with history: rating, items sold, reply time and the year they joined">
        <SellerCard seller={KESTREL} storeHref="#kestrel-outdoor" onContact={() => setSaid("Contact pressed: your app opens the message form for Kestrel Outdoor.")} />
        <p role="status" className="text-xs text-muted-foreground">
          {said}
        </p>
      </Example>

      <Example caption="No logo, not verified, slower to answer: the initials are drawn and nothing is claimed">
        <SellerCard seller={WILLOW} storeHref="#willow-and-pine" contactHref="#message-willow" />
      </Example>

      <Example caption="A new seller: it says so, instead of 0 sales and 0 reviews">
        <SellerCard seller={HALCYON} storeHref="#halcyon-studio" contactHref="#message-halcyon" />
      </Example>

      <Example caption="Sales but no reviews yet: each figure is told as it is, and no rating is made up">
        <SellerCard seller={BLUEBIRD} storeHref="#bluebird-vintage" />
      </Example>

      <Example caption="Compact, beside the price in a buy box" wide>
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5 rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="grid min-w-40 gap-1">
            <p className="text-sm text-muted-foreground">Kestrel merino base layer</p>
            <p className="text-3xl font-semibold tracking-[-0.04em] tabular-nums">$89.00</p>
            <p className="text-xs text-muted-foreground">Free delivery on orders over $75</p>
            <Button type="button" className="mt-3">
              Add to cart
            </Button>
          </div>
          {/* Inside a surface of its own the compact card gives up its border and shadow and sits as a tinted well, so the buy box has one edge, not two. */}
          <SellerCard compact seller={KESTREL} storeHref="#kestrel-outdoor" contactHref="#message-kestrel" className="w-full max-w-sm flex-[1_1_16rem] border-transparent bg-muted/50 shadow-none" />
        </div>
      </Example>

      <Example caption="Compact, with a single review and with no history: each says only what is true" wide>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
          <SellerCard compact seller={NORTHWIND} storeHref="#northwind-surplus" contactHref="#message-northwind" />
          <SellerCard compact seller={HALCYON} storeHref="#halcyon-studio" contactHref="#message-halcyon" />
        </div>
      </Example>
    </div>
  );
}
