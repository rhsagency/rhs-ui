"use client";

import { useRef, useState, type ReactNode } from "react";

import { NoticeStack, type NoticeTone, type StackNotice } from "@rhs-ui/application/notice-stack";
import { Button } from "@rhs-ui/primitives/button";

const BILLING: StackNotice = {
  id: "card-expiring",
  tone: "warning",
  title: "Your card expires at the end of November",
  body: "Update it now so the December invoice goes through.",
  action: (
    <Button size="sm" variant="outline">
      Update card
    </Button>
  ),
};

const MAINTENANCE: StackNotice = {
  id: "maintenance",
  tone: "info",
  title: "Scheduled maintenance on Saturday",
  body: "Halcyon is read-only from 02:00 to 04:00 UTC while we upgrade the database.",
  dismissible: true,
};

const TRIAL: StackNotice = {
  id: "trial",
  tone: "info",
  title: "Your trial ends in 3 days",
  body: "Choose a plan before Friday to keep your projects and your team.",
  action: (
    <Button size="sm" variant="outline">
      Choose a plan
    </Button>
  ),
  dismissible: true,
};

// What the buttons add. Each press takes the next one, so every notice has its own id and its own words.
const MORE: Record<NoticeTone, readonly Omit<StackNotice, "id" | "tone">[]> = {
  error: [
    {
      title: "Your last payment failed",
      body: "We could not charge the Visa ending 4242. Update the card to keep your plan.",
      action: (
        <Button size="sm" variant="outline">
          Update card
        </Button>
      ),
    },
    { title: "Sync with the warehouse stopped", body: "The connection was refused at 09:14. Orders are queued and nothing is lost." },
  ],
  warning: [
    { title: "You have used 90% of your storage", body: "Delete old exports or upgrade before uploads stop at 100%.", dismissible: true },
    { title: "Two teammates have not accepted their invites", body: "The invites to Priya and Tom expire in 2 days.", dismissible: true },
  ],
  info: [
    { title: "The annual report is ready", body: "Your 2025 summary can be downloaded from Reports.", dismissible: true },
    { title: "Dark mode is here", body: "Switch themes from the menu under your avatar.", dismissible: true },
  ],
};

function Window({ title, children }: { title: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-xs">
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <span className="text-sm font-semibold tracking-[-0.03em]">Halcyon</span>
        <span className="text-xs text-muted-foreground">{title}</span>
      </div>
      <div className="grid gap-4 p-4">
        {children}
        <div aria-hidden="true" className="grid gap-2.5 pt-1">
          <div className="h-3 w-1/3 rounded-full bg-muted" />
          <div className="h-2.5 w-4/5 rounded-full bg-muted/70" />
          <div className="h-2.5 w-3/5 rounded-full bg-muted/70" />
        </div>
      </div>
    </div>
  );
}

/** A caption and what it captions. Under a container wide enough for two columns the captions share their rows, so the windows start level. */
function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3 @3xl:row-span-2 @3xl:grid-rows-subgrid">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [notices, setNotices] = useState<StackNotice[]>([MAINTENANCE, TRIAL, BILLING]);
  const [wide, setWide] = useState<StackNotice[]>([MAINTENANCE, TRIAL, BILLING, { ...MORE.error[0]!, id: "payment-failed", tone: "error" }]);
  const counts = useRef<Record<NoticeTone, number>>({ error: 0, warning: 0, info: 0 });

  function add(tone: NoticeTone) {
    const pool = MORE[tone];
    const index = counts.current[tone];
    counts.current[tone] += 1;
    const base = pool[index % pool.length]!;
    setNotices((current) => [...current, { ...base, id: `${tone}-${index}`, tone }]);
  }

  return (
    <div className="@container w-full">
      <div className="mx-auto grid max-w-5xl gap-x-8 gap-y-10 @3xl:grid-cols-2">
        <Case caption="The most urgent notice in full, the others folded behind it. Close one and the next comes forward. Add one: a screen reader hears it, an error as an alert.">
          <Window title="Billing">
            <NoticeStack notices={notices} onDismiss={(id) => setNotices((current) => current.filter((notice) => notice.id !== id))} label="Billing notices" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Add</span>
              <Button size="sm" variant="outline" onClick={() => add("error")}>
                An error
              </Button>
              <Button size="sm" variant="outline" onClick={() => add("warning")}>
                A warning
              </Button>
              <Button size="sm" variant="outline" onClick={() => add("info")}>
                Information
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setNotices([MAINTENANCE, TRIAL, BILLING])}>
                Reset
              </Button>
            </div>
          </Window>
        </Case>

        <Case caption="max is 2: two in full, one folded. The error is on top whatever the order of the list, and it has no close button because it has to be dealt with.">
          <Window title="Account">
            <NoticeStack notices={wide} max={2} onDismiss={(id) => setWide((current) => current.filter((notice) => notice.id !== id))} label="Account notices" />
          </Window>
        </Case>
      </div>
    </div>
  );
}
