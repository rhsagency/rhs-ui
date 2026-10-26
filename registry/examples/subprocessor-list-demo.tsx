"use client";

import { useId, useState } from "react";

import { SubprocessorList, type Subprocessor } from "@rhs-ui/marketing/subprocessor-list";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";

const VENDORS: readonly Subprocessor[] = [
  {
    name: "Meridian Cloud Services EU Ltd",
    purpose: "Hosts the application, its databases and the nightly backups.",
    data: "Account data, workspace content, uploaded files",
    location: "Ireland",
    safeguard: "Not applicable, processed in the EU",
    href: "#meridian",
  },
  {
    name: "Parcel Mail Ltd",
    purpose: "Delivers sign-in links, invoices and notifications by email.",
    data: "Name, email address, message content",
    location: ["Ireland", "United States"],
    safeguard: "Standard Contractual Clauses and the EU-US Data Privacy Framework",
    href: "#parcel",
  },
  {
    name: "Ledgerline Payments B.V.",
    purpose: "Takes card and direct debit payments and issues receipts.",
    data: "Billing name, billing address, payment method token",
    location: "Netherlands",
    safeguard: "Not applicable, processed in the EU",
    href: "#ledgerline",
  },
  {
    name: "Signalfire Analytics GmbH",
    purpose: "Measures which features are used, without cookies and without IP addresses.",
    data: "Pseudonymous usage events",
    location: "Germany",
    safeguard: "Not applicable, processed in the EU",
  },
  {
    name: "Oakline Support Inc.",
    purpose: "Runs the help desk where customers write to our support team.",
    data: "Name, email address, support conversations",
    location: "United States",
    safeguard: "Standard Contractual Clauses",
    href: "#oakline",
  },
  {
    name: "Quillstack Search AB",
    purpose: "Powers search across workspace content.",
    data: "Workspace content, search queries",
    location: "Sweden",
    safeguard: "Not applicable, processed in the EU",
    href: "#quillstack",
  },
];

function NotifyForm(): React.JSX.Element {
  const id = useId();
  const [done, setDone] = useState(false);
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
      <div className="max-w-md">
        <p className="text-sm font-medium">Hear about changes first</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">We email account owners 30 days before we add or replace a subprocessor, so you can object.</p>
      </div>
      {done ? (
        <p role="status" className="text-sm font-medium">
          Thanks. We will write to you before the next change.
        </p>
      ) : (
        <form
          className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            setDone(true);
          }}
        >
          <div className="grid flex-1 gap-2">
            <Label htmlFor={`${id}-email`} className="sr-only">
              Work email
            </Label>
            <Input id={`${id}-email`} type="email" required placeholder="you@company.com" autoComplete="email" />
          </div>
          <Button type="submit">Notify me</Button>
        </form>
      )}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <SubprocessorList
        title="Subprocessors"
        description="Northwind uses the companies below to run the service. Each one is bound by a data processing agreement that is at least as strict as ours."
        updated="2026-09-30"
        caption="Subprocessors used by Northwind, in alphabetical order"
        notice={<NotifyForm />}
        subprocessors={VENDORS}
      />

      <p className="mt-20 mb-6 text-xs text-muted-foreground">A company without subprocessors still publishes the page, and the page says so</p>
      <SubprocessorList
        headingLevel={3}
        title="Subprocessors"
        description="Halcyon runs everything on its own servers in Frankfurt."
        updated="2026-09-30"
        subprocessors={[]}
      />
    </div>
  );
}
