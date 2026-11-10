"use client";

import { useState, type ReactNode } from "react";

import { NotificationPanel, NotificationPopover, type NotificationEntry } from "@rhs-ui/application/notification-popover";
import { IconDownload, IconRocket } from "@rhs-ui/icons";
import { Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";

// A fixed "now" keeps the preview the same on every load. In an app, leave `now` out and the times read the browser's clock.
const NOW = Date.parse("2026-11-10T09:30:00Z");
const ago = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();

const INITIAL: readonly NotificationEntry[] = [
  {
    id: "n1",
    title: "Mara Okafor replied to your comment",
    body: "Can we move the press embargo to Thursday? Legal needs one more day.",
    time: ago(4),
    href: "#/inbox/mara-reply",
    unread: true,
    actor: { name: "Mara Okafor" },
  },
  {
    id: "n2",
    title: "Leo Martins assigned you to “Redirect map for 212 legacy URLs”",
    time: ago(52),
    href: "#/tasks/redirect-map",
    unread: true,
    actor: { name: "Leo Martins" },
  },
  {
    id: "n3",
    title: "Your export is ready",
    body: "orders-october.csv, 2.4 MB. The link works for 7 days.",
    time: ago(3 * 60),
    href: "#/exports/orders-october",
    unread: true,
    icon: <IconDownload />,
  },
  {
    id: "n4",
    title: "Priya Nair asked for your review",
    body: "Accessibility notes for the checkout: keyboard order and focus rings are covered, the screen reader pass is still open.",
    time: ago(26 * 60),
    href: "#/docs/checkout-a11y",
    actor: { name: "Priya Nair" },
  },
  {
    id: "n5",
    title: "Dan Cho mentioned you in “Load test the search endpoint at 400 requests per second against staging before the Friday freeze”",
    time: ago(3 * 24 * 60),
    href: "#/tasks/load-test",
    actor: { name: "Dan Cho" },
  },
  {
    id: "n6",
    title: "Halcyon 4.12 is out",
    body: "Faster sync, a calmer inbox and 14 fixes.",
    time: ago(8 * 24 * 60),
    href: "#/changelog/4-12",
    icon: <IconRocket />,
  },
];

export default function Demo(): React.JSX.Element {
  const [items, setItems] = useState(INITIAL);
  // The panel lists the newest six, but the person has 9 more unread further back: the bell counts all of them.
  const [further, setFurther] = useState(9);
  const [opened, setOpened] = useState("Nothing opened yet.");
  const unreadCount = items.filter((item) => item.unread).length + further;

  return (
    <div className="grid w-full gap-x-8 gap-y-10 md:grid-cols-[minmax(0,28rem)_minmax(0,24rem)] md:items-start">
      <Case caption="The bell in a header, open. Escape or a click away closes it. Arrow keys move between rows, opening a row marks it read and the number follows, and Mark all as read clears the rest.">
        <div className="relative h-[36rem] overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <div className="flex h-14 items-center justify-between gap-3 border-b border-border px-4">
            <div className="flex min-w-0 items-center gap-5">
              <span className="text-sm font-semibold tracking-[-0.02em]">Northwind</span>
              <div className="hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
                <span className="font-medium text-foreground">Overview</span>
                <span>Orders</span>
                <span>Customers</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationPopover
                defaultOpen
                items={items}
                unreadCount={unreadCount}
                now={NOW}
                viewAllHref="#/notifications"
                onOpenItem={(item, event) => {
                  // The demo stays on its page; an app would let the link go, or route to it.
                  event.preventDefault();
                  setOpened(`Opened “${item.title.length > 44 ? `${item.title.slice(0, 44)}…` : item.title}”.`);
                }}
                onMarkRead={(id) => setItems((list) => list.map((item) => (item.id === id ? { ...item, unread: false } : item)))}
                onMarkAllRead={() => {
                  setItems((list) => list.map((item) => ({ ...item, unread: false })));
                  setFurther(0);
                }}
              />
              <Avatar size="sm">
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </div>
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
            {opened}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setItems(INITIAL);
              setFurther(9);
              setOpened("Nothing opened yet.");
            }}
          >
            Reset
          </Button>
        </div>
      </Case>

      <div className="grid min-w-0 gap-8">
        <Case caption="While it loads: skeleton rows in the shape of the rows to come, and the panel says so to screen readers.">
          <Surface>
            <NotificationPanel items={[]} loading now={NOW} onMarkAllRead={() => undefined} viewAllHref="#/notifications" />
          </Surface>
        </Case>
        <Case caption="With nothing new: a short, kind sentence instead of an empty box.">
          <Surface>
            <NotificationPanel items={[]} now={NOW} onMarkAllRead={() => undefined} viewAllHref="#/notifications" />
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
