"use client";

import { useState } from "react";

import { FacetFilter, type FacetOption } from "@rhs-ui/dashboard/facet-filter";
import { FilterRow } from "@rhs-ui/dashboard/filter-row";
import { IconArchive, IconCheckCircle, IconClock, IconTruck } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";

interface Order {
  id: string;
  customer: string;
  channel: string;
  status: string;
  owner: string;
  total: number;
}

const ORDERS: readonly Order[] = [
  { id: "#4821", customer: "Studio Kestrel", channel: "wholesale", status: "shipped", owner: "mo", total: 1240 },
  { id: "#4820", customer: "Halcyon Bakery", channel: "web", status: "packing", owner: "priya", total: 386.5 },
  { id: "#4819", customer: "Lena Bakker", channel: "web", status: "paid", owner: "tom", total: 92 },
  { id: "#4818", customer: "Polder & Co", channel: "wholesale", status: "shipped", owner: "mo", total: 2115 },
  { id: "#4817", customer: "Northwind Cycles", channel: "marketplace", status: "paid", owner: "priya", total: 540.75 },
  { id: "#4816", customer: "Marit de Boer", channel: "web", status: "refunded", owner: "tom", total: 64 },
  { id: "#4815", customer: "Lumen Interiors", channel: "wholesale", status: "packing", owner: "mo", total: 3480 },
  { id: "#4814", customer: "Joost Hermans", channel: "marketplace", status: "shipped", owner: "priya", total: 129.9 },
  { id: "#4813", customer: "Fenna Visser", channel: "web", status: "paid", owner: "tom", total: 248 },
  { id: "#4812", customer: "Kestrel Foods", channel: "wholesale", status: "refunded", owner: "priya", total: 410 },
  { id: "#4811", customer: "Sanne Mulder", channel: "marketplace", status: "packing", owner: "mo", total: 77.5 },
  { id: "#4810", customer: "Oakline Studio", channel: "web", status: "shipped", owner: "tom", total: 890 },
];

const STATUS: Record<string, string> = { paid: "Paid", packing: "Packing", shipped: "Shipped", refunded: "Refunded" };
const CHANNEL: Record<string, string> = { web: "Web shop", marketplace: "Marketplace", wholesale: "Wholesale" };
const OWNER: Record<string, string> = { mo: "Mo Haddad", priya: "Priya Nair", tom: "Tom Jansen" };
const STATUS_ICON: Record<string, React.JSX.Element> = { paid: <IconCheckCircle />, packing: <IconClock />, shipped: <IconTruck />, refunded: <IconArchive /> };

interface Filters {
  query: string;
  status: string[];
  channel: string[];
  owner: string;
}

const NONE: Filters = { query: "", status: [], channel: [], owner: "anyone" };
const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" });

/** The orders that pass every filter except `skip`: what choosing an option of `skip` would leave. */
function pass(filters: Filters, skip?: "status" | "channel"): Order[] {
  const needle = filters.query.trim().toLowerCase();
  return ORDERS.filter(
    (order) =>
      (!needle || order.customer.toLowerCase().includes(needle) || order.id.includes(needle)) &&
      (skip === "status" || !filters.status.length || filters.status.includes(order.status)) &&
      (skip === "channel" || !filters.channel.length || filters.channel.includes(order.channel)) &&
      (filters.owner === "anyone" || order.owner === filters.owner),
  );
}

export default function Demo(): React.JSX.Element {
  const [filters, setFilters] = useState<Filters>({ ...NONE, status: ["paid", "packing", "shipped"], channel: ["web", "wholesale"] });
  const rows = pass(filters);
  const active = (filters.query.trim() ? 1 : 0) + (filters.status.length ? 1 : 0) + (filters.channel.length ? 1 : 0) + (filters.owner !== "anyone" ? 1 : 0);

  const options = (facet: "status" | "channel", labels: Record<string, string>): FacetOption[] =>
    Object.entries(labels).map(([value, label]) => ({
      value,
      label,
      icon: facet === "status" ? STATUS_ICON[value] : undefined,
      count: pass(filters, facet).filter((order) => order[facet] === value).length,
    }));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-5">
        <h2 className="text-xl font-medium tracking-[-0.02em]">Orders</h2>
        <p className="mt-1 text-sm text-muted-foreground">Narrow the list. On a phone the filters fold into one button.</p>
      </div>

      <FilterRow
        search={filters.query}
        onSearchChange={(query) => setFilters((current) => ({ ...current, query }))}
        labels={{ search: "Search orders", placeholder: "Search orders" }}
        activeCount={active}
        onReset={() => setFilters(NONE)}
      >
        <FacetFilter
          title="Status"
          options={options("status", STATUS)}
          value={filters.status}
          onValueChange={(status) => setFilters((current) => ({ ...current, status }))}
          searchable={false}
        />
        <FacetFilter
          title="Channel"
          options={options("channel", CHANNEL)}
          value={filters.channel}
          onValueChange={(channel) => setFilters((current) => ({ ...current, channel }))}
          searchable={false}
        />
        <Select value={filters.owner} onValueChange={(owner) => setFilters((current) => ({ ...current, owner }))}>
          <SelectTrigger aria-label="Owner" className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="anyone">Any owner</SelectItem>
            {Object.entries(OWNER).map(([value, name]) => (
              <SelectItem key={value} value={value}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterRow>

      <p role="status" className="mt-4 mb-2 text-sm text-muted-foreground tabular-nums">
        Showing {rows.length} of {ORDERS.length} orders
      </p>
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden sm:table-cell">Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden sm:table-cell">Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">{order.id}</TableCell>
                  <TableCell className="font-medium">{order.customer}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{CHANNEL[order.channel]}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{STATUS[order.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{money.format(order.total)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center whitespace-normal">
                  <p className="text-sm font-medium">No orders match these filters</p>
                  <Button type="button" variant="link" onClick={() => setFilters(NONE)}>
                    Reset filters
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
