"use client";

import { useRef, useState, type ReactNode } from "react";

import { IconCalendar, IconChart, IconFolder, IconHome, IconInbox, IconSettings } from "@rhs-ui/icons";
import { GoToHint, GoToShortcuts, type GoToDestination } from "@rhs-ui/application/go-to-shortcuts";
import { goToShortcut } from "@rhs-ui/application/go-to-shortcuts/shortcuts";
import { Input } from "@rhs-ui/primitives/input";
import { Kbd } from "@rhs-ui/primitives/kbd";
import { cn } from "@/lib/utils";

/** The small keycaps of the window: 16px tall, 11px type. */
const KEY = "h-4 min-w-4 text-[0.6875rem]";

export default function Demo(): React.JSX.Element {
  const region = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState("dashboard");
  const [how, setHow] = useState<"keyboard" | "click">("click");
  const current = PAGES.find((entry) => entry.id === page) ?? PAGES[0];

  function open(id: string, by: "keyboard" | "click") {
    setPage(id);
    setHow(by);
  }

  const destinations: GoToDestination[] = PAGES.map((entry) => ({ key: entry.key, label: entry.label, onGo: () => open(entry.id, "keyboard") }));

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-12">
        <Case caption="Click inside the window, then press G and a letter. The panel lists where each letter goes, the next key goes there, and Escape or a pause puts it away. Typing a g in the search field does nothing, and the links carry aria-keyshortcuts.">
          <div
            ref={region}
            role="region"
            tabIndex={0}
            aria-label="Halcyon app, with go-to shortcuts"
            className="group/window relative grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-xl border border-border bg-card shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:h-[26rem] sm:grid-cols-[13.5rem_minmax(0,1fr)]"
          >
            <GoToShortcuts destinations={destinations} scope={region} className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4" />

            {/* On a phone there is no sidebar and, mostly, no keyboard: the keys are a row of links to read and to tap. */}
            <nav aria-label="Halcyon" className="grid gap-2 border-b border-border bg-muted/30 p-3 sm:hidden">
              <p aria-hidden="true" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                On a keyboard, press <Kbd className={KEY}>G</Kbd> and then
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {PAGES.map((entry) => (
                  <li key={entry.id}>
                    <a
                      href={`#${entry.id}`}
                      {...goToShortcut(entry.key)}
                      aria-current={entry.id === page ? "page" : undefined}
                      onClick={(event) => {
                        event.preventDefault();
                        open(entry.id, "click");
                      }}
                      className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-background pr-3 pl-1.5 text-[0.8125rem] outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:border-foreground/30 aria-[current=page]:bg-muted aria-[current=page]:font-medium"
                    >
                      <Kbd aria-hidden="true" className={KEY}>
                        {entry.key.toUpperCase()}
                      </Kbd>
                      {entry.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Halcyon" className="hidden border-r border-border bg-muted/30 p-3 sm:block">
              <p className="px-2.5 pt-1 pb-3 text-sm font-semibold tracking-[-0.01em]">Halcyon</p>
              <ul className="grid gap-0.5">
                {PAGES.map((entry) => (
                  <li key={entry.id}>
                    <a
                      href={`#${entry.id}`}
                      {...goToShortcut(entry.key)}
                      aria-current={entry.id === page ? "page" : undefined}
                      onClick={(event) => {
                        event.preventDefault();
                        open(entry.id, "click");
                      }}
                      className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground [&_svg]:size-4"
                    >
                      {entry.icon}
                      <span className="flex-1">{entry.label}</span>
                      <span aria-hidden="true" className="flex items-center gap-0.5">
                        <Kbd className={cn(KEY, "text-foreground/70")}>G</Kbd>
                        <Kbd className={cn(KEY, "text-foreground/70")}>{entry.key.toUpperCase()}</Kbd>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="grid min-w-0 content-start gap-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="grid gap-0.5">
                  <h2 className="text-lg leading-tight font-semibold tracking-[-0.02em]">{current?.label}</h2>
                  <p className="text-xs text-muted-foreground" aria-live="polite">
                    {how === "keyboard" ? (
                      <>
                        Opened with <Kbd className={KEY}>G</Kbd> <Kbd className={KEY}>{current?.key.toUpperCase()}</Kbd>
                      </>
                    ) : (
                      "Opened with a click"
                    )}
                  </p>
                </div>
                <Input type="search" aria-label="Search Halcyon" placeholder="Search Halcyon" className="h-8 w-full max-w-48 text-[0.8125rem]" />
              </div>
              <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-background">
                {current?.rows.map(([name, detail]) => (
                  <li key={name} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <span className="truncate font-medium">{name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{detail}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground group-focus-within/window:hidden max-sm:hidden">Click here to try the keys.</p>
              <p className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:group-focus-within/window:flex">
                Listening: press <Kbd className={KEY}>G</Kbd> and a letter.
              </p>
            </div>
          </div>
        </Case>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 md:items-start">
          <Case caption="The panel on its own, to teach the keys in a help page. Six destinations stack, and more than six make two columns.">
            <div className="flex flex-wrap items-start gap-6">
              <GoToHint destinations={destinations} />
              <GoToHint destinations={MORE} />
            </div>
          </Case>
          <Case caption="Another prefix is one prop, and every word is translated through labels. While a live panel waits for a letter, a thin bar along its foot runs down over the timeout.">
            <div className="flex flex-wrap items-start gap-6">
              <GoToHint destinations={destinations.slice(0, 4)} prefix="/" labels={{ title: "Jump to", cancel: "close" }} />
            </div>
          </Case>
        </div>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const PAGES: readonly { id: string; key: string; label: string; icon: ReactNode; rows: readonly [string, string][] }[] = [
  {
    id: "dashboard",
    key: "d",
    label: "Dashboard",
    icon: <IconHome aria-hidden="true" />,
    rows: [
      ["Revenue this week", "€12,480"],
      ["New customers", "34"],
      ["Open support threads", "7"],
    ],
  },
  {
    id: "inbox",
    key: "i",
    label: "Inbox",
    icon: <IconInbox aria-hidden="true" />,
    rows: [
      ["Mara Veld: Re: Spring catalogue", "9:41"],
      ["Tomas Reyes: Invoice 2041", "Yesterday"],
      ["Northwind Freight: Delivery window", "Mon"],
    ],
  },
  {
    id: "projects",
    key: "p",
    label: "Projects",
    icon: <IconFolder aria-hidden="true" />,
    rows: [
      ["Spring catalogue", "Due Fri"],
      ["Warehouse move", "On track"],
      ["Loyalty programme", "Draft"],
    ],
  },
  {
    id: "reports",
    key: "r",
    label: "Reports",
    icon: <IconChart aria-hidden="true" />,
    rows: [
      ["Sales by region", "Updated today"],
      ["Returns and refunds", "Updated Mon"],
      ["Stock on hand", "Updated today"],
    ],
  },
  {
    id: "calendar",
    key: "c",
    label: "Calendar",
    icon: <IconCalendar aria-hidden="true" />,
    rows: [
      ["Supplier call", "Today, 14:00"],
      ["Catalogue review", "Thu, 10:30"],
      ["Quarter planning", "Fri, 09:00"],
    ],
  },
  {
    id: "settings",
    key: "s",
    label: "Settings",
    icon: <IconSettings aria-hidden="true" />,
    rows: [
      ["Store details", "Edit"],
      ["Team and roles", "4 people"],
      ["Billing", "Studio plan"],
    ],
  },
];

const MORE: readonly GoToDestination[] = [
  { key: "d", label: "Dashboard" },
  { key: "i", label: "Inbox" },
  { key: "p", label: "Projects" },
  { key: "r", label: "Reports" },
  { key: "c", label: "Calendar" },
  { key: "t", label: "Team" },
  { key: "b", label: "Billing" },
  { key: "s", label: "Settings" },
];
