"use client";

import { useState, type ReactNode } from "react";

import { ProductPricingFieldset, type PricingValue } from "@rhs-ui/commerce/product-pricing-fieldset";

function Example({ caption, className, children }: { caption: string; className?: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className={`grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4 ${className ?? ""}`}>
      {/* Two lines tall in a two-column row, so the fieldsets line up across the columns. */}
      <p className="text-xs leading-relaxed text-muted-foreground sm:min-h-10">{caption}</p>
      <div className="rounded-xl border border-border bg-card p-5 text-card-foreground">{children}</div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [reported, setReported] = useState<PricingValue>({ price: 8000, compareAt: 10000, cost: 3200 });

  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-x-10 gap-y-12 [grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr))]">
      <Example caption="Kestrel down vest. Type in any field and the discount, the profit and the margin follow, worked out in whole cents." className="col-span-full">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <ProductPricingFieldset defaultValue={{ price: 8000, compareAt: 10000, cost: 3200 }} onValueChange={setReported} />
          <p className="text-xs text-muted-foreground">
            Reports{" "}
            {/* A space after each comma, so a narrow screen breaks the line there and nowhere else. */}
            <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-foreground tabular-nums [overflow-wrap:anywhere]">{JSON.stringify(reported).replace(/,/g, ", ")}</code>
          </p>
        </div>
      </Example>

      <Example caption="A compare-at price below the price is flagged in words instead of being accepted quietly.">
        <ProductPricingFieldset defaultValue={{ price: 8000, compareAt: 6500, cost: 3200 }} />
      </Example>

      <Example caption="Below cost: a negative margin is shown plainly, with a warning icon and text.">
        <ProductPricingFieldset defaultValue={{ price: 2400, compareAt: null, cost: 2900 }} />
      </Example>

      <Example caption="Nothing typed yet: no nonsense numbers, only a plain 'Not enough information'.">
        <ProductPricingFieldset />
      </Example>

      <Example caption="Without a cost field, and in a currency with no decimals.">
        <ProductPricingFieldset showCost={false} currency="JPY" locale="ja-JP" defaultValue={{ price: 12800, compareAt: 16000, cost: null }} />
      </Example>
    </div>
  );
}
