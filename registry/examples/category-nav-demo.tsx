"use client";

import { useState, type ReactNode } from "react";

import { CategoryNav, type CategoryNode } from "@rhs-ui/commerce/category-nav";

const SHOP: CategoryNode[] = [
  {
    id: "women",
    label: "Women",
    href: "/women",
    count: 1284,
    children: [
      {
        id: "dresses",
        label: "Dresses",
        href: "/women/dresses",
        count: 326,
        children: [
          { id: "mini", label: "Mini", href: "/women/dresses/mini", count: 74 },
          {
            id: "midi",
            label: "Midi",
            href: "/women/dresses/midi",
            count: 112,
            children: [
              { id: "floral", label: "Floral", href: "/women/dresses/midi/floral", count: 34 },
              { id: "plain", label: "Plain", href: "/women/dresses/midi/plain", count: 28 },
              { id: "wrap", label: "Wrap", href: "/women/dresses/midi/wrap", count: 19 },
              { id: "satin", label: "Satin", href: "/women/dresses/midi/satin", count: 14 },
              { id: "knit", label: "Knitted", href: "/women/dresses/midi/knit", count: 9 },
              { id: "pleated", label: "Pleated", href: "/women/dresses/midi/pleated", count: 7 },
              { id: "tiered", label: "Tiered", href: "/women/dresses/midi/tiered", count: 5 },
              { id: "linen", label: "Linen", href: "/women/dresses/midi/linen", count: 3 },
              { id: "shirt", label: "Shirt dresses", href: "/women/dresses/midi/shirt", count: 0 },
            ],
          },
          { id: "maxi", label: "Maxi", href: "/women/dresses/maxi", count: 89 },
          { id: "occasion", label: "Occasion", href: "/women/dresses/occasion", count: 51 },
        ],
      },
      { id: "tops", label: "Tops", href: "/women/tops", count: 412 },
      { id: "knitwear", label: "Knitwear", href: "/women/knitwear", count: 188 },
      { id: "coats", label: "Coats", href: "/women/coats", count: 96 },
    ],
  },
  { id: "men", label: "Men", href: "/men", count: 1102 },
  { id: "kids", label: "Kids", href: "/kids", count: 644 },
  { id: "sale", label: "Sale", href: "/sale", count: 411 },
];

const HELP: CategoryNode[] = [
  {
    id: "orders",
    label: "Orders and delivery",
    href: "/help/orders",
    children: [
      { id: "track", label: "Track an order", href: "/help/orders/track" },
      { id: "change", label: "Change or cancel an order", href: "/help/orders/change" },
      { id: "late", label: "My parcel is late", href: "/help/orders/late" },
    ],
  },
  { id: "returns", label: "Returns and refunds", href: "/help/returns" },
  { id: "payments", label: "Payments and invoices", href: "/help/payments" },
  { id: "account", label: "Your account", href: "/help/account" },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
      {/* Four lines tall in a three-column row, so the lists line up across the columns. */}
      <p className="text-xs leading-relaxed text-muted-foreground sm:min-h-20">{caption}</p>
      <div className="rounded-xl border border-border bg-card p-3 text-card-foreground">{children}</div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [current, setCurrent] = useState<string | null>("midi");

  return (
    <div className="grid w-full max-w-5xl min-w-0 gap-x-10 gap-y-12 [grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr))]">
      <Example caption="Women, Dresses, Midi: the parents are links back, the dresses beside Midi are listed, and the nine children fold after six. Click around, the page does not leave.">
        <CategoryNav
          tree={SHOP}
          currentId={current}
          onNavigate={(category, event) => {
            event.preventDefault();
            setCurrent(category?.id ?? null);
          }}
        />
      </Example>

      <Example caption="At the top there is no branch yet: All categories is where you are and the departments are its children.">
        <CategoryNav tree={SHOP} labels={{ nav: "Shop departments" }} />
      </Example>

      <Example caption="A help centre needs no counts, so they are off. The branch is just as short.">
        <CategoryNav tree={HELP} currentId="late" showCounts={false} labels={{ nav: "Help topics" }} />
      </Example>
    </div>
  );
}
