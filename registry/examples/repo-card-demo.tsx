"use client";

import { useState } from "react";

import { RepoCard } from "@rhs-ui/application/repo-card";

// A fixed "now" keeps "Updated 3 days ago" the same on every load. In an app, leave `now` out and the cards read the browser's clock.
const NOW = Date.parse("2026-10-29T15:20:00Z");
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export default function Demo(): React.JSX.Element {
  const [opened, setOpened] = useState<string | null>(null);
  const open = (name: string) => (event: { preventDefault: () => void }) => {
    // A preview has nowhere to go: a router would navigate here.
    event.preventDefault();
    setOpened(name);
  };

  return (
    <div className="grid w-full max-w-4xl gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.02em]">Pinned repositories</h2>
          <p className="mt-1 text-sm text-muted-foreground">Hover a count for the full number, or a date for the exact day.</p>
        </div>
        <p role="status" className="text-xs text-muted-foreground">
          {opened ? `Opened ${opened}.` : ""}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <RepoCard
          owner="northwind"
          name="ledger-core"
          description="A double-entry ledger for small businesses, with bank feeds, VAT returns and a typed API."
          language="TypeScript"
          stars={12384}
          forks={1204}
          updatedAt={NOW - 3 * DAY}
          visibility="public"
          topics={["accounting", "typescript", "postgres", "double-entry", "api", "vat"]}
          href="#ledger-core"
          onOpen={open("northwind/ledger-core")}
          now={NOW}
        />
        <RepoCard
          owner="northwind"
          name="halcyon-ui"
          description="A calm component library for dashboards: tables, filters, forms and a command palette."
          language="TypeScript"
          stars={4821}
          forks={312}
          updatedAt={NOW - 5 * HOUR}
          visibility="public"
          topics={["react", "design-system", "accessibility"]}
          href="#halcyon-ui"
          onOpen={open("northwind/halcyon-ui")}
          now={NOW}
        />
        <RepoCard
          owner="northwind"
          name="kestrel-cli"
          description="Deploy from your terminal. Preview environments, secrets and rollbacks in one small binary."
          language="Go"
          stars={987}
          forks={64}
          updatedAt={NOW - 16 * DAY}
          visibility="public"
          topics={["cli", "deployments", "golang"]}
          href="#kestrel-cli"
          onOpen={open("northwind/kestrel-cli")}
          now={NOW}
        />
        <RepoCard
          owner="northwind"
          name="billing-internal"
          description="Invoice runs, dunning and revenue recognition for the finance team. Not for outside eyes."
          language="Python"
          stars={0}
          forks={0}
          updatedAt={NOW - 22 * HOUR}
          visibility="private"
          topics={["finance", "internal"]}
          href="#billing-internal"
          onOpen={open("northwind/billing-internal")}
          now={NOW}
        />
        <RepoCard
          owner="northwind"
          name="webhook-relay"
          description="Receive, queue and replay webhooks. Retries with backoff, a dead-letter queue and signed payloads."
          language="Rust"
          stars={2301}
          forks={143}
          updatedAt={NOW - 45 * DAY}
          visibility="public"
          topics={["webhooks", "rust", "queue"]}
          href="#webhook-relay"
          onOpen={open("northwind/webhook-relay")}
          now={NOW}
        />
        <RepoCard
          owner="mara"
          name="dotfiles"
          description="My shell, editor and terminal setup, and the script that puts it on a new laptop."
          language="Shell"
          stars={8}
          forks={1}
          updatedAt={NOW - 640 * DAY}
          visibility="public"
          href="#dotfiles"
          onOpen={open("mara/dotfiles")}
          now={NOW}
        />
      </div>
    </div>
  );
}
