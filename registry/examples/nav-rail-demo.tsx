"use client";

import { useState, type ReactNode } from "react";

import { IconCalendar, IconChartBar, IconFolder, IconHome, IconMessages, IconSettings, IconUsers } from "@rhs-ui/icons";
import { NavRail, NavRailItem, type NavRailEntry } from "@rhs-ui/primitives/nav-rail";

/** Six areas in two groups: the whole list, with the brand above and the pinned group below, fits in every frame but the short one. */
const ITEMS: readonly NavRailEntry[] = [
  { id: "home", label: "Home", icon: <IconHome />, group: "main" },
  { id: "messages", label: "Messages", icon: <IconMessages />, badge: 3, badgeLabel: "unread messages", group: "main" },
  { id: "calendar", label: "Calendar", icon: <IconCalendar />, group: "main" },
  { id: "files", label: "Files", icon: <IconFolder />, group: "work" },
  { id: "people", label: "People", icon: <IconUsers />, group: "work" },
  { id: "reports", label: "Reports", icon: <IconChartBar />, badge: true, badgeLabel: "report", group: "work" },
];

/** Tall enough for the brand, the six areas and the pinned group in the rail that needs most room (the one with labels). */
const TALL = "h-[38rem]";
/** Deliberately short, to show the list scrolling while the brand and the pinned group stay. */
const SHORT = "h-72";

const CHATS = [
  { who: "Halcyon design review", line: "Priya: the new spacing scale is ready to try", when: "09:41" },
  { who: "Mara Okafor", line: "Can you look at the invoice export before lunch?", when: "09:12" },
  { who: "Kestrel launch", line: "Jonas: the status page is live", when: "Yesterday" },
  { who: "Priya Raman", line: "Shared the third quarter usage export in Files", when: "Yesterday" },
  { who: "Northwind support", line: "Your ticket about the webhook retries is solved", when: "Mon" },
  { who: "Lena Hartmann", line: "Thanks, the invoice looks right now", when: "Mon" },
];

function Brand(): React.JSX.Element {
  return (
    <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-semibold tracking-[-0.04em] text-primary-foreground">
      N
    </span>
  );
}

function Account(): React.JSX.Element {
  return (
    <span aria-hidden="true" className="grid size-6 place-items-center rounded-full border border-border bg-muted text-[0.625rem] font-semibold text-foreground">
      MO
    </span>
  );
}

/** A small app window: the rail on the left and, beside it, the area you chose. Everything in it is drawn, so the demo needs nothing else. */
function App({ name, height, rail }: { name: string; height: string; rail: { showLabels?: boolean; expandOnHover?: boolean; expanded?: boolean } }): React.JSX.Element {
  const [current, setCurrent] = useState("messages");
  const area = ITEMS.find((item) => item.id === current);
  return (
    <div className={`flex ${height} overflow-hidden rounded-xl border border-border bg-card text-card-foreground`}>
      <NavRail
        items={ITEMS}
        label={name}
        current={current}
        onSelect={setCurrent}
        top={<Brand />}
        bottom={
          <>
            <NavRailItem label="Settings" icon={<IconSettings />} onSelect={() => setCurrent("settings")} current={current === "settings"} />
            <NavRailItem label="Account" icon={<Account />} onSelect={() => setCurrent("account")} current={current === "account"} />
          </>
        }
        {...rail}
      />
      <div className="min-w-0 flex-1 overflow-hidden p-4 sm:p-5">
        <h2 className="text-base font-semibold tracking-[-0.02em]">{area?.label ?? (current === "settings" ? "Settings" : "Account")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">Northwind workspace</p>
        <ul className="mt-5 grid gap-1">
          {CHATS.map((chat) => (
            <li key={chat.who} className="flex items-center gap-3 rounded-lg px-2 py-2.5">
              <span aria-hidden="true" className="size-8 shrink-0 rounded-full bg-muted" />
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate text-[0.8125rem] font-medium">{chat.who}</span>
                <span className="truncate text-xs text-muted-foreground">{chat.line}</span>
              </span>
              <span className="hidden shrink-0 text-[0.6875rem] text-muted-foreground tabular-nums sm:block">{chat.when}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Example({ caption, children, className }: { caption: string; children: ReactNode; className?: string }): React.JSX.Element {
  return (
    <section className={`grid min-w-0 grid-cols-1 content-start gap-3 ${className ?? ""}`}>
      {/* Two lines tall on a wide screen, so the frames of a row start at the same height whatever the length of their captions. */}
      <p className="text-xs text-muted-foreground lg:min-h-8">{caption}</p>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-x-6 gap-y-10 px-4 py-10 sm:px-6 lg:grid-cols-3">
      <Example caption="Icons, each with its name in a tooltip. The current area is filled; Messages has a count and Reports a dot.">
        <App name="Areas, icons" height={TALL} rail={{}} />
      </Example>
      <Example caption="showLabels: the names sit under the icons, so there are no tooltips and every area is named at a glance.">
        <App name="Areas, labels below" height={TALL} rail={{ showLabels: true }} />
      </Example>
      <Example caption="expandOnHover: hover the rail, or Tab into it, and a labelled panel slides over the content. The page does not move.">
        <App name="Areas, expands on hover" height={TALL} rail={{ expandOnHover: true }} />
      </Example>
      <Example className="lg:col-span-2" caption="The same panel, held open with expanded. On a short screen the list scrolls and the brand and the bottom group stay.">
        <App name="Areas, held open" height={SHORT} rail={{ expandOnHover: true, expanded: true }} />
      </Example>
    </div>
  );
}
