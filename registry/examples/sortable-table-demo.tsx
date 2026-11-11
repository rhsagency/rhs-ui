"use client";

import { useState, type ReactNode } from "react";

import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { SortableTable, type SortableColumn, type SortState } from "@rhs-ui/primitives/sortable-table";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  // Starts on a column that a phone shows too, so the line above the table always names a header that can be seen and pressed.
  const [sort, setSort] = useState<SortState | null>({ key: "amount", direction: "descending" });
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-10 p-2 sm:p-6">
      <Example caption="Controlled: you hold the sort. Press a header to go ascending, descending, then off. Empty amounts stay at the bottom either way, and equal amounts keep their order">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border px-4 py-2">
            <p className="text-sm text-muted-foreground tabular-nums" aria-hidden="true">
              {sort ? (
                <>
                  Sorted by <span className="font-medium text-foreground">{COLUMNS.find((column) => column.key === sort.key)?.header}</span>, {sort.direction}
                </>
              ) : (
                "In the order they arrived"
              )}
            </p>
            <Button type="button" variant="ghost" size="sm" disabled={sort === null} onClick={() => setSort(null)}>
              Clear sort
            </Button>
          </div>
          <SortableTable
            columns={COLUMNS}
            rows={INVOICES}
            sort={sort}
            onSortChange={setSort}
            locale="en-IE"
            caption={<span className="block px-4 pb-3">Invoices for September and October. The customer column sorts by the alphabet of the locale, so Émile comes before Halcyon.</span>}
          />
        </div>
      </Example>

      <Example caption="Uncontrolled, with a starting sort: tickets closed, most first">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <SortableTable columns={TEAM_COLUMNS} rows={TEAM} defaultSort={{ key: "closed", direction: "descending" }} caption={<span className="block px-4 pb-3">The support team this year.</span>} />
        </div>
      </Example>
    </div>
  );
}

type Invoice = { id: string; customer: string; issued: string; due: string | null; amount: number | null; status: "Paid" | "Open" | "Overdue" | "Draft" };

const INVOICES: readonly Invoice[] = [
  { id: "INV-1001", customer: "Kestrel Analytics", issued: "2026-10-02", due: "2026-11-01", amount: 18420, status: "Paid" },
  { id: "INV-998", customer: "Émile Roche Studio", issued: "2026-09-28", due: "2026-10-28", amount: 640, status: "Paid" },
  { id: "INV-1004", customer: "Zoë van Dijk", issued: "2026-10-09", due: null, amount: null, status: "Draft" },
  { id: "INV-1002", customer: "Northwind Traders", issued: "2026-10-04", due: "2026-11-03", amount: 7250, status: "Open" },
  { id: "INV-1010", customer: "Halcyon Labs", issued: "2026-10-21", due: "2026-11-20", amount: 2980, status: "Open" },
  { id: "INV-990", customer: "Aiko Tanaka Design", issued: "2026-09-12", due: "2026-10-12", amount: 1175, status: "Overdue" },
  { id: "INV-1007", customer: "Oak Lane Bakery", issued: "2026-10-15", due: null, amount: null, status: "Draft" },
  { id: "INV-1003", customer: "Mirror Labs", issued: "2026-10-04", due: "2026-11-03", amount: 7250, status: "Paid" },
];

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

const TONE = { Paid: "outline", Open: "secondary", Overdue: "destructive", Draft: "muted" } as const;

const COLUMNS: readonly SortableColumn<Invoice>[] = [
  // The mono style is in the cell, not in `className`, which would set the header in mono as well.
  { key: "id", header: "Invoice", className: "hidden whitespace-nowrap sm:table-cell", cell: (row) => <span className="font-mono text-xs">{row.id}</span> },
  { key: "customer", header: "Customer", className: "font-medium" },
  { key: "issued", header: "Issued", sortType: "date", className: "hidden whitespace-nowrap text-muted-foreground sm:table-cell" },
  { key: "due", header: "Due", sortType: "date", className: "hidden whitespace-nowrap text-muted-foreground lg:table-cell" },
  {
    key: "amount",
    header: "Amount",
    sortType: "number",
    align: "right",
    cell: (row) => (row.amount === null ? <span className="text-muted-foreground">Not set</span> : euro.format(row.amount)),
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => (
      <Badge variant={TONE[row.status]} className={row.status === "Overdue" ? "text-[color-mix(in_oklch,var(--destructive),var(--foreground)_25%)]" : undefined}>
        {row.status}
      </Badge>
    ),
  },
];

type Member = { name: string; role: string; joined: string; closed: number };

const TEAM: readonly Member[] = [
  { name: "Mara Okafor", role: "Support lead", joined: "2023-03-14", closed: 412 },
  { name: "Jonas Weber", role: "Engineer", joined: "2024-01-08", closed: 96 },
  { name: "Aiko Tanaka", role: "Designer", joined: "2022-09-19", closed: 58 },
  { name: "Lucas Moreau", role: "Support", joined: "2025-06-02", closed: 1204 },
  { name: "Priya Nair", role: "Support", joined: "2025-02-17", closed: 387 },
];

const TEAM_COLUMNS: readonly SortableColumn<Member>[] = [
  { key: "name", header: "Name", className: "font-medium" },
  { key: "role", header: "Role", className: "hidden text-muted-foreground sm:table-cell" },
  { key: "joined", header: "Joined", sortType: "date", className: "whitespace-nowrap text-muted-foreground" },
  { key: "closed", header: "Tickets closed", sortType: "number", align: "right" },
];
