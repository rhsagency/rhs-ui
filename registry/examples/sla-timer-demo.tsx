"use client";

import { useState } from "react";

import { SlaTimer, type BusinessHours } from "@rhs-ui/application/sla-timer";
import { Button } from "@rhs-ui/primitives/button";

// A fixed "now" (Monday, 15:30 UTC) keeps every state the same on each load. In an app, leave `now` out and the timers read the browser's clock.
const NOW = Date.parse("2026-10-26T15:30:00Z");

const AMSTERDAM: BusinessHours = { start: "09:00", end: "17:30", timeZone: "Europe/Amsterdam" };

interface Ticket {
  key: string;
  title: string;
  customer: string;
  timer: React.ComponentProps<typeof SlaTimer>;
}

const TICKETS: readonly Ticket[] = [
  {
    key: "NW-2041",
    title: "Checkout fails for guest carts",
    customer: "Halcyon Freight",
    timer: { label: "First response in", startedAt: "2026-10-26T15:00:00Z", deadline: "2026-10-26T15:42:00Z" },
  },
  {
    key: "NW-2037",
    title: "Invoice PDF shows the wrong VAT number",
    customer: "Kestrel Labs",
    timer: { label: "Resolve within", startedAt: "2026-10-26T04:30:00Z", deadline: "2026-10-26T19:10:00Z", thresholds: { atRiskFraction: 0.3 } },
  },
  {
    key: "NW-2029",
    title: "Login loop after a password reset",
    customer: "Polder Foods",
    timer: { label: "First response in", startedAt: "2026-10-26T13:05:00Z", deadline: "2026-10-26T15:05:00Z" },
  },
  {
    key: "NW-2024",
    title: "CSV export drops accented letters",
    customer: "Lumen Studio",
    timer: { label: "Resolve within", startedAt: "2026-10-26T09:00:00Z", deadline: "2026-10-26T17:00:00Z", pausedAt: "2026-10-26T14:05:00Z" },
  },
  {
    key: "NW-2018",
    title: "Webhook retries arrive out of order",
    customer: "Northwind Labs",
    timer: { label: "Resolve within", startedAt: "2026-10-26T08:00:00Z", deadline: "2026-10-27T13:00:00Z", businessHours: AMSTERDAM },
  },
];

export default function Demo(): React.JSX.Element {
  const [skipped, setSkipped] = useState(0);

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-8">
      <section aria-labelledby="sla-timer-demo-title" className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3.5">
          <h2 id="sla-timer-demo-title" className="text-sm font-semibold tracking-[-0.01em]">
            Support queue
          </h2>
          <p className="text-xs text-muted-foreground">Monday 26 October, 3:30 PM UTC</p>
        </div>
        <ul className="divide-y divide-border">
          {TICKETS.map((ticket) => (
            <li key={ticket.key} className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-medium tracking-[-0.01em]">{ticket.title}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="tabular-nums">{ticket.key}</span> · {ticket.customer}
                </p>
              </div>
              <SlaTimer now={NOW} className="sm:w-72 sm:shrink-0" {...ticket.timer} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="sla-timer-clock-title" className="grid gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs">
        <div className="grid gap-1">
          <h2 id="sla-timer-clock-title" className="text-sm font-semibold tracking-[-0.01em]">
            Try the clock
          </h2>
          <p className="text-xs text-muted-foreground">Move time on and watch the state change. Only the change is announced, once, politely.</p>
        </div>
        <SlaTimer label="First response in" startedAt="2026-10-26T15:00:00Z" deadline="2026-10-26T15:42:00Z" now={NOW + skipped * 60_000} className="w-full max-w-xs" />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setSkipped((minutes) => minutes + 10)}>
            Skip 10 minutes
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSkipped(0)} disabled={skipped === 0}>
            Reset
          </Button>
        </div>
      </section>
    </div>
  );
}
