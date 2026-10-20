"use client";

import { useState } from "react";

import { IconCheck, IconRefresh } from "@rhs-ui/icons";
import { Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { StaggerList } from "@rhs-ui/motion/stagger-list";

const ACTIVITY = [
  { name: "Mara Okafor", initials: "MO", action: "merged", target: "Fix duplicate invoices", time: "2 min ago" },
  { name: "Joris de Wit", initials: "JW", action: "opened", target: "Add courier tracking links", time: "14 min ago" },
  { name: "Priya Nair", initials: "PN", action: "commented on", target: "Refund flow for part orders", time: "41 min ago" },
  { name: "Tomás Silva", initials: "TS", action: "closed", target: "Stock count mismatch", time: "1 h ago" },
  { name: "Lena Fischer", initials: "LF", action: "reviewed", target: "Warehouse label printing", time: "3 h ago" },
] as const;

const CHECKLIST = ["Connect your store", "Import 1,284 products", "Set shipping rules", "Invite your team", "Send a test order"] as const;

export default function Demo(): React.JSX.Element {
  const [run, setRun] = useState(0);
  return (
    <div className="w-full max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium">One after another</h2>
          <p className="mt-1 text-xs text-muted-foreground">Items arrive in turn once the list is on screen. The delay is capped, so a long list never makes anyone wait.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setRun((n) => n + 1)}>
          <IconRefresh />
          Replay
        </Button>
      </div>

      <div key={run} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section aria-labelledby="stagger-activity" className="min-w-0 rounded-xl border border-border bg-card shadow-xs">
          <h3 id="stagger-activity" className="px-5 pt-4 pb-3 text-sm font-medium">
            Recent activity
          </h3>
          <StaggerList step={60} duration={450} className="divide-y divide-border border-t border-border">
            {ACTIVITY.map((item) => (
              <li key={item.target} className="flex items-center gap-3 px-5 py-3">
                <Avatar size="sm">
                  <AvatarFallback>{item.initials}</AvatarFallback>
                </Avatar>
                <p className="min-w-0 flex-1 text-sm leading-snug sm:truncate">
                  <span className="font-medium">{item.name}</span> <span className="text-muted-foreground">{item.action}</span> {item.target}
                </p>
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{item.time}</span>
              </li>
            ))}
          </StaggerList>
        </section>

        <section aria-labelledby="stagger-checklist" className="min-w-0 rounded-xl border border-border bg-card shadow-xs">
          <h3 id="stagger-checklist" className="px-5 pt-4 pb-3 text-sm font-medium">
            Set up Northwind
          </h3>
          <StaggerList as="ol" direction="left" step={80} duration={450} className="border-t border-border p-3">
            {CHECKLIST.map((step, index) => (
              <li key={step} className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm">
                <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border text-xs text-muted-foreground tabular-nums" aria-hidden="true">
                  {index < 2 ? <IconCheck className="size-3.5 text-foreground" /> : index + 1}
                </span>
                <span className={index < 2 ? "text-muted-foreground line-through decoration-border" : undefined}>
                  {index < 2 ? <span className="sr-only">Done: </span> : null}
                  {step}
                </span>
              </li>
            ))}
          </StaggerList>
        </section>
      </div>
    </div>
  );
}
