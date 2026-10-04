"use client";

import { useState } from "react";

import { BundlePicker } from "@rhs-ui/commerce/bundle-picker";

const art = (fill: string, shape: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='200' height='200' fill='${fill}'/>${shape}</svg>`);

export default function Demo(): React.JSX.Element {
  const [selected, setSelected] = useState<string[]>(["beans", "filter"]);
  const [added, setAdded] = useState<number | null>(null);
  return (
    <div className="mx-auto max-w-md p-8">
      <BundlePicker
        discount={0.1}
        selected={selected}
        onSelectedChange={setSelected}
        onAdd={(ids) => setAdded(ids.length)}
        items={[
          { id: "dripper", title: "Ceramic dripper", locked: true, price: { amount: 3200, currency: "EUR" }, image: { src: art("#e4e0d8", "<path d='M50 70h100l-30 70H80z' fill='#8b8377'/>"), alt: "Ceramic dripper" } },
          { id: "beans", title: "Single-origin beans, 500 g", price: { amount: 1895, currency: "EUR" }, image: { src: art("#d7d1c6", "<ellipse cx='100' cy='100' rx='45' ry='60' fill='#4b4036'/>"), alt: "Coffee beans" } },
          { id: "filter", title: "Paper filters, 100", price: { amount: 650, currency: "EUR" }, image: { src: art("#efece6", "<path d='M60 60h80l-25 80H85z' fill='#d8d1c3'/>"), alt: "Paper filters" } },
        ]}
      />
      <p role="status" className="mt-3 text-sm text-muted-foreground">{added ? `${added} items added to your bag.` : ""}</p>
    </div>
  );
}
