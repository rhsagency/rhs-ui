"use client";

import { useEffect, useRef, useState } from "react";

import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { TopLoadingBar } from "@rhs-ui/motion/top-loading-bar";

type PageId = "orders" | "customers" | "invoices";

const PAGES: Record<PageId, { title: string; summary: string; rows: readonly { name: string; meta: string; status: string }[] }> = {
  orders: {
    title: "Orders",
    summary: "34 open orders, 6 waiting to be dispatched.",
    rows: [
      { name: "#4821 Kestrel Outfitters", meta: "3 items · Express", status: "Shipped" },
      { name: "#4820 Halcyon Studio", meta: "1 item · Standard", status: "Packing" },
      { name: "#4819 Oak Lane Interiors", meta: "12 items · Freight", status: "Awaiting stock" },
    ],
  },
  customers: {
    title: "Customers",
    summary: "1,284 customers, 41 new this month.",
    rows: [
      { name: "Halcyon Studio", meta: "Amsterdam · 12 orders", status: "Active" },
      { name: "Kestrel Outfitters", meta: "Rotterdam · 8 orders", status: "Active" },
      { name: "Mirror Labs", meta: "Utrecht · 2 orders", status: "New" },
    ],
  },
  invoices: {
    title: "Invoices",
    summary: "€48,320 outstanding across 9 invoices.",
    rows: [
      { name: "INV-2041 Kestrel Outfitters", meta: "€1,240.00 · due 28 Oct", status: "Paid" },
      { name: "INV-2040 Oak Lane Interiors", meta: "€6,880.00 · due 24 Oct", status: "Overdue" },
      { name: "INV-2039 Halcyon Studio", meta: "€420.50 · due 30 Oct", status: "Sent" },
    ],
  },
};

const TABS: readonly { id: PageId; label: string }[] = [
  { id: "orders", label: "Orders" },
  { id: "customers", label: "Customers" },
  { id: "invoices", label: "Invoices" },
];

export default function Demo(): React.JSX.Element {
  const [page, setPage] = useState<PageId>("orders");
  const [pending, setPending] = useState(false);
  const [failing, setFailing] = useState(false);
  const [note, setNote] = useState("Pick a page, or run one of the requests below.");
  // The note is the last result; while something is pending the line below says what the bar is doing.
  const timers = useRef<number[]>([]);

  const later = (run: () => void, ms: number): void => {
    timers.current.push(window.setTimeout(run, ms));
  };

  // A request of `ms` milliseconds. A failing one turns the bar red just before it ends.
  const request = (ms: number, then?: () => void, fails = false): void => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setFailing(false);
    setPending(true);
    if (fails) later(() => setFailing(true), ms * 0.75);
    later(() => {
      setPending(false);
      then?.();
      setNote(
        fails
          ? `The request failed after ${ms} ms. The bar finished in the destructive tone.`
          : ms < 150
            ? `Done in ${ms} ms. That is under the 150 ms delay, so the bar never appeared.`
            : `Done in ${(ms / 1000).toFixed(1)} s. The bar raced to 80 percent, then swept to the end.`,
      );
    }, ms);
    if (fails) later(() => setFailing(false), ms + 900);
  };

  // Start with something in flight, so the bar is on screen straight away.
  useEffect(() => {
    request(2600);
    return () => timers.current.forEach((id) => window.clearTimeout(id));
  }, []);

  const current = PAGES[page];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="relative overflow-clip rounded-xl border border-border bg-card shadow-xs">
        <TopLoadingBar active={pending} tone={failing ? "destructive" : "default"} className="absolute" />
        <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-6 place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground" aria-hidden="true">
              N
            </span>
            <span className="text-sm font-medium tracking-[-0.01em]">Northwind Console</span>
          </div>
          <nav aria-label="Console" className="flex gap-1">
            {TABS.map((tab) => (
              <Button key={tab.id} variant={tab.id === page ? "secondary" : "ghost"} size="sm" aria-current={tab.id === page ? "page" : undefined} onClick={() => request(1600, () => setPage(tab.id))}>
                {tab.label}
              </Button>
            ))}
          </nav>
        </header>
        <main className="min-h-72 px-5 py-6" aria-busy={pending}>
          <h2 className="text-xl font-medium tracking-[-0.03em]">{current.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{current.summary}</p>
          <ul className="mt-5 divide-y divide-border rounded-lg border border-border">
            {current.rows.map((row) => (
              <li key={row.name} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{row.meta}</p>
                </div>
                <Badge variant="muted">{row.status}</Badge>
              </li>
            ))}
          </ul>
        </main>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => request(2200)}>
          Slow request, 2.2 s
        </Button>
        <Button variant="outline" size="sm" onClick={() => request(80)}>
          Quick request, 80 ms
        </Button>
        <Button variant="outline" size="sm" onClick={() => request(1800, undefined, true)}>
          Failing request
        </Button>
      </div>
      <p className="mt-3 min-h-5 text-xs text-muted-foreground" aria-live="polite">
        {pending ? "A request is in flight. The bar races to 80 percent and keeps creeping until it ends." : note}
      </p>
    </div>
  );
}
