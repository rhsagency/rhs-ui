"use client";

import { useId, useState, type ReactNode } from "react";

import { TradeCreditSummary } from "@rhs-ui/commerce/trade-credit-summary";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Textarea } from "@rhs-ui/primitives/textarea";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function RequestForm(): React.JSX.Element {
  const id = useId();
  const [sent, setSent] = useState(false);
  if (sent) return <p role="status" className="text-sm font-medium">Request sent. Marta replies within one working day.</p>;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
      className="grid gap-3"
    >
      <div className="grid gap-2">
        <Label htmlFor={`${id}-amount`}>The limit you need</Label>
        <Input id={`${id}-amount`} inputMode="numeric" defaultValue="€75,000.00" className="tabular-nums" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-why`}>What is it for?</Label>
        <Textarea id={`${id}-why`} rows={2} defaultValue="Stock for the autumn menus, ordered in two deliveries." />
      </div>
      <div>
        <Button type="submit" size="sm">
          Send request
        </Button>
      </div>
    </form>
  );
}

function Example({ caption, note, children }: { caption: string; note?: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      {/* Two lines tall in a two-column row, so a short caption does not lift its card above the one beside it. */}
      <p className="text-xs text-muted-foreground lg:min-h-8">{caption}</p>
      {children}
      {note ? (
        <p role="status" className="text-xs text-muted-foreground">
          {note}
        </p>
      ) : null}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [log, setLog] = useState("Pay now starts a payment of what is overdue.");
  return (
    <div className="mx-auto grid w-full max-w-5xl min-w-0 gap-x-10 gap-y-12 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-2">
      <Example caption="In good standing: the figure that matters is what is left to spend, and a form opens to ask for more">
        <TradeCreditSummary
          account="Fieldwork Kitchens B.V., account&nbsp;40218"
          limit={5_000_000}
          used={3_155_000}
          terms="30 days net"
          nextDue={{ date: "2026-11-06", amount: 422_000 }}
          locale="en-GB"
          timeZone="Europe/Amsterdam"
          requestForm={<RequestForm />}
          defaultRequestOpen
        />
      </Example>
      <Example caption="Near the limit with something overdue: it warns in words, and Pay now sits on the line" note={log}>
        <TradeCreditSummary
          account="Harbour Light Catering, account&nbsp;40377"
          limit={2_500_000}
          used={2_275_000}
          terms="30 days net"
          nextDue={{ date: "2026-11-02", amount: 96_000 }}
          overdue={{ amount: 128_450, count: 2, since: "2026-10-12" }}
          locale="en-GB"
          timeZone="Europe/Amsterdam"
          onPay={async () => {
            await wait(900);
            setLog("onPay(): a payment for the overdue amount was started");
          }}
          onRequestIncrease={() => setLog("onRequestIncrease()")}
        />
      </Example>
      <Example caption="A new account with nothing used yet: the whole limit is open, and nothing is due">
        <TradeCreditSummary
          account="Meridian Interiors Ltd, account&nbsp;41005"
          limit={1_000_000}
          used={0}
          terms="30 days net, after the first order"
          locale="en-GB"
          timeZone="Europe/Amsterdam"
          requestForm={<RequestForm />}
        />
      </Example>
      <Example caption="On hold: it says so at the top with the reason and who to call, and the figure shows nothing to spend">
        <TradeCreditSummary
          account="Kestrel Outdoor GmbH, account&nbsp;39912"
          limit={2_500_000}
          used={2_500_000}
          terms="14 days net"
          overdue={{ amount: 480_000, count: 3, since: "2026-09-14" }}
          blocked={{
            reason: "Three invoices are more than 30 days late, so new orders are paused.",
            contact: (
              <>
                Call Marta at Northwind Trade on{" "}
                <a href="tel:+31205550187" className="rounded-sm whitespace-nowrap underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
                  +31 20 555 0187
                </a>
                .
              </>
            ),
          }}
          locale="en-GB"
          timeZone="Europe/Amsterdam"
          onPay={async () => {
            await wait(900);
          }}
        />
      </Example>
    </div>
  );
}
