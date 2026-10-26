"use client";

import { useState, type ReactNode } from "react";

import { BulkPasteField } from "@rhs-ui/primitives/bulk-paste-field";
import { Button } from "@rhs-ui/primitives/button";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const isEmail = (line: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(line) || "Not a valid email address";
const lower = (line: string) => line.trim().toLowerCase();

const TEAM = [
  "ines@orbit.example",
  "marit@halcyon.example",
  "jan.vries@kestrel.example",
  "ines@orbit.example",
  "zoe@northwind.example",
  "dana@northwind",
  "tomas@halcyon.example",
  "Priya@Orbit.example",
  "priya@orbit.example",
  "kestrel-support",
  "lena@northwind.example",
  "marit@halcyon.example",
  "omar@kestrel.example",
  "sven@orbit.example",
  "ava@halcyon.example",
].join("\n");

const SKUS = ["HAL-1042", "HAL-1043", "hal-1042", "KES-2210", "KES-22", "NOR-0007", "NOR-0007", "ORB-9120"].join("\n");

const PAGES = [
  "https://northwind.example/pricing",
  "https://northwind.example/features",
  "https://northwind.example/changelog",
  "https://northwind.example/docs",
  "https://northwind.example/contact",
  "https://northwind.example/careers",
  "https://northwind.example/security",
  "https://northwind.example/status",
].join("\n");

function InviteTeam(): React.JSX.Element {
  const [people, setPeople] = useState<string[]>([]);
  const [sent, setSent] = useState<number | null>(null);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (people.length) setSent(people.length);
      }}
      className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs"
    >
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Invite your team to Northwind</h2>
        <p className="text-xs text-muted-foreground">Paste a column from a spreadsheet, or a list with commas.</p>
      </div>
      <BulkPasteField
        label="Email addresses"
        name="invitees"
        defaultValue={TEAM}
        validate={isEmail}
        normalise={lower}
        onItemsChange={(items) => {
          setPeople(items);
          setSent(null);
        }}
      />
      <Button type="submit" disabled={people.length === 0}>
        {people.length ? `Invite ${people.length} people` : "Add some addresses"}
      </Button>
      <div className="grid border-t border-border pt-4 text-xs text-muted-foreground">
        <p role="status">{sent !== null ? `Invited ${sent} people` : null}</p>
        {sent !== null ? null : (
          <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span>onItemsChange</span>
            <code className="font-mono text-[0.6875rem] text-foreground">{people.length} clean addresses</code>
          </p>
        )}
      </div>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: paste a comma list or a spreadsheet column. Remove duplicates and Remove invalid tidy it in one click, and Undo brings it back">
          <InviteTeam />
        </Example>
        <Example caption="Any kind of item: your own check, your own reasons, and a click on a line jumps to it">
          <BulkPasteField
            label="SKUs to restock"
            rows={6}
            defaultValue={SKUS}
            normalise={(line) => line.trim().toUpperCase()}
            validate={(line) => /^[A-Z]{3}-\d{4}$/.test(line) || "Use the format ABC-1234"}
          />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="max counts what is valid, and the lines past it can be dropped in one click">
          <BulkPasteField label="Pages to submit" rows={6} max={5} defaultValue={PAGES} validate={(line) => /^https:\/\/\S+\.\S+$/.test(line) || "Use a full https:// address"} />
        </Example>
        <Example caption="Empty: the placeholder shows the shape, and the summary says what to do">
          <BulkPasteField label="Discount codes" rows={4} placeholder={"SPRING-24\nWELCOME-10\nFRIENDS-15"} />
        </Example>
        <Example caption="Disabled">
          <BulkPasteField label="Email addresses" rows={4} disabled defaultValue={"ines@orbit.example\nmarit@halcyon.example"} validate={isEmail} />
        </Example>
      </div>
    </div>
  );
}
