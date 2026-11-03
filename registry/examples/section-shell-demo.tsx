import type { CSSProperties } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { SectionShell } from "@rhs-ui/primitives/section-shell";
import { Switch } from "@rhs-ui/primitives/switch";

const NOTIFICATIONS = [
  { id: "orders", label: "Order updates", note: "A message when an order is placed, shipped or returned.", on: true },
  { id: "digest", label: "Weekly digest", note: "Monday morning: sales, top products and what needs attention.", on: true },
  { id: "product", label: "Product news", note: "New features in Halcyon, about twice a month.", on: false },
];

const LINKS = [
  ["Profile", "#profile"],
  ["Notifications", "#notifications"],
  ["API keys", "#keys"],
  ["Danger zone", "#danger"],
] as const;

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6" style={{ "--section-scroll-offset": "4.5rem" } as CSSProperties}>
      <div className="mb-10">
        <p className="text-2xl font-semibold tracking-[-0.03em]">Halcyon Studio</p>
        <p className="mt-1 text-sm text-muted-foreground">Workspace settings</p>
        <nav aria-label="On this page" className="mt-5 flex flex-wrap gap-2">
          {LINKS.map(([label, href]) => (
            <a
              key={`${label}-${href}`}
              href={href}
              className="inline-flex h-8 items-center rounded-full border border-border px-3 text-sm text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      <SectionShell
        id="profile"
        tone="bordered"
        title="Workspace profile"
        description="Shown on invoices and in the emails your customers get."
        footer={
          <>
            <span>Changes apply to new invoices.</span>
            <Button size="sm">Save changes</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="shell-name">Studio name</Label>
            <Input id="shell-name" defaultValue="Halcyon Studio" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="shell-vat">VAT number</Label>
            <Input id="shell-vat" defaultValue="NL8123.45.678.B01" />
          </div>
        </div>
      </SectionShell>

      <SectionShell
        id="notifications"
        title="Notifications"
        description="Choose what we email you about."
        actions={
          <Button variant="outline" size="sm">
            Mute all
          </Button>
        }
      >
        <ul className="divide-y divide-border">
          {NOTIFICATIONS.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-6 py-3.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <Label htmlFor={`shell-${item.id}`}>{item.label}</Label>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.note}</p>
              </div>
              <Switch id={`shell-${item.id}`} defaultChecked={item.on} />
            </li>
          ))}
        </ul>
      </SectionShell>

      <SectionShell
        id="keys"
        tone="bordered"
        title="API keys"
        description="Keys let your storefront and your server talk to Halcyon."
        actions={<Button size="sm">Create key</Button>}
        empty={
          <div className="grid justify-items-center gap-1.5 py-6 text-center">
            <p className="text-sm font-medium">No keys yet</p>
            <p className="max-w-xs text-sm text-pretty text-muted-foreground">Create a key to connect your storefront. You will see it once, so copy it somewhere safe.</p>
          </div>
        }
      />

      <SectionShell
        id="danger"
        tone="muted"
        title="Danger zone"
        description="Deleting the workspace removes every project, order and file in it. This cannot be undone."
        actions={
          <Button variant="destructive" size="sm">
            Delete workspace
          </Button>
        }
      />
    </div>
  );
}
