"use client";

import type { ReactNode } from "react";

import { IconBuilding, IconCheck, IconEye, IconGitPullRequest, IconInbox, IconLayers, IconPackage, IconRocket, IconRotateCcw, IconSprout, IconTrendUp, IconUsers } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { CardTabs, CardTabsContent, type CardTab } from "@rhs-ui/primitives/card-tabs";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid min-w-0 content-start gap-4">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: readonly (readonly [string, string, string])[] }): React.JSX.Element {
  return (
    <ul className="m-0 grid list-none divide-y divide-border rounded-xl border border-border bg-card p-0">
      {rows.map(([title, meta, when]) => (
        <li key={title} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="grid min-w-0 gap-0.5">
            <p className="truncate text-sm font-medium">{title}</p>
            <p className="truncate text-xs text-muted-foreground">{meta}</p>
          </div>
          <p className="shrink-0 text-xs text-muted-foreground tabular-nums">{when}</p>
        </li>
      ))}
    </ul>
  );
}

const QUEUE: readonly CardTab[] = [
  { value: "triage", title: "Triage", description: "New reports waiting for an owner", icon: <IconInbox />, count: 14 },
  { value: "review", title: "In review", description: "Changes waiting for a second pair of eyes", icon: <IconGitPullRequest />, count: 6 },
  { value: "shipped", title: "Shipped", description: "Released in the last 30 days", icon: <IconPackage />, count: 1204 },
];

const PLANS: readonly CardTab[] = [
  { value: "starter", title: "Starter", description: "For one person with a side project", icon: <IconSprout /> },
  { value: "team", title: "Team", description: "Shared workspaces and roles", icon: <IconUsers /> },
  { value: "scale", title: "Scale", description: "Audit log, SSO and priority support", icon: <IconTrendUp /> },
  { value: "enterprise", title: "Enterprise", description: "Contracts, a named engineer, your cloud", icon: <IconBuilding /> },
];

const TARGETS: readonly CardTab[] = [
  { value: "preview", title: "Preview", description: "A private link for review", icon: <IconEye /> },
  { value: "staging", title: "Staging", description: "The shared test environment", icon: <IconLayers /> },
  { value: "production", title: "Production", description: "Live for every customer", icon: <IconRocket /> },
  { value: "rollback", title: "Rollback", description: "Return to the last good release", icon: <IconRotateCcw /> },
];

function Plan({ name, price, note, items }: { name: string; price: string; note: string; items: readonly string[] }): React.JSX.Element {
  return (
    <div className="grid gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-base font-semibold tracking-[-0.02em]">{name}</h3>
        <p className="text-sm text-muted-foreground">
          <span className="text-2xl font-semibold tracking-[-0.03em] text-foreground tabular-nums">{price}</span> {note}
        </p>
      </div>
      <ul className="m-0 grid list-none gap-2 p-0">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-sm">
            <IconCheck aria-hidden="true" className="size-4 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Target({ name, meta, action, destructive = false }: { name: string; meta: readonly (readonly [string, string])[]; action: string; destructive?: boolean }): React.JSX.Element {
  return (
    <div className="grid gap-5 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold tracking-[-0.02em]">{name}</h3>
        <Badge variant="outline">Healthy</Badge>
      </div>
      <dl className="m-0 grid gap-3 text-sm">
        {meta.map(([term, detail]) => (
          <div key={term} className="flex items-baseline justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
            <dt className="text-muted-foreground">{term}</dt>
            <dd className="m-0 text-right font-medium tabular-nums">{detail}</dd>
          </div>
        ))}
      </dl>
      <Button type="button" variant={destructive ? "destructive" : "default"} className="w-full sm:w-fit">
        {action}
      </Button>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-14">
      <Example caption="A horizontal grid with counts. The selected card has a second line in its border and an inverted tile, so it reads without colour. On a phone the cards stack in the same order.">
        <CardTabs label="Work queue" tabs={QUEUE} defaultValue="review">
          <CardTabsContent value="triage">
            <Rows
              rows={[
                ["Checkout fails on Safari 17.4", "Reported by Priya Raman", "12 min ago"],
                ["Wrong VAT on German invoices", "Reported by Jonas Lindqvist", "1 h ago"],
                ["Export hangs above 50,000 rows", "Reported by Tomasz Wrona", "3 h ago"],
              ]}
            />
          </CardTabsContent>
          <CardTabsContent value="review">
            <Rows
              rows={[
                ["Rewrite the invoice PDF renderer", "#2231 · Mara Okafor", "Waiting 2 days"],
                ["Add the sessions table to the audit log", "#2238 · Daan Verhoeven", "Waiting 1 day"],
                ["Cache the plan lookup per request", "#2244 · Lena Hartmann", "Waiting 5 h"],
              ]}
            />
          </CardTabsContent>
          <CardTabsContent value="shipped">
            <Rows
              rows={[
                ["Dark mode for every screen", "Release 4.2", "Tue"],
                ["Exports in a third of the time", "Release 4.2", "Tue"],
                ["Search across notes", "Release 4.1", "12 Feb"],
              ]}
            />
          </CardTabsContent>
        </CardTabs>
      </Example>
      <Example caption="Two columns, four cards. Up and Down move by a row as well as Left and Right by a card, and the panel below is linked to the selected card.">
        <CardTabs label="Plan" tabs={PLANS} columns={2} defaultValue="team">
          <CardTabsContent value="starter">
            <Plan name="Starter" price="€0" note="for one person" items={["3 projects", "1,000 events a month", "Community support"]} />
          </CardTabsContent>
          <CardTabsContent value="team">
            <Plan name="Team" price="€24" note="per seat, monthly" items={["Unlimited projects", "Roles and shared workspaces", "Email support in one day"]} />
          </CardTabsContent>
          <CardTabsContent value="scale">
            <Plan name="Scale" price="€79" note="per seat, monthly" items={["Audit log and SSO", "99.95% uptime commitment", "Priority support, four hours"]} />
          </CardTabsContent>
          <CardTabsContent value="enterprise">
            <Plan name="Enterprise" price="Talk to us" note="custom contract" items={["Runs in your cloud account", "A named engineer", "Security review and DPA"]} />
          </CardTabsContent>
        </CardTabs>
      </Example>
      <Example caption="orientation=vertical: the cards become a list beside the panel, and above it on a phone.">
        <CardTabs label="Deploy to" tabs={TARGETS} orientation="vertical" defaultValue="production">
          <CardTabsContent value="preview">
            <Target name="Preview" meta={[["Link", "pr-2244.kestrel.dev"], ["Expires", "In 7 days"], ["Last build", "4 min ago"]]} action="Create preview" />
          </CardTabsContent>
          <CardTabsContent value="staging">
            <Target name="Staging" meta={[["Address", "staging.kestrel.dev"], ["Version", "4.2.1-rc.2"], ["Last deploy", "Yesterday, 17:40"]]} action="Deploy to staging" />
          </CardTabsContent>
          <CardTabsContent value="production">
            <Target name="Production" meta={[["Address", "app.kestrel.dev"], ["Version", "4.2.0"], ["Approvals needed", "2 of 2 given"], ["Last deploy", "2 hours ago"]]} action="Deploy 4.2.1" />
          </CardTabsContent>
          <CardTabsContent value="rollback">
            <Target name="Rollback" meta={[["Return to", "4.1.9"], ["Released", "12 March"], ["Data changes", "None to undo"]]} action="Roll back to 4.1.9" destructive />
          </CardTabsContent>
        </CardTabs>
      </Example>
    </div>
  );
}
