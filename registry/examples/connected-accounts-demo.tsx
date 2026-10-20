"use client";

import { useState } from "react";

import { ConnectedAccounts, type ConnectedAccount } from "@rhs-ui/application/connected-accounts";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Who each provider says you are once you connect it again. */
const identities: Record<string, string> = {
  google: "ana@acme.com",
  linkedin: "Ana Reyes",
  microsoft: "ana.reyes@acme.onmicrosoft.com",
  apple: "Private relay address",
};

/** Connect and disconnect after a short wait, the way a real round trip would feel. */
function handlers(setAccounts: React.Dispatch<React.SetStateAction<ConnectedAccount[]>>) {
  return {
    onConnect: async (id: string) => {
      await wait(800);
      setAccounts((list) => list.map((item) => (item.id === id ? { ...item, identity: identities[id], connectedAt: new Date().toISOString() } : item)));
    },
    onDisconnect: async (id: string) => {
      await wait(700);
      setAccounts((list) => list.map((item) => (item.id === id ? { id: item.id, name: item.name } : item)));
    },
  };
}

export default function Demo(): React.JSX.Element {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([
    { id: "google", name: "Google", identity: "ana@acme.com", connectedAt: "2026-03-14T09:12:00Z" },
    { id: "linkedin", name: "LinkedIn", identity: "Ana Reyes", connectedAt: "2025-11-02T16:40:00Z" },
    { id: "microsoft", name: "Microsoft" },
    { id: "apple", name: "Apple" },
  ]);
  const [single, setSingle] = useState<ConnectedAccount[]>([
    { id: "google", name: "Google", identity: "ana@acme.com", connectedAt: "2026-03-14T09:12:00Z" },
    { id: "microsoft", name: "Microsoft" },
    { id: "apple", name: "Apple" },
  ]);
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <ConnectedAccounts accounts={accounts} timeZone="Europe/Amsterdam" {...handlers(setAccounts)} />
      <p className="mt-3 text-center text-xs text-muted-foreground">Disconnect one of two and the other becomes your only way in.</p>
      <ConnectedAccounts className="mt-12" accounts={single} title="Sign-in accounts" timeZone="Europe/Amsterdam" {...handlers(setSingle)} />
      <p className="mt-3 text-center text-xs text-muted-foreground">With one way in, it stays protected until you connect another.</p>
    </div>
  );
}
