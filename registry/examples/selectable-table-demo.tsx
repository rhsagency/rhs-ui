"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { IconArchive, IconDownload } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { SelectableTable, type SelectableColumn } from "@rhs-ui/primitives/selectable-table";
import { StatusBadge } from "@rhs-ui/primitives/status-badge";

type Order = { id: string; number: string; customer: string; placed: string; total: number; status: "paid" | "pending" | "overdue" | "refunded" };

const ORDERS: readonly Order[] = [
  { id: "ord_1048", number: "#1048", customer: "Kestrel Analytics", placed: "Oct 28", total: 1840, status: "paid" },
  { id: "ord_1047", number: "#1047", customer: "Halcyon Labs", placed: "Oct 27", total: 620, status: "pending" },
  { id: "ord_1046", number: "#1046", customer: "Northwind Traders", placed: "Oct 27", total: 2375.5, status: "overdue" },
  { id: "ord_1045", number: "#1045", customer: "Oak Lane Bakery", placed: "Oct 26", total: 310, status: "paid" },
  { id: "ord_1044", number: "#1044", customer: "Mirror Labs", placed: "Oct 25", total: 4200, status: "paid" },
  { id: "ord_1043", number: "#1043", customer: "Aiko Tanaka Design", placed: "Oct 24", total: 1175, status: "refunded" },
  { id: "ord_1042", number: "#1042", customer: "Émile Roche Studio", placed: "Oct 23", total: 640, status: "pending" },
  { id: "ord_1041", number: "#1041", customer: "Zoë van Dijk", placed: "Oct 22", total: 89.9, status: "paid" },
  { id: "ord_1040", number: "#1040", customer: "Fjord Freight", placed: "Oct 21", total: 5320, status: "overdue" },
  { id: "ord_1039", number: "#1039", customer: "Lumen Energy", placed: "Oct 20", total: 960, status: "paid" },
];

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

// A selected row is the same grey as a soft badge, so the pill would vanish with the row picked, and an outline in the dark theme is the colour of the row: inside one the pill
// lifts off in the card colour with a hairline. The red one keeps its own fill.
const ON_SELECTED = "[tr[data-state=selected]_&]:bg-card [tr[data-state=selected]_&]:ring-1 [tr[data-state=selected]_&]:ring-foreground/15";

// The card is the container: the two quiet columns leave when it is narrow, whatever the window says.
const COLUMNS: readonly SelectableColumn<Order>[] = [
  { key: "number", header: "Order", className: "hidden @xl:table-cell", cell: (order) => <span className="font-mono text-xs">{order.number}</span> },
  { key: "customer", header: "Customer", className: "font-medium" },
  { key: "placed", header: "Placed", className: "hidden whitespace-nowrap text-muted-foreground @xl:table-cell" },
  { key: "status", header: "Status", className: "hidden @xs:table-cell", cell: (order) => <StatusBadge status={order.status} className={order.status === "overdue" ? undefined : ON_SELECTED} /> },
  { key: "total", header: "Total", align: "right", className: "tabular-nums", cell: (order) => euro.format(order.total) },
];

type Member = { id: string; name: string; role: string };

const TEAM: readonly Member[] = [
  { id: "m1", name: "Mara Okafor", role: "Support lead" },
  { id: "m2", name: "Jonas Weber", role: "Engineer" },
  { id: "m3", name: "Priya Nair", role: "Support" },
  { id: "m4", name: "Lucas Moreau", role: "Support" },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [orders, setOrders] = useState<readonly Order[]>(ORDERS);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set(["ord_1048", "ord_1045", "ord_1044"]));
  const frame = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  // Archive is disabled by its own press (nothing is picked any more) and Restore removes itself, and the focus on either would drop to the top of the page.
  // Once the list has rendered, the header checkbox takes it, or the restore link when nothing is left to pick.
  useLayoutEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    const scope = frame.current;
    (scope?.querySelector<HTMLElement>("thead [role=checkbox]:not(:disabled)") ?? scope?.querySelector<HTMLElement>("[data-restore]"))?.focus();
  }, [orders]);
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-10 p-2 sm:p-6">
      <Example caption="Controlled: you hold the ids. Shift-click a second box to pick everything between. The refunded order stays in the tab order: focus its dimmed box to hear why it cannot be picked">
        <div ref={frame} className="@container overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-4 py-2">
            <p className="text-sm" aria-hidden="true">
              {selected.size === 0 ? (
                <span className="text-muted-foreground">Select orders to act on them</span>
              ) : (
                <>
                  <span className="font-medium tabular-nums">{selected.size}</span> <span className="text-muted-foreground">of {orders.length} selected</span>
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" disabled={selected.size === 0}>
                <IconDownload aria-hidden="true" />
                Export
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={selected.size === 0}
                onClick={() => {
                  moved.current = true;
                  setOrders((rows) => rows.filter((order) => !selected.has(order.id)));
                  setSelected(new Set());
                }}
              >
                <IconArchive aria-hidden="true" />
                Archive
              </Button>
            </div>
          </div>
          <SelectableTable
            columns={COLUMNS}
            rows={orders}
            selected={selected}
            onSelectedChange={setSelected}
            noun="orders"
            getRowLabel={(order) => `order ${order.number}`}
            isRowDisabled={(order) => (order.status === "refunded" ? "Refunded orders are closed and cannot be edited" : false)}
            empty="Every order is archived."
            caption={<span className="block px-4 pb-3 text-left">Orders from the last two weeks. Archiving an order hides it from this list and keeps its invoice.</span>}
          />
          {orders.length < ORDERS.length ? (
            <div className="border-t border-border px-4 py-2">
              <button
                type="button"
                data-restore
                onClick={() => {
                  moved.current = true;
                  setOrders(ORDERS);
                }}
                className="rounded-sm text-xs text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                Restore the sample orders
              </button>
            </div>
          ) : null}
        </div>
      </Example>

      <Example caption="Uncontrolled, with a starting selection and its own noun: the header box is mixed while only some rows are picked">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <SelectableTable
            columns={[
              { key: "name", header: "Name", className: "font-medium" },
              { key: "role", header: "Role", className: "text-muted-foreground" },
            ]}
            rows={TEAM}
            defaultSelected={["m2", "m3"]}
            noun="members"
            getRowLabel={(member) => member.name}
            caption={<span className="block px-4 pb-3 text-left">Who can approve refunds.</span>}
          />
        </div>
      </Example>
    </div>
  );
}
