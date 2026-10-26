"use client";

import { useCallback } from "react";

import { TopNavShell } from "@rhs-ui/application/top-nav-shell";
import { IconDownload, IconHome, IconPlus, IconReceipt, IconUserPlus, IconUsers, IconChartBar } from "@rhs-ui/icons";
import { Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { SearchTrigger } from "@rhs-ui/primitives/search-trigger";
import { StatusBadge } from "@rhs-ui/primitives/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";

const EURO = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

const INVOICES = [
  { id: "INV-2048", customer: "Halcyon Studio", issued: "24 Oct", due: "7 Nov", amount: 12400, status: "pending" },
  { id: "INV-2047", customer: "Kestrel Labs", issued: "22 Oct", due: "5 Nov", amount: 3860.5, status: "pending" },
  { id: "INV-2046", customer: "Larkspur Foods", issued: "18 Oct", due: "1 Nov", amount: 7215, status: "paid" },
  { id: "INV-2045", customer: "Northwind Outfitters", issued: "15 Oct", due: "29 Oct", amount: 21980, status: "paid" },
  { id: "INV-2044", customer: "Brightwater Clinic", issued: "9 Oct", due: "23 Oct", amount: 4150, status: "overdue" },
  { id: "INV-2043", customer: "Halcyon Studio", issued: "2 Oct", due: "16 Oct", amount: 9800, status: "paid" },
  { id: "INV-2042", customer: "Marlow & Finch", issued: "30 Sep", due: "14 Oct", amount: 2010, status: "overdue" },
  { id: "INV-2041", customer: "Kestrel Labs", issued: "26 Sep", due: "10 Oct", amount: 5630, status: "paid" },
  { id: "INV-2040", customer: "Orchard & Pine", issued: "21 Sep", due: "5 Oct", amount: 1290, status: "paid" },
  { id: "INV-2039", customer: "Larkspur Foods", issued: "19 Sep", due: "3 Oct", amount: 6075, status: "paid" },
  { id: "INV-2038", customer: "New customer", issued: "Not sent", due: "Not set", amount: 1800, status: "draft" },
];

const FIGURES = [
  { label: "Outstanding", value: EURO.format(16260.5), note: "2 invoices open" },
  { label: "Overdue", value: EURO.format(6160), note: "2 invoices, oldest 14 days" },
  { label: "Paid in October", value: EURO.format(55085), note: "5 invoices" },
];

export default function Demo(): React.JSX.Element {
  const openSearch = useCallback(() => undefined, []);
  return (
    <TopNavShell
      mainId="topnav-main"
      className="min-h-[calc(100dvh-3rem)]"
      brand={
        <span className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-lg bg-foreground text-background">
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5" fill="currentColor">
              <path d="M3 3h3v10H3zM10 3h3v10h-3z" />
            </svg>
          </span>
          Ledgerly
        </span>
      }
      links={[
        { label: "Overview", href: "/overview", icon: <IconHome /> },
        { label: "Invoices", href: "/invoices", icon: <IconReceipt />, badge: "2" },
        { label: "Customers", href: "/customers", icon: <IconUsers /> },
        { label: "Reports", href: "/reports", icon: <IconChartBar /> },
      ]}
      currentHref="/invoices"
      search={<SearchTrigger onOpen={openSearch} placeholder="Search invoices…" className="w-52 lg:w-60" />}
      actions={
        <Button variant="outline" size="sm">
          <IconUserPlus />
          Invite teammates
        </Button>
      }
      account={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="Account menu" className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=open]:ring-[3px] data-[state=open]:ring-ring/40">
              <Avatar size="sm">
                <AvatarFallback>MO</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>mara@halcyon.studio</DropdownMenuLabel>
            <DropdownMenuItem>Account settings</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
      pageHeader={{
        titleAs: "h2",
        title: "Invoices",
        description: "Everything you billed this year, with what is still open.",
        actions: (
          <>
            <Button variant="outline">
              <IconDownload />
              Export
            </Button>
            <Button>
              <IconPlus />
              New invoice
            </Button>
          </>
        ),
      }}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <p>Ledgerly B.V. · Amsterdam</p>
          <p className="flex gap-5">
            <a href="#terms" className="hover:text-foreground">
              Terms
            </a>
            <a href="#privacy" className="hover:text-foreground">
              Privacy
            </a>
            <a href="#status" className="hover:text-foreground">
              Status
            </a>
          </p>
        </div>
      }
    >
      <dl className="grid divide-y divide-border overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {FIGURES.map((figure) => (
          <div key={figure.label} className="px-5 py-4">
            <dt className="text-xs text-muted-foreground">{figure.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tracking-[-0.03em] tabular-nums">{figure.value}</dd>
            <dd className="mt-0.5 text-xs text-muted-foreground">{figure.note}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5 max-sm:hidden">Invoice</TableHead>
              <TableHead className="max-sm:pl-5">Customer</TableHead>
              <TableHead className="max-md:hidden">Issued</TableHead>
              <TableHead className="max-md:hidden">Due</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="pr-5">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {INVOICES.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="pl-5 font-medium whitespace-nowrap max-sm:hidden">{invoice.id}</TableCell>
                <TableCell className="max-sm:pl-5">
                  {invoice.customer}
                  <span className="block text-xs text-muted-foreground sm:hidden">{invoice.id}</span>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground max-md:hidden">{invoice.issued}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground max-md:hidden">{invoice.due}</TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">{EURO.format(invoice.amount)}</TableCell>
                <TableCell className="pr-5">
                  <StatusBadge status={invoice.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TopNavShell>
  );
}
