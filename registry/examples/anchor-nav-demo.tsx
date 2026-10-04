"use client";

import { AnchorNav } from "@rhs-ui/primitives/anchor-nav";

const ITEMS = [
  { id: "an-overview", label: "Overview" },
  { id: "an-specs", label: "Specifications" },
  { id: "an-reviews", label: "Reviews" },
  { id: "an-delivery", label: "Delivery" },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <AnchorNav items={ITEMS} />
      <div className="mt-6 space-y-8">
        {ITEMS.map((item) => (
          <section key={item.id} id={item.id} className="scroll-mt-16">
            <h2 className="text-lg font-medium">{item.label}</h2>
            <p className="mt-2 text-sm text-muted-foreground">Placeholder copy for the {item.label.toLowerCase()} section of a product page.</p>
          </section>
        ))}
      </div>
    </div>
  );
}
