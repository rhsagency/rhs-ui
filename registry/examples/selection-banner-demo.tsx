"use client";

import { useRef, useState, type ReactNode } from "react";

import { SelectableTable, type SelectableColumn } from "@rhs-ui/primitives/selectable-table";
import { SelectionBanner } from "@rhs-ui/primitives/selection-banner";
import { StatusBadge } from "@rhs-ui/primitives/status-badge";

type Order = { id: string; number: string; customer: string; total: number; status: "paid" | "pending" | "overdue" };

const PAGE: readonly Order[] = [
  { id: "ord_1048", number: "#1048", customer: "Kestrel Analytics", total: 1840, status: "paid" },
  { id: "ord_1047", number: "#1047", customer: "Halcyon Labs", total: 620, status: "pending" },
  { id: "ord_1046", number: "#1046", customer: "Northwind Traders", total: 2375.5, status: "overdue" },
  { id: "ord_1045", number: "#1045", customer: "Oak Lane Bakery", total: 310, status: "paid" },
  { id: "ord_1044", number: "#1044", customer: "Mirror Labs", total: 4200, status: "paid" },
  { id: "ord_1042", number: "#1042", customer: "Émile Roche Studio", total: 640, status: "pending" },
];

const TOTAL_ORDERS = 312;
const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

// A selected row is the same grey as a soft badge, so the pill would vanish with the row picked: inside one it lifts off in the card colour with a hairline. The red one keeps its own fill.
const ON_SELECTED = "[tr[data-state=selected]_&]:bg-card [tr[data-state=selected]_&]:ring-1 [tr[data-state=selected]_&]:ring-foreground/15";

const COLUMNS: readonly SelectableColumn<Order>[] = [
  { key: "number", header: "Order", className: "hidden @xs:table-cell", cell: (order) => <span className="font-mono text-xs">{order.number}</span> },
  { key: "customer", header: "Customer", className: "font-medium" },
  { key: "status", header: "Status", className: "hidden @lg:table-cell", cell: (order) => <StatusBadge status={order.status} className={order.status === "overdue" ? undefined : ON_SELECTED} /> },
  { key: "total", header: "Total", align: "right", className: "tabular-nums", cell: (order) => euro.format(order.total) },
];

/** A banner whose buttons do what they say, so the picture is not a pair of dead buttons: press one and it flips to the other state, still on the same button. */
function LiveBanner({ start }: { start: boolean }): React.JSX.Element {
  const [all, setAll] = useState(start);
  return <SelectionBanner pageCount={25} total={312} allSelected={all} onSelectAll={() => setAll(true)} onClear={() => setAll(false)} noun="orders" />;
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  // Start with the page picked, so the first thing on screen is the question the banner asks.
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set(PAGE.map((order) => order.id)));
  // "Everything" is yours to keep: only you know that all 312 means every order matching the query.
  const [everything, setEverything] = useState(false);
  const wholePage = selected.size === PAGE.length;
  const frame = useRef<HTMLDivElement>(null);

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-10 p-2 sm:p-6">
      <div className="grid gap-6 @container">
        <Example caption="The two states, as they read. Both are live: press a button and the banner flips to the other state, on the same button">
          <div className="grid gap-3">
            <LiveBanner start={false} />
            <LiveBanner start />
          </div>
        </Example>
      </div>

      <Example caption="Try it: pick the page with the header box. The banner offers every order; after the press it offers to clear. Untick a row and it steps away">
        <div ref={frame} className="@container overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border px-4 py-2">
            <p className="text-sm font-medium">Orders</p>
            <p className="text-sm text-muted-foreground tabular-nums" aria-hidden="true">
              {everything ? `${TOTAL_ORDERS} selected` : `${selected.size} of ${PAGE.length} on this page selected`}
            </p>
          </div>
          {wholePage || everything ? (
            <SelectionBanner
              pageCount={PAGE.length}
              total={TOTAL_ORDERS}
              allSelected={everything}
              onSelectAll={() => setEverything(true)}
              onClear={() => {
                // The banner, and the button that has the focus, are about to go: the header checkbox takes the focus first, so a keyboard user is not sent back to the top of the page.
                frame.current?.querySelector<HTMLElement>("thead [role=checkbox]")?.focus();
                setEverything(false);
                setSelected(new Set());
              }}
              noun="orders"
              className="rounded-none border-x-0 border-t-0"
            />
          ) : null}
          <SelectableTable
            columns={COLUMNS}
            rows={PAGE}
            selected={selected}
            onSelectedChange={(next) => {
              setSelected(next);
              setEverything(false);
            }}
            noun="orders"
            getRowLabel={(order) => `order ${order.number}`}
            caption={<span className="block px-4 pb-3 text-left">Page 1 of 52, six orders a page.</span>}
          />
        </div>
      </Example>
    </div>
  );
}
