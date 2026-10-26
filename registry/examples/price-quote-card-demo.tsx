"use client";

import { useState, type ReactNode } from "react";

import { PriceQuoteCard } from "@rhs-ui/commerce/price-quote-card";

const NOW = "2026-11-18T09:00:00Z";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [log, setLog] = useState("Accept it to see the outcome, or ask for a new quote on the expired one.");

  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-x-8 gap-y-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr))]">
      <Example caption="Open: accept and decline weigh the same, and each asks once before it counts">
        <div className="grid gap-3">
          <PriceQuoteCard
            number="Q-2026-0412"
            issuedAt="2026-11-18"
            validUntil="2026-11-30"
            total={1452000}
            taxIncluded={21}
            status="viewed"
            supplier={{ name: "Halcyon Interiors", contact: "Marta Visser, estimator" }}
            summary="Kitchen renovation at Prinsengracht 148: demolition, plumbing, cabinetry and worktops, three weeks on site."
            onAccept={async () => {
              await new Promise((resolve) => setTimeout(resolve, 700));
              setLog("Accepted: Halcyon Interiors has been told.");
            }}
            onDecline={() => setLog("Declined: Halcyon Interiors has been told.")}
            onDownload={() => setLog("Downloading Q-2026-0412.pdf")}
            now={NOW}
            locale="en-GB"
            timeZone="Europe/Amsterdam"
          />
          <p role="status" className="min-h-5 text-xs text-muted-foreground">
            {log}
          </p>
        </div>
      </Example>

      <Example caption="Accepted: the outcome and when, in place of the buttons">
        <PriceQuoteCard
          number="Q-2026-0388"
          issuedAt="2026-11-04"
          validUntil="2026-11-25"
          total={486500}
          taxIncluded={21}
          status="accepted"
          decidedAt="2026-11-06T14:05:00+01:00"
          supplier={{ name: "Kestrel Electrical", contact: "Daan Bos, installer" }}
          summary="Three-phase upgrade and a new meter cupboard, including the grid operator's fee."
          onDownload={() => setLog("Downloading Q-2026-0388.pdf")}
          now={NOW}
          locale="en-GB"
          timeZone="Europe/Amsterdam"
        />
      </Example>

      <Example caption="Declined: the same, worded for a no">
        <PriceQuoteCard
          number="Q-2026-0371"
          issuedAt="2026-10-29"
          validUntil="2026-12-04"
          total={1299000}
          taxIncluded={21}
          status="declined"
          decidedAt="2026-11-02T09:41:00+01:00"
          supplier={{ name: "Northwind Wholesale", contact: "Sofia Marchetti, account manager" }}
          summary="Spring order: 240 planters, 60 trellis frames and delivery to two sites."
          now={NOW}
          locale="en-GB"
          timeZone="Europe/Amsterdam"
        />
      </Example>

      <Example caption="Expired: both actions are off, and there is a way forward">
        <PriceQuoteCard
          number="Q-2026-0291"
          issuedAt="2026-10-02"
          validUntil="2026-10-31"
          total={238000}
          taxIncluded={21}
          status="expired"
          supplier={{ name: "Meridian Signs", contact: "Jonas Kessler, sales" }}
          summary="Illuminated fascia sign, 3.2 metres, with installation and the permit application."
          onRequestNew={() => setLog("Meridian Signs will be asked for a new quote.")}
          now={NOW}
          locale="en-GB"
          timeZone="Europe/Amsterdam"
        />
      </Example>
    </div>
  );
}
