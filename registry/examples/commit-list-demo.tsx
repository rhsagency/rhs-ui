"use client";

import { useState } from "react";

import { CommitList, type Commit } from "@rhs-ui/application/commit-list";
import { IconGitBranch } from "@rhs-ui/icons";

// A fixed "now" keeps "25 minutes ago" the same on every load. In an app, leave `now` out and the list reads the browser's clock.
const NOW = Date.parse("2026-10-29T15:20:00Z");
const minutes = (count: number) => NOW - count * 60_000;

const COMMITS: readonly Commit[] = [
  {
    hash: "3f9a2c1e84b05d7a6c2f19e0b4a8d3c5f7e1a902",
    message: "Retry failed webhook deliveries with exponential backoff",
    body: "Deliveries that answer with a 5xx are retried after 1, 5 and 25 minutes, then parked in the dead-letter queue for a manual replay.\n\nCloses #1184.",
    author: { name: "Mara Okafor" },
    committedAt: minutes(25),
    status: "running",
    href: "/ledger-core/commit/3f9a2c1",
  },
  {
    hash: "b71d0e48a2c95f3617ed8b0a4c29f6d1e5a3c7b8",
    message: "Fix VAT rounding on multi-currency invoices",
    author: { name: "Leo Martins" },
    committedAt: minutes(130),
    status: "success",
    href: "/ledger-core/commit/b71d0e4",
  },
  {
    hash: "5c20e9f7d3b14a86e0c52f9a7b3d18e4c6a0f2d1",
    message: "Merge pull request #482 from northwind/ledger-sync",
    body: "Sync the ledger with the bank feed every 15 minutes instead of nightly, and show the time of the last sync on the invoices page.",
    author: { name: "Sofia Rossi" },
    committedAt: minutes(240),
    status: "success",
    merge: true,
    href: "/ledger-core/commit/5c20e9f",
  },
  {
    hash: "e84a1b6c9d02f573a8e1c40b7d9f2a6358c1e0b4",
    message: "Add idempotency keys to the payments API",
    body: "A repeated POST /v1/payments with the same Idempotency-Key now returns the first response instead of charging twice. Keys expire after 24 hours.",
    author: { name: "Priya Nair" },
    committedAt: Date.parse("2026-10-28T16:42:00Z"),
    status: "success",
    href: "/ledger-core/commit/e84a1b6",
  },
  {
    hash: "09d6f3a5b81c4e27d0a9b6f18c3e5d7a2b4f6c90",
    message: "Bump next from 16.0.3 to 16.0.4",
    author: { name: "release-bot" },
    committedAt: Date.parse("2026-10-28T09:05:00Z"),
    status: "failure",
    href: "/ledger-core/commit/09d6f3a",
  },
  {
    hash: "a2c47e90f1b63d85c7e4a09b2d6f8135e0c9a4b7",
    message: "Document the export schema",
    author: { name: "Dan Cho" },
    committedAt: Date.parse("2026-10-28T07:48:00Z"),
    status: "pending",
    href: "/ledger-core/commit/a2c47e9",
  },
  {
    hash: "7e15b3d8a0c9f246e1b7d58a3c0f9e62b4d7a1c5",
    message: 'Revert "Cache invoice previews for ten minutes"',
    body: "This reverts commit 9ab41e0. Cached previews showed stale totals after an invoice was edited.",
    author: { name: "Hana Sato" },
    committedAt: Date.parse("2026-10-22T13:10:00Z"),
    status: "success",
    href: "/ledger-core/commit/7e15b3d",
  },
  {
    hash: "c93e60a7d1f4b852a0e9c3d7b6f1048e5a2c7d93",
    message: "Cancel stale preview deployments on push",
    author: { name: "Tomas Brandt" },
    committedAt: Date.parse("2026-10-22T08:31:00Z"),
    status: "cancelled",
    href: "/ledger-core/commit/c93e60a",
  },
];

export default function Demo(): React.JSX.Element {
  const [opened, setOpened] = useState<string | null>(null);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.02em]">Commits</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <IconGitBranch className="size-4" />
            northwind/ledger-core on <span className="font-mono text-[0.8125rem] text-foreground">main</span>
          </p>
        </div>
        <p role="status" className="text-xs text-muted-foreground">
          {opened ? (
            <>
              Opened <span className="font-mono text-foreground">{opened}</span>
            </>
          ) : (
            "Press a subject to open its commit."
          )}
        </p>
      </div>
      <CommitList
        commits={COMMITS}
        now={NOW}
        onSelect={(commit, event) => {
          // A preview has nowhere to go: a router would navigate here.
          event.preventDefault();
          setOpened(commit.hash.slice(0, 7));
        }}
      />
    </div>
  );
}
