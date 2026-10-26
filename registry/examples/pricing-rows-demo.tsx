"use client";

import { useState } from "react";

import { PricingRows, type PricingInterval } from "@rhs-ui/marketing/pricing-rows";
import { Button } from "@rhs-ui/primitives/button";

export default function Demo(): React.JSX.Element {
  const [interval, setInterval] = useState<PricingInterval>("monthly");
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:py-16">
      <p className="mb-6 text-xs text-muted-foreground">Five tiers with a billing toggle: the prices count to their new value, and the recommended plan is marked by a badge and a heavier outline</p>
      <PricingRows
        title="Pricing that grows with your team"
        interval={interval}
        onIntervalChange={setInterval}
        yearlySaving="save 20%"
        plans={[
          {
            id: "free",
            name: "Free",
            pitch: "For trying Halcyon on a side project.",
            limits: "1 seat, 1 GB",
            price: "Free",
            period: "no card needed",
            action: (
              <Button variant="outline" aria-label="Get started, Free plan">
                Get started
              </Button>
            ),
          },
          {
            id: "solo",
            name: "Solo",
            pitch: "For freelancers who book their own week.",
            limits: "1 seat, 20 GB",
            price: { monthly: 12, yearly: 10 },
            period: { monthly: "per month", yearly: "per month, billed yearly" },
            action: (
              <Button variant="outline" aria-label="Start 14-day trial, Solo plan">
                Start 14-day trial
              </Button>
            ),
          },
          {
            id: "team",
            name: "Team",
            pitch: "For teams that ship every week.",
            limits: "Up to 10 seats, 50 GB",
            price: { monthly: 24, yearly: 19 },
            period: { monthly: "per seat, per month", yearly: "per seat, per month, billed yearly" },
            action: <Button aria-label="Start 14-day trial, Team plan">Start 14-day trial</Button>,
            featured: true,
          },
          {
            id: "business",
            name: "Business",
            pitch: "For several teams sharing one workspace.",
            limits: "Up to 50 seats, 500 GB",
            price: { monthly: 48, yearly: 38 },
            period: { monthly: "per seat, per month", yearly: "per seat, per month, billed yearly" },
            action: (
              <Button variant="outline" aria-label="Start 14-day trial, Business plan">
                Start 14-day trial
              </Button>
            ),
          },
          {
            id: "enterprise",
            name: "Enterprise",
            pitch: "For security reviews and procurement.",
            limits: "Unlimited seats, 5 TB and up",
            price: "Custom",
            period: "annual contract",
            action: (
              <Button variant="outline" aria-label="Talk to sales, Enterprise plan">
                Talk to sales
              </Button>
            ),
          },
        ]}
        note="Prices are in US dollars and exclude VAT. Every paid plan includes a 14-day trial, and you can change plan or cancel at any time. Yearly billing is charged once, up front."
      />

      <div className="mt-20 max-w-xl border-t border-border pt-12">
        <p className="mb-6 text-xs text-muted-foreground">In a narrower column, in euros and with fixed prices: no toggle, and the rows keep name, price and action apart</p>
        <PricingRows
          currency="EUR"
          locale="nl-NL"
          headingLevel={3}
          plans={[
            {
              id: "essential",
              name: "Essential",
              pitch: "One studio, one location.",
              limits: "Up to 3 teachers",
              price: 29,
              period: "per month",
              action: <Button variant="outline">Choose Essential</Button>,
            },
            {
              id: "studio",
              name: "Studio",
              pitch: "Classes, memberships and payments.",
              limits: "Up to 15 teachers",
              price: 59.5,
              period: "per month",
              action: <Button>Choose Studio</Button>,
              featured: true,
            },
            {
              id: "chain",
              name: "Chain",
              pitch: "Several locations, one login.",
              limits: "Unlimited teachers",
              price: 149,
              period: "per month",
              action: <Button variant="outline">Choose Chain</Button>,
            },
          ]}
        />
      </div>
    </div>
  );
}
