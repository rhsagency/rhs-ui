"use client";

import { useState, type ReactNode } from "react";

import { LimitedOfferPanel } from "@rhs-ui/marketing/limited-offer-panel";

/**
 * The demo pins `now`, so the three panels read the same on any day. In a real page leave it out and the panel
 * judges the end date by the reader's clock.
 */
const NOW = "2026-10-26T09:00:00Z";

const perks = ["Every future Kestrel feature, for life", "A setup call with the founders", "Early access to every beta"];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="flex min-w-0 flex-col items-center">
      <p className="mb-6 max-w-md self-start text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [message, setMessage] = useState("");
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <div className="grid justify-items-center gap-x-8 gap-y-14 lg:grid-cols-3">
        <Example caption="Places left: the meter, the count in words and the rule for the price, with the end date written out">
          <LimitedOfferPanel
            className="flex-1"
            title="Founding member"
            description="For the first 100 teams who back Kestrel before launch."
            price="€149"
            priceNote="once, yours for life"
            claimed={63}
            total={100}
            perks={perks}
            condition="The price goes to €249 when all 100 places are gone."
            action={{ label: "Claim a founding place", onClick: () => setMessage("A founding place is in your basket. Demo only: nothing is charged.") }}
            endsAt="2026-12-31"
            now={NOW}
          />
        </Example>
        <Example caption="The last tenth is said with weight: the count of places left is no longer muted">
          <LimitedOfferPanel
            className="flex-1"
            title="Last founding places"
            description="For the first 100 teams who back Kestrel before launch."
            price="€149"
            priceNote="once, yours for life"
            claimed={97}
            total={100}
            perks={perks}
            condition="The price goes to €249 when all 100 places are gone."
            action={{ label: "Claim a founding place", onClick: () => setMessage("A founding place is in your basket. Demo only: nothing is charged.") }}
            endsAt="2026-10-30"
            now={NOW}
          />
        </Example>
        <Example caption="Everything claimed: the price is struck, the meter says so and the button becomes the waiting list">
          <LimitedOfferPanel
            className="flex-1"
            title="Founding places gone"
            description="For the first 100 teams who back Kestrel before launch."
            price="€149"
            priceNote="once, yours for life"
            claimed={100}
            total={100}
            perks={perks}
            condition="The price is now €249."
            action={{ label: "Claim a founding place", href: "#checkout" }}
            waitlist={{ onClick: () => setMessage("You are on the waiting list. Demo only: nothing was sent.") }}
            now={NOW}
          />
        </Example>
      </div>
      <p role="status" className="mt-10 min-h-6 text-center text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
