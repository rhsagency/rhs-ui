"use client";

import { useState } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { TopMoversList, type Mover } from "@rhs-ui/dashboard/top-movers-list";

const EUR: Intl.NumberFormatOptions = { style: "currency", currency: "EUR", maximumFractionDigits: 0 };
const VISITS: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };

const RISERS: readonly Mover[] = [
  { id: "duvet", label: "Linen duvet set", current: 4820, previous: 3490 },
  { id: "planter", label: "Ceramic planter, large", current: 1240, previous: 910 },
  { id: "throw", label: "Wool throw, oatmeal", current: 2150, previous: 1720 },
  { id: "holder", label: "Brass candle holder", current: 640, previous: 540 },
  { id: "napkins", label: "Linen napkins, set of four", current: 380, previous: 340 },
  { id: "gift", label: "Gift card", current: 90, previous: 12 },
  { id: "beeswax", label: "Beeswax candles", current: 310, previous: 310 },
];

const FALLERS: readonly Mover[] = [
  { id: "table", label: "Oak side table", current: 620, previous: 1050 },
  { id: "chair", label: "Rattan lounge chair", current: 1480, previous: 2310 },
  { id: "lamp", label: "Table lamp, matte black", current: 880, previous: 1120 },
  { id: "basket", label: "Wicker storage basket", current: 150, previous: 160 },
  { id: "sample", label: "Fabric sample pack", current: 4, previous: 30 },
];

const PAGES: readonly Mover[] = [
  { id: "pricing", label: "/pricing", current: 8420, previous: 6130 },
  { id: "changelog", label: "/changelog", current: 3150, previous: 2480 },
  { id: "docs", label: "/docs/getting-started", current: 12900, previous: 11200 },
];

export default function Demo(): React.JSX.Element {
  const [rankBy, setRankBy] = useState("percent");
  const [picked, setPicked] = useState("Press a row to select it.");

  return (
    <div className="grid w-full max-w-4xl gap-10">
      <section className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-md text-xs text-muted-foreground">Flat items never appear. Items that started under 100 euros are left out, so a jump from 12 to 90 does not top the list.</p>
          <SegmentedControl
            label="Rank by"
            value={rankBy}
            onValueChange={setRankBy}
            options={[
              { value: "percent", label: "Percent" },
              { value: "amount", label: "Amount" },
            ]}
          />
        </div>
        <TopMoversList
          risers={RISERS}
          fallers={FALLERS}
          period="the previous 7 days"
          format={EUR}
          locale="en-IE"
          limit={4}
          minBase={100}
          rankBy={rankBy === "amount" ? "amount" : "percent"}
          title="Top movers by revenue"
          onSelect={(item) => setPicked(`Selected ${item.label}.`)}
        />
        <p aria-live="polite" className="text-xs text-muted-foreground">
          {picked}
        </p>
      </section>

      <section className="grid gap-3">
        <p className="text-xs text-muted-foreground">A narrow card stacks the halves, and an empty half says so</p>
        <div className="max-w-md">
          <TopMoversList risers={PAGES} fallers={[]} period="last week" format={VISITS} locale="en-IE" title="Pages by visits" />
        </div>
      </section>
    </div>
  );
}
