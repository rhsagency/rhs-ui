"use client";

import { useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { RentalRates, type RentalRange } from "@rhs-ui/commerce/rental-rates";

/** Booked for other customers. Everything between the 12th and the 23rd of November is free. */
const BOOKED = ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-24", "2026-11-25", "2026-11-26", "2026-12-04", "2026-12-05", "2026-12-06"];

const TRIES = {
  weekend: { label: "A weekend", range: { from: new Date(2026, 10, 20), to: new Date(2026, 10, 22) } },
  six: { label: "Six days", range: { from: new Date(2026, 10, 16), to: new Date(2026, 10, 21) } },
  ten: { label: "Ten days", range: { from: new Date(2026, 10, 12), to: new Date(2026, 10, 21) } },
} satisfies Record<string, { label: string; range: RentalRange }>;

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [range, setRange] = useState<RentalRange>(TRIES.weekend.range);
  const [tried, setTried] = useState<keyof typeof TRIES | "own">("weekend");

  return (
    <div className="grid w-full max-w-3xl min-w-0 grid-cols-[minmax(0,1fr)] gap-y-12">
      <Example caption="Pick days, or try a rental: the cheapest mix of rates is worked out for exactly those days">
        <SegmentedControl
          label="Try a rental"
          value={tried}
          onValueChange={(next) => {
            if (next === "own") return;
            const pick = TRIES[next as keyof typeof TRIES];
            setTried(next as keyof typeof TRIES);
            setRange(pick.range);
          }}
          options={[
            ...Object.entries(TRIES).map(([value, entry]) => ({ value, label: entry.label })),
            ...(tried === "own" ? [{ value: "own", label: "Your dates" }] : []),
          ]}
          className="w-full max-sm:flex-wrap max-sm:[&>button]:flex-1 max-sm:[&>button]:basis-[calc(50%-2px)] sm:w-fit"
        />
        <RentalRates
          rates={{ day: 3500, weekend: 9000, week: 18000, month: 52000 }}
          deposit={25000}
          description="Floor sander, 2.2 kW · Northwind Hire"
          locale="en-GB"
          min="2026-11-02"
          unavailable={BOOKED}
          range={range}
          onRangeChange={(next) => {
            setRange(next);
            setTried("own");
          }}
        />
      </Example>

      <Example caption="Nothing picked yet, only a day and a week rate, no deposit">
        <div className="max-w-md">
          <RentalRates rates={{ day: 4500, week: 22000 }} description="Tile cutter, wet saw · Northwind Hire" locale="en-GB" min="2026-11-02" />
        </div>
      </Example>
    </div>
  );
}
