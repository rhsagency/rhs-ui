"use client";

import { useState } from "react";

import { FeatureGate } from "@rhs-ui/application/feature-gate";
import { IconDownload } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";

const LOG = [
  { time: "12:41", who: "Mara Okafor", what: "Changed the role of Priya Nair to Viewer", where: "Workspace" },
  { time: "11:58", who: "Leo Martins", what: "Deleted the project Larkspur brand", where: "Projects" },
  { time: "11:20", who: "Sofia Rossi", what: "Exported 1,284 orders to CSV", where: "Orders" },
  { time: "10:47", who: "Priya Nair", what: "Rotated the API key for the Kestrel integration", where: "Developers" },
  { time: "10:05", who: "Mara Okafor", what: "Added a webhook for order.paid", where: "Developers" },
  { time: "09:41", who: "Dan Cho", what: "Invited Jonas Weber as a Member", where: "Workspace" },
  { time: "09:12", who: "Tomas Brandt", what: "Signed in from a new device in Utrecht", where: "Security" },
  { time: "08:55", who: "Leo Martins", what: "Turned on two-factor sign-in for everyone", where: "Security" },
  { time: "08:30", who: "Sofia Rossi", what: "Changed the billing email address", where: "Billing" },
  { time: "08:02", who: "Hana Sato", what: "Created the project Larkspur brand", where: "Projects" },
];

/** A labelled text field, as the real SSO screen would have. */
function Field({ id, label, defaultValue }: { id: string; label: string; defaultValue: string }): React.JSX.Element {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} defaultValue={defaultValue} />
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [scale, setScale] = useState(false);

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-3xl gap-8">
        <div className="grid gap-2">
          <FeatureGate
            locked={!scale}
            plan="Scale"
            title="See every change, and who made it"
            description="The audit log keeps twelve months of changes across every project, and exports to CSV for your auditors."
            action={{ label: "Upgrade to Scale", onClick: () => setScale(true) }}
          >
            <section aria-labelledby="gate-demo-log" className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5">
                <div>
                  <h2 id="gate-demo-log" className="text-sm font-semibold tracking-[-0.01em]">
                    Audit log
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">Today, 26 October</p>
                </div>
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <Input aria-label="Filter the log" placeholder="Filter by person" className="h-8 min-w-0 flex-1 text-[0.8125rem] sm:w-40 sm:flex-none" />
                  <Button variant="outline" size="sm">
                    <IconDownload />
                    Export
                  </Button>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Time</TableHead>
                    <TableHead>Person</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead className="hidden sm:table-cell">Area</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {LOG.map((entry) => (
                    <TableRow key={`${entry.time}-${entry.who}`}>
                      <TableCell className="text-muted-foreground tabular-nums">{entry.time}</TableCell>
                      <TableCell className="font-medium sm:whitespace-nowrap">{entry.who}</TableCell>
                      <TableCell className="min-w-28 sm:min-w-48">{entry.what}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">{entry.where}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          </FeatureGate>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">The log stays in view, muted. Nothing in it can be reached while it is locked.</p>
            {scale ? (
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setScale(false)}>
                Back to the Free plan
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-2">
          <FeatureGate
            plan="Enterprise"
            title="Sign in with your identity provider"
            description="Let people use the account they already have, and switch off access the moment they leave."
            // A preview has nowhere to go: a router would navigate here.
            action={{ label: "Compare plans", href: "/pricing", onClick: (event) => event.preventDefault() }}
          >
            <section aria-labelledby="gate-demo-sso" className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 id="gate-demo-sso" className="text-sm font-semibold tracking-[-0.01em]">
                    Single sign-on
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">SAML 2.0 with Okta, Entra ID or any provider.</p>
                </div>
                <Switch aria-label="Require single sign-on" />
              </div>
              <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2">
                <Field id="gate-demo-domain" label="Company domain" defaultValue="northwind.studio" />
                <Field id="gate-demo-provider" label="Identity provider" defaultValue="Okta" />
                <Field id="gate-demo-url" label="Sign-on URL" defaultValue="https://login.northwind.studio/saml" />
                <Field id="gate-demo-entity" label="Entity ID" defaultValue="https://northwind.studio/sso/metadata" />
                <Field id="gate-demo-cert" label="Certificate fingerprint" defaultValue="3F:2A:9C:71:D4:08:BE:55" />
                <Field id="gate-demo-role" label="Default role" defaultValue="Member" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">People sign in with their own account from the next session.</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm">
                    Test connection
                  </Button>
                  <Button size="sm">Save changes</Button>
                </div>
              </div>
            </section>
          </FeatureGate>
          <p className="text-xs text-muted-foreground">The action can be a link: here it goes to the pricing page. In a narrow gate the bar becomes a stacked card, as on a phone.</p>
        </div>
      </div>
    </div>
  );
}
