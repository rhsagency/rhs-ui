import type { ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { CheckList, type CheckListItem } from "@rhs-ui/primitives/check-list";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const STARTER: readonly CheckListItem[] = [
  { label: "3 active projects" },
  { label: "1 GB of storage" },
  { label: "Community support" },
  { label: "Custom domains", included: false },
  { label: "Audit log and SSO", included: false },
];

const TEAM: readonly CheckListItem[] = [
  { label: "Unlimited projects" },
  { label: "100 GB of storage", hint: "Pooled across the workspace" },
  { label: "Email support, 24-hour reply" },
  { label: "Custom domains" },
  { label: "Audit log", tooltip: "Every sign-in, permission change and export, kept for 90 days and searchable." },
  { label: "SAML single sign-on", included: false },
];

const BUSINESS: readonly CheckListItem[] = [
  { label: "Everything in Team" },
  { label: "1 TB of storage", hint: "Then €0.02 per GB" },
  { label: "SAML single sign-on", hint: "Okta, Entra ID and Google" },
  { label: "99.95% uptime SLA", tooltip: "Credited automatically on your next invoice when we miss it." },
  { label: "Named success manager" },
];

const REQUIREMENTS: readonly CheckListItem[] = [
  { label: "Node.js 20 or newer", hint: "22 LTS is what we test against" },
  { label: "A Postgres 15 database", hint: "Hosted or on your own machine" },
  { label: "A Linux or macOS machine", hint: "Windows works through WSL 2" },
  { label: "A GPU", included: false, hint: "Not needed, the models run on our side" },
];

function Plan({ name, price, note, items, featured = false }: { name: string; price: string; note: string; items: readonly CheckListItem[]; featured?: boolean }): React.JSX.Element {
  return (
    <div className={featured ? "flex flex-col gap-5 rounded-xl border border-primary bg-primary p-5 text-primary-foreground" : "flex flex-col gap-5 rounded-xl border border-border bg-card p-5 shadow-xs"}>
      <div>
        <h2 className="text-sm font-medium">{name}</h2>
        <p className="mt-2 flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold tracking-[-0.04em] tabular-nums">{price}</span>
          <span className={featured ? "text-xs text-primary-foreground/70" : "text-xs text-muted-foreground"}>{note}</span>
        </p>
      </div>
      <CheckList items={items} tone={featured ? "inverted" : "default"} className="flex-1" />
      {/* On the solid card the default ring is the colour of the card, so the featured button rings in the card's own text colour. */}
      <Button variant={featured ? "secondary" : "outline"} className={featured ? "w-full focus-visible:ring-primary-foreground/60" : "w-full"}>
        Choose {name}
      </Button>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl gap-10">
      <Example caption="In plan cards: a dash and quieter text for what is not in the plan, and screen readers hear “Included” and “Not included”">
        <div className="grid gap-4 sm:grid-cols-3">
          <Plan name="Starter" price="€0" note="free forever" items={STARTER} />
          <Plan name="Team" price="€24" note="per seat, per month" items={TEAM} featured />
          <Plan name="Business" price="€72" note="per seat, per month" items={BUSINESS} />
        </div>
      </Example>

      <div className="grid gap-10 md:grid-cols-2">
        <Example caption="Requirements, each with a hint underneath. The icon stays on the first line when the text wraps">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h2 className="mb-4 text-sm font-medium">Before you install</h2>
            <CheckList items={REQUIREMENTS} />
          </div>
        </Example>

        <Example caption="Three sizes and a muted tone, for a list that should not compete with its card">
          <div className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
            <CheckList size="lg" items={[{ label: "Large, for a hero" }, { label: "Two lines of copy that wrap onto the next line to show where the icon sits" }]} />
            <CheckList size="md" items={[{ label: "Medium, the default" }, { label: "Not included here", included: false }]} />
            <CheckList size="sm" tone="muted" items={[{ label: "Small and muted, for fine print" }, { label: "Also left out", included: false }]} />
          </div>
        </Example>
      </div>
    </div>
  );
}
