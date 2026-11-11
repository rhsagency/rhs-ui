"use client";

import { useState, type ReactNode } from "react";

import { Badge } from "@rhs-ui/primitives/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { TableExportMenu, type ExportColumn } from "@rhs-ui/primitives/table-export-menu";
import { toCsv } from "@rhs-ui/primitives/table-export-menu/export";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

type Order = { id: string; customer: string; placed: string; total: number; status: "Paid" | "Pending" | "Refunded"; note: string };

const ORDERS: readonly Order[] = [
  { id: "#1048", customer: "Kestrel Analytics", placed: "2026-11-03T09:14:00Z", total: 1840, status: "Paid", note: 'Agreed "net 30" by email' },
  { id: "#1047", customer: "Harbour & Co, Ltd", placed: "2026-11-02T16:40:00Z", total: 620.5, status: "Pending", note: "" },
  { id: "#1046", customer: "Émile Roche Studio", placed: "2026-11-02T11:05:00Z", total: 2375.5, status: "Paid", note: "Gift wrap.\nLeave at reception." },
  { id: "#1045", customer: "Zoë van Dijk", placed: "2026-11-01T08:22:00Z", total: 89.9, status: "Refunded", note: "Returned unopened" },
  { id: "#1044", customer: "Northwind Traders", placed: "2026-10-31T14:58:00Z", total: 5320, status: "Paid", note: "" },
];

// What the file holds is the raw data, not what the table shows: an ISO time and a plain number, with no euro sign.
const COLUMNS: readonly ExportColumn<Order>[] = [
  { key: "id", header: "Order" },
  { key: "customer", header: "Customer" },
  { key: "placed", header: "Placed at (UTC)" },
  { key: "total", header: "Total (EUR)" },
  { key: "status", header: "Status" },
  { key: "note", header: "Internal note", hidden: true },
];

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
const day = new Intl.DateTimeFormat("en-IE", { dateStyle: "medium", timeZone: "UTC" });
const BADGE = { Paid: "outline", Pending: "secondary", Refunded: "muted" } as const;

/** The first lines of a file, as the person would see them in a text editor: the byte order mark is there, but not drawn. */
function firstLines(csv: string, lines = 5): string {
  return csv.replace(/^\uFEFF/, "").trimEnd().split("\r\n").slice(0, lines).join("\n");
}

function FilePreview({ title, text }: { title: string; text: string }): React.JSX.Element {
  return (
    <div className="border-t border-border bg-muted/40 px-4 py-3">
      <p className="text-xs text-muted-foreground">{title}</p>
      <pre
        tabIndex={0}
        role="region"
        aria-label={title}
        className="relative mt-2 overflow-x-auto rounded-md border border-border bg-background px-3 py-2 font-mono text-xs leading-5 text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
      >
        {text}
      </pre>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [last, setLast] = useState("Nothing exported yet.");

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-10">
      <Example caption="Download as CSV or copy for a spreadsheet: raw values, the hidden note column skipped">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border px-4 py-2">
            <p className="min-w-0 truncate text-sm text-muted-foreground tabular-nums">{ORDERS.length} orders in November</p>
            <TableExportMenu className="shrink-0" columns={COLUMNS} rows={ORDERS} filename="orders-november" onExported={({ format, count }) => setLast(`Last export: ${format}, ${count} rows.`)} />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Order</TableHead>
                <TableHead scope="col">Customer</TableHead>
                <TableHead scope="col" className="hidden sm:table-cell">
                  Placed
                </TableHead>
                <TableHead scope="col" className="text-right">
                  Total
                </TableHead>
                <TableHead scope="col" className="hidden md:table-cell">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ORDERS.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{order.id}</TableCell>
                  <TableCell className="font-medium">{order.customer}</TableCell>
                  <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">{day.format(new Date(order.placed))}</TableCell>
                  <TableCell className="text-right tabular-nums">{euro.format(order.total)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={BADGE[order.status]}>{order.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <FilePreview title="The first lines of orders-november.csv, in a text editor" text={firstLines(toCsv(COLUMNS, ORDERS))} />
          <p role="status" className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            {last}
          </p>
        </div>
      </Example>

      <Example caption="All three formats, semicolons for comma-decimal locales, rows built only on demand">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="flex min-h-12 items-center justify-between gap-3 px-4 py-2">
            <p className="min-w-0 truncate text-sm text-muted-foreground">Full export for the accountant</p>
            <TableExportMenu className="shrink-0" columns={COLUMNS} getRows={() => ORDERS} filename="orders-full" formats={["csv", "copy", "json"]} includeHidden delimiter=";" />
          </div>
          <FilePreview title="The same rows with semicolons and the note column" text={firstLines(toCsv(COLUMNS, ORDERS, { includeHidden: true, delimiter: ";" }), 4)} />
        </div>
      </Example>
    </div>
  );
}
