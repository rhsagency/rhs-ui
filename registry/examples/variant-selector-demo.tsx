"use client";

import { useState } from "react";

import { VariantSelector } from "@rhs-ui/commerce/variant-selector";

const OPTIONS = [
  { name: "Colour", values: [{ value: "stone", label: "Stone", swatch: "#8b7f6a" }, { value: "ink", label: "Ink", swatch: "#1b1a25" }, { value: "sage", label: "Sage", swatch: "#8aa38b" }] },
  { name: "Size", values: [{ value: "S" }, { value: "M" }, { value: "L" }, { value: "XL" }] },
];

const SOLD_OUT = new Set(["sage/L", "sage/XL", "ink/S"]);

export default function VariantSelectorDemo() {
  const [value, setValue] = useState<Record<string, string>>({ Colour: "stone", Size: "M" });
  const available = (selection: Readonly<Record<string, string>>) => !SOLD_OUT.has(`${selection.Colour}/${selection.Size}`);
  return (
    <div className="grid w-full max-w-sm gap-4">
      <VariantSelector options={OPTIONS} value={value} onValueChange={setValue} isAvailable={available} />
      <p className="text-sm" aria-live="polite">
        {available(value) ? <span>In stock, ships tomorrow.</span> : <span className="text-muted-foreground">Sold out in this combination.</span>}
      </p>
    </div>
  );
}
