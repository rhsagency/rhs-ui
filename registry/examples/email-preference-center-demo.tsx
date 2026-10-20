"use client";

import { useState } from "react";

import { EmailPreferenceCenter, type EmailList, type EmailPreferences, type TransactionalEmail } from "@rhs-ui/application/email-preference-center";

const LISTS: EmailList[] = [
  { id: "product", name: "Product updates", description: "New features, improvements and fixes, written by the people who built them." },
  {
    id: "digest",
    name: "Workspace digest",
    description: "What happened in your workspace: activity, mentions and open tasks.",
    frequencies: [
      { value: "off", label: "Off" },
      { value: "daily", label: "Daily" },
      { value: "weekly", label: "Weekly" },
    ],
  },
  {
    id: "guides",
    name: "Tips and guides",
    description: "Short, practical pieces on getting more out of Kestrel.",
    frequencies: [
      { value: "off", label: "Off" },
      { value: "monthly", label: "Monthly" },
    ],
  },
  {
    id: "events",
    name: "Events and webinars",
    description: "Invitations to live sessions. Never more than one a month.",
    frequencies: [
      { value: "off", label: "Off" },
      { value: "invites", label: "My region" },
      { value: "all", label: "All" },
    ],
  },
];

const ALWAYS: TransactionalEmail[] = [
  { id: "receipts", name: "Receipts and invoices", reason: "We have to send these, for your records and for tax." },
  { id: "security", name: "Security alerts", reason: "So you hear about a sign-in or a password change you did not make." },
  { id: "legal", name: "Account and legal notices", reason: "Changes to your plan or to our terms, which the law asks us to share." },
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Caption({ children }: { children: string }): React.JSX.Element {
  return <p className="mb-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">{children}</p>;
}

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState<EmailPreferences>({ product: "weekly", digest: "daily", guides: "monthly", events: "off" });
  const [pausedUntil, setPausedUntil] = useState<string | null>("2026-11-19T00:00:00Z");
  return (
    <div className="mx-auto w-full max-w-2xl space-y-16 px-4 py-12 sm:px-6">
      <div>
        <Caption>Reached from an email footer</Caption>
        <EmailPreferenceCenter
          address="ada.lovelace@northwind.example"
          lists={LISTS}
          transactional={ALWAYS}
          value={value}
          onChange={async (listId, frequency) => {
            await wait(450);
            setValue((current) => ({ ...current, [listId]: frequency }));
          }}
          onPause={() => wait(450)}
          onResume={() => wait(450)}
          onUnsubscribeAll={async () => {
            await wait(600);
            setValue({ product: "off", digest: "off", guides: "off", events: "off" });
          }}
        />
      </div>
      <div>
        <Caption>Paused, lists only</Caption>
        <EmailPreferenceCenter
          address="m.okafor@halcyon.example"
          lists={LISTS.slice(0, 2)}
          defaultValue={{ product: "monthly", digest: "off" }}
          pausedUntil={pausedUntil}
          onResume={async () => {
            await wait(400);
            setPausedUntil(null);
          }}
          onPause={async () => {
            await wait(400);
            setPausedUntil("2026-11-19T00:00:00Z");
          }}
        />
      </div>
    </div>
  );
}
