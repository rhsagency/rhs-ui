"use client";

import { useState, type ReactNode } from "react";

import { IconAlertCircle, IconInfo, IconWarning } from "@rhs-ui/icons";
import { ExpandableTable, type ExpandableColumn } from "@rhs-ui/primitives/expandable-table";
import { StatusBadge, type StatusDefinition } from "@rhs-ui/primitives/status-badge";

type Line = { item: string; quantity: number; price: number };
type Invoice = { id: string; number: string; customer: string; due: string; status: "paid" | "pending" | "overdue"; lines: readonly Line[] };

const INVOICES: readonly Invoice[] = [
  {
    id: "inv_1042",
    number: "Invoice 1042",
    customer: "Kestrel Analytics",
    due: "Nov 12",
    status: "pending",
    lines: [
      { item: "Analytics seats, annual", quantity: 12, price: 120 },
      { item: "Onboarding workshop", quantity: 1, price: 350 },
      { item: "Priority support", quantity: 12, price: 4.5 },
    ],
  },
  {
    id: "inv_1041",
    number: "Invoice 1041",
    customer: "Halcyon Labs",
    due: "Nov 4",
    status: "paid",
    lines: [
      { item: "Hosting, October", quantity: 1, price: 480 },
      { item: "Extra storage, 200 GB", quantity: 2, price: 70 },
    ],
  },
  {
    id: "inv_1040",
    number: "Invoice 1040",
    customer: "Northwind Traders",
    due: "Oct 29",
    status: "overdue",
    lines: [
      { item: "Warehouse integration", quantity: 1, price: 1900 },
      { item: "Barcode scanners", quantity: 4, price: 118.75 },
    ],
  },
  {
    id: "inv_1039",
    number: "Invoice 1039",
    customer: "Mirror Labs",
    due: "Oct 22",
    status: "paid",
    lines: [{ item: "Design review", quantity: 6, price: 140 }],
  },
];

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
const sum = (invoice: Invoice) => invoice.lines.reduce((total, line) => total + line.quantity * line.price, 0);

const COLUMNS: readonly ExpandableColumn<Invoice>[] = [
  { key: "number", header: "Invoice", className: "font-medium whitespace-nowrap" },
  { key: "customer", header: "Customer", className: "hidden @lg:table-cell" },
  { key: "due", header: "Due", className: "hidden whitespace-nowrap text-muted-foreground @xl:table-cell" },
  { key: "status", header: "Status", className: "hidden @xs:table-cell", cell: (invoice) => <StatusBadge status={invoice.status} /> },
  { key: "total", header: "Total", align: "right", className: "tabular-nums", cell: (invoice) => euro.format(sum(invoice)) },
];

/** The lines of one invoice, as a small table of its own. */
function Lines({ invoice }: { invoice: Invoice }): React.JSX.Element {
  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        {invoice.customer}, due {invoice.due}
      </p>
      {/* Fixed columns, so the quantities and the amounts end in the same place in every open panel. */}
      <table className="w-full max-w-lg table-fixed text-sm">
        <caption className="sr-only">Lines of {invoice.number}</caption>
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th scope="col" className="pb-1.5 font-normal">
              Item
            </th>
            <th scope="col" className="w-16 pb-1.5 text-right font-normal">
              Qty
            </th>
            <th scope="col" className="w-28 pb-1.5 text-right font-normal">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line) => (
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
    </div>
  );
}

type Entry = { id: string; time: string; level: "info" | "warn" | "error"; message: string; detail: string };

const LOG: readonly Entry[] = [
  { id: "e1", time: "09:41:07", level: "error", message: "Payment webhook failed", detail: "POST /hooks/payments returned 502 after 3 attempts. The event stays queued and is retried at 09:56." },
  { id: "e2", time: "09:38:52", level: "warn", message: "Slow query on orders", detail: "SELECT on orders took 2.4 s with 118,204 rows scanned. An index on placed_at would bring it under 50 ms." },
  { id: "e3", time: "09:30:00", level: "info", message: "Nightly export finished", detail: "1,204 orders written to the warehouse bucket in 41 s." },
];

const LEVELS: Readonly<Record<string, StatusDefinition>> = {
  info: { label: "Info", glyph: <IconInfo />, emphasis: "outline" },
  warn: { label: "Warning", glyph: <IconWarning />, emphasis: "soft" },
  error: { label: "Error", glyph: <IconAlertCircle />, emphasis: "critical" },
};

const LOG_COLUMNS: readonly ExpandableColumn<Entry>[] = [
  { key: "time", header: "Time", className: "hidden whitespace-nowrap @md:table-cell", cell: (entry) => <span className="font-mono text-xs text-muted-foreground">{entry.time}</span> },
  { key: "level", header: "Level", cell: (entry) => <StatusBadge status={entry.level} statuses={LEVELS} /> },
  { key: "message", header: "Message", className: "font-medium" },
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
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set(["inv_1042"]));
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-10 p-2 sm:p-6">
      <Example caption="Controlled, any number open: the header button opens them all and shows a mixed state while only some are open. Each row's button says which row it opens">
        <div className="@container overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <ExpandableTable
            columns={COLUMNS}
            rows={INVOICES}
            expanded={open}
            onExpandedChange={setOpen}
            getRowLabel={(invoice) => invoice.number}
            renderDetail={(invoice) => <Lines invoice={invoice} />}
            caption={<span className="block px-4 pb-3 text-left">Invoices with their lines. {open.size === 0 ? "Nothing is open." : `${open.size} of ${INVOICES.length} open.`}</span>}
          />
        </div>
      </Example>

      <Example caption="One at a time: opening a row closes the one that was open, and there is no expand-all button">
        <div className="@container overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <ExpandableTable
            mode="single"
            columns={LOG_COLUMNS}
            rows={LOG}
            defaultExpanded={["e2"]}
            getRowLabel={(entry) => `${entry.time} ${entry.message}`}
            renderDetail={(entry) => <p className="max-w-xl text-sm text-muted-foreground">{entry.detail}</p>}
            caption={<span className="block px-4 pb-3 text-left">Application log, newest first.</span>}
          />
        </div>
      </Example>
    </div>
  );
}
