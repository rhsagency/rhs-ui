"use client";

import { useEffect, useState } from "react";

import { TimeTracker } from "@rhs-ui/application/time-tracker";
import { formatClock } from "@rhs-ui/application/time-tracker/time";

interface Clock {
  running: boolean;
  startedAt: number | null;
  accumulated: number;
}

interface Entry {
  id: number;
  what: string;
  total: number;
}

const MINUTE = 60_000;

/** A tracker that keeps its own three numbers, the way an app would keep them in its store. */
function Tracked({ initial, label, descriptionLabel, defaultDescription, onRecord }: { initial: () => Clock; label: string; descriptionLabel?: string; defaultDescription?: string; onRecord: (what: string, total: number) => void }): React.JSX.Element {
  const [clock, setClock] = useState(initial);
  // "Running since 4:25 PM" is written in the visitor's own time zone. The component's default is UTC, so the server and the browser agree on first paint; the zone is read once the page is live.
  const [zone, setZone] = useState("UTC");
  useEffect(() => {
    setZone(Intl.DateTimeFormat("en-US").resolvedOptions().timeZone);
  }, []);
  return (
    <TimeTracker
      label={label}
      timeZone={zone}
      running={clock.running}
      startedAt={clock.startedAt}
      accumulated={clock.accumulated}
      descriptionLabel={descriptionLabel}
      defaultDescription={defaultDescription}
      onStart={(at) => setClock((current) => ({ ...current, running: true, startedAt: at }))}
      onPause={(total) => setClock({ running: false, startedAt: null, accumulated: total })}
      onStop={(total, what) => {
        setClock({ running: false, startedAt: null, accumulated: 0 });
        onRecord(what || label, total);
      }}
    />
  );
}

export default function Demo(): React.JSX.Element {
  const [log, setLog] = useState<readonly Entry[]>([
    { id: 1, what: "Sprint planning", total: 75 * MINUTE },
    { id: 2, what: "Supplier call notes", total: 32 * MINUTE + 18_000 },
  ]);
  const record = (what: string, total: number) => setLog((current) => [{ id: Date.now(), what, total }, ...current]);
  const sum = log.reduce((all, entry) => all + entry.total, 0);

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-lg gap-8">
        <div className="grid gap-3">
          <Tracked
            label="Checkout redesign"
            descriptionLabel="What are you working on?"
            defaultDescription="Reviewing the checkout flow with Priya"
            // Twelve minutes and forty-one seconds into a run that began when the page opened.
            initial={() => ({ running: true, startedAt: Date.now() - (12 * MINUTE + 41_000), accumulated: 0 })}
            onRecord={record}
          />
          <p className="text-xs text-muted-foreground">Pause and resume, then stop to add a line to today's log. The time comes from timestamps, so it stays right when the tab sleeps.</p>
          <section aria-labelledby="tracker-demo-log" className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
            <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3">
              <h2 id="tracker-demo-log" className="text-sm font-semibold tracking-[-0.01em]">
                Today
              </h2>
              <p className="text-xs text-muted-foreground tabular-nums">{formatClock(sum)} tracked</p>
            </div>
            <ul className="divide-y divide-border" aria-live="polite">
              {log.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                  <span className="min-w-0 truncate">{entry.what}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">{formatClock(entry.total)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid gap-2">
          <p className="text-xs text-muted-foreground">Ready, and paused with time already on it.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Tracked label="Supplier call notes" initial={() => ({ running: false, startedAt: null, accumulated: 0 })} onRecord={record} />
            <Tracked label="Photography brief" initial={() => ({ running: false, startedAt: null, accumulated: 84 * MINUTE + 7_000 })} onRecord={record} />
          </div>
        </div>
      </div>
    </div>
  );
}
