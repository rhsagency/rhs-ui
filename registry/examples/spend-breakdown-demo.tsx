import type { ReactNode } from "react";

import { SpendBreakdown } from "@rhs-ui/marketing/spend-breakdown";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="A hundred squares, one per cent, filled row by row: a solid, a hatch and dots, so the three parts still differ in greyscale. The table beside it is the content, and hovering a row lights its squares">
        <SpendBreakdown
          title="Where every €100 you give goes"
          description="Kestrel Water Fund raised €4.2 million in 2025. Here is what happened to each hundred euros, from a one-off gift or a monthly one."
          total={{ amount: 4200000, currency: "EUR", label: "raised in 2025" }}
          parts={[
            {
              id: "programmes",
              label: "Programmes",
              share: 82,
              description: "Wells, filters and pipes, built with local crews, plus two years of repairs once the water is flowing.",
            },
            {
              id: "fundraising",
              label: "Fundraising",
              share: 11,
              description: "Finding new donors and thanking the ones we have. A monthly donor costs less to keep than a new one costs to find.",
            },
            {
              id: "admin",
              label: "Administration",
              share: 7,
              description: "The audit, the accounts, insurance and the office. Every line is in the annual report.",
            },
          ]}
          source={{ label: "Kestrel Water Fund annual report", href: "#annual-report", year: 2025 }}
        />
      </Example>

      <div className="mt-20 max-w-2xl border-t border-border pt-12 sm:mt-24">
        <Example caption="Five parts with decimals, in a narrower column: the shares add up to 100.0, the squares are rounded by the largest remainder so the grid is exactly full, and the table still shows the exact figures">
          <SpendBreakdown
            headingLevel={3}
            title="Where every €100 of a sale goes"
            description="What a buyer pays on Polder Market, and who ends up with it, on an average order in 2026."
            total={{ amount: 100, currency: "EUR", label: "sale" }}
            parts={[
              { id: "seller", label: "The seller", share: 71.4, description: "The price of the goods, paid out two days after delivery." },
              { id: "shipping", label: "Shipping", share: 14.2, description: "The carrier, at the rate the seller chose." },
              { id: "fee", label: "Marketplace fee", share: 8.6, description: "Listing, search, support and the buyer protection programme." },
              { id: "payment", label: "Payment costs", share: 3.1, description: "Card and bank fees, passed on at cost." },
              { id: "returns", label: "Returns and refunds", share: 2.7, description: "A pool that covers returns the seller cannot." },
            ]}
            source={{ label: "Polder Market fee schedule", year: 2026 }}
          />
        </Example>
      </div>
    </div>
  );
}
