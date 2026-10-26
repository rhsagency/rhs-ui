"use client";

import { useState, type ReactNode } from "react";

import { ActivityEntry, type ActivityChange } from "@rhs-ui/application/activity-entry";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconArchive, IconCheck, IconEdit, IconFileCheck, IconMessage, IconPlus, IconRocket, IconUserPlus } from "@rhs-ui/icons";

// A fixed "now" keeps "12 minutes ago" the same on every load. In an app, leave `now` out and the entries read the browser's clock.
const NOW = Date.parse("2026-10-26T14:30:00Z");
const ago = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();

interface Entry {
  id: string;
  actor: { name: string; system?: boolean };
  verb: string;
  object: { label: string; href: string };
  change?: ActivityChange;
  time: string;
  icon?: ReactNode;
}

const ENTRIES: readonly Entry[] = [
  { id: "e1", actor: { name: "Anna Lindqvist" }, verb: "moved", object: { label: "Checkout redesign", href: "#checkout" }, change: { from: "In review", to: "Done" }, time: ago(12), icon: <IconCheck /> },
  { id: "e2", actor: { name: "Leo Martins" }, verb: "commented on", object: { label: "Redirect map for 212 legacy URLs", href: "#redirect-map" }, time: ago(48), icon: <IconMessage /> },
  { id: "e3", actor: { name: "Deploy bot", system: true }, verb: "deployed", object: { label: "Northwind web", href: "#2041" }, change: { from: "v2.14.0", to: "v2.15.0" }, time: ago(2 * 60), icon: <IconRocket /> },
  { id: "e4", actor: { name: "Mara Okafor" }, verb: "changed the due date of", object: { label: "Pricing page copy review", href: "#pricing-copy" }, change: { from: "24 Oct", to: "31 Oct" }, time: ago(26 * 60), icon: <IconEdit /> },
  { id: "e5", actor: { name: "Sofia Rossi" }, verb: "reassigned", object: { label: "Replace placeholder photography", href: "#photography" }, change: { from: "Leo Martins", to: "Priya Nair" }, time: ago(3 * 24 * 60), icon: <IconUserPlus /> },
  { id: "e6", actor: { name: "Import job", system: true }, verb: "finished importing", object: { label: "orders-october.csv", href: "#orders-october" }, change: { to: "1,284 orders" }, time: ago(5 * 24 * 60), icon: <IconFileCheck /> },
  { id: "e7", actor: { name: "Tomas Brandt" }, verb: "created", object: { label: "Accessibility notes for the checkout", href: "#checkout-a11y" }, time: ago(6 * 24 * 60), icon: <IconPlus /> },
  {
    id: "e8",
    actor: { name: "Dan Cho" },
    verb: "archived",
    object: { label: "Q4 launch checklist for the Northwind relaunch with the Kestrel and Halcyon teams", href: "#q4-launch" },
    time: ago(9 * 24 * 60),
    icon: <IconArchive />,
  },
];

type Filter = "all" | "people" | "system";

export default function Demo(): React.JSX.Element {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = ENTRIES.filter((entry) => filter === "all" || (filter === "system") === Boolean(entry.actor.system));

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold tracking-[-0.01em]">Activity</h2>
            <p aria-live="polite" className="mt-0.5 text-xs text-muted-foreground tabular-nums">
              {shown.length} {shown.length === 1 ? "entry" : "entries"}
            </p>
          </div>
          <SegmentedControl
            label="Show"
            value={filter}
            onValueChange={(value) => setFilter(value === "people" || value === "system" ? value : "all")}
            options={[
              { value: "all", label: "All" },
              { value: "people", label: "People" },
              { value: "system", label: "System" },
            ]}
          />
        </div>
        <ul aria-label="Activity" className="divide-y divide-border">
          {shown.map((entry) => (
            <ActivityEntry
              key={entry.id}
              actor={entry.actor}
              verb={entry.verb}
              object={{
                label: entry.object.label,
                href: entry.object.href,
              }}
              change={entry.change}
              time={entry.time}
              icon={entry.icon}
              now={NOW}
              locale="en-GB"
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
