"use client";

import { useState, type ReactNode } from "react";

import { TimesheetGrid, type TimesheetEntries, type TimesheetProject } from "@rhs-ui/application/timesheet-grid";

// Fixed, so the demo reads the same today and next year: which day is today, and which days are over, is measured from here.
// Wednesday afternoon in Amsterdam.
const NOW = "2026-10-28T14:00:00Z";
const ZONE = "Europe/Amsterdam";

const PROJECTS: readonly TimesheetProject[] = [
  { id: "rebrand", name: "Halcyon rebrand", client: "Halcyon Foods" },
  { id: "app", name: "Kestrel mobile app", client: "Kestrel Labs" },
  { id: "retainer", name: "Support retainer", client: "Northwind Textiles" },
  { id: "meetings", name: "Team meetings", client: "Internal" },
  { id: "leave", name: "Time off", client: "Internal" },
];

// Monday is a full day, Tuesday is short by an hour and a half, and today is half done.
const THIS_WEEK: TimesheetEntries = {
  rebrand: { "2026-10-26": 5, "2026-10-27": 4, "2026-10-28": 2.5 },
  app: { "2026-10-26": 2, "2026-10-27": 1.5, "2026-10-28": 1.25 },
  retainer: { "2026-10-26": 0.5, "2026-10-28": 0.5 },
  meetings: { "2026-10-26": 0.5, "2026-10-27": 1 },
};

// A week that has been approved: one day went past the cap, one stayed short.
const LAST_WEEK: TimesheetEntries = {
  rebrand: { "2026-10-19": 4.5, "2026-10-20": 8, "2026-10-21": 3, "2026-10-22": 5, "2026-10-23": 3.5 },
  app: { "2026-10-19": 2.5, "2026-10-20": 4, "2026-10-21": 3.5, "2026-10-22": 2, "2026-10-23": 2.5 },
  retainer: { "2026-10-19": 0.5, "2026-10-20": 0.75, "2026-10-21": 0.5, "2026-10-22": 0.5 },
  meetings: { "2026-10-19": 0.5, "2026-10-20": 0.25, "2026-10-21": 0.5, "2026-10-22": 0.5 },
};

function Section({ title, summary, children }: { title: string; summary: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <section className="min-w-0">
      <h2 className="text-xl font-semibold tracking-[-0.02em]">{title}</h2>
      <p className="mt-1.5 mb-5 max-w-2xl text-sm text-muted-foreground">{summary}</p>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  const [entries, setEntries] = useState<TimesheetEntries>(THIS_WEEK);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-14 px-4 py-10 sm:px-6">
      <Section
        title="This week"
        summary="Click a cell, or use the arrow keys, and type hours the way you say them: 7.5, 7:30 or 7h 30m. Enter saves and moves down. Monday reached its target, Tuesday is short, and Wednesday is today."
      >
        <TimesheetGrid projects={PROJECTS} entries={entries} onChange={setEntries} defaultWeekStart="2026-10-26" now={NOW} timeZone={ZONE} locale="en-GB" />
      </Section>

      <Section
        title="A closed week"
        summary="The same grid for a week that has been approved, with hours as a clock. Every cell is read-only and the banner says why. Tuesday went past the cap and Friday stayed short, both said in words."
      >
        <TimesheetGrid
          projects={PROJECTS}
          defaultEntries={LAST_WEEK}
          defaultWeekStart="2026-10-19"
          now={NOW}
          timeZone={ZONE}
          locale="en-GB"
          format="clock"
          locked
          lockedReason="Approved by Mara Visser on 26 October. Ask a manager to reopen the week before changing it."
        />
      </Section>
    </div>
  );
}
