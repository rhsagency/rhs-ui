"use client";

import type { ReactNode } from "react";

import { NameYourPrice } from "@rhs-ui/marketing/name-your-price";

/** A request that takes a moment and works, so the busy and thank-you states can be seen by trying it. */
const pay = () => new Promise<void>((resolve) => setTimeout(resolve, 900));

const copy = {
  title: "Pay what feels right",
  description: "Tidewater Icons is free to use. If it saved you time, choose an amount and help us keep drawing.",
  presets: [500, 1200, 2500],
  suggested: 1200,
  min: 300,
  currency: "EUR",
  locale: "en-IE",
  impact: [
    { from: 300, text: "covers a week of hosting." },
    { from: 1000, text: "pays for a month of updates." },
    { from: 2000, text: "funds a whole new icon family." },
  ],
  onSubmit: pay,
};

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="flex min-w-0 flex-col items-center">
      <p className="mb-6 max-w-md self-start text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:py-16">
      <div className="grid justify-items-center gap-x-10 gap-y-14 lg:grid-cols-2">
        <Example caption="Try it: choose a tile or type your own amount. The line under the tiles and the button follow the choice, and the arrow keys move between tiles">
          <NameYourPrice {...copy} monthly />
        </Example>
        <Example caption="An amount under the minimum is said in words and stays in the field; the monthly switch changes the button">
          <NameYourPrice {...copy} monthly defaultMonthly defaultAmount={150} defaultStatus="invalid" headingLevel={3} title="Support Tidewater" />
        </Example>
      </div>
    </div>
  );
}
