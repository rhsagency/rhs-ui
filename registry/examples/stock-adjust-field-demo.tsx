"use client";

import { useState, type ReactNode } from "react";

import { StockAdjustField, type StockChange } from "@rhs-ui/commerce/stock-adjust-field";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
      {/* Three lines tall in a two-column row, so the forms line up across the columns. */}
      <p className="text-xs leading-relaxed text-muted-foreground sm:min-h-12">{caption}</p>
      <div className="rounded-xl border border-border bg-card p-5 text-card-foreground">{children}</div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [reported, setReported] = useState<Pick<StockChange, "newOnHand" | "valid">>({ newOnHand: 36, valid: true });

  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-x-10 gap-y-12 [grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr))]">
      <Example caption="Halcyon chilli oil, 24 on hand. Add 12 received and the result line reads On hand 24, after 36.">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <StockAdjustField onHand={24} unit="pcs" defaultValue={{ mode: "add", quantity: 12, reason: "received", note: "" }} onValueChange={setReported} />
          <p className="text-xs text-muted-foreground">
            Reports{" "}
            {/* A space after each comma, so a narrow screen breaks the line there and nowhere else. */}
            <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-foreground tabular-nums [overflow-wrap:anywhere]">
              {JSON.stringify({ newOnHand: reported.newOnHand, valid: reported.valid }).replace(/,/g, ", ")}
            </code>
          </p>
        </div>
      </Example>

      <Example caption="A removal that would take the stock below zero is refused, with the numbers, and the result says it is not possible.">
        <StockAdjustField onHand={24} unit="pcs" defaultValue={{ mode: "remove", quantity: 30, reason: "damaged", note: "" }} />
      </Example>

      <Example caption="Set to counts the stock at a number. It starts at what is on hand, and Add and Remove keep their own numbers.">
        <StockAdjustField onHand={24} unit="pcs" defaultValue={{ mode: "set", quantity: 18, reason: "count-correction", note: "Recount of shelf B4." }} />
      </Example>

      <Example caption="Other asks for a note, so no adjustment is left unexplained. Back orders can allow stock below zero.">
        <StockAdjustField onHand={24} unit="pcs" allowNegative defaultValue={{ mode: "remove", quantity: 30, reason: "other", note: "" }} />
      </Example>
    </div>
  );
}
