"use client";

import { useId, useState } from "react";

import { Combobox, type ComboboxOption } from "@rhs-ui/primitives/combobox";
import { Label } from "@rhs-ui/primitives/label";

const COUNTRIES: readonly ComboboxOption[] = [
  { value: "NL", label: "Netherlands", keywords: ["Holland"], group: "Europe" },
  { value: "BE", label: "Belgium", group: "Europe" },
  { value: "DE", label: "Germany", keywords: ["Deutschland"], group: "Europe" },
  { value: "FR", label: "France", group: "Europe" },
  { value: "ES", label: "Spain", keywords: ["España"], group: "Europe" },
  { value: "IT", label: "Italy", keywords: ["Italia"], group: "Europe" },
  { value: "PT", label: "Portugal", group: "Europe" },
  { value: "SE", label: "Sweden", keywords: ["Sverige"], group: "Europe" },
  { value: "GB", label: "United Kingdom", keywords: ["UK", "Britain", "England"], group: "Europe" },
  { value: "US", label: "United States", keywords: ["USA", "America"], group: "Americas" },
  { value: "CA", label: "Canada", group: "Americas" },
  { value: "MX", label: "Mexico", keywords: ["México"], group: "Americas" },
  { value: "BR", label: "Brazil", keywords: ["Brasil"], group: "Americas" },
  { value: "AE", label: "United Arab Emirates", keywords: ["UAE", "Dubai"], group: "Middle East" },
  { value: "JP", label: "Japan", keywords: ["Nippon"], group: "Asia and Pacific" },
  { value: "SG", label: "Singapore", group: "Asia and Pacific" },
  { value: "AU", label: "Australia", group: "Asia and Pacific" },
  { value: "NZ", label: "New Zealand", keywords: ["Aotearoa"], group: "Asia and Pacific" },
];

export default function Demo(): React.JSX.Element {
  const id = useId();
  const [country, setCountry] = useState<string | null>(null);
  const chosen = COUNTRIES.find((item) => item.value === country);

  return (
    <div className="grid w-full max-w-xs gap-2">
      <Label htmlFor={id}>Country</Label>
      <Combobox
        id={id}
        label="Country"
        options={COUNTRIES}
        value={country}
        onValueChange={setCountry}
        placeholder="Choose a country"
        searchPlaceholder="Search countries..."
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`} className="text-xs text-muted-foreground" aria-live="polite">
        {chosen ? `Shipping to ${chosen.label}.` : "Try typing UK or Holland."}
      </p>
    </div>
  );
}
