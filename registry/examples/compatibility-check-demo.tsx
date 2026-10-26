"use client";

import { useState, type ReactNode } from "react";

import { CompatibilityCheck, type CompatibilityAlternative, type CompatibilityBrand, type CompatibilityModel, type CompatibilityResult } from "@rhs-ui/commerce/compatibility-check";

const BRANDS: readonly CompatibilityBrand[] = [
  { id: "lumen", name: "Lumen" },
  { id: "orbit", name: "Orbit" },
  { id: "vantage", name: "Vantage" },
];

const MODELS: readonly CompatibilityModel[] = [
  { id: "lumen-air-3-pro", brand: "lumen", name: "Air 3 Pro", description: "6.1 inch, 2025", keywords: ["la3p"] },
  { id: "lumen-air-3", brand: "lumen", name: "Air 3", description: "6.1 inch, 2025" },
  { id: "lumen-air-2", brand: "lumen", name: "Air 2", description: "6.1 inch, 2024" },
  { id: "lumen-air-1", brand: "lumen", name: "Air 1", description: "6.1 inch, 2023" },
  { id: "lumen-go-2", brand: "lumen", name: "Go 2", description: "4.7 inch, 2024" },
  { id: "orbit-one-pro", brand: "orbit", name: "One Pro", description: "6.7 inch, 2025" },
  { id: "orbit-one", brand: "orbit", name: "One", description: "6.2 inch, 2025" },
  { id: "orbit-one-a", brand: "orbit", name: "One A", description: "6.1 inch, 2025" },
  { id: "orbit-seven-a", brand: "orbit", name: "Seven A", description: "6.1 inch, 2024" },
  { id: "orbit-six-a", brand: "orbit", name: "Six A", description: "6.1 inch, 2023" },
  { id: "orbit-three-a", brand: "orbit", name: "Three A", description: "5.6 inch, 2019" },
  { id: "vantage-v8-ultra", brand: "vantage", name: "V8 Ultra", description: "6.8 inch, 2025" },
  { id: "vantage-v8-plus", brand: "vantage", name: "V8+", description: "6.7 inch, 2025" },
  { id: "vantage-v8", brand: "vantage", name: "V8", description: "6.2 inch, 2025" },
  { id: "vantage-v7", brand: "vantage", name: "V7", description: "6.1 inch, 2024" },
  { id: "vantage-m5", brand: "vantage", name: "M5", description: "6.4 inch, 2024" },
  { id: "vantage-fold-3", brand: "vantage", name: "Fold 3", description: "Foldable, 2024" },
];

/** The models the mount is checked on, and the ones it is known not to hold. The rest has never been tried. */
const COMPATIBLE = ["lumen-air-3-pro", "lumen-air-3", "lumen-air-2", "lumen-air-1", "orbit-one-pro", "orbit-one", "orbit-one-a", "vantage-v8-ultra", "vantage-v8-plus", "vantage-v8", "vantage-v7"];
const INCOMPATIBLE = ["lumen-go-2", "orbit-seven-a", "orbit-six-a", "vantage-m5"];

const ALTERNATIVES: Readonly<Record<string, readonly CompatibilityAlternative[]>> = {
  "orbit-seven-a": [
    { name: "Halcyon StickGrip car mount", href: "#stickgrip", detail: "€19.90" },
    { name: "Halcyon ClampGrip vent mount", href: "#clampgrip", detail: "€14.90" },
  ],
  "orbit-six-a": [{ name: "Halcyon StickGrip car mount", href: "#stickgrip", detail: "€19.90" }],
  "lumen-go-2": [{ name: "Halcyon ClampGrip vent mount", href: "#clampgrip", detail: "€14.90" }],
  "vantage-m5": [{ name: "Halcyon StickGrip car mount", href: "#stickgrip", detail: "€19.90" }],
};

const SHARED = {
  brands: BRANDS,
  models: MODELS,
  compatible: COMPATIBLE,
  incompatible: INCOMPATIBLE,
  alternatives: ALTERNATIVES,
  productName: "Halcyon MagGrip car mount",
  contactHref: "#ask",
  labels: { idle: "Choose your phone and we will tell you if it fits.", brand: "Phone brand", model: "Phone model" },
} as const;

function Example({ caption, note, className, children }: { caption: string; note?: ReactNode; className?: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className={`grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 ${className ?? ""}`}>
      <p className="text-xs text-muted-foreground">{caption}</p>
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">{children}</div>
      {note ? (
        <p role="status" className="text-xs text-muted-foreground">
          {note}
        </p>
      ) : null}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [last, setLast] = useState<CompatibilityResult | null>(null);
  return (
    <div className="grid w-full max-w-4xl min-w-0 grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2">
      <Example
        caption="Try it: the model field waits for a brand, then searches"
        note={last ? `Remembered for next visit: ${last.brand.name} ${last.model.name} (${last.verdict}).` : "onCheck hands the choice back, so you can remember it."}
      >
        <CompatibilityCheck {...SHARED} onCheck={setLast} />
      </Example>
      <Example caption="Compatible: said in words, with an icon">
        <CompatibilityCheck {...SHARED} defaultValue={{ brand: "lumen", model: "lumen-air-3" }} />
      </Example>
      <Example caption="Not compatible: with what does fit instead">
        <CompatibilityCheck {...SHARED} defaultValue={{ brand: "orbit", model: "orbit-seven-a" }} />
      </Example>
      <Example caption="Unknown: it says so instead of guessing">
        <CompatibilityCheck {...SHARED} defaultValue={{ brand: "orbit", model: "orbit-three-a" }} />
      </Example>
    </div>
  );
}
