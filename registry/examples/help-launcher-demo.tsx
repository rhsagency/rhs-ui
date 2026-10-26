"use client";

import { useState, type ReactNode } from "react";

import { HelpLauncher, type HelpLauncherItem } from "@rhs-ui/application/help-launcher";
import { IconActivity, IconKeyboard, IconMail, IconMessage, IconSearch } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

const INVOICES = [
  { number: "INV-2041", client: "Halcyon Freight", amount: "€4,820.00", status: "Paid" },
  { number: "INV-2040", client: "Kestrel Labs", amount: "€1,260.00", status: "Paid" },
  { number: "INV-2039", client: "Polder Foods", amount: "€8,940.00", status: "Overdue" },
  { number: "INV-2038", client: "Lumen Studio", amount: "€2,150.00", status: "Draft" },
] as const;

function AppWindow({ title, caption, children }: { title: string; caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <figure className="grid gap-2">
      <figcaption className="text-xs text-muted-foreground">{caption}</figcaption>
      <div className="relative h-[34rem] overflow-hidden rounded-xl border border-border bg-background shadow-xs">
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <span className="text-sm font-semibold tracking-[-0.01em]">Northwind</span>
          <span className="text-xs text-muted-foreground">Studio plan</span>
        </div>
        <div className="grid gap-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-[-0.03em]">{title}</h2>
            <Button size="sm" variant="outline">
              New invoice
            </Button>
          </div>
          <ul className="divide-y divide-border rounded-lg border border-border bg-card text-sm">
            {INVOICES.map((row) => (
              <li key={row.number} className="flex items-center justify-between gap-3 px-3.5 py-3">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{row.client}</span>
                  <span className="block text-xs text-muted-foreground tabular-nums">{row.number}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-medium tabular-nums">{row.amount}</span>
                  <span className="block text-xs text-muted-foreground">{row.status}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        {children}
      </div>
    </figure>
  );
}

export default function Demo(): React.JSX.Element {
  const [chosen, setChosen] = useState("");

  const items: readonly HelpLauncherItem[] = [
    { id: "docs", label: "Search the docs", description: "Guides, API reference and recipes", icon: <IconSearch />, href: "#docs", shortcut: "/", group: "learn" },
    { id: "chat", label: "Chat with us", description: "A person answers, usually within 5 minutes", icon: <IconMessage />, onSelect: () => setChosen("Opening a chat with the support team."), group: "contact" },
    { id: "email", label: "Email support", description: "support@northwind.studio", icon: <IconMail />, href: "mailto:support@northwind.studio", group: "contact" },
    { id: "shortcuts", label: "Keyboard shortcuts", description: "Every key, in one list", icon: <IconKeyboard />, onSelect: () => setChosen("Opening the keyboard shortcuts."), shortcut: "?", group: "more" },
    { id: "status", label: "System status", description: "All systems operational", icon: <IconActivity />, href: "https://status.northwind.studio", group: "more" },
  ];

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <AppWindow title="Invoices" caption="Bottom right, with the menu open. It is a real menu: arrow keys move, Escape closes.">
          <HelpLauncher contained items={items} heading="How can we help?" defaultOpen />
        </AppWindow>
        <AppWindow title="Invoices" caption="Bottom left, lifted above a cookie bar with offset.">
          <div className="absolute inset-x-0 bottom-0 flex h-14 items-center justify-between gap-3 border-t border-border bg-card px-4 text-xs text-muted-foreground">
            <span>We use cookies to keep you signed in.</span>
            <Button size="sm" variant="outline">
              Got it
            </Button>
          </div>
          <HelpLauncher contained position="bottom-left" offset="3.5rem" items={items} />
        </AppWindow>
      </div>
      <p aria-live="polite" className="text-center text-xs text-muted-foreground">
        {chosen || "Choose Chat with us or Keyboard shortcuts: the entry runs your own action."}
      </p>
    </div>
  );
}
