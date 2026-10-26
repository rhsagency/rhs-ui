"use client";

import { useState, type ReactNode } from "react";

import { DiscountField, type DiscountValue } from "@rhs-ui/commerce/discount-field";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      {/* Two lines tall in a two-column row, so the fields line up across the columns. */}
      <p className="text-xs text-muted-foreground sm:min-h-8">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [reported, setReported] = useState<DiscountValue | null>({ type: "percent", value: 20 });

  return (
    <div className="grid w-full max-w-3xl min-w-0 gap-x-10 gap-y-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
      <Example caption="With the price: the new price follows every keystroke. Flip the switch and each side keeps what you typed">
        <div className="grid gap-3">
          <DiscountField price={4800} defaultValue={{ type: "percent", value: 20 }} onValueChange={setReported} name="discount" />
          <p className="text-xs text-muted-foreground">
            Reports{" "}
            <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-foreground tabular-nums">{reported ? JSON.stringify(reported) : "null"}</code>
          </p>
        </div>
      </Example>

      <Example caption="Without a price it only reads the number: an amount is reported in minor units">
        <DiscountField defaultValue={{ type: "amount", value: 1500 }} defaultType="amount" />
      </Example>

      <Example caption="An amount above the price is refused in words, and nothing is reported">
        <DiscountField price={4800} defaultValue={{ type: "amount", value: 6000 }} />
      </Example>

      <Example caption="A percentage above the limit is refused too. Here the limit is 50%, and the keyboard's comma works">
        <DiscountField price={12900} maxPercent={50} defaultValue={{ type: "percent", value: 62.5 }} locale="nl-NL" />
      </Example>
    </div>
  );
}
