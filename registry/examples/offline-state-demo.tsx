"use client";

import { useState } from "react";

import { OfflineState } from "@rhs-ui/application/offline-state";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconCheck } from "@rhs-ui/icons";

const NOTES = [
  { title: "Supplier call, Thursday", edited: "Edited 14:32" },
  { title: "Spring range: first sketches", edited: "Edited yesterday" },
  { title: "Warehouse move checklist", edited: "Edited 28 October" },
] as const;

export default function Demo(): React.JSX.Element {
  const [online, setOnline] = useState(false);
  const [refetches, setRefetches] = useState(0);

  /** Stands in for the refetch a page does when the connection returns, or when Try again is pressed. */
  async function refetch() {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setRefetches((count) => count + 1);
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-sm leading-5 font-medium tracking-[-0.01em]">Northwind Notes</p>
          <p className="text-xs leading-5 text-muted-foreground">Switch the connection to see the state step in and out.</p>
        </div>
        <SegmentedControl
          label="Connection"
          value={online ? "online" : "offline"}
          onValueChange={(next) => setOnline(next === "online")}
          options={[
            { value: "online", label: "Online" },
            { value: "offline", label: "Offline" },
          ]}
        />
      </div>

      {/* The page stays mounted underneath. The state covers it while the connection is down and steps aside after "Back online". */}
      <div className="relative min-h-[34rem]">
        <section aria-labelledby="offline-demo-notes" className="mx-auto w-full max-w-lg px-4 py-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="offline-demo-notes" className="text-base font-semibold tracking-[-0.02em]">
              Recent notes
            </h2>
            <p className="text-xs text-muted-foreground tabular-nums">
              Refetched {refetches} {refetches === 1 ? "time" : "times"}
            </p>
          </div>
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
            {NOTES.map((note) => (
              <li key={note.title} className="flex items-baseline justify-between gap-4 px-4 py-3">
                <span className="min-w-0 truncate text-sm font-medium">{note.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{note.edited}</span>
              </li>
            ))}
          </ul>
        </section>

        <OfflineState online={online} onRetry={refetch} cachedAt="2026-11-02T14:32:00Z" locale="en-GB" timeZone="Europe/Amsterdam" className="absolute inset-0 z-10 min-h-0 bg-background">
          <ul>
            <li>
              <IconCheck className="size-4 shrink-0" />
              Read the notes saved on this device
            </li>
            <li>
              <IconCheck className="size-4 shrink-0" />
              Write new notes, which sync later
            </li>
            <li>
              <IconCheck className="size-4 shrink-0" />
              Search everything you have opened
            </li>
          </ul>
        </OfflineState>
      </div>
    </div>
  );
}
