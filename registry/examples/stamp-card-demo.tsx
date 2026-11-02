"use client";

import { useState, type ReactNode } from "react";

import { StampCard } from "@rhs-ui/application/stamp-card";
import { Button } from "@rhs-ui/primitives/button";

function Case({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      {/* A caption that wraps on one side must not push its card below the card beside it: from sm the two share the height of two lines. */}
      <p className="mb-2.5 flex text-xs text-muted-foreground sm:min-h-8 sm:items-end">{caption}</p>
      {children}
    </div>
  );
}

/** Stands in for a request that marks the reward as used: the button shows a spinner until it settles. */
const redeem = () => new Promise<void>((resolve) => setTimeout(resolve, 900));

export default function Demo(): React.JSX.Element {
  const [filled, setFilled] = useState(6);
  // The date of the last stamp goes with the count: giving a stamp dates it today, and a card with no stamps has no date.
  const [lastStamp, setLastStamp] = useState<Date | string>("2026-10-28");

  return (
    <div className="grid w-full max-w-3xl items-start gap-x-6 gap-y-8 sm:grid-cols-2">
      <Case caption="Give a stamp: it presses in, the count is announced, and the tenth unlocks the reward.">
        <div className="grid gap-3">
          <StampCard total={10} filled={filled} label="Cappuccino card" reward="Free cappuccino" lastStampedAt={filled > 0 ? lastStamp : undefined} locale="en-GB" timeZone="Europe/Amsterdam" onRedeem={redeem} />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={filled >= 10}
              onClick={() => {
                setFilled((count) => Math.min(10, count + 1));
                setLastStamp(new Date());
              }}
            >
              Give a stamp
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={filled === 0} onClick={() => setFilled(0)}>
              Start over
            </Button>
          </div>
        </div>
      </Case>

      <Case caption="Full: the reward is unlocked and Redeem appears.">
        <StampCard total={8} filled={8} label="Car wash card" reward="Free full valet" lastStampedAt="2026-11-01" locale="en-GB" timeZone="Europe/Amsterdam" onRedeem={redeem} />
      </Case>

      <Case caption="A card of six: three to a row.">
        <StampCard total={6} filled={2} label="Salon card" reward="10% off your next cut" lastStampedAt="2026-10-30" locale="en-GB" timeZone="Europe/Amsterdam" />
      </Case>

      <Case caption="A new card, nothing stamped yet.">
        <StampCard total={8} filled={0} label="Bakery card" reward="A free croissant" locale="en-GB" timeZone="Europe/Amsterdam" />
      </Case>
    </div>
  );
}
