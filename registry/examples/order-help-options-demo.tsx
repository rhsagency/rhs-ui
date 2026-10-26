"use client";

import { useState } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { OrderHelpOptions, type OrderHelpStatus } from "@rhs-ui/commerce/order-help-options";

/** The shop's clock, fixed so the page reads the same everywhere: the last Monday of October 2026. */
const NOW = "2026-10-26T09:30:00Z";

const STATES = [
  { value: "processing", label: "Processing" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const CONTACT = { href: "#contact", description: "Chat, email or call us. We answer within one working day, Monday to Friday." };

export default function Demo(): React.JSX.Element {
  const [status, setStatus] = useState<OrderHelpStatus>("packed");
  const [chosen, setChosen] = useState("Press an available button.");

  return (
    <div className="mx-auto grid w-full max-w-2xl min-w-0 grid-cols-[minmax(0,1fr)] gap-y-12 px-6 py-8">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
        <p className="text-xs text-muted-foreground">Move the order along: what can still be done changes, and the list says why</p>
        <SegmentedControl
          label="Where is the order?"
          value={status}
          onValueChange={(next) => setStatus(next as OrderHelpStatus)}
          options={STATES}
          className="w-full [&>button]:flex-1 [&>button]:px-2 max-sm:flex-wrap max-sm:[&>button]:basis-[30%] sm:w-fit"
        />
        <OrderHelpOptions
          order={{ number: "NW-20431", status, deliveredAt: "2026-10-23T14:12:00Z", returnUntil: "2026-11-22" }}
          now={NOW}
          timeZone="Europe/Amsterdam"
          locale="en-GB"
          contact={CONTACT}
          onSelect={(id) => setChosen(`You chose “${id}” for order NW-20431.`)}
        />
        <p role="status" className="text-xs text-muted-foreground">
          {chosen}
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
        <p className="text-xs text-muted-foreground">Delivered, and the return window has closed: the date says so</p>
        <OrderHelpOptions
          order={{ number: "NW-20112", status: "delivered", deliveredAt: "2026-09-18T11:05:00Z", returnUntil: "2026-10-18" }}
          now={NOW}
          timeZone="Europe/Amsterdam"
          locale="en-GB"
          contact={{ href: "#contact", label: "Contact support" }}
          labels={{ title: "Need help with an older order?" }}
        />
      </div>
    </div>
  );
}
