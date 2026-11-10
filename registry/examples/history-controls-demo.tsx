"use client";

import { useRef, useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { HistoryControls, type HistoryEntry } from "@rhs-ui/primitives/history-controls";
import { Kbd } from "@rhs-ui/primitives/kbd";

const SUMMARY: Readonly<Record<string, string>> = {
  Dashboard: "Revenue, open invoices and what needs attention today.",
  Customers: "412 customers across 9 countries, newest activity first.",
  "Northwind BV": "A customer since 2022 on the Studio plan, billed yearly, based in Utrecht.",
  Invoices: "38 open invoices worth €84,210, six of them overdue.",
  "Invoice 1042": "€4,820.00 for the Northwind BV annual plan, due on 14 March.",
  Payments: "Today 14 payments came in and 2 failed and were retried.",
  Reports: "Saved reports and the schedules they are sent on.",
  Team: "Eleven people, two pending invitations.",
  Settings: "Workspace name, billing contact and single sign-on.",
  "Audit log": "Every change in the workspace, who made it and when.",
};

const FIRST: readonly HistoryEntry[] = ["Dashboard", "Customers", "Northwind BV", "Invoices", "Invoice 1042", "Payments"].map((label) => ({ id: label, label }));

const TRAIL: readonly HistoryEntry[] = ["Home", "Docs", "Guides", "Webhooks", "Retries", "Signatures", "Testing", "API", "Events", "Limits", "Changelog", "Status", "Pricing", "Support"].map((label) => ({ id: label, label }));

const OPENABLE = ["Reports", "Team", "Settings", "Audit log"];

function noop() {}

function Example({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Viewer(): React.JSX.Element {
  const [entries, setEntries] = useState<readonly HistoryEntry[]>(FIRST);
  const [index, setIndex] = useState(3);
  const serial = useRef(0);
  const here = entries[index] ?? FIRST[0];

  // Opening a new place drops everything that was ahead of this one, as a browser does.
  const open = (label: string) => {
    serial.current += 1;
    const next = [...entries.slice(0, index + 1), { id: `${label}-${serial.current}`, label }];
    setEntries(next);
    setIndex(next.length - 1);
  };

  return (
    <section aria-label="Admin viewer" className="w-full overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-3 py-2.5 sm:px-4">
        <HistoryControls entries={entries} index={index} onNavigate={setIndex} />
        <p className="min-w-0 flex-1 truncate text-sm font-medium tracking-[-0.01em]">{here?.label}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground max-sm:hidden">
          <Kbd>Alt</Kbd>
          <Kbd>←</Kbd>
          <Kbd>→</Kbd>
        </p>
      </header>
      <div className="grid min-h-48 gap-6 p-5 sm:p-6">
        <div className="grid content-start gap-1.5">
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-balance">{here?.label}</h2>
          <p className="max-w-prose text-sm text-muted-foreground">{SUMMARY[here?.label ?? ""] ?? "A page of the workspace."}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Open</span>
          {OPENABLE.map((label) => (
            <Button key={label} type="button" variant="outline" size="sm" onClick={() => open(label)}>
              {label}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}

function LongTrail(): React.JSX.Element {
  const [index, setIndex] = useState(8);
  return (
    <div className="grid w-full max-w-xs justify-items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
      <HistoryControls entries={TRAIL} index={index} onNavigate={setIndex} maxMenu={5} shortcuts={false} aria-label="Long history" />
      <p className="text-sm text-muted-foreground">
        On <span className="font-medium text-foreground">{TRAIL[index]?.label}</span>, place {index + 1} of {TRAIL.length}.
      </p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
      <div className="min-w-0 [grid-column:1/-1]">
        <Example caption="Open a page, then go back. Press the chevron (or hold the arrow, or right-click it) to see where it would go and jump straight there. Alt with the arrow keys works too.">
          <Viewer />
        </Example>
      </div>

      <Example caption="A long history lists the nearest places and says how many more there are.">
        <LongTrail />
      </Example>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="At the start of the history Back is dimmed, and its tooltip says why.">
          <HistoryControls entries={FIRST} index={0} onNavigate={noop} shortcuts={false} aria-label="History at the start" />
        </Example>
        <Example caption="Ghost and small, for a toolbar that has its own surface. Here it is at the end, so Forward is dimmed.">
          <div className="flex w-full max-w-xs items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 shadow-xs">
            <HistoryControls entries={FIRST} index={5} onNavigate={noop} shortcuts={false} variant="ghost" size="sm" aria-label="History at the end" />
            <span className="min-w-0 flex-1 truncate border-l border-border pl-3 text-sm font-medium tracking-[-0.01em]">Payments</span>
          </div>
        </Example>
      </div>
    </div>
  );
}
