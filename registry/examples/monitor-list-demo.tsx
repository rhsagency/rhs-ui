"use client";

import { useState } from "react";

import { MonitorList, type Monitor } from "@rhs-ui/dashboard/monitor-list";
import { Button } from "@rhs-ui/primitives/button";

const NOW = "2026-10-20T10:30:00Z";

const INITIAL: readonly Monitor[] = [
  { id: "storefront", name: "Storefront", host: "shop.northwind.example", state: "up", responseMs: 184, since: "2026-10-08T10:30:00Z" },
  { id: "checkout", name: "Checkout API", host: "api.northwind.example/checkout", state: "degraded", responseMs: 1840, since: "2026-10-20T08:25:00Z" },
  { id: "webhooks", name: "Payments webhook", host: "hooks.northwind.example", state: "down", responseMs: null, since: "2026-10-20T10:16:00Z" },
  { id: "admin", name: "Admin dashboard", host: "admin.northwind.example", state: "up", responseMs: 96, since: "2026-09-09T06:00:00Z" },
  { id: "search", name: "Search index", host: "search.northwind.example", state: "up", responseMs: 212, since: "2026-10-17T10:30:00Z" },
  { id: "staging", name: "Staging", host: "staging.northwind.example", state: "paused", responseMs: null, since: "2026-10-17T09:00:00Z" },
  { id: "status", name: "Status page", host: "status.northwind.example", state: "up", responseMs: 71, since: "2026-07-25T10:30:00Z" },
];

export default function Demo(): React.JSX.Element {
  const [monitors, setMonitors] = useState<readonly Monitor[]>(INITIAL);
  const [message, setMessage] = useState("Open a row menu to pause or resume a monitor.");

  const outage = monitors.find((monitor) => monitor.id === "search")?.state === "down";

  return (
    <div className="grid w-full max-w-3xl gap-10">
      <section className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Down first. While you are in the list, rows stay where they are.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setMonitors((current) =>
                current.map((monitor) =>
                  monitor.id === "search"
                    ? outage
                      ? { ...monitor, state: "up", responseMs: 208, since: NOW }
                      : { ...monitor, state: "down", responseMs: null, since: NOW }
                    : monitor,
                ),
              )
            }
          >
            {outage ? "Bring search back" : "Simulate an outage"}
          </Button>
        </div>
        <MonitorList
          monitors={monitors}
          now={NOW}
          onSelect={(monitor) => setMessage(`Opened ${monitor.name}.`)}
          onPause={(monitor, paused) => {
            setMonitors((current) => current.map((entry) => (entry.id === monitor.id ? { ...entry, state: paused ? "paused" : "up", responseMs: paused ? null : 190, since: NOW } : entry)));
            setMessage(`${monitor.name} ${paused ? "paused" : "resumed"}.`);
          }}
        />
        <p aria-live="polite" className="text-xs text-muted-foreground">
          {message}
        </p>
      </section>

      <section className="grid items-start gap-8 md:grid-cols-2">
        <div className="grid gap-3">
          <p className="text-xs text-muted-foreground">Loading</p>
          <MonitorList monitors={[]} loading />
        </div>
        <div className="grid gap-3">
          <p className="text-xs text-muted-foreground">Nothing monitored yet</p>
          <MonitorList monitors={[]} />
        </div>
      </section>
    </div>
  );
}
