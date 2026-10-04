"use client";

import { QuickView } from "@rhs-ui/commerce/quick-view";
import { Button } from "@rhs-ui/primitives/button";

const apron = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect width='400' height='400' fill='#dedad2'/><path d='M130 110h140l30 240H100z' fill='#5d5850'/><path d='M160 110c0-40 80-40 80 0' fill='none' stroke='#5d5850' stroke-width='10'/></svg>");

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex min-h-64 max-w-sm flex-col items-center gap-4 p-8">
      <img src={apron} alt="Linen apron in charcoal" className="aspect-square w-48 rounded-2xl object-cover" />
      <QuickView
        product={{
          title: "Linen apron",
          price: { amount: 3900, currency: "EUR" },
          description: "Washed Belgian linen with two deep pockets and long ties. Softer with every wash.",
          image: { src: apron, alt: "Linen apron in charcoal" },
          options: { name: "Size", values: [{ value: "S" }, { value: "M" }, { value: "L", available: false }, { value: "XL" }] },
          href: "#linen-apron",
        }}
        onAdd={() => new Promise<void>((resolve) => setTimeout(resolve, 600))}
      >
        <Button variant="outline">Quick view</Button>
      </QuickView>
    </div>
  );
}
