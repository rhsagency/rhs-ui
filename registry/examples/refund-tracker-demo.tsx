import type { ReactNode } from "react";

import { RefundTracker, type Refund } from "@rhs-ui/commerce/refund-tracker";

const REQUESTED: Refund = {
  amount: 12900,
  method: "Card ending 4242",
  steps: { requested: "2026-10-20T09:30:00Z" },
};

const APPROVED: Refund = {
  amount: 12900,
  method: "Card ending 4242",
  steps: { requested: "2026-10-20T09:30:00Z", received: "2026-10-22T14:05:00Z", approved: "2026-10-23T08:40:00Z" },
  expectedBy: "2026-10-28",
};

/** Approved, but nobody has said when the money lands: there is no expectedBy, so the usual range is all it can promise. */
const NO_DATE: Refund = {
  amount: 8995,
  method: "Card ending 1881",
  steps: { requested: "2026-10-20T09:30:00Z", received: "2026-10-22T14:05:00Z", approved: "2026-10-23T08:40:00Z" },
};

const SENT: Refund = {
  amount: 6450,
  method: "Bank account ending 2210",
  steps: { requested: "2026-10-14T18:12:00Z", received: "2026-10-16T10:20:00Z", approved: "2026-10-16T15:02:00Z", paid: "2026-10-17T07:15:00Z" },
  expectedBy: "2026-10-22",
};

const FAILED: Refund = {
  amount: 21500,
  method: "Card ending 0097",
  steps: { requested: "2026-10-12T11:00:00Z", received: "2026-10-15T09:48:00Z", approved: "2026-10-16T13:30:00Z" },
  issue: {
    kind: "failed",
    reason: "The card this order was paid with has been closed, so your bank sent the money back.",
    action: "Reply to your refund email with the IBAN of an account in your name and we will pay it there within two working days.",
  },
};

const PARTIAL: Refund = {
  amount: 12900,
  method: "Wallet balance",
  steps: { requested: "2026-10-13T08:20:00Z", received: "2026-10-15T12:10:00Z", approved: "2026-10-16T09:05:00Z", paid: "2026-10-16T09:30:00Z" },
  expectedBy: "2026-10-19",
  issue: {
    kind: "partial",
    refunded: 8400,
    reason: "The linen jacket came back with a stain, so it was not refunded. The shirt and the scarf were.",
    action: "If you think we got it wrong, reply to your return email within 14 days and we will look again.",
  },
};

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-x-8 gap-y-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr))]">
      <Example caption="Just requested: what to do next, and no promise about the money yet">
        <RefundTracker refund={REQUESTED} now="2026-10-21T09:00:00Z" locale="en-GB" />
      </Example>

      <Example caption="Approved: the arrival appears now, because there is one to promise">
        <RefundTracker refund={APPROVED} now="2026-10-24T09:00:00Z" locale="en-GB" />
      </Example>

      <Example caption="Money on its way, and the day it was due has passed: it says so">
        <RefundTracker refund={SENT} now="2026-10-26T09:00:00Z" locale="en-GB" />
      </Example>

      <Example caption="Failed: it stops at its step and says why and what to do">
        <RefundTracker refund={FAILED} now="2026-10-20T09:00:00Z" locale="en-GB" />
      </Example>

      <Example caption="Partial: how much, and why the rest is not refunded">
        <RefundTracker refund={PARTIAL} now="2026-10-17T09:00:00Z" locale="en-GB" />
      </Example>

      <Example caption="No date known: the usual range, only after approval. Here in US dollars and US dates">
        <RefundTracker refund={NO_DATE} currency="USD" locale="en-US" now="2026-10-24T09:00:00Z" />
      </Example>
    </div>
  );
}
