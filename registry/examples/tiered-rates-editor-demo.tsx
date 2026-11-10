"use client";

import { useState, type ReactNode } from "react";

import { TieredRatesEditor, type Tier } from "@rhs-ui/application/tiered-rates-editor";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [volume, setVolume] = useState<Tier[]>([
    { from: 1, rate: 1200 },
    { from: 10, rate: 1050 },
    { from: 50, rate: 900 },
  ]);
  const [shipping, setShipping] = useState<Tier[]>([
    { from: 1, rate: 490 },
    { from: 501, rate: 690 },
    { from: 2001, rate: 990 },
  ]);
  const [commission, setCommission] = useState<Tier[]>([
    { from: 1, rate: 5 },
    { from: 26, rate: 7.5 },
    { from: 101, rate: 10 },
  ]);

  return (
    // The preview stage caps its child at 900px, so the width that suits the table is set one level in.
    <div className="w-full">
      <div className="mx-auto grid w-full max-w-2xl gap-9">
        <Example caption="Try it: change the From of tier 2 and the To above it follows. Type 1 there and pause, or a number past tier 3, and the start is refused with the reason.">
          <TieredRatesEditor value={volume} onValueChange={setVolume} unit={{ one: "unit", other: "units" }} rateLabel="Price per unit" currency="EUR" />
          <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>Reported, rates in cents</span>
            <code className="font-mono text-[0.6875rem] text-foreground">{JSON.stringify(volume).replace(/"/g, "").replace(/,/g, ", ")}</code>
          </p>
        </Example>

        <Example caption="Shipping bands by weight in grams: the last band runs on, and a tier can be removed, which hands its range to the one before it.">
          <TieredRatesEditor value={shipping} onValueChange={setShipping} unit="g" rateLabel="Shipping cost" currency="EUR" minRows={2} />
        </Example>

        <Example caption="Commissions are a plain rate rather than money: no currency, a % after the number.">
          <TieredRatesEditor value={commission} onValueChange={setCommission} unit={{ one: "order", other: "orders" }} rateLabel="Commission" rateSuffix="%" />
        </Example>
      </div>
    </div>
  );
}
