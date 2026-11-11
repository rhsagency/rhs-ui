"use client";

import { useState, type ReactNode } from "react";

import { RecentItemsPanel, RecentItemsPopover, type RecentItem } from "@rhs-ui/application/recent-items-popover";
import { Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";

// A fixed "now" and zone keep the headings the same on every load. In an app, leave `now` out and the panel reads the browser's clock.
const NOW = Date.parse("2026-11-10T14:30:00Z");
const ZONE = "Europe/Amsterdam";
const ago = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();
const HOUR = 60;
const DAY = 24 * 60;

const START: readonly RecentItem[] = [
  { id: "brand", title: "Northwind brand guidelines", kind: "document", href: "/docs/brand-guidelines", openedAt: ago(6 * DAY + 3 * HOUR), pinned: true },
  { id: "launch", title: "Q4 launch plan", kind: "project", href: "/projects/q4-launch", openedAt: ago(2 * DAY), pinned: true },
  { id: "inv", title: "Invoice INV-2041 for Halcyon Labs", kind: "record", href: "/billing/inv-2041", openedAt: ago(12) },
  { id: "checkout", title: "Checkout redesign", kind: "board", href: "/boards/checkout-redesign", openedAt: ago(2 * HOUR + 10) },
  { id: "notes", title: "Kestrel onboarding call notes and next steps for the pilot in January", kind: "document", href: "/docs/kestrel-notes", openedAt: ago(5 * HOUR) },
  { id: "pricing", title: "Pricing experiments", kind: "sheet", href: "/sheets/pricing", openedAt: ago(19 * HOUR) },
  { id: "assets", title: "Launch assets", kind: "folder", href: "/files/launch-assets", openedAt: ago(22 * HOUR) },
  { id: "report", title: "Annual report 2025", kind: "document", href: "/docs/annual-report", openedAt: ago(4 * DAY) },
  { id: "interviews", title: "Customer interviews", kind: "folder", href: "/files/interviews", openedAt: ago(9 * DAY) },
  { id: "mark", title: "Brand mark v3", kind: "image", href: "/files/brand-mark-v3", openedAt: ago(12 * DAY) },
];

export default function Demo(): React.JSX.Element {
  const [items, setItems] = useState(START);
  const [note, setNote] = useState("Nothing opened yet.");

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-start">
        <Case caption="A Recent button in a header, open. Arrow keys move between rows, Enter opens one, and P pins the row you are on (the pin button does the same for a pointer). Clear history asks nothing: the rows go and Undo waits for a few seconds. The days are read in Europe/Amsterdam against a fixed now.">
          <div className="relative h-[38rem] overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
            <div className="flex h-14 items-center justify-between gap-3 border-b border-border px-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-sm font-semibold tracking-[-0.02em]">Northwind</span>
                <RecentItemsPopover
                  defaultOpen
                  items={items}
                  now={NOW}
                  timeZone={ZONE}
                  onOpen={(item, event) => {
                    // The demo stays on its page; an app would let the link go, or route to it.
                    event.preventDefault();
                    setNote(`Opened “${item.title.length > 36 ? `${item.title.slice(0, 36)}…` : item.title}”.`);
                  }}
                  onPin={(item, pinned) => setItems((list) => list.map((entry) => (entry.id === item.id ? { ...entry, pinned } : entry)))}
                  onClear={(cleared) => {
                    const gone = new Set(cleared.map((item) => item.id));
                    setItems((list) => list.filter((entry) => !gone.has(entry.id)));
                  }}
                />
              </div>
              <Avatar size="sm">
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </div>
            <div aria-hidden="true" className="grid gap-4 p-5">
              <div className="h-5 w-44 rounded-md bg-muted" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-20 rounded-lg border border-border bg-background" />
                <div className="h-20 rounded-lg border border-border bg-background" />
                <div className="h-20 rounded-lg border border-border bg-background" />
              </div>
              <div className="h-3 w-full rounded bg-muted/70" />
              <div className="h-3 w-4/5 rounded bg-muted/70" />
              <div className="h-3 w-3/5 rounded bg-muted/70" />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" className="text-xs text-muted-foreground">
              {note}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setItems(START);
                setNote("Nothing opened yet.");
              }}
            >
              Reset
            </Button>
          </div>
        </Case>

        <Case caption="With nothing opened yet: the panel says that recent items appear after opening something.">
          <Surface>
            <RecentItemsPanel items={[]} now={NOW} timeZone={ZONE} onPin={() => undefined} onClear={() => undefined} />
          </Surface>
        </Case>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The popover a panel sits in, drawn flat so the panel is seen in its place. */
function Surface({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="w-full overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-sm">{children}</div>;
}
