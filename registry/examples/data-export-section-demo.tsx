"use client";

import { useEffect, useRef, useState } from "react";

import { DataExportSection, type DataExportGroup, type DataExportRecord } from "@rhs-ui/application/data-export-section";

// A fixed "now" keeps the relative dates in this preview stable.
const NOW = "2026-10-20T09:30:00Z";
const MINUTE = 60_000;
const WEEK = 7 * 24 * 60 * MINUTE;

const GROUPS: DataExportGroup[] = [
  { id: "profile", label: "Profile", description: "Name, email address, avatar and preferences." },
  { id: "projects", label: "Projects", description: "Every project you own, with settings and members." },
  { id: "comments", label: "Comments", description: "What you wrote, with the time you wrote it." },
  { id: "activity", label: "Activity log", description: "Sign-ins and changes from the last 12 months." },
];

const sample = (name: string) => `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ export: name, note: "A sample file for this preview." }, null, 2))}`;

const EARLIER: DataExportRecord[] = [
  { id: "exp_4d1f", requestedAt: "2026-10-19T08:12:00Z", status: "ready", size: 48_200_000, expiresAt: "2026-10-26T08:12:00Z", href: sample("exp_4d1f") },
  { id: "exp_c93a", requestedAt: "2026-09-02T14:40:00Z", status: "expired", size: 31_400_000, expiresAt: "2026-09-09T14:40:00Z" },
];

function Caption({ children }: { children: string }): React.JSX.Element {
  return <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">{children}</p>;
}

export default function Demo(): React.JSX.Element {
  const [records, setRecords] = useState<DataExportRecord[]>(EARLIER);
  // Every request counts up, so each one is its own row: its own id, a minute later than the last, expiring a week after it was asked for.
  const sequence = useRef(0);
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const scheduled = timers.current;
    return () => scheduled.forEach((timer) => window.clearTimeout(timer));
  }, []);

  function request() {
    return new Promise<void>((resolve) => {
      timers.current.push(
        window.setTimeout(() => {
          sequence.current += 1;
          const id = `exp_${sequence.current}`;
          const asked = Date.parse(NOW) + sequence.current * MINUTE;
          const requestedAt = new Date(asked).toISOString();
          setRecords((list) => [{ id, requestedAt, status: "preparing" }, ...list]);
          // A real backend would email the person; here the file turns up after a few seconds.
          timers.current.push(
            window.setTimeout(() => {
              setRecords((list) => list.map((record) => (record.id === id ? { ...record, status: "ready", size: 12_600_000, expiresAt: new Date(asked + WEEK).toISOString(), href: sample(id) } : record)));
            }, 5000),
          );
          resolve();
        }, 700),
      );
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-14 px-4 py-12 sm:px-6">
      <div>
        <Caption>With earlier exports</Caption>
        <DataExportSection groups={GROUPS} exports={records} onRequest={request} locale="en-GB" timeZone="Europe/Amsterdam" now={NOW} />
      </div>
      <div>
        <Caption>First visit</Caption>
        <DataExportSection groups={GROUPS} exports={[]} onRequest={() => undefined} defaultGroups={["profile", "comments"]} defaultFormat="csv" locale="en-GB" timeZone="Europe/Amsterdam" now={NOW} />
      </div>
    </div>
  );
}
