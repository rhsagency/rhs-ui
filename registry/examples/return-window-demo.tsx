"use client";

import { useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { ReturnWindow } from "@rhs-ui/commerce/return-window";

/** Delivered on 2 October with 30 days to return: the last day is 1 November. */
const TODAYS = [
  { value: "2026-10-20T10:00:00Z", label: "20 Oct" },
  { value: "2026-10-31T10:00:00Z", label: "31 Oct" },
  { value: "2026-11-02T10:00:00Z", label: "2 Nov" },
] as const;

const NOW = "2026-10-20T10:00:00Z";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Order({ number, item, children }: { number: string; item: string; children: ReactNode }): React.JSX.Element {
  return (
    <section aria-label={`Order ${number}`} className="grid gap-3">
      <p className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{item}</span>
        <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground tabular-nums">Order {number}</span>
      </p>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  const [today, setToday] = useState<string>(TODAYS[0].value);
  const [started, setStarted] = useState("The button is only there while the window is open.");
  return (
    <div className="grid w-full max-w-xl min-w-0 grid-cols-[minmax(0,1fr)] gap-y-9">
      <Example caption="Move today: open, closing soon, then closed">
        <div className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-xs">
          <SegmentedControl label="Today is" value={today} onValueChange={setToday} options={TODAYS} className="w-full [&>button]:flex-1 [&>button]:px-2" />
          <Order number="NW-20418" item="Linen shirt, delivered 2 Oct">
            <ReturnWindow deliveredAt="2026-10-02" windowDays={30} now={today} timeZone="Europe/Amsterdam" locale="en-GB" onStartReturn={() => setStarted("Return started for order NW-20418.")} />
          </Order>
        </div>
        <p role="status" className="text-xs text-muted-foreground">
          {started}
        </p>
      </Example>

      <Example caption="Closing soon, the last day, and closed">
        <div className="grid gap-6 rounded-xl border border-border bg-card p-5 shadow-xs">
          <Order number="NW-20397" item="Merino scarf, delivered 21 Sep">
            <ReturnWindow deliveredAt="2026-09-21" windowDays={30} now={NOW} timeZone="Europe/Amsterdam" locale="en-GB" onStartReturn={() => setStarted("Return started for order NW-20397.")} />
          </Order>
          <Order number="NW-20390" item="Stoneware mug, delivered 20 Sep">
            <ReturnWindow deliveredAt="2026-09-20T09:12:00Z" windowDays={30} now={NOW} timeZone="Europe/Amsterdam" locale="en-GB" startReturnHref="#start-return" />
          </Order>
          <Order number="NW-20371" item="Waxed canvas tote, delivered 12 Sep">
            <ReturnWindow deliveredAt="2026-09-12" windowDays={30} now={NOW} timeZone="Europe/Amsterdam" locale="en-GB" onStartReturn={() => setStarted("Not reachable: the window is closed.")} />
          </Order>
        </div>
      </Example>
    </div>
  );
}
