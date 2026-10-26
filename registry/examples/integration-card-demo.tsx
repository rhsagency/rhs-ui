"use client";

import { useRef, useState, type ReactNode } from "react";

import { IntegrationCard, type Integration, type IntegrationStatus } from "@rhs-ui/application/integration-card";

// A fixed "now" keeps "Last sync 12 minutes ago" the same on every load. In an app, leave `now` out and the cards read the browser's clock.
const NOW = Date.parse("2026-10-26T14:30:00Z");
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Marks are drawn in the page's ink, so they follow both themes. Use your own logos in an app. */
const Mark = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const TOOLS: readonly { integration: Integration; status: IntegrationStatus }[] = [
  {
    status: "connected",
    integration: {
      id: "ledger",
      name: "Kestrel Ledger",
      description: "Match invoices and payments to your orders, without retyping a number.",
      mark: (
        <Mark>
          <rect x="3" y="3" width="14" height="14" rx="3" />
          <path d="M7 8h6M7 12h4" />
        </Mark>
      ),
      syncs: ["invoices", "customers", "payments"],
      account: "anna@studio.nl",
      lastSyncedAt: NOW - 12 * 60_000,
    },
  },
  {
    status: "attention",
    integration: {
      id: "mail",
      name: "Halcyon Mail",
      description: "Send receipts and reminders from your own domain.",
      mark: (
        <Mark>
          <rect x="2.5" y="4.5" width="15" height="11" rx="2.5" />
          <path d="m3.5 6.2 6.5 5 6.5-5" />
        </Mark>
      ),
      syncs: ["contacts", "templates"],
      account: "hello@studio.nl",
      lastSyncedAt: "2026-10-21T08:05:00Z",
      problem: "The login expired on 21 Oct, so nothing has synced since. Reconnect to pick up where it stopped.",
    },
  },
  {
    status: "disconnected",
    integration: {
      id: "chat",
      name: "Polder Chat",
      description: "Post order and stock alerts to the channels you choose.",
      mark: (
        <Mark>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h7A2.5 2.5 0 0 1 16 5.5v5a2.5 2.5 0 0 1-2.5 2.5H9l-3.5 3v-3A2.5 2.5 0 0 1 4 10.5z" />
        </Mark>
      ),
      syncs: ["order alerts", "stock alerts"],
    },
  },
  {
    status: "connected",
    integration: {
      id: "drive",
      name: "Lumen Drive",
      description: "Back up exports and product files in one folder.",
      mark: (
        <Mark>
          <ellipse cx="10" cy="5.5" rx="6" ry="2.5" />
          <path d="M4 5.5v9c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-9M4 10c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5" />
        </Mark>
      ),
      syncs: ["exports", "product files"],
      account: "studio@lumen.drive",
      lastSyncedAt: NOW - 3 * 3_600_000,
      consequence: "Backups to Lumen Drive stop today. The files already in your folder stay there, and exports are still available to download from Northwind.",
    },
  },
];

export default function Demo(): React.JSX.Element {
  const [tools, setTools] = useState(TOOLS);
  const [note, setNote] = useState("");
  const refused = useRef(false);

  const update = (id: string, status: IntegrationStatus, patch: Partial<Integration> = {}) =>
    setTools((list) => list.map((tool) => (tool.integration.id === id ? { status, integration: { ...tool.integration, ...patch } } : tool)));

  return (
    <div className="grid w-full max-w-4xl gap-5">
      <div>
        <h2 className="text-base font-semibold tracking-[-0.02em]">Integrations</h2>
        <p className="mt-1 text-sm text-muted-foreground">Connect the tools your team already uses. Connecting and disconnecting are simulated; disconnecting Lumen Drive fails once, to show the retry.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map(({ integration, status }) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            status={status}
            now={NOW}
            onConfigure={() => setNote(`Opening the settings of ${integration.name}.`)}
            onConnect={async () => {
              await wait(1100);
              update(integration.id, "connected", { account: integration.account ?? "anna@studio.nl", lastSyncedAt: NOW, problem: undefined });
            }}
            onDisconnect={async () => {
              await wait(900);
              if (integration.id === "drive" && !refused.current) {
                refused.current = true;
                throw new Error("refused");
              }
              update(integration.id, "disconnected", { lastSyncedAt: undefined });
            }}
          />
        ))}
      </div>
      <p aria-live="polite" className="min-h-5 text-xs text-muted-foreground">
        {note}
      </p>
    </div>
  );
}
