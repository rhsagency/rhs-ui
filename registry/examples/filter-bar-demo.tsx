"use client";

import { useState } from "react";

import { FilterBar } from "@rhs-ui/application/filter-bar";

const PRODUCTS = [
  { name: "Linen apron", colour: "stone", size: "m" },
  { name: "Linen apron", colour: "ink", size: "l" },
  { name: "Canvas tote", colour: "stone", size: "one" },
  { name: "Wool scarf", colour: "sage", size: "one" },
  { name: "Cotton tee", colour: "ink", size: "m" },
];

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState<Record<string, readonly string[]>>({ colour: ["stone"] });
  const count = PRODUCTS.filter((product) => (!value.colour?.length || value.colour.includes(product.colour)) && (!value.size?.length || value.size.includes(product.size))).length;
  return (
    <div className="mx-auto max-w-3xl p-6">
      <FilterBar
        value={value}
        onChange={setValue}
        resultCount={count}
        groups={[
          { id: "colour", label: "Colour", options: [{ id: "stone", label: "Stone", count: 2 }, { id: "ink", label: "Ink", count: 2 }, { id: "sage", label: "Sage", count: 1 }] },
          { id: "size", label: "Size", options: [{ id: "m", label: "M" }, { id: "l", label: "L" }, { id: "one", label: "One size" }] },
        ]}
      />
    </div>
  );
}
