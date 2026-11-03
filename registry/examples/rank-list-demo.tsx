"use client";

import { useState, type ReactNode } from "react";

import { RankList, type RankItem } from "@rhs-ui/primitives/rank-list";

const PRIORITIES: readonly RankItem[] = [
  { id: "checkout", label: "Checkout redesign", description: "One page instead of four, for the 38% who leave at payment" },
  { id: "search", label: "Search relevance", description: "Typo tolerance and synonyms for the catalogue" },
  { id: "tracking", label: "Order tracking emails", description: "A status update at every step of delivery" },
  { id: "pricing", label: "Multi-currency pricing", description: "Show euros, pounds and dollars at checkout" },
  { id: "returns", label: "Returns portal", description: "Self-serve labels, without writing to support" },
];

const STEPS: readonly RankItem[] = [
  { id: "domain", label: "Connect your domain", description: "Point halcyon.shop at the store" },
  { id: "payments", label: "Set up payments" },
  { id: "shipping", label: "Add shipping rates" },
  { id: "launch", label: "Publish the store" },
];

const RELEASES: readonly RankItem[] = [
  { id: "r-41", label: "Northwind 4.1", description: "Saved views" },
  { id: "r-42", label: "Northwind 4.2", description: "Bulk edit" },
  { id: "r-43", label: "Northwind 4.3", description: "CSV import" },
  { id: "r-44", label: "Northwind 4.4", description: "Audit log" },
  { id: "r-45", label: "Northwind 4.5", description: "Webhooks" },
  { id: "r-46", label: "Northwind 4.6", description: "Roles and permissions" },
  { id: "r-47", label: "Northwind 4.7", description: "Single sign-on" },
  { id: "r-48", label: "Northwind 4.8", description: "Data residency" },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Reported({ value }: { value: readonly string[] }): React.JSX.Element {
  return (
    <p role="status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span>Reported</span>
      <code className="max-w-full font-mono text-[0.6875rem] break-words text-foreground">{JSON.stringify(value).replace(/,/g, ", ")}</code>
    </p>
  );
}

export default function Demo(): React.JSX.Element {
  const [priorities, setPriorities] = useState<string[]>(PRIORITIES.map((item) => item.id));
  const [steps, setSteps] = useState<string[]>(STEPS.map((item) => item.id));
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-10">
        <Example caption="Try it: drag a grip, or Tab to one, press Space, move it with the arrow keys, Space to drop and Escape to cancel.">
          <div className="grid gap-4">
            <h2 id="priorities-title" className="text-sm font-medium tracking-[-0.01em]">
              Rank what we build next quarter
            </h2>
            <RankList aria-labelledby="priorities-title" items={PRIORITIES} value={priorities} onValueChange={setPriorities} name="priorities" />
            <Reported value={priorities} />
          </div>
        </Example>
        <Example caption="With Move up and Move down buttons, for anyone who cannot drag.">
          <div className="grid gap-4">
            <h2 id="steps-title" className="text-sm font-medium tracking-[-0.01em]">
              Order the setup checklist
            </h2>
            <RankList aria-labelledby="steps-title" items={STEPS} value={steps} onValueChange={setSteps} moveButtons />
          </div>
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-10">
        <Example caption="Unnumbered, and tall enough to scroll: it scrolls itself while you drag near its edges.">
          <div className="grid gap-4">
            <h2 id="releases-title" className="text-sm font-medium tracking-[-0.01em]">
              Release train
            </h2>
            <RankList aria-labelledby="releases-title" items={RELEASES} numbered={false} maxHeight="19rem" className="rounded-xl border border-border bg-muted/40 p-2" />
          </div>
        </Example>
        <Example caption="Disabled.">
          <RankList aria-label="Locked order" items={STEPS.slice(0, 3)} disabled />
        </Example>
      </div>
    </div>
  );
}
