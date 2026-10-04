"use client";

import { useState } from "react";

import { FilterSidebar } from "@rhs-ui/commerce/filter-sidebar";

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState<Record<string, string[]>>({ colour: ["stone"] });
  const active = Object.values(value).flat().length;
  return (
    <div className="mx-auto max-w-xs p-8">
      <FilterSidebar
        results={Math.max(3, 48 - active * 11)}
        value={value}
        onValueChange={setValue}
        facets={[
          { id: "category", label: "Category", options: [{ value: "aprons", label: "Aprons", count: 12 }, { value: "mugs", label: "Mugs", count: 18 }, { value: "towels", label: "Tea towels", count: 9 }] },
          { id: "colour", label: "Colour", options: [{ value: "stone", label: "Stone", count: 14 }, { value: "charcoal", label: "Charcoal", count: 11 }, { value: "sage", label: "Sage", count: 0 }] },
          { id: "material", label: "Material", options: [{ value: "linen", label: "Linen", count: 21 }, { value: "stoneware", label: "Stoneware", count: 18 }] },
        ]}
      />
    </div>
  );
}
