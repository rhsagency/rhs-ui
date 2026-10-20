"use client";

import { useState } from "react";

import { TransactionList, type Transaction } from "@rhs-ui/dashboard/transaction-list";

const NOW = "2026-10-20T12:00:00Z";

const TRANSACTIONS: readonly Transaction[] = [
  { id: "t-01", counterparty: "Northwind Payroll", category: "Salary", date: "2026-10-20T07:00:00Z", amount: 3250 },
  { id: "t-02", counterparty: "Albert's Corner Bakery", category: "Groceries", date: "2026-10-20T07:42:00Z", amount: -8.4 },
  { id: "t-03", counterparty: "Kestrel Cloud Hosting Europe B.V. annual plan, invoice 2026-10-0042", category: "Software", date: "2026-10-20T06:15:00Z", amount: -129, pending: true },
  { id: "t-04", counterparty: "Halcyon Transit", category: "Travel", date: "2026-10-19T15:18:00Z", amount: -24.5 },
  { id: "t-05", counterparty: "Maya Okafor", category: "Dinner split", date: "2026-10-19T12:05:00Z", amount: 45 },
  { id: "t-06", counterparty: "Fresh Market Utrecht", category: "Groceries", date: "2026-10-19T09:30:00Z", amount: -63.18 },
  { id: "t-07", counterparty: "Canal Street Studios", category: "Rent", date: "2026-10-18T08:00:00Z", amount: -1150 },
  { id: "t-08", counterparty: "Oak Lane Bakery", category: "Refund", date: "2026-10-18T10:21:00Z", amount: 14.95 },
  { id: "t-09", counterparty: "Vondel Physio", category: "Health", date: "2026-10-16T13:40:00Z", amount: -55 },
];

const MONTHS: readonly Transaction[] = [
  { id: "m-01", counterparty: "Northwind Payroll", category: "Salary", date: "2026-10-01T07:00:00Z", amount: 3250 },
  { id: "m-02", counterparty: "Canal Street Studios", category: "Rent", date: "2026-10-01T08:00:00Z", amount: -1150 },
  { id: "m-03", counterparty: "Northwind Payroll", category: "Salary", date: "2026-09-01T07:00:00Z", amount: 3250 },
  { id: "m-04", counterparty: "Canal Street Studios", category: "Rent", date: "2026-09-01T08:00:00Z", amount: -1150 },
];

export default function Demo(): React.JSX.Element {
  const [selected, setSelected] = useState<Transaction | null>(null);

  return (
    <div className="grid w-full max-w-4xl gap-10">
      <div className="grid items-start gap-8 md:grid-cols-2">
        <section className="grid gap-3">
          <p className="text-xs text-muted-foreground">Grouped by day. The headings stay in view while the list scrolls.</p>
          <TransactionList transactions={TRANSACTIONS} currency="EUR" locale="en-IE" timeZone="Europe/Amsterdam" now={NOW} maxHeight="30rem" onSelect={setSelected} />
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {selected ? `Selected ${selected.counterparty.slice(0, 40)}${selected.counterparty.length > 40 ? "..." : ""}.` : "Press a row to select it."}
          </p>
        </section>

        <section className="grid gap-3">
          <p className="text-xs text-muted-foreground">Grouped by month</p>
          <TransactionList transactions={MONTHS} groupBy="month" currency="EUR" locale="en-IE" timeZone="Europe/Amsterdam" now={NOW} />
        </section>
      </div>

      <div className="grid items-start gap-8 md:grid-cols-2">
        <section className="grid gap-3">
          <p className="text-xs text-muted-foreground">Loading</p>
          <TransactionList transactions={[]} loading />
        </section>
        <section className="grid gap-3">
          <p className="text-xs text-muted-foreground">Nothing yet</p>
          <TransactionList transactions={[]} />
        </section>
      </div>
    </div>
  );
}
