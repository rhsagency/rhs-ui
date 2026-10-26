"use client";

import { useState, type ReactNode } from "react";

import { AnimatedPrice } from "@rhs-ui/commerce/animated-price";
import { formatMoney } from "@rhs-ui/commerce/money";
import { RoundUpToggle } from "@rhs-ui/commerce/round-up-toggle";

function Example({ caption, className, children }: { caption: string; className?: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className={`grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 ${className ?? ""}`}>
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The toggle in the place it belongs: between the lines of an order and its total, which follows the switch. */
function OrderSummary(): React.JSX.Element {
  const [donation, setDonation] = useState(0);
  const SUBTOTAL = 2107;
  const SHIPPING = 350;
  const before = SUBTOTAL + SHIPPING;
  const money = (amount: number) => formatMoney({ amount, currency: "EUR" }, "en-GB");
  return (
    <section aria-label="Order summary" className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-xs">
      <h2 className="text-[0.9375rem] leading-snug font-semibold tracking-[-0.02em]">Order summary</h2>
      <dl className="grid gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Subtotal, 3 items</dt>
          <dd className="tabular-nums">{money(SUBTOTAL)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Standard delivery</dt>
          <dd className="tabular-nums">{money(SHIPPING)}</dd>
        </div>
      </dl>
      <RoundUpToggle total={before} cause="Clean Water Fund" currency="EUR" locale="en-GB" onChange={(on, roundUp) => setDonation(on ? roundUp.amount : 0)} />
      {/* The donation line joins the order below the switch: nothing above it changes height, so the switch stays under the finger that turned it on. */}
      <div className="grid gap-3 border-t border-border pt-4">
        {donation > 0 ? (
          <p className="flex justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Donation, Clean Water Fund</span>
            <span className="tabular-nums">{money(donation)}</span>
          </p>
        ) : null}
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-sm font-medium">Total</p>
          <AnimatedPrice value={(before + donation) / 100} currency="EUR" locale="en-GB" className="text-xl leading-none font-semibold tracking-[-0.02em]" />
        </div>
      </div>
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  const [last, setLast] = useState("onChange tells you when the shopper switches it.");
  return (
    <div className="grid w-full max-w-4xl min-w-0 grid-cols-1 items-start gap-x-10 gap-y-9 md:grid-cols-2">
      <Example caption="In a checkout: off until the shopper turns it on, and the total follows" className="md:row-span-3">
        <OrderSummary />
      </Example>

      <Example caption="Another step: rounding to the next five, on because the shopper chose it last time">
        <RoundUpToggle total={4130} step={500} cause="Kestrel Reforestation" currency="EUR" locale="en-GB" defaultChecked onChange={(on, roundUp) => setLast(on ? `On: ${formatMoney({ amount: roundUp.amount, currency: "EUR" }, "en-GB")} goes to the cause.` : "Off: nothing is added to the order.")} />
        <p role="status" className="text-xs text-muted-foreground tabular-nums">
          {last}
        </p>
      </Example>

      <Example caption="A round total: there is nothing to give, so the option is not there">
        <div className="grid gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm">
          <p className="flex justify-between gap-4">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium tabular-nums">€25.00</span>
          </p>
          <RoundUpToggle total={2500} cause="Clean Water Fund" currency="EUR" locale="en-GB" />
        </div>
      </Example>

      <Example caption="In Dutch: the amounts follow the locale, the words follow labels">
        <RoundUpToggle
          total={2457}
          cause="Stichting Schoon Water"
          currency="EUR"
          locale="nl-NL"
          labels={{
            label: "Rond af met {amount} voor {cause}",
            off: "Je totaal blijft {total}.",
            on: "Nieuw totaal {total}. Bedankt.",
            statusOn: "Afronden aan. {amount} gaat naar {cause}. Nieuw totaal {total}.",
            statusOff: "Afronden uit. Totaal {total}.",
          }}
        />
      </Example>
    </div>
  );
}
