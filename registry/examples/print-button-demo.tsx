"use client";

import { useRef } from "react";

import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { PrintButton } from "@rhs-ui/primitives/print-button";

// A non-breaking space, so an amount never wraps between the currency and the number.
const eur = (amount: string) => `EUR\u00a0${amount}`;

const LINES = [
  { name: "Brand identity workshop", detail: `2 days × ${eur("1,200.00")}`, amount: eur("2,400.00") },
  { name: "Design system audit", detail: `1 report × ${eur("1,860.00")}`, amount: eur("1,860.00") },
  { name: "Prototype, three screens", detail: `3 screens × ${eur("200.00")}`, amount: eur("600.00") },
];

export default function Demo(): React.JSX.Element {
  const invoice = useRef<HTMLDivElement>(null);
  return (
    <div className="flex w-full justify-center">
      <div className="grid w-full max-w-lg gap-3">
        <div ref={invoice} className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div>
              <p className="text-lg font-semibold tracking-[-0.03em]">Northwind Studio</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Herengracht 214, 1016 BS Amsterdam</p>
            </div>
            <div className="text-left text-xs text-muted-foreground tabular-nums sm:text-right">
              <p className="text-sm font-medium text-foreground">Invoice INV-2041</p>
              <p className="mt-0.5">Issued 14 Oct 2026</p>
              <p>Due 28 Oct 2026</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <div>
              <p className="text-xs text-muted-foreground">Billed to</p>
              <p className="mt-0.5 text-sm font-medium">Halcyon Labs</p>
            </div>
            <Badge variant="outline">Awaiting payment</Badge>
          </div>

          <ul className="mt-4 divide-y divide-border border-y border-border">
            {LINES.map((line) => (
              <li key={line.name} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{line.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{line.detail}</p>
                </div>
                <p className="shrink-0 text-sm tabular-nums">{line.amount}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 grid gap-1.5 text-sm tabular-nums">
            <div className="flex justify-between gap-4 text-muted-foreground">
              <dt>Subtotal</dt>
              <dd>{eur("4,860.00")}</dd>
            </div>
            <div className="flex justify-between gap-4 text-muted-foreground">
              <dt>VAT, 21%</dt>
              <dd>{eur("1,020.60")}</dd>
            </div>
            <div className="mt-1 flex justify-between gap-4 border-t border-border pt-3 text-base font-semibold tracking-[-0.01em]">
              <dt>Total</dt>
              <dd>{eur("5,880.60")}</dd>
            </div>
          </dl>

          <div data-print-hide className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-5">
            <PrintButton target={invoice} title="Invoice INV-2041, Northwind Studio" label="Print invoice" />
            <Button>Pay {eur("5,880.60")}</Button>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">Only the card reaches the paper. The buttons inside it, and everything around it, stay off.</p>
      </div>
    </div>
  );
}
