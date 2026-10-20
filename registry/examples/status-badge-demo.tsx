import type { ReactNode } from "react";

import { IconTruck } from "@rhs-ui/icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { StatusBadge, defaultStatuses } from "@rhs-ui/primitives/status-badge";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const INVOICES = [
  { id: "INV-2041", client: "Northwind Studio", amount: "EUR 4,860.00", status: "paid" },
  { id: "INV-2042", client: "Halcyon Labs", amount: "EUR 1,240.00", status: "pending" },
  { id: "INV-2043", client: "Kestrel Air", amount: "EUR 9,300.00", status: "overdue" },
  { id: "INV-2044", client: "Polder Foods", amount: "EUR 620.00", status: "refunded" },
  { id: "INV-2045", client: "Lumen Works", amount: "EUR 2,115.00", status: "failed" },
  { id: "INV-2046", client: "Harbour & Co", amount: "EUR 780.00", status: "draft" },
] as const;

const DOCUMENTS = [
  { title: "Brand guidelines v3", meta: "Edited 2 hours ago by Ines", status: "in-review" },
  { title: "Kestrel onboarding flow", meta: "Edited yesterday by Tomas", status: "approved" },
  { title: "Halcyon pricing page", meta: "Edited 12 Oct by Mara", status: "draft" },
  { title: "Legacy checkout", meta: "Archived 3 Sep", status: "archived" },
] as const;

const FULFILMENT = {
  ...defaultStatuses,
  shipped: { label: "Shipped", glyph: <IconTruck />, emphasis: "soft" },
  "out-for-delivery": { label: "Out for delivery", glyph: <IconTruck />, emphasis: "strong" },
} as const;

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-9">
      <Example caption="In a table: the glyph and the word say it, the fill adds weight">
        <div className="w-full rounded-xl border border-border bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {INVOICES.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="hidden font-mono text-xs whitespace-nowrap sm:table-cell">{invoice.id}</TableCell>
                  <TableCell className="font-medium">{invoice.client}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{invoice.amount}</TableCell>
                  <TableCell>
                    <StatusBadge status={invoice.status} size="sm" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Example>

      <Example caption="The whole vocabulary">
        <div className="flex flex-wrap gap-2">
          {Object.keys(defaultStatuses).map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </Example>

      <Example caption="Sizes: 20, 24 and 28px, and a dot for dense tables">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <StatusBadge status="paid" size="sm" />
          <StatusBadge status="paid" size="md" />
          <StatusBadge status="paid" size="lg" />
          <span role="group" aria-label="Dot sizes" className="flex items-center gap-1.5">
            <StatusBadge status="paid" size="dot" />
            <StatusBadge status="pending" size="dot" />
            <StatusBadge status="paused" size="dot" />
            <StatusBadge status="overdue" size="dot" />
            <StatusBadge status="failed" size="dot" />
          </span>
          <span className="text-xs text-muted-foreground">Dots keep the word for screen readers and in a title.</span>
        </div>
      </Example>

      <Example caption="Your own statuses, next to the defaults">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status="pending" statuses={FULFILMENT} />
          <StatusBadge status="shipped" statuses={FULFILMENT} />
          <StatusBadge status="out_for_delivery" statuses={FULFILMENT} />
          <StatusBadge status="paid" statuses={FULFILMENT} label="Delivered" />
          <StatusBadge status="held-at-customs" />
        </div>
      </Example>

      <Example caption="In a record list, next to the rest of the row">
        <ul className="w-full divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
          {DOCUMENTS.map((document) => (
            <li key={document.title} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{document.title}</p>
                <p className="truncate text-xs text-muted-foreground">{document.meta}</p>
              </div>
              <StatusBadge status={document.status} className="shrink-0" />
            </li>
          ))}
        </ul>
      </Example>
    </div>
  );
}
