"use client";

import { useRef, useState, type ReactNode } from "react";

import { NotificationItem } from "@rhs-ui/application/notification-item";
import { IconCheck, IconClipboardCheck, IconDownload, IconMessage, IconUserPlus, IconClose } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

// A fixed "now" keeps the preview the same on every load. In an app, leave `now` out and the row reads the browser's clock.
const NOW = Date.parse("2026-10-26T14:30:00Z");
const ago = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();

interface Entry {
  id: string;
  actor?: { name: string };
  verb: string;
  target: { label: string; href: string };
  time: string;
  unread: boolean;
  icon?: ReactNode;
  preview?: string;
  invite?: "pending" | "accepted" | "declined";
}

const PANEL: readonly Entry[] = [
  {
    id: "p1",
    actor: { name: "Mara Okafor" },
    verb: "commented on",
    target: { label: "Q4 launch checklist", href: "/docs/q4-launch-checklist" },
    time: ago(4),
    unread: true,
    icon: <IconMessage />,
    preview: "Can we move the press embargo to Thursday? Legal needs one more day.",
  },
  {
    id: "p2",
    actor: { name: "Leo Martins" },
    verb: "assigned you to",
    target: { label: "Redirect map for 212 legacy URLs", href: "/tasks/redirect-map" },
    time: ago(52),
    unread: true,
    icon: <IconUserPlus />,
  },
  {
    id: "p3",
    verb: "Your export is ready:",
    target: { label: "orders-october.csv", href: "/exports/orders-october" },
    time: ago(3 * 60),
    unread: false,
    icon: <IconDownload />,
  },
  {
    id: "p4",
    actor: { name: "Dan Cho" },
    verb: "mentioned you in",
    target: { label: "Load test the search endpoint at 400 requests per second against staging before the Friday freeze", href: "/tasks/load-test" },
    time: ago(26 * 60),
    unread: false,
    icon: <IconMessage />,
  },
];

const PAGE: readonly Entry[] = [
  {
    id: "w1",
    actor: { name: "Sofia Rossi" },
    verb: "invited you to",
    target: { label: "Kestrel mobile app", href: "/projects/kestrel" },
    time: ago(18),
    unread: true,
    icon: <IconUserPlus />,
    invite: "pending",
  },
  {
    id: "w2",
    actor: { name: "Priya Nair" },
    verb: "requested your review on",
    target: { label: "Accessibility notes for the checkout", href: "/docs/checkout-a11y" },
    time: ago(2 * 60),
    unread: true,
    icon: <IconClipboardCheck />,
    preview: "Keyboard order, focus rings and the error summary are covered. The screen reader pass is still open.",
  },
  {
    id: "w3",
    actor: { name: "Hana Sato" },
    verb: "shared",
    target: { label: "Returns flow training deck", href: "/files/returns-training" },
    time: ago(5 * 24 * 60),
    unread: false,
  },
  {
    id: "w4",
    actor: { name: "Tomas Brandt" },
    verb: "finished",
    target: { label: "Rollback rehearsal on staging", href: "/tasks/rollback" },
    time: ago(12 * 24 * 60),
    unread: false,
  },
];

function Inbox({ title, initial }: { title: string; initial: readonly Entry[] }): React.JSX.Element {
  const [entries, setEntries] = useState(initial);
  const rows = useRef(new Map<string, HTMLLIElement>());
  const change = (id: string, patch: Partial<Entry>) => setEntries((list) => list.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  const unread = entries.filter((entry) => entry.unread).length;
  // Accept and Decline turn into a result and leave the row: focus goes to the row's link, not to the top of the page.
  const answer = (id: string, invite: "accepted" | "declined") => {
    change(id, { invite, unread: false });
    requestAnimationFrame(() => rows.current.get(id)?.querySelector<HTMLElement>("a")?.focus());
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold tracking-[-0.01em]">{title}</h2>
          <p aria-live="polite" className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            {unread === 0 ? "You are all caught up" : `${unread} unread`}
          </p>
        </div>
        {/* aria-disabled and not disabled: a button that disables itself under the finger would drop keyboard focus to the page. */}
        <Button
          variant="ghost"
          size="sm"
          aria-disabled={unread === 0}
          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
          onClick={() => {
            if (unread > 0) setEntries((list) => list.map((entry) => ({ ...entry, unread: false })));
          }}
        >
          <IconCheck />
          Mark all as read
        </Button>
      </div>
      <ul className="divide-y divide-border">
        {entries.map((entry) => (
          <NotificationItem
            key={entry.id}
            ref={(element) => {
              if (element) rows.current.set(entry.id, element);
              else rows.current.delete(entry.id);
            }}
            actor={entry.actor}
            verb={entry.verb}
            target={entry.target}
            time={entry.time}
            now={NOW}
            unread={entry.unread}
            icon={entry.icon}
            onOpen={(event) => {
              // A preview has nowhere to go: a router would navigate here.
              event.preventDefault();
              change(entry.id, { unread: false });
            }}
            onMarkRead={() => change(entry.id, { unread: false })}
            actions={
              entry.invite === "pending" ? (
                <>
                  <Button size="sm" onClick={() => answer(entry.id, "accepted")}>
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => answer(entry.id, "declined")}>
                    Decline
                  </Button>
                </>
              ) : entry.invite ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  {entry.invite === "accepted" ? <IconCheck className="size-3.5" /> : <IconClose className="size-3.5" />}
                  {entry.invite === "accepted" ? "You joined" : "Declined"}
                </span>
              ) : undefined
            }
          >
            {entry.preview}
          </NotificationItem>
        ))}
      </ul>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="flex w-full max-w-4xl flex-wrap items-start gap-x-6 gap-y-8">
      <figure className="grid w-full max-w-96 gap-2">
        <figcaption className="text-xs text-muted-foreground">In a bell panel, 24rem wide: a long target clamps to two lines, and a row keeps its comment short.</figcaption>
        <Inbox title="Notifications" initial={PANEL} />
      </figure>
      <figure className="grid min-w-[min(100%,28rem)] flex-1 gap-2">
        <figcaption className="text-xs text-muted-foreground">On an inbox page: the actions sit beside the text, and drop under it when the row gets narrower than 28rem.</figcaption>
        <Inbox title="Inbox" initial={PAGE} />
      </figure>
    </div>
  );
}
