"use client";

import { useState } from "react";

import { TicketTiers, type TicketSelection, type TicketTier } from "@rhs-ui/marketing/ticket-tiers";

const tiers: TicketTier[] = [
  {
    id: "early-bird",
    name: "Early bird",
    description: "The lowest price, for the first hundred people.",
    price: 89,
    includes: ["Both conference days", "Lunch and coffee", "Recordings, a week after"],
    remaining: 0,
    saleEnd: "2026-09-30T21:59:00Z",
  },
  {
    id: "standard",
    name: "Standard",
    description: "Everything you need for two days of talks.",
    price: 129,
    includes: ["Both conference days", "Lunch and coffee", "Recordings, a week after", "The attendee Slack"],
    remaining: 12,
    // The end of 15 November in Amsterdam, so the line says the price rises on the day Late registration opens.
    saleEnd: "2026-11-15T23:00:00Z",
    max: 6,
  },
  {
    id: "patron",
    name: "Patron",
    description: "Support the event and meet the speakers.",
    price: 349,
    includes: ["Everything in Standard", "Speaker dinner on Thursday", "Front-row seating", "A named seat and a gift"],
    remaining: 3,
    max: 2,
  },
  {
    id: "late",
    name: "Late registration",
    description: "Opens the moment Standard closes.",
    price: 169,
    includes: ["Both conference days", "Lunch and coffee", "Recordings, a week after"],
    saleStart: "2026-11-15T23:00:00Z",
  },
];

export default function Demo(): React.JSX.Element {
  const [message, setMessage] = useState("");
  const choose = ({ tierId, quantity }: TicketSelection) => {
    const tier = tiers.find((item) => item.id === tierId);
    if (tier) setMessage(`${quantity} × ${tier.name} added to your order. Demo only: nothing is charged.`);
  };
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">
        Four ticket types, pinned to 28 October so every state shows: sold out, selling with a date the price rises, almost gone with a limit of two, and not open yet. Press plus on Patron at two to see the limit said in words. Leave `now` out and the
        windows follow the reader&apos;s clock; until the page has loaded, a tier with a window reads Checking availability instead of guessing.
      </p>
      <TicketTiers
        title="Tickets for Kestrel Summit"
        description="Two days in Rotterdam, 3 and 4 December. Prices rise in steps, and each step has its own number of seats."
        tiers={tiers}
        onSelect={choose}
        currency="EUR"
        locale="en-GB"
        timeZone="Europe/Amsterdam"
        now="2026-10-28T12:00:00Z"
      />
      <p role="status" className="mt-8 min-h-6 text-center text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
