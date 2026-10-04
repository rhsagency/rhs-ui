"use client";

import { useState } from "react";

import { MiniCart, type MiniCartLine } from "@rhs-ui/commerce/mini-cart";

const LINES: MiniCartLine[] = [
  { id: "apron", title: "Linen apron", variant: "Stone", quantity: 1, price: { amount: 3900, currency: "EUR" } },
  { id: "mug", title: "Stoneware mug", variant: "Set of 2", quantity: 2, price: { amount: 2400, currency: "EUR" } },
];

export default function Demo(): React.JSX.Element {
  const [lines, setLines] = useState(LINES);
  return (
    <div className="mx-auto flex min-h-80 max-w-md items-start justify-end p-8">
      <MiniCart lines={lines} onRemove={(id) => setLines((list) => list.filter((line) => line.id !== id))} checkoutHref="#checkout" cartHref="#cart" />
    </div>
  );
}
