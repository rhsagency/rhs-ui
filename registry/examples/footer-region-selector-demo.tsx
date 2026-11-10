"use client";

import { useState } from "react";

import { FooterRegionSelector, type Region, type RegionOptions } from "@rhs-ui/marketing/footer-region-selector";

const OPTIONS: RegionOptions = {
  suggestedCountries: ["NL", "BE", "DE", "FR", "GB", "US"],
  languages: [
    { value: "en", label: "English" },
    { value: "nl", label: "Nederlands", hint: "Dutch" },
    { value: "de", label: "Deutsch", hint: "German" },
    { value: "fr", label: "Français", hint: "French" },
  ],
  currencies: [
    { value: "EUR", label: "EUR", hint: "Euro" },
    { value: "GBP", label: "GBP", hint: "Pound sterling" },
    { value: "USD", label: "USD", hint: "US dollar" },
  ],
};

export default function Demo(): React.JSX.Element {
  const [region, setRegion] = useState<Region>({ country: "NL", language: "en", currency: "EUR" });
  const [last, setLast] = useState<Region | null>(null);

  return (
    <div className="mx-auto grid max-w-6xl gap-3 px-6 py-6">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Change a field and the callback gets all three codes; nothing navigates. Below 768px the group is one button that opens a dialog with the same fields.
      </p>
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <FooterRegionSelector
          brand={<span className="text-base font-semibold tracking-tight">Northwind Outdoor</span>}
          tagline="Tents, packs and clothing for the long way round. Shipped from Rotterdam."
          columns={[
            {
              title: "Shop",
              links: [
                { label: "Tents", href: "#tents" },
                { label: "Backpacks", href: "#backpacks" },
                { label: "Clothing", href: "#clothing" },
                { label: "Footwear", href: "#footwear" },
                { label: "Gift cards", href: "#gift-cards" },
              ],
            },
            {
              title: "Help",
              links: [
                { label: "Shipping and returns", href: "#shipping" },
                { label: "Size guide", href: "#sizes" },
                { label: "Warranty", href: "#warranty" },
                { label: "Contact", href: "#contact" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About", href: "#about" },
                { label: "Stores", href: "#stores" },
                { label: "Careers", href: "#careers" },
                { label: "Sustainability", href: "#sustainability" },
              ],
            },
          ]}
          legal="© 2026 Northwind Outdoor B.V."
          legalLinks={[
            { label: "Privacy", href: "#privacy" },
            { label: "Terms", href: "#terms" },
            { label: "Cookies", href: "#cookies" },
          ]}
          options={OPTIONS}
          region={region}
          onRegionChange={(next) => {
            setRegion(next);
            setLast(next);
          }}
        />
      </div>
      <p className="min-h-5 font-mono text-xs text-muted-foreground" role="status">
        {last ? `onRegionChange(${JSON.stringify(last)})` : "Nothing has changed yet."}
      </p>
    </div>
  );
}
