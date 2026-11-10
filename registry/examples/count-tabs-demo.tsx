"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { CountTabs, type CountTab } from "@rhs-ui/primitives/count-tabs";
import { TabsContent } from "@rhs-ui/primitives/tabs";

interface PullRequest {
  id: number;
  title: string;
  by: string;
  when: string;
}

const PULLS: Record<string, readonly PullRequest[]> = {
  open: [
    { id: 1842, title: "Fix timezone drift in the billing export", by: "Mara Okafor", when: "opened 2 hours ago" },
    { id: 1839, title: "Add retry with backoff to the webhook sender", by: "Jonas Lindqvist", when: "opened yesterday" },
    { id: 1836, title: "Replace the invoice PDF renderer", by: "Priya Raman", when: "opened 3 days ago" },
  ],
  draft: [],
  merged: [
    { id: 1831, title: "Cache plan limits per workspace", by: "Tomasz Wrona", when: "merged 4 days ago" },
    { id: 1827, title: "Move audit log writes off the request path", by: "Mara Okafor", when: "merged last week" },
    { id: 1822, title: "Show seat usage on the billing page", by: "Lena Hartmann", when: "merged last week" },
  ],
  closed: [
    { id: 1814, title: "Experiment: edge-rendered dashboards", by: "Jonas Lindqvist", when: "closed 2 weeks ago" },
    { id: 1809, title: "Drop support for Node 18", by: "Priya Raman", when: "closed 3 weeks ago" },
  ],
};

const PULL_TABS: readonly CountTab[] = [
  { value: "open", label: "Open", count: 12 },
  { value: "draft", label: "Draft", count: 0 },
  { value: "merged", label: "Merged", count: 48 },
  { value: "closed", label: "Closed", count: 7 },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid min-w-0 grid-cols-1 gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

function Pulls(): React.JSX.Element {
  const [tab, setTab] = useState("open");
  return (
    <CountTabs label="Pull requests" tabs={PULL_TABS} value={tab} onValueChange={setTab}>
      {PULL_TABS.map((item) => (
        <TabsContent key={item.value} value={item.value} className="min-h-[11.5rem]">
          {PULLS[item.value]?.length ? (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {PULLS[item.value]?.map((pull) => (
                <li key={pull.id} className="grid gap-0.5 px-4 py-3">
                  <p className="text-sm font-medium tracking-[-0.01em]">{pull.title}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    #{pull.id} {pull.when} by {pull.by}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="grid min-h-[11.5rem] place-items-center rounded-lg border border-dashed border-border px-4 text-center text-sm text-muted-foreground">No draft pull requests. Start one from a branch.</p>
          )}
        </TabsContent>
      ))}
    </CountTabs>
  );
}

function Orders(): React.JSX.Element {
  const [tab, setTab] = useState("shipped");
  return (
    <div className="grid gap-3">
      <CountTabs
        label="Orders"
        variant="pill"
        value={tab}
        onValueChange={setTab}
        tabs={[
          { value: "unfulfilled", label: "Unfulfilled", count: 8 },
          { value: "shipped", label: "Shipped", count: 142 },
          { value: "returns", label: "Returns", count: 3 },
        ]}
      />
      <p className="text-xs text-muted-foreground">142 shipped orders show as 99+ and are still read as "Shipped, more than 99 items".</p>
    </div>
  );
}

function Tickets(): React.JSX.Element {
  // The first count is still on its way when the page opens, so the skeleton is there to see.
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState(4);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const first = setTimeout(() => setLoading(false), 1400);
    return () => {
      clearTimeout(first);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  const refresh = () => {
    setLoading(true);
    timer.current = setTimeout(() => {
      setMine((count) => count + 1);
      setLoading(false);
    }, 1100);
  };
  return (
    <div className="grid gap-3">
      <CountTabs
        label="Support tickets"
        defaultValue="mine"
        tabs={[
          { value: "mine", label: "Mine", count: mine, loading },
          { value: "unassigned", label: "Unassigned", count: 17, loading },
          { value: "solved", label: "Solved", count: 214, loading },
        ]}
      />
      <div className="flex items-center gap-3">
        <Button type="button" size="sm" variant="outline" onClick={refresh} disabled={loading}>
          Refresh counts
        </Button>
        <p className="text-xs text-muted-foreground">{loading ? "Counting tickets..." : `The count of the tab you are on is announced when it changes: now ${mine}.`}</p>
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="w-full">
      <div className="mx-auto grid w-full max-w-xl gap-12">
        <Example caption="Line tabs on pull requests. Draft has nothing in it, so it dims, and it is still reachable.">
          <Pulls />
        </Example>
        <Example caption="Pill tabs for order status.">
          <Orders />
        </Example>
        <Example caption="Counts that load, then update.">
          <Tickets />
        </Example>
      </div>
    </div>
  );
}
