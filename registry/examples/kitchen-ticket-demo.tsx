"use client";

import { useEffect, useState, type ReactNode } from "react";

import { KitchenTicket, type KitchenTicketOrder, type KitchenTicketStatus } from "@rhs-ui/commerce/kitchen-ticket";
import { Button } from "@rhs-ui/primitives/button";

/** 12:30 on a Tuesday lunch service. Every ticket counts to the same clock, so the board ticks as one. */
const START = Date.UTC(2026, 9, 20, 12, 30, 0);
const minutesAgo = (minutes: number): number => START - minutes * 60_000;

const ORDERS: readonly KitchenTicketOrder[] = [
  {
    id: "o-142",
    number: "142",
    type: "dine-in",
    place: "Table 12",
    receivedAt: minutesAgo(2),
    allergies: ["Peanuts", "Shellfish"],
    notes: "Birthday: bring both desserts out together",
    items: [
      { id: "i-1", quantity: 2, name: "Margherita pizza", modifiers: ["No basil", "Extra mozzarella"] },
      { id: "i-2", quantity: 1, name: "Caesar salad", note: "Dressing on the side" },
      { id: "i-3", quantity: 2, name: "Sparkling water, 75 cl" },
    ],
  },
  {
    id: "o-143",
    number: "143",
    type: "pickup",
    place: "Ana K.",
    receivedAt: minutesAgo(9),
    items: [
      { id: "i-4", quantity: 1, name: "Spicy rigatoni", modifiers: ["Extra chilli", "No parmesan"] },
      { id: "i-5", quantity: 2, name: "Garlic flatbread", modifiers: ["Well done"] },
    ],
  },
  {
    id: "o-138",
    number: "138",
    type: "delivery",
    place: "Courier at 12:40",
    receivedAt: minutesAgo(14),
    allergies: ["Gluten"],
    notes: "Customer called twice, hand over hot",
    items: [
      { id: "i-6", quantity: 2, name: "Pulled pork burger", modifiers: ["Gluten-free bun", "No pickles"], note: "Cut in half" },
      { id: "i-7", quantity: 1, name: "Sweet potato fries" },
    ],
  },
  {
    id: "o-135",
    number: "135",
    type: "dine-in",
    place: "Table 4",
    receivedAt: minutesAgo(21),
    bumpedAt: minutesAgo(11.5),
    items: [
      { id: "i-8", quantity: 1, name: "Miso ramen", modifiers: ["Soft egg"] },
      { id: "i-9", quantity: 1, name: "Gyoza, six pieces" },
    ],
  },
];

const CAPTIONS: Record<string, string> = {
  "o-142": "Two minutes in: the allergy comes first, the notes are in bold",
  "o-143": "Nine minutes: running slow, in bold and ringed, and the words say so",
  "o-138": "Fourteen minutes: a solid timer and LATE in capitals",
  "o-135": "Bumped: a short confirmation and a way back",
};

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const clock = (value: number): string => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone: "UTC" }).format(value);

export default function Demo(): React.JSX.Element {
  const [now, setNow] = useState(START);
  const [statuses, setStatuses] = useState<Record<string, KitchenTicketStatus>>({ "o-135": "bumped" });
  const [last, setLast] = useState("Press Bump on a ticket. Nothing leaves the screen until your own code says so.");

  useEffect(() => {
    const timer = window.setInterval(() => setNow((value) => value + 1000), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-8">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xs">
        <div>
          <p className="text-xs text-muted-foreground">Kitchen clock, shared by every ticket</p>
          <p className="text-xl font-semibold tracking-[-0.02em] tabular-nums">{clock(now)}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setNow((value) => value + 180_000)}>
          Skip three minutes
        </Button>
      </div>

      <div className="grid gap-x-8 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))]">
        {ORDERS.map((order) => (
          <Example key={order.id} caption={CAPTIONS[order.id] ?? ""}>
            <KitchenTicket
              order={order}
              now={now}
              locale="en-GB"
              status={statuses[order.id] ?? "open"}
              onBump={(bumped) => {
                setStatuses((current) => ({ ...current, [bumped.id]: "bumped" }));
                setLast(`Order ${bumped.number} bumped.`);
              }}
              onRecall={(recalled) => {
                setStatuses((current) => ({ ...current, [recalled.id]: "open" }));
                setLast(`Order ${recalled.number} recalled to the screen.`);
              }}
            />
          </Example>
        ))}
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        {last}
      </p>
    </div>
  );
}
