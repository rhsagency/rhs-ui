"use client";

import { useState } from "react";

import { Badge } from "@rhs-ui/primitives/badge";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow, type TableSort } from "@rhs-ui/primitives/table";

const INVOICES = [
  { id: "INV-2041", client: "Studio North", due: "2026-10-02", amount: 1840, status: "Paid" },
  { id: "INV-2042", client: "Harbour & Co", due: "2026-10-09", amount: 620, status: "Open" },
  { id: "INV-2043", client: "Fieldwork", due: "2026-09-21", amount: 2375, status: "Overdue" },
  { id: "INV-2044", client: "Oak Lane Bakery", due: "2026-10-16", amount: 310, status: "Open" },
  { id: "INV-2045", client: "Mirror Labs", due: "2026-09-30", amount: 4200, status: "Paid" },
] as const;

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
const TONE = { Paid: "success", Open: "outline", Overdue: "destructive" } as const;

export default function Demo(): React.JSX.Element {
  const [sort, setSort] = useState<TableSort>("none");
  const rows = sort === "none" ? INVOICES : [...INVOICES].sort((a, b) => (sort === "ascending" ? a.amount - b.amount : b.amount - a.amount));
  const next: Record<TableSort, TableSort> = { none: "descending", descending: "ascending", ascending: "none" };

  return (
    <div className="w-full max-w-2xl rounded-xl border border-border">
      <Table>
        <TableCaption className="pb-4">Invoices for September and October. Sort by amount with the column header.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Status</TableHead>
            <TableHead sort={sort} onSort={() => setSort(next[sort])} className="text-right">
              Amount
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-mono text-xs">{invoice.id}</TableCell>
              <TableCell className="font-medium">{invoice.client}</TableCell>
              <TableCell className="text-muted-foreground tabular-nums">{invoice.due}</TableCell>
              <TableCell>
                <Badge variant={TONE[invoice.status]}>{invoice.status}</Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">{euro.format(invoice.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4}>Total</TableCell>
            <TableCell className="text-right tabular-nums">{euro.format(INVOICES.reduce((sum, invoice) => sum + invoice.amount, 0))}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
