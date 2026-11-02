"use client";

import { useState, type ReactNode } from "react";

import { VatPriceField, type VatPrice } from "@rhs-ui/commerce/vat-price-field";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
      {/* Three lines tall in a two-column row, so the fields line up across the columns. */}
      <p className="text-xs leading-relaxed text-muted-foreground sm:min-h-12">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [reported, setReported] = useState<VatPrice | null>({ net: 1240, vat: 260, gross: 1500, rate: 21 });

  return (
    <div className="grid w-full max-w-3xl min-w-0 gap-x-12 gap-y-12 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
      <Example caption="Halcyon chilli oil, typed without VAT. Flip the switch and the number stays: the other side is worked out.">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <VatPriceField defaultValue={1240} onChange={(price) => setReported(price)} name="price" />
          <p className="text-xs text-muted-foreground">
            Reports{" "}
            {/* A space after each comma, so a narrow screen breaks the line there and nowhere else. */}
            <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-foreground tabular-nums [overflow-wrap:anywhere]">{reported ? JSON.stringify(reported).replace(/,/g, ", ") : "null"}</code>
          </p>
        </div>
      </Example>

      <Example caption="Kestrel down jacket, typed with VAT as it is on the shelf label. The net is rounded once, half up, and the VAT is what is left, so the three always add up.">
        <VatPriceField defaultValue={14900} defaultMode="including" />
      </Example>

      <Example caption="A Dutch keyboard: the comma works, and so does a point. The rates are the ones you pass, here 0, 9 and 21.">
        <VatPriceField locale="nl-NL" defaultValue={8995} defaultRate={9} />
      </Example>

      <Example caption="A currency with no decimals and a country with other rates, in words of your own.">
        <VatPriceField currency="JPY" locale="ja-JP" rates={[8, 10]} defaultValue={3800} labels={{ vat: "Consumption tax {rate}" }} />
      </Example>
    </div>
  );
}
