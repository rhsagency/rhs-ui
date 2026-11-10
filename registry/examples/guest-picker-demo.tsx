"use client";

import { useId, useState, type ReactNode } from "react";

import { GuestPicker, type GuestCounts, type GuestGroup } from "@rhs-ui/application/guest-picker";
import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const STAY: readonly GuestGroup[] = [
  { id: "adults", label: "Adults", description: "Ages 13 or above", min: 1, max: 6, noun: { one: "adult", other: "adults" } },
  { id: "children", label: "Children", description: "Ages 2 to 12", max: 5, noun: { one: "child", other: "children" } },
  { id: "infants", label: "Infants", description: "Under 2, in a cot", max: 2, countsTowardTotal: false, noun: { one: "infant", other: "infants" } },
];

const TABLE: readonly GuestGroup[] = [{ id: "party", label: "Guests", description: "We hold the table for 15 minutes", min: 1, max: 12, noun: { one: "guest", other: "guests" } }];

const TRANSFER: readonly GuestGroup[] = [
  { id: "adults", label: "Adults", description: "Ages 12 or above", min: 1, max: 8, noun: { one: "adult", other: "adults" } },
  { id: "children", label: "Children", description: "Under 12, in a booster seat", max: 6, noun: { one: "child", other: "children" } },
];

function Reported({ value }: { value: GuestCounts }): React.JSX.Element {
  return (
    <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
      <span>Reported</span>
      <code className="font-mono text-[0.6875rem] text-foreground">{JSON.stringify(value).replace(/,/g, ", ")}</code>
    </p>
  );
}

const card = "grid gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs sm:p-6";

/** One line of the price: what it is and what it costs. */
function Line({ label, amount, strong = false }: { label: string; amount: string; strong?: boolean }): React.JSX.Element {
  return (
    <div className={strong ? "flex justify-between gap-4 border-t border-border pt-3 font-medium" : "flex justify-between gap-4"}>
      <dt className={strong ? undefined : "text-muted-foreground"}>{label}</dt>
      <dd className="tabular-nums">{amount}</dd>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const stayId = useId();
  const tableId = useId();
  const transferId = useId();
  const [stay, setStay] = useState<GuestCounts>({ adults: 2, children: 1, infants: 0 });
  // The panel starts open. While it is, the card keeps the room it needs under the field, so the panel covers nothing below it.
  const [stayOpen, setStayOpen] = useState(true);
  const [table, setTable] = useState<GuestCounts>({ party: 4 });
  const [transfer, setTransfer] = useState<GuestCounts>({ adults: 2, children: 0 });

  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 pb-10 md:grid-cols-2 md:items-start">
      <Example caption="Try it: the room sleeps six, and infants are not counted. The panel starts open; fill it up and the plus buttons say why they stop, or take the adults down to one.">
        <div className={card}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium tracking-[-0.01em]">Book the Kestrel loft</h2>
            <p className="text-xs text-muted-foreground tabular-nums">€210 a night</p>
          </div>
          <div className={cn("grid gap-2 transition-[margin] duration-200 motion-reduce:transition-none", stayOpen && "mb-[19rem]")}>
            <Label htmlFor={stayId}>Guests</Label>
            <GuestPicker id={stayId} groups={STAY} value={stay} onValueChange={setStay} maxTotal={6} defaultOpen open={stayOpen} onOpenChange={setStayOpen} />
          </div>
          <dl className="grid gap-2.5 border-t border-border pt-4 text-sm">
            <Line label="Fri 13 to Mon 16 November" amount="3 nights" />
            <Line label="3 nights × €210" amount="€630" />
            <Line label="Cleaning" amount="€45" />
            <Line label="Total" amount="€675" strong />
          </dl>
          <Button>Reserve</Button>
          <p className="text-center text-xs text-muted-foreground">Free cancellation until 6 November.</p>
          <Reported value={stay} />
        </div>
      </Example>

      <div className="grid min-w-0 grid-cols-1 content-start gap-9">
        <Example caption="One kind of guest, applied only when Done is pressed. Escape or a click outside throws the steps away.">
          <div className={card}>
            <h2 className="text-sm font-medium tracking-[-0.01em]">Reserve a table at Halcyon</h2>
            <div className="grid gap-2">
              <Label htmlFor={tableId}>Party size</Label>
              <GuestPicker id={tableId} groups={TABLE} value={table} onValueChange={setTable} commit="done" labels={{ guests: "Party size" }} />
            </div>
            <Reported value={table} />
          </div>
        </Example>

        <Example caption="Your own words on the button: formatSummary writes the total, and labels rename the panel.">
          <div className={card}>
            <h2 className="text-sm font-medium tracking-[-0.01em]">Airport transfer</h2>
            <div className="grid gap-2">
              <Label htmlFor={transferId}>Travellers</Label>
              <GuestPicker
                id={transferId}
                groups={TRANSFER}
                value={transfer}
                onValueChange={setTransfer}
                maxTotal={8}
                locale="en-GB"
                labels={{ guests: "Travellers", placeholder: "Add travellers", totalOne: "1 traveller", totalMany: "{total} travellers", totalOf: "{total} of {max} travellers", totalFull: "The van seats {maxTotal} travellers." }}
                formatSummary={(counts) => {
                  const total = (counts.adults ?? 0) + (counts.children ?? 0);
                  return `${total} ${total === 1 ? "traveller" : "travellers"}`;
                }}
              />
            </div>
          </div>
        </Example>
      </div>
    </div>
  );
}
