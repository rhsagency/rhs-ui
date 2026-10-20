"use client";

import { useState } from "react";

import { RecentOrdersCard, type RecentOrder } from "@rhs-ui/dashboard/recent-orders-card";

const NOW = "2026-10-20T10:30:00Z";

const ORDERS: readonly RecentOrder[] = [
  { id: "o-10482", number: "#10482", customer: { name: "Maya Okafor", email: "maya.okafor@example.com" }, placedAt: "2026-10-20T10:26:00Z", total: 182.4, status: "paid", href: "#order-10482" },
  { id: "o-10481", number: "#10481", customer: { name: "Jonas Bergström", email: "jonas@bergstrom.example" }, placedAt: "2026-10-20T10:09:00Z", total: 64, status: "pending", href: "#order-10481" },
  { id: "o-10480", number: "#10480", customer: { name: "Ines Moreau", email: "ines.moreau@example.com" }, placedAt: "2026-10-20T09:20:00Z", total: 319.9, status: "shipped", href: "#order-10480" },
  { id: "o-10479", number: "#10479", customer: { name: "Tomás Ibarra", email: "tomas.ibarra@example.com" }, placedAt: "2026-10-20T08:02:00Z", total: 48.5, status: "paid", href: "#order-10479" },
  { id: "o-10478", number: "#10478", customer: { name: "Priya Raman", email: "priya@ramanstudio.example" }, placedAt: "2026-10-19T16:48:00Z", total: 1240, status: "shipped", href: "#order-10478" },
  { id: "o-10477", number: "#10477", customer: { name: "Hannah Lindqvist", email: "hannah.lindqvist@example.com" }, placedAt: "2026-10-19T11:15:00Z", total: 89, status: "failed", href: "#order-10477" },
  { id: "o-10476", number: "#10476", customer: { name: "Daan de Wit", email: "daan@dewit.example" }, placedAt: "2026-10-17T19:30:00Z", total: 27.95, status: "refunded", href: "#order-10476" },
  { id: "o-10475", number: "#10475", customer: { name: "Olu Adeyemi", email: "olu.adeyemi@example.com" }, placedAt: "2026-10-16T13:04:00Z", total: 156.2, status: "cancelled", href: "#order-10475" },
];

export default function Demo(): React.JSX.Element {
  const [opened, setOpened] = useState<string | null>(null);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-10 sm:px-6">
      <section className="grid gap-3">
        <RecentOrdersCard
          orders={ORDERS}
          description="Across the web shop and the market stall"
          viewAllHref="#orders"
          currency="EUR"
          locale="en-IE"
          now={NOW}
          onOpen={(order, event) => {
            event.preventDefault();
            setOpened(`${order.number} for ${order.customer.name}`);
          }}
        />
        <p aria-live="polite" className="text-xs text-muted-foreground">
          {opened ? `Opened ${opened}.` : "Press an order number: onOpen runs, and you can route it yourself."}
        </p>
      </section>

      <section className="grid items-start gap-6 md:grid-cols-2">
        <div className="grid gap-3">
          <p className="text-xs text-muted-foreground">Loading keeps the height, so nothing jumps when the orders arrive</p>
          <RecentOrdersCard orders={[]} loading viewAllHref="#orders" currency="EUR" locale="en-IE" now={NOW} />
        </div>
        <div className="grid gap-3">
          <p className="text-xs text-muted-foreground">A new shop explains what to expect</p>
          <RecentOrdersCard orders={[]} viewAllHref="#orders" currency="EUR" locale="en-IE" now={NOW} />
        </div>
      </section>
    </div>
  );
}
