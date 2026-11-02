"use client";

import { PriceBreakdownPopover } from "@rhs-ui/commerce/price-breakdown-popover";

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl min-w-0 items-start gap-x-12 gap-y-12 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
      {/* The popover opens under the price, so this cell keeps room for it. */}
      <div className="grid min-h-[26rem] min-w-0 content-start gap-3">
        <p className="text-xs leading-relaxed text-muted-foreground">A shelf price. Press it to see what it is made of: the offer, the shipping and the VAT already inside.</p>
        <p className="mt-2 text-sm text-muted-foreground">Kestrel down vest, Fjord green</p>
        <p className="text-3xl font-semibold tracking-[-0.04em]">
          <PriceBreakdownPopover
            defaultOpen
            includesTax
            className="-ml-1"
            total={4900}
            lines={[
              { label: "Kestrel down vest", amount: 5200, note: "Fjord green, size M" },
              { label: "Spring offer", amount: 800, kind: "discount", note: "Until 31 March" },
              { label: "Shipping", amount: 500, note: "To the Netherlands" },
              { label: "VAT", amount: 850, kind: "tax", rate: 21 },
            ]}
          />
        </p>
      </div>

      <div className="grid min-w-0 content-start gap-12">
        <div className="grid gap-3">
          <p className="text-xs leading-relaxed text-muted-foreground">A quote total, where VAT is added on top of the lines.</p>
          <p className="text-sm">
            Quote 2026-114, total{" "}
            <span className="font-semibold">
              <PriceBreakdownPopover
                total={283140}
                title="How the quote adds up"
                lines={[
                  { label: "Workshop, two days", amount: 240000 },
                  { label: "Travel and expenses", amount: 18000 },
                  { label: "Partner discount, 10%", amount: 24000, kind: "discount" },
                  { label: "VAT", amount: 49140, kind: "tax", rate: 21 },
                ]}
              />
            </span>
          </p>
        </div>

        <div className="grid gap-3">
          <p className="text-xs leading-relaxed text-muted-foreground">A fee, in dollars, with a trigger of your own. Its name stays Price breakdown.</p>
          <p className="text-sm text-muted-foreground">
            <PriceBreakdownPopover
              currency="USD"
              className="-ml-1"
              total={350}
              trigger={
                <span className="inline-flex items-center gap-1.5 underline decoration-1 decoration-dotted underline-offset-4">
                  Processing fee <span className="font-medium text-foreground tabular-nums">$3.50</span>
                </span>
              }
              lines={[
                { label: "Card processing", amount: 250 },
                { label: "Payout to your bank", amount: 100 },
              ]}
            />
          </p>
        </div>
      </div>
    </div>
  );
}
