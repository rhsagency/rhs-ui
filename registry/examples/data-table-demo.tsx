"use client";

import { useState } from "react";

import { DataTable, type DataTableColumn } from "@rhs-ui/application/data-table";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";

interface Invoice {
  id: string;
  customer: string;
  status: "paid" | "due" | "overdue";
  amount: number;
  issued: string;
}

const CUSTOMERS = ["Northwind", "Harbour & Co", "Fieldwork", "Oak Lane", "Mirror Labs", "Studio North", "Atelier Moreau"];
const INVOICES: Invoice[] = Array.from({ length: 23 }, (_, index) => ({
  id: `INV-${2048 - index}`,
  customer: CUSTOMERS[index % CUSTOMERS.length]!,
  status: index % 7 === 3 ? "overdue" : index % 3 === 0 ? "due" : "paid",
  amount: 480 + ((index * 1373) % 5200),
  issued: `2026-09-${String(28 - (index % 27)).padStart(2, "0")}`,
}));
const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
const TONE = { paid: "success", due: "muted", overdue: "destructive" } as const;

const COLUMNS: DataTableColumn<Invoice>[] = [
  { id: "id", header: "Invoice", cell: (row) => <span className="font-mono text-xs">{row.id}</span>, sortValue: (row) => row.id },
  { id: "customer", header: "Customer", cell: (row) => row.customer, sortValue: (row) => row.customer },
  { id: "status", header: "Status", cell: (row) => <Badge variant={TONE[row.status]} className="capitalize">{row.status}</Badge>, sortValue: (row) => row.status },
  { id: "issued", header: "Issued", cell: (row) => row.issued, sortValue: (row) => row.issued, hideOnMobile: true },
  { id: "amount", header: "Amount", cell: (row) => euro.format(row.amount), sortValue: (row) => row.amount, align: "right" },
];

export default function Demo(): React.JSX.Element {
  const [done, setDone] = useState("");
  return (
    <div className="grid w-full gap-2">
      <DataTable
        rows={INVOICES}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        caption="Invoices"
        searchText={(row) => `${row.id} ${row.customer}`}
        selectable
        pageSize={6}
        actions={(ids) => (
          <Button size="sm" variant="outline" onClick={() => setDone(`${ids.length} reminders sent. Not really: this is a preview.`)}>
            Send reminder
          </Button>
        )}
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {done}
      </p>
    </div>
  );
}
