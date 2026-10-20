"use client";

import { useState } from "react";

import { AttentionList, type AttentionItem } from "@rhs-ui/dashboard/attention-list";
import { Button } from "@rhs-ui/primitives/button";
import { Toaster } from "@rhs-ui/primitives/toast";

const NOW = "2026-10-20T10:30:00Z";

const INITIAL: readonly AttentionItem[] = [
  {
    id: "halcyon-payment",
    severity: "critical",
    title: "Payment failed for Halcyon Studio",
    detail: "The card was declined three times. Their subscription pauses tomorrow at 09:00.",
    time: "2026-10-20T10:18:00Z",
    action: { label: "Retry payment" },
  },
  {
    id: "checkout-latency",
    severity: "critical",
    title: "Checkout is slower than usual",
    detail: "Median response time is 3.2 seconds over the last 15 minutes.",
    time: "2026-10-20T09:52:00Z",
    action: { label: "Open status", href: "#status" },
  },
  {
    id: "tls-certificate",
    severity: "warning",
    title: "The certificate for shop.northwind.example expires in 6 days",
    detail: "Renewal failed twice. Check the DNS record before Friday.",
    time: "2026-10-20T07:12:00Z",
    action: { label: "Renew now" },
  },
  {
    id: "waiting-tickets",
    severity: "warning",
    title: "8 tickets have waited for more than a day",
    detail: "The oldest is from Maya Okafor, about a delayed parcel.",
    time: "2026-10-19T14:05:00Z",
    action: { label: "Open inbox", href: "#inbox" },
  },
  {
    id: "kestrel-key",
    severity: "notice",
    title: "The Kestrel analytics key stops working on 31 October",
    detail: "Create a new key and update it in your settings.",
    time: "2026-10-18T09:00:00Z",
    action: { label: "Create key" },
  },
  {
    id: "inventory-sync",
    severity: "notice",
    title: "Inventory sync finished with 3 skipped products",
    detail: "Variants without a SKU were left out.",
    time: "2026-10-15T16:40:00Z",
    action: { label: "Review" },
  },
];

export default function Demo(): React.JSX.Element {
  const [items, setItems] = useState<readonly AttentionItem[]>(INITIAL);
  const [last, setLast] = useState("Nothing pressed yet.");

  return (
    <div className="grid w-full max-w-2xl gap-10">
      <Toaster />

      <section className="grid gap-3">
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Sorted by severity, newest first. Dismiss a row, then undo it from the toast.</p>
          {items.length < INITIAL.length ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setItems(INITIAL)}>
              Restore all
            </Button>
          ) : null}
        </div>
        <AttentionList
          items={items}
          maxVisible={5}
          viewAllHref="#all-issues"
          now={NOW}
          onAction={(item) => setLast(`${item.action?.label ?? "Action"} on “${item.title}”`)}
          onDismiss={(item) => setItems((current) => current.filter((entry) => entry.id !== item.id))}
          onUndoDismiss={(item) => setItems((current) => (current.some((entry) => entry.id === item.id) ? current : [...current, item]))}
        />
        <p aria-live="polite" className="text-xs text-muted-foreground">
          Last action: {last}
        </p>
      </section>

      <section className="grid gap-3">
        <p className="text-xs text-muted-foreground">With nothing left to do, the list says so calmly</p>
        <AttentionList items={[]} viewAllHref="#all-issues" now={NOW} />
      </section>
    </div>
  );
}
