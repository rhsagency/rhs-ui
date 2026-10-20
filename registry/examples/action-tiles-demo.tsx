"use client";

import { useState } from "react";

import { ActionTiles, type ActionTile } from "@rhs-ui/dashboard/action-tiles";
import { IconDownload, IconFilePlus, IconPercent, IconSend, IconSettings, IconTruck, IconUpload, IconUserPlus } from "@rhs-ui/icons";

export default function Demo(): React.JSX.Element {
  const [last, setLast] = useState("Press a tile: it is a real button or link.");
  const press = (name: string) => () => setLast(`${name} pressed.`);

  const actions: readonly ActionTile[] = [
    { label: "New invoice", description: "Bill a customer in two steps", icon: <IconFilePlus />, shortcut: "N then I", onSelect: press("New invoice") },
    { label: "Invite teammate", description: "Add a colleague by email", icon: <IconUserPlus />, shortcut: "N then T", onSelect: press("Invite teammate") },
    { label: "Import products", description: "From a CSV or another shop", icon: <IconUpload />, shortcut: "N then P", onSelect: press("Import products") },
    { label: "Create discount", description: "A code or an automatic offer", icon: <IconPercent />, shortcut: "N then D", onSelect: press("Create discount") },
    { label: "Print labels", description: "Ready to ship: 24 orders", icon: <IconTruck />, shortcut: "P then L", onSelect: press("Print labels") },
    { label: "Export report", description: "Last 30 days as a spreadsheet", icon: <IconDownload />, href: "#export" },
    { label: "Send reminder", description: "Nudge customers with open invoices", icon: <IconSend />, disabled: true, disabledReason: "Connect an email provider in Settings first." },
    { label: "Shop settings", description: "Payments, tax and shipping", icon: <IconSettings />, shortcut: "G then S", href: "#settings" },
  ];

  const dense: readonly ActionTile[] = [
    { label: "New invoice", icon: <IconFilePlus />, shortcut: "N then I", onSelect: press("New invoice") },
    { label: "Invite teammate", icon: <IconUserPlus />, shortcut: "N then T", onSelect: press("Invite teammate") },
    { label: "Import products", icon: <IconUpload />, shortcut: "N then P", onSelect: press("Import products") },
    { label: "Create discount", icon: <IconPercent />, shortcut: "N then D", onSelect: press("Create discount") },
    { label: "Send reminder", icon: <IconSend />, disabled: true, disabledReason: "Connect an email provider in Settings first." },
    { label: "Export report", icon: <IconDownload />, href: "#export" },
  ];

  return (
    <div className="grid w-full max-w-4xl gap-10">
      <section className="grid gap-3">
        <p className="text-xs text-muted-foreground">Four columns, two on a phone. The disabled tile stays focusable and says why.</p>
        <ActionTiles actions={actions} />
        <p aria-live="polite" className="text-xs text-muted-foreground">
          {last}
        </p>
      </section>

      <section className="grid gap-3">
        <p className="text-xs text-muted-foreground">Dense, three columns</p>
        <ActionTiles actions={dense} columns={3} dense label="Quick actions, compact" />
      </section>
    </div>
  );
}
