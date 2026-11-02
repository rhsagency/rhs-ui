"use client";

import { useState } from "react";

import { CompanyCard } from "@rhs-ui/application/company-card";

// A fixed "now" keeps "3 days ago" the same on every load. In an app, leave `now` out and the cards read the browser's clock.
const NOW = Date.parse("2026-10-29T15:20:00Z");
const DAY = 86_400_000;

/** A logo tile drawn in flat shapes, with its own ground so it reads on both themes. Use real logos in an app. */
const mark = (ground: string, ink: string, shape: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' rx='18' fill='${ground}'/>${shape.replaceAll("INK", ink)}</svg>`);

const HALCYON = mark("#1f2328", "#f1efe9", "<rect x='27' y='26' width='11' height='44' rx='2' fill='INK'/><rect x='58' y='26' width='11' height='44' rx='2' fill='INK'/><rect x='27' y='42' width='42' height='11' fill='INK'/>");
const KESTREL = mark("#e6e3dc", "#2f3236", "<path d='M24 62 48 32 72 62' fill='none' stroke='INK' stroke-width='9' stroke-linecap='round' stroke-linejoin='round'/><circle cx='48' cy='70' r='5' fill='INK'/>");
const POLDER = mark("#4a4e55", "#f1efe9", "<circle cx='48' cy='48' r='20' fill='none' stroke='INK' stroke-width='9'/>");

export default function Demo(): React.JSX.Element {
  const [opened, setOpened] = useState<string | null>(null);
  const open = (name: string) => (event: { preventDefault: () => void }) => {
    // A preview has nowhere to go: a router would navigate here.
    event.preventDefault();
    setOpened(name);
  };

  return (
    <div className="grid w-full max-w-4xl gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.02em]">Accounts</h2>
          <p className="mt-1 text-sm text-muted-foreground">Press a card to open the company. The domain opens its website in a new tab.</p>
        </div>
        <p role="status" className="text-xs text-muted-foreground">
          {opened ? `Opened ${opened}.` : ""}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <CompanyCard
          name="Halcyon Freight"
          logo={HALCYON}
          domain="halcyon-freight.com"
          industry="Freight and logistics"
          size={240}
          location="Rotterdam, Netherlands"
          owner={{ name: "Pieter de Wit" }}
          lastContact={NOW - 3 * DAY}
          status="customer"
          href="/companies/halcyon-freight"
          onOpen={open("Halcyon Freight")}
          now={NOW}
        />
        <CompanyCard
          name="Kestrel Labs"
          logo={KESTREL}
          domain="https://www.kestrel-labs.io/about"
          industry="Climate software"
          size="51 to 200 people"
          location="Berlin, Germany"
          owner={{ name: "Leo Martins" }}
          lastContact={NOW - 2 * 3_600_000}
          status="prospect"
          href="/companies/kestrel-labs"
          onOpen={open("Kestrel Labs")}
          now={NOW}
        />
        <CompanyCard
          name="Northwind Studio"
          domain="northwind.studio"
          industry="Brand and packaging"
          size={12}
          location="Amsterdam, Netherlands"
          owner={{ name: "Sofia Rossi" }}
          lastContact={null}
          status="lead"
          href="/companies/northwind-studio"
          onOpen={open("Northwind Studio")}
          now={NOW}
        />
        <CompanyCard
          name="Polder & Zoon Wholesale Holding"
          logo={POLDER}
          industry="Wholesale"
          location="Utrecht, Netherlands"
          owner={{ name: "Dan Cho" }}
          lastContact="2025-12-04T10:00:00Z"
          status="lost"
          href="/companies/polder-zoon"
          onOpen={open("Polder & Zoon Wholesale Holding")}
          now={NOW}
        />
      </div>
    </div>
  );
}
