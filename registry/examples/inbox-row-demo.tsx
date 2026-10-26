"use client";

import { useRef, useState } from "react";

import { InboxRow, type InboxMessage } from "@rhs-ui/application/inbox-row";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconArchive, IconMailOpen } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";

// A fixed "now" keeps "14:12" and "Sun" the same on every load. In an app, leave `now` out and the rows read the browser's clock.
const NOW = Date.parse("2026-10-26T14:30:00Z");

const START: readonly InboxMessage[] = [
  {
    id: "m1",
    sender: "Northwind Support",
    subject: "Refund for order NW-4471 has been issued",
    snippet: "Hi Mara, we have refunded €84.00 to your original payment method. It can take up to five working days to show on your statement.",
    time: "2026-10-26T14:12:00Z",
    unread: true,
    starred: true,
    attachment: true,
    labels: [
      { name: "Billing", tone: "ink" },
      { name: "Customer", tone: "mist" },
    ],
    href: "#m1",
  },
  {
    id: "m2",
    sender: "Priya Nair",
    subject: "Checkout accessibility notes, round two",
    snippet: "Keyboard order is fixed and the focus rings are in. The screen reader pass on the address step is still open, can you look at it?",
    time: "2026-10-26T12:41:00Z",
    unread: true,
    labels: [{ name: "Design", tone: "graphite" }],
    href: "#m2",
  },
  {
    id: "m3",
    sender: "Halcyon Textiles",
    subject: "Revised price list for the linen range",
    snippet: "Please find the updated price list attached. Lead time is now 18 days and the minimum order stays at 120 metres.",
    time: "2026-10-26T09:05:00Z",
    starred: true,
    attachment: true,
    labels: [{ name: "Suppliers", tone: "stone" }],
    href: "#m3",
  },
  {
    id: "m4",
    sender: "Leo Martins",
    subject: "Re: Release train on Friday",
    snippet: "Works for me. I will freeze the branch at 15:00 and ping you as soon as the build is green.",
    time: "2026-10-25T17:48:00Z",
    href: "#m4",
  },
  {
    id: "m5",
    sender: "Sofia Rossi",
    subject: "Planning for the second half: roadmap, hiring and the budget we agreed to keep flat for the agency retainer",
    snippet: "Notes from this morning are in the shared doc. Two open questions for you at the bottom, both about January.",
    time: "2026-10-22T16:20:00Z",
    labels: [
      { name: "Work", tone: "ink" },
      { name: "Planning", tone: "graphite" },
      { name: "Finance", tone: "stone" },
    ],
    href: "#m5",
  },
  {
    id: "m6",
    sender: "Kestrel Billing",
    subject: "Your October invoice is ready (€1,240.00)",
    snippet: "Your invoice for the Studio plan is attached. It will be collected on 1 November.",
    time: "2026-10-14T08:00:00Z",
    attachment: true,
    labels: [{ name: "Billing", tone: "ink" }],
    href: "#m6",
  },
  {
    id: "m7",
    sender: "Dan Cho",
    subject: "Photos from the shoot",
    snippet: "The link is live: 46 originals, 12 already retouched. Tell me which ones you want first.",
    time: "2025-12-03T10:15:00Z",
    href: "#m7",
  },
];

const COMPACT: readonly InboxMessage[] = START.slice(0, 4);

type Density = "comfortable" | "compact";

export default function Demo(): React.JSX.Element {
  const [messages, setMessages] = useState(START);
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set(["m2"]));
  const [density, setDensity] = useState<Density>("comfortable");
  const [quiet, setQuiet] = useState(COMPACT);
  const list = useRef<HTMLUListElement>(null);

  const change = (id: string, patch: Partial<InboxMessage>) => setMessages((current) => current.map((message) => (message.id === id ? { ...message, ...patch } : message)));
  const unread = messages.filter((message) => message.unread).length;
  const picked = messages.filter((message) => chosen.has(message.id));
  const all = messages.length > 0 && picked.length === messages.length;

  function toggle(id: string, on: boolean) {
    setChosen((current) => {
      const copy = new Set(current);
      if (on) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  }

  function archive() {
    setMessages((current) => current.filter((message) => !chosen.has(message.id)));
    setChosen(new Set());
    // The rows that had focus are gone: focus moves to the list, not to the top of the page.
    requestAnimationFrame(() => list.current?.focus());
  }

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-3xl gap-8">
        <section aria-labelledby="inbox-demo-title" className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <div className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-2.5">
            <Checkbox
              checked={all ? true : picked.length > 0 ? "indeterminate" : false}
              onCheckedChange={(value) => setChosen(value === true ? new Set(messages.map((message) => message.id)) : new Set())}
              aria-label="Select all messages"
            />
            {picked.length ? (
              <>
                <p aria-live="polite" className="text-sm font-medium tabular-nums">
                  {picked.length} selected
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMessages((current) => current.map((message) => (chosen.has(message.id) ? { ...message, unread: false } : message)));
                      setChosen(new Set());
                    }}
                  >
                    <IconMailOpen />
                    Mark as read
                  </Button>
                  <Button variant="ghost" size="sm" onClick={archive}>
                    <IconArchive />
                    Archive
                  </Button>
                </div>
              </>
            ) : (
              <div className="min-w-0">
                <h2 id="inbox-demo-title" className="text-sm font-semibold tracking-[-0.01em]">
                  Inbox
                </h2>
                <p aria-live="polite" className="text-xs text-muted-foreground tabular-nums">
                  {unread} unread
                </p>
              </div>
            )}
            <SegmentedControl
              className="ms-auto"
              label="Row density"
              value={density}
              onValueChange={(value) => setDensity(value === "compact" ? "compact" : "comfortable")}
              options={[
                { value: "comfortable", label: "Comfortable" },
                { value: "compact", label: "Compact" },
              ]}
            />
          </div>
          <ul ref={list} tabIndex={-1} aria-label="Messages" className="divide-y divide-border outline-none">
            {messages.map((message) => (
              <InboxRow
                key={message.id}
                message={message}
                density={density}
                now={NOW}
                selected={chosen.has(message.id)}
                onSelect={(on) => toggle(message.id, on)}
                onStar={(starred) => change(message.id, { starred })}
                onOpen={(_message, event) => {
                  // A preview has nowhere to go: a router would navigate here.
                  event.preventDefault();
                  change(message.id, { unread: false });
                }}
              />
            ))}
          </ul>
        </section>

        <div className="grid gap-2">
          <p className="text-xs text-muted-foreground">Compact is one line in a wide list and folds to two in a narrow one. The star and the checkbox are separate controls, and the whole row opens the message.</p>
          <ul aria-label="Compact messages" className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
            {quiet.map((message) => (
              <InboxRow
                key={message.id}
                message={message}
                density="compact"
                now={NOW}
                onStar={(starred) => setQuiet((current) => current.map((item) => (item.id === message.id ? { ...item, starred } : item)))}
                onOpen={(_message, event) => event.preventDefault()}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
