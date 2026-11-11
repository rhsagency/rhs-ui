"use client";

import type { ReactNode } from "react";

import { ExpandableTable, type ExpandableColumn } from "@rhs-ui/primitives/expandable-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { TableDensityProvider, TableDensityToggle, useTableDensity } from "@rhs-ui/primitives/table-density-toggle";

const CUSTOMERS = [
  { name: "Kestrel Analytics", plan: "Team", seats: 12, mrr: 1440 },
  { name: "Halcyon Labs", plan: "Starter", seats: 4, mrr: 96 },
  { name: "Northwind Traders", plan: "Business", seats: 48, mrr: 5760 },
  { name: "Oak Lane Bakery", plan: "Starter", seats: 3, mrr: 72 },
  { name: "Mirror Labs", plan: "Team", seats: 9, mrr: 1080 },
  { name: "Fjord Freight", plan: "Business", seats: 31, mrr: 3720 },
] as const;

type Line = { item: string; quantity: number; price: number };
type Order = { id: string; number: string; customer: string; lines: readonly Line[] };

const ORDERS: readonly Order[] = [
  {
    id: "ord_4821",
    number: "Order 4821",
    customer: "Kestrel Analytics",
    lines: [
      { item: "Team plan, 12 seats", quantity: 12, price: 120 },
      { item: "Onboarding workshop", quantity: 1, price: 350 },
    ],
  },
  {
    id: "ord_4820",
    number: "Order 4820",
    customer: "Fjord Freight",
    lines: [
      { item: "Business plan, 31 seats", quantity: 31, price: 120 },
      { item: "Priority support", quantity: 31, price: 4.5 },
    ],
  },
  { id: "ord_4819", number: "Order 4819", customer: "Oak Lane Bakery", lines: [{ item: "Starter plan, 3 seats", quantity: 3, price: 24 }] },
];

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
const HEIGHTS = { compact: "32", comfortable: "44", spacious: "56" } as const;
const sum = (order: Order) => order.lines.reduce((total, line) => total + line.quantity * line.price, 0);

const COLUMNS: readonly ExpandableColumn<Order>[] = [
  { key: "number", header: "Order", className: "font-medium whitespace-nowrap" },
  { key: "customer", header: "Customer", className: "hidden text-muted-foreground @md:table-cell" },
  { key: "total", header: "Total", align: "right", className: "tabular-nums", cell: (order) => euro.format(sum(order)) },
];

/** Reads the density from the provider, the way a cell of your own would. */
function Readout(): React.JSX.Element {
  const { density } = useTableDensity();
  return (
    <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
      {density}, {HEIGHTS[density]}px rows
    </p>
  );
}

/** A table of its own inside a panel: a plain table, set at its natural size whatever the density above says. */
function Lines({ order }: { order: Order }): React.JSX.Element {
  return (
    <table className="w-full max-w-md table-fixed text-sm">
      <caption className="sr-only">Lines of {order.number}</caption>
      <thead>
        <tr className="text-left text-xs text-muted-foreground">
          <th scope="col" className="pb-1.5 font-normal">
            Item
          </th>
          <th scope="col" className="w-14 pb-1.5 text-right font-normal">
            Qty
          </th>
          <th scope="col" className="w-24 pb-1.5 text-right font-normal">
            Amount
          </th>
        </tr>
      </thead>
      <tbody>
        {order.lines.map((line) => (
          <tr key={line.item} className="border-t border-border">
            <th scope="row" className="py-1.5 pr-3 text-left font-normal">
              {line.item}
            </th>
            <td className="py-1.5 text-right text-muted-foreground tabular-nums">{line.quantity}</td>
            <td className="py-1.5 text-right tabular-nums">{euro.format(line.quantity * line.price)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
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
  return (
    <div className="grid w-full max-w-2xl gap-10">
      <TableDensityProvider storageKey="rhs-ui-demo-table-density">
        <Example caption="One control for every table below it: pick a density and the rows and the size of their text follow">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-4 py-2">
              <div className="grid gap-0.5">
                <h2 className="text-sm font-medium">Customers</h2>
                <Readout />
              </div>
              <TableDensityToggle />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Customer</TableHead>
                  <TableHead scope="col" className="hidden sm:table-cell">
                    Plan
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Seats
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    MRR
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CUSTOMERS.map((customer) => (
                  <TableRow key={customer.name}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{customer.plan}</TableCell>
                    <TableCell className="text-right tabular-nums">{customer.seats}</TableCell>
                    <TableCell className="text-right tabular-nums">{euro.format(customer.mrr)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Example>

        <Example caption="The same control, another table: the rows follow, but an open panel opts out with data-density-skip, and so does the table inside it, which keeps its own sizes">
          <div className="@container overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <ExpandableTable
              aria-label="Orders with their lines"
              columns={COLUMNS}
              rows={ORDERS}
              defaultExpanded={["ord_4821"]}
              getRowLabel={(order) => order.number}
              renderDetail={(order) => <Lines order={order} />}
            />
          </div>
        </Example>
      </TableDensityProvider>
    </div>
  );
}
