"use client";

import { useState, type ReactNode } from "react";

import { ModeBar, type ModeBarProps } from "@rhs-ui/application/mode-bar";
import { Button } from "@rhs-ui/primitives/button";

const PAYMENTS = [
  { id: "NW-10482", customer: "Halcyon Freight", amount: "€1,240.00" },
  { id: "NW-10481", customer: "Kestrel Labs", amount: "€86.50" },
  { id: "NW-10480", customer: "Polder Foods", amount: "€412.00" },
] as const;

/** A header and a few rows of an app, with a mode bar under the header. Leaving the mode removes the bar, and the way back is a button that only exists in this demo. */
function Screen({ kind, title, description, withExit = true, caption }: { kind: ModeBarProps["kind"]; title?: string; description: string; withExit?: boolean; caption: string }): React.JSX.Element {
  const [active, setActive] = useState(true);
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="min-h-8 text-xs text-muted-foreground">{caption}</p>
      <div className="overflow-hidden rounded-xl border border-border bg-background shadow-xs">
        <div className="flex h-12 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
          <span className="text-sm font-semibold tracking-[-0.03em]">Halcyon</span>
          <span aria-hidden="true" className="flex gap-4 text-xs text-muted-foreground">
            <span>Payments</span>
            <span>Customers</span>
          </span>
        </div>
        {active ? <ModeBar kind={kind} title={title} description={description} onExit={withExit ? () => setActive(false) : undefined} /> : null}
        <div className="px-4 py-4 sm:px-6">
          <ul className="divide-y divide-border">
            {PAYMENTS.map((payment) => (
              <li key={payment.id} className="flex items-baseline justify-between gap-4 py-2.5">
                <span className="min-w-0 truncate text-sm">
                  <span className="font-medium tabular-nums">{payment.id}</span> <span className="text-muted-foreground">{payment.customer}</span>
                </span>
                <span className="shrink-0 text-sm tabular-nums">{payment.amount}</span>
              </li>
            ))}
          </ul>
          {active ? null : (
            <p role="status" className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
              You left the mode.
              <Button type="button" size="sm" variant="outline" onClick={() => setActive(true)}>
                Switch it back on
              </Button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Sticky(): React.JSX.Element {
  return (
    <div className="grid min-w-0 gap-3">
      <p className="text-xs text-muted-foreground">With sticky the bar stays under the header while the page scrolls. Scroll inside the window.</p>
      <div tabIndex={0} role="region" aria-label="A scrolling page with a sticky mode bar" className="relative h-72 overflow-y-auto rounded-xl border border-border bg-background shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
        <div className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
          <span className="text-sm font-semibold tracking-[-0.03em]">Halcyon</span>
          <span aria-hidden="true" className="text-xs text-muted-foreground">
            Payments
          </span>
        </div>
        <ModeBar sticky className="top-12" kind="test" description="No real payments are taken." onExit={() => undefined} />
        <ul className="divide-y divide-border px-4 sm:px-6">
          {Array.from({ length: 14 }, (_, index) => (
            <li key={index} className="flex items-baseline justify-between gap-4 py-3">
              <span className="text-sm">
                <span className="font-medium tabular-nums">NW-{10400 + index}</span> <span className="text-muted-foreground">Test order</span>
              </span>
              <span className="text-sm tabular-nums">€{(24 + index * 7.5).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Case({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="grid min-w-0 gap-9">{children}</div>;
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <Case>
        <div className="grid items-start gap-x-6 gap-y-9 lg:grid-cols-2">
          <Screen kind="test" description="No real payments are taken." caption="Test data is hatched and calm. The name of the mode is a word, not a colour." />
          <Screen kind="viewing-as" title="Mara Jansen" description="You see her account as she does. Changes are saved to it." caption="Acting as someone else is the loudest bar, because it is the riskiest." />
          <Screen kind="read-only" withExit={false} description="This workspace is archived. You can look, but nothing can be changed." caption="Read only with no onExit: a mode the person cannot leave has no button." />
          <Screen kind="beta" description="You are trying the new editor. Some things may change before launch." caption="Beta is a card with a hairline: it asks for attention, not for caution." />
        </div>
        <Sticky />
      </Case>
    </div>
  );
}
