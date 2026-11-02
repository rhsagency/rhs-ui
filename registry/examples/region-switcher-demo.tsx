"use client";

import { useState } from "react";

import { RegionSwitcher, type RegionCountry, type RegionValue } from "@rhs-ui/commerce/region-switcher";

const COUNTRIES: RegionCountry[] = [
  { code: "BE", name: "Belgium", currency: "EUR" },
  { code: "DK", name: "Denmark", currency: "DKK", accepts: ["EUR"] },
  { code: "DE", name: "Germany", currency: "EUR" },
  { code: "FR", name: "France", currency: "EUR" },
  { code: "NL", name: "Netherlands", currency: "EUR" },
  { code: "NO", name: "Norway", currency: "NOK", accepts: ["EUR"] },
  { code: "SE", name: "Sweden", currency: "SEK", accepts: ["EUR"] },
  { code: "CH", name: "Switzerland", currency: "CHF", accepts: ["EUR"] },
  { code: "GB", name: "United Kingdom", currency: "GBP", accepts: ["EUR", "USD"] },
  { code: "US", name: "United States", currency: "USD", accepts: ["EUR"] },
];

const CURRENCIES = ["EUR", "GBP", "USD", "CHF", "NOK", "SEK", "DKK"];

export default function Demo(): React.JSX.Element {
  const [region, setRegion] = useState<RegionValue>({ country: "NL", currency: "EUR" });

  return (
    // The panel opens under the button, so the demo keeps room for it.
    <div className="grid min-h-[42rem] w-full max-w-md min-w-0 content-start gap-5">
      <div className="grid gap-1.5">
        <p className="text-xs leading-relaxed text-muted-foreground">
          The footer of Northwind Outfitters. Nothing applies until Save, and Escape closes the panel without saving.
        </p>
        <p className="text-sm">
          Prices are shown in <span className="font-medium tabular-nums">{region.currency}</span>, delivery to <span className="font-medium tabular-nums">{region.country}</span>.
        </p>
      </div>
      <div>
        <RegionSwitcher countries={COUNTRIES} currencies={CURRENCIES} value={region} onSave={setRegion} defaultOpen note="Free shipping on orders over 50 euro, to every country in the list." />
      </div>
    </div>
  );
}
