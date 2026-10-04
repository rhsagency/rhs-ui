"use client";

import { useState } from "react";

import { CartDrawer, type CartDrawerLine } from "@rhs-ui/commerce/cart-drawer";
import { IconBag } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

const art = (fill: string, shape: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='200' height='200' fill='${fill}'/>${shape}</svg>`);

export default function Demo(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<CartDrawerLine[]>([
    { id: "apron", title: "Linen apron", variant: "Stone / M", quantity: 1, price: { amount: 3900, currency: "EUR" }, image: { src: art("#dedad2", "<path d='M65 55h70l15 120H50z' fill='#5d5850'/>"), alt: "Linen apron" } },
    { id: "mug", title: "Stoneware mug", variant: "Set of 2", quantity: 2, price: { amount: 2400, currency: "EUR" }, image: { src: art("#e4e0d8", "<rect x='60' y='65' width='75' height='85' rx='9' fill='#8b8377'/>"), alt: "Stoneware mug" } },
  ]);
  return (
    <div className="mx-auto flex min-h-64 max-w-sm items-center justify-center p-8">
      <CartDrawer
        open={open}
        onOpenChange={setOpen}
        trigger={<Button variant="outline"><IconBag /> Bag ({lines.reduce((sum, line) => sum + line.quantity, 0)})</Button>}
        lines={lines}
        freeShippingFrom={10000}
        checkoutHref="#checkout"
        onQuantityChange={(id, quantity) => setLines((list) => list.map((line) => (line.id === id ? { ...line, quantity } : line)))}
        onRemove={(id) => setLines((list) => list.filter((line) => line.id !== id))}
      />
    </div>
  );
}
