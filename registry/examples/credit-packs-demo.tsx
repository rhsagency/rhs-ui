"use client";

import { useState } from "react";

import { CreditPacks, type CreditPack, type CreditPacksProps } from "@rhs-ui/marketing/credit-packs";

const packs: CreditPack[] = [
  { id: "starter", label: "Starter", credits: 100, price: 10 },
  { id: "builder", label: "Builder", credits: 500, price: 38 },
  { id: "studio", label: "Studio", credits: 2000, price: 130 },
  { id: "scale", label: "Scale", credits: 10000, price: 560 },
];

const euroPacks: CreditPack[] = [
  { id: "small", credits: 250, price: 20 },
  { id: "medium", credits: 1000, price: 70 },
  { id: "large", credits: 5000, price: 300 },
];

/** Packs with their own status line right under them, so whatever the reader presses is answered where they are looking. */
function Shop(props: Omit<CreditPacksProps, "onSelect">): React.JSX.Element {
  const [message, setMessage] = useState("");
  return (
    <>
      <CreditPacks {...props} onSelect={(pack) => setMessage(`${pack.credits.toLocaleString("en-US")} credits added to your basket. Demo only: nothing is charged.`)} />
      <p role="status" className="mt-5 min-h-6 text-center text-sm text-muted-foreground">
        {message}
      </p>
    </>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">
        Four packs for a usage-priced tool. The saving and the best value badge are worked out from the numbers: the smallest pack is the standard rate, and the cheapest credit wins the badge. Choose a pack and press Continue.
      </p>
      <Shop
        title="Top up your Kestrel credits"
        description="One-off packs for renders, exports and API calls. Buy what you need now; a bigger pack makes every credit cheaper."
        packs={packs}
        defaultValue="builder"
        expiry="Credits never expire"
      />

      <div className="mt-16 max-w-xl border-t border-border pt-10">
        <p className="mb-8 text-xs text-muted-foreground">In a narrow column, in euros and with no names: every pack is a row, and an expiry rule that is not "never" is said just as plainly</p>
        <Shop headingLevel={3} title="Add credits" packs={euroPacks} currency="EUR" locale="en-IE" expiry="Credits are valid for 12 months after you buy them" />
      </div>
    </div>
  );
}
