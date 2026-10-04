"use client";

import { PromoBar } from "@rhs-ui/commerce/promo-bar";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl overflow-clip rounded-2xl border border-border">
      <PromoBar messages={["Free delivery on orders over €50", <>New: the linen collection. <a href="#linen">Shop now</a></>, "30-day returns, free and easy"]} />
      <div className="flex items-center justify-between px-5 py-4 text-sm"><span className="font-medium">Atelier</span><span className="text-muted-foreground">Shop · Journal · Bag (2)</span></div>
    </div>
  );
}
