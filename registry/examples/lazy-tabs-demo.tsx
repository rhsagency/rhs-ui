"use client";

import { useRef, useState, type ReactNode } from "react";

import { IconActivity, IconGauge, IconLayout, IconReceipt, IconUsers } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";
import { LazyTabs, type LazyTab } from "@rhs-ui/primitives/lazy-tabs";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { Switch } from "@rhs-ui/primitives/switch";
import { Textarea } from "@rhs-ui/primitives/textarea";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** A loader that answers with the content after a pause. */
const later = (ms: number, content: ReactNode) => async (): Promise<ReactNode> => {
  await wait(ms);
  return content;
};

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: number }): React.JSX.Element {
  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-8 shrink-0 rounded-full" delay={index * 120} />
          <div className="grid flex-1 gap-1.5">
            <Skeleton className="h-3.5 w-2/5" delay={index * 120} />
            <Skeleton className="h-3 w-3/5" delay={index * 120 + 60} />
          </div>
          <Skeleton className="h-3.5 w-12" delay={index * 120} />
        </div>
      ))}
    </div>
  );
}

function Overview(): React.JSX.Element {
  const facts: readonly (readonly [string, string])[] = [
    ["Plan", "Scale, billed yearly"],
    ["Seats", "148 of 150 in use"],
    ["Renews", "14 March 2027"],
    ["Owner", "Mara Okafor"],
  ];
  return (
    <dl className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
      {facts.map(([term, detail]) => (
        <div key={term} className="grid gap-0.5 bg-card px-4 py-3">
          <dt className="text-xs text-muted-foreground">{term}</dt>
          <dd className="text-sm font-medium">{detail}</dd>
        </div>
      ))}
    </dl>
  );
}

function Invoices(): React.JSX.Element {
  const invoices: readonly (readonly [string, string, string, boolean])[] = [
    ["INV-2041", "February 2027", "€12,480.00", true],
    ["INV-2012", "January 2027", "€12,480.00", false],
    ["INV-1987", "December 2026", "€11,960.00", false],
    ["INV-1951", "November 2026", "€11,960.00", false],
  ];
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {invoices.map(([id, month, amount, open]) => (
        <li key={id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="grid min-w-0 gap-0.5">
            <p className="truncate text-sm font-medium">{month}</p>
            <p className="font-mono text-xs text-muted-foreground">{id}</p>
          </div>
          <div className="grid shrink-0 justify-items-end gap-0.5">
            <p className="text-sm tabular-nums">{amount}</p>
            <Badge variant={open ? "outline" : "muted"}>{open ? "Open" : "Paid"}</Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Activity(): React.JSX.Element {
  const events: readonly (readonly [string, string])[] = [
    ["Priya Raman downloaded INV-2041", "2 hours ago"],
    ["Mara Okafor added 4 seats", "Yesterday"],
    ["Jonas Lindqvist changed the billing contact", "3 days ago"],
    ["Renewal reminder sent to finance@halcyon.studio", "Last week"],
  ];
  return (
    <ol className="grid gap-0 rounded-lg border border-border px-4 py-1">
      {events.map(([text, when]) => (
        <li key={text} className="flex items-baseline justify-between gap-4 border-b border-border py-3 last:border-b-0">
          <p className="min-w-0 text-sm">{text}</p>
          <p className="shrink-0 text-xs text-muted-foreground">{when}</p>
        </li>
      ))}
    </ol>
  );
}

function Members(): React.JSX.Element {
  const people: readonly (readonly [string, string])[] = [
    ["Mara Okafor", "Owner"],
    ["Jonas Lindqvist", "Admin"],
    ["Priya Raman", "Billing"],
    ["Tomasz Wrona", "Member"],
  ];
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {people.map(([name, role]) => (
        <li key={name} className="flex items-center gap-3 px-4 py-3">
          <Avatar size="sm">
            <AvatarFallback>{initialsOf(name)}</AvatarFallback>
          </Avatar>
          <p className="min-w-0 flex-1 truncate text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </li>
      ))}
    </ul>
  );
}

function Usage(): React.JSX.Element {
  const meters: readonly (readonly [string, string, number])[] = [
    ["API calls", "8.4M of 10M", 84],
    ["Storage", "212 GB of 500 GB", 42],
    ["Seats", "148 of 150", 99],
  ];
  return (
    <div className="grid gap-4 rounded-lg border border-border px-4 py-4">
      {meters.map(([name, amount, percent]) => (
        <div key={name} className="grid gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <p className="font-medium">{name}</p>
            <p className="text-xs text-muted-foreground tabular-nums">{amount}</p>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div className="h-full rounded-full bg-foreground" style={{ width: `${percent}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Customer(): React.JSX.Element {
  const [requests, setRequests] = useState(0);
  const [prefetch, setPrefetch] = useState(true);
  const [run, setRun] = useState(0);
  const tries = useRef(0);

  /** Pretends to ask a server: it answers after a while, and the Members request fails the first time. */
  const ask = (ms: number, content: ReactNode, fails = false) => async (): Promise<ReactNode> => {
    setRequests((count) => count + 1);
    await wait(ms);
    if (fails && tries.current++ === 0) throw new Error("The members service did not answer in time.");
    return content;
  };

  const tabs: readonly LazyTab[] = [
    { value: "overview", label: "Overview", icon: <IconLayout />, load: <Overview /> },
    { value: "billing", label: "Billing", icon: <IconReceipt />, load: ask(1100, <Invoices />), skeleton: <Rows rows={4} /> },
    { value: "activity", label: "Activity", icon: <IconActivity />, load: ask(1500, <Activity />) },
    { value: "members", label: "Members", icon: <IconUsers />, load: ask(900, <Members />, true), skeleton: <Rows rows={4} /> },
    { value: "usage", label: "Usage", icon: <IconGauge />, load: ask(1300, <Usage />) },
  ];

  return (
    <div className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="grid min-w-0 gap-0.5">
          <h2 className="truncate text-base font-semibold tracking-[-0.02em]">Halcyon Studio</h2>
          <p className="text-sm text-muted-foreground">Customer since 2023</p>
        </div>
        <Badge variant="outline">Scale plan</Badge>
      </div>
      <LazyTabs key={run} label="Customer" tabs={tabs} defaultValue="billing" prefetchOnHover={prefetch} panelClassName="min-h-[15rem]" />
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border pt-4">
        <div className="flex items-center gap-2.5">
          <Switch id="lazy-prefetch" checked={prefetch} onCheckedChange={setPrefetch} />
          <Label htmlFor="lazy-prefetch" className="font-normal text-muted-foreground">
            Prefetch on hover
          </Label>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground tabular-nums">Requests so far: {requests}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              tries.current = 0;
              setRequests(0);
              setRun((count) => count + 1);
            }}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}

function Draft(): React.JSX.Element {
  return (
    <div className="grid gap-2">
      <Label htmlFor="lazy-note" className="text-xs font-normal text-muted-foreground">
        Note for the account team
      </Label>
      <Textarea id="lazy-note" rows={4} placeholder="Write something, switch tab, and come back" />
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const failing: readonly LazyTab[] = [
    {
      value: "billing",
      label: "Billing",
      load: async () => {
        await wait(150);
        throw new Error("The billing service returned an error (503).");
      },
    },
    { value: "plan", label: "Plan", load: <p className="text-sm text-muted-foreground">Scale plan, billed yearly.</p> },
  ];
  const kept: readonly LazyTab[] = [
    { value: "note", label: "Note", load: later(300, <Draft />) },
    { value: "history", label: "History", load: later(300, <Activity />) },
  ];
  return (
    <div className="grid w-full max-w-3xl gap-12">
      <Example caption="Billing is loading as the page opens. Hover another tab to prefetch it, press Members to see a failure and Retry.">
        <Customer />
      </Example>
      <div className="grid gap-12 md:grid-cols-2 md:gap-x-10">
        <Example caption="A panel that failed says so, and only that panel.">
          <LazyTabs label="Account" tabs={failing} panelClassName="min-h-[11rem]" />
        </Example>
        <Example caption="Pill tabs that keep what they loaded mounted, so a draft survives a visit elsewhere.">
          <LazyTabs label="Account notes" variant="pill" keepMounted tabs={kept} defaultValue="note" panelClassName="min-h-[11rem]" />
        </Example>
      </div>
    </div>
  );
}
