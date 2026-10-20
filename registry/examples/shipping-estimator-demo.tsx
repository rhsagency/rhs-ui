"use client";

import { useRef, useState, type ReactNode } from "react";

import { ShippingEstimator, type ShippingOption, type ShippingQuery } from "@rhs-ui/commerce/shipping-estimator";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const COUNTRIES = ["NL", "BE", "DE", "FR", "GB", "IE", "NO"];

const NETHERLANDS: ShippingOption[] = [
  { id: "standard", name: "Standard delivery", arrival: "Arrives Thu 22 Oct to Fri 23 Oct", amount: 0, carrier: "PostNL" },
  { id: "evening", name: "Evening delivery", arrival: "Arrives Thu 22 Oct, 18:00 to 22:00", amount: 495, carrier: "PostNL" },
  { id: "next-day", name: "Next day", arrival: "Arrives Wed 21 Oct", amount: 695, carrier: "DHL Express" },
];

const NEIGHBOURS: ShippingOption[] = [
  { id: "standard", name: "Standard delivery", arrival: "Arrives Fri 23 Oct to Tue 27 Oct", amount: 595, carrier: "DHL" },
  { id: "express", name: "Express", arrival: "Arrives Thu 22 Oct to Fri 23 Oct", amount: 1295, carrier: "DHL Express" },
];

const PRICE = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" });

function Cart({ caption, note, children }: { caption: string; note?: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">{children}</div>
      {note ? (
        <p role="status" className="text-xs text-muted-foreground">
          {note}
        </p>
      ) : null}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [chosen, setChosen] = useState<ShippingOption | null>(NETHERLANDS[0]!);
  const attempts = useRef(0);

  /** A stand-in for your rates endpoint: Norway has no service, Ireland fails once. */
  async function estimate({ country }: ShippingQuery): Promise<ShippingOption[]> {
    await wait(900);
    if (country === "NO") return [];
    if (country === "IE" && attempts.current++ === 0) throw new Error("The carrier did not answer.");
    return country === "NL" ? NETHERLANDS : NEIGHBOURS;
  }

  return (
    <div className="grid w-full max-w-4xl grid-cols-1 items-start gap-x-10 gap-y-9 md:grid-cols-2">
      <Cart
        caption="With onSelect the options become a radio group"
        note={chosen ? `Chosen: ${chosen.name}, ${chosen.amount === 0 ? "free" : PRICE.format(chosen.amount / 100)}` : "Nothing chosen: when the place changes, the choice is taken back."}
      >
        <ShippingEstimator
          description="See delivery options and prices before you check out."
          countries={COUNTRIES}
          defaultCountry="NL"
          defaultPostcode="1017 AB"
          defaultOptions={NETHERLANDS}
          defaultSelectedId="standard"
          // onSelect hands over null when the country or postcode is edited or a new estimate starts, so the note never names a method that is no longer on screen.
          onSelect={setChosen}
          onEstimate={estimate}
          locale="en-GB"
        />
      </Cart>
      <Cart caption="Try it: Norway has no service, Ireland fails once">
        <ShippingEstimator title="Check delivery" description="Enter where it is going." countries={COUNTRIES} defaultCountry="NL" onEstimate={estimate} locale="en-GB" />
      </Cart>
    </div>
  );
}
