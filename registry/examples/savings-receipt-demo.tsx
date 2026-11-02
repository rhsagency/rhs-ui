import type { ReactNode } from "react";

import { SavingsReceipt } from "@rhs-ui/marketing/savings-receipt";

/** On a wide page the two examples share their rows (a subgrid), so the receipts start on one line however many lines each caption takes. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 justify-items-center lg:row-span-2 lg:grid-rows-subgrid">
      <p className="mb-6 max-w-md justify-self-start text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:py-16">
      <div className="grid justify-items-center gap-x-10 gap-y-14 lg:grid-cols-2 lg:gap-y-0">
        <Example caption="Monthly prices in euros: every figure and the saving are worked out from the numbers, the percent rounded down, and the date is part of the receipt">
          <SavingsReceipt
            currency="EUR"
            locale="en-IE"
            items={[
              { label: "Email platform", price: 79 },
              { label: "Survey tool", price: 49 },
              { label: "Scheduling tool", price: 35 },
              { label: "Form builder", price: 29 },
              { label: "Customer database", price: 59 },
            ]}
            ours={{ name: "Halcyon Suite", price: 119 }}
            action={{ label: "Switch and save", href: "#switch" }}
            asOf="2026-10-01"
            note="List prices of each tool's cheapest plan for a team of ten."
          />
        </Example>
        <Example caption="Yearly prices in dollars, with a title of its own: the saving is still said for a year">
          <SavingsReceipt
            headingLevel={3}
            title="Your analytics stack"
            period="year"
            currency="USD"
            items={[
              { label: "Product analytics", price: 588 },
              { label: "Session replay", price: 1188 },
              { label: "Feature flags", price: 480 },
            ]}
            ours={{ name: "Kestrel Insights", price: 1490 }}
            action={{ label: "Start a free trial", href: "#trial" }}
            asOf="2026-10-01"
            note="Annual plans for 50,000 monthly visitors."
          />
        </Example>
      </div>
    </div>
  );
}
