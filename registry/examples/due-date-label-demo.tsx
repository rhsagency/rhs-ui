"use client";

import { useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconCircle, IconCheckCircle } from "@rhs-ui/icons";
import { DueDateLabel } from "@rhs-ui/primitives/due-date-label";

const MOMENTS = [
  { value: "2026-10-20T09:30:00Z", label: "20 Oct" },
  { value: "2026-10-23T00:01:00Z", label: "23 Oct" },
  { value: "2026-10-27T09:30:00Z", label: "27 Oct" },
] as const;

const ZONES = [
  { value: "UTC", label: "UTC" },
  { value: "Pacific/Auckland", label: "Auckland" },
  { value: "America/Lima", label: "Lima" },
] as const;

const TASKS = [
  { title: "Send Q4 invoices to Northwind", due: "2026-10-20" },
  { title: "Review Kestrel contract changes", due: "2026-10-18" },
  { title: "Ship v2.4 release notes", due: "2026-10-21" },
  { title: "Prepare the board deck", due: "2026-10-23" },
  { title: "Renew SSL certificates", due: "2026-10-12", doneAt: "2026-10-11T16:20:00Z" },
  { title: "Book the offsite venue", due: "2026-12-04" },
  { title: "Archive old campaign assets", due: null },
] as const;

type Task = (typeof TASKS)[number];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A segmented control with its name written above it. The control carries the accessible name itself, so the visible one is hidden from a screen reader. */
function Field({ label, children }: { label: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 gap-1.5">
      <span aria-hidden="true" className="text-xs text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function TaskList({ tasks, now, timeZone, showDate = false }: { tasks: readonly Task[]; now: string; timeZone: string; showDate?: boolean }): React.JSX.Element {
  return (
    <ul className="w-full divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
      {tasks.map((task) => {
        const done = "doneAt" in task;
        return (
          // The label sits under the title on a phone, lined up with its text, and at the end of the row from sm up.
          <li key={task.title} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1 px-4 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-x-3">
            {done ? <IconCheckCircle aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /> : <IconCircle aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}
            <span className={done ? "truncate text-sm font-medium text-muted-foreground line-through decoration-muted-foreground/50" : "truncate text-sm font-medium"}>{task.title}</span>
            <DueDateLabel date={task.due} doneAt={done ? task.doneAt : undefined} now={now} locale="en-GB" timeZone={timeZone} showDate={showDate} className="col-start-2 text-sm sm:col-start-3" />
          </li>
        );
      })}
    </ul>
  );
}

export default function Demo(): React.JSX.Element {
  const [now, setNow] = useState<string>(MOMENTS[0].value);
  const [timeZone, setTimeZone] = useState<string>("UTC");
  const zone = ZONES.find((option) => option.value === timeZone)?.label ?? timeZone;
  // What the wall clock reads in the chosen zone, so the effect of the zone is visible.
  const clock = new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(now));
  return (
    <div className="grid w-full max-w-2xl gap-9">
      <Example caption="Days are compared as calendar days in the zone you pick">
        <div className="grid w-full gap-2.5">
          <div className="flex w-full flex-wrap items-end gap-x-5 gap-y-3">
            <Field label="Now">
              <SegmentedControl label="Now" value={now} onValueChange={setNow} options={MOMENTS} />
            </Field>
            <Field label="Time zone">
              <SegmentedControl label="Time zone" value={timeZone} onValueChange={setTimeZone} options={ZONES} />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
            It is {clock} in {zone}
          </p>
        </div>
        <TaskList tasks={TASKS} now={now} timeZone={timeZone} />
      </Example>

      <Example caption="Compact keeps the sentence as its accessible name. Tap one, or Tab to it, for the full date">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-xs">
          <DueDateLabel date="2026-10-18" now={now} locale="en-GB" timeZone={timeZone} compact focusable />
          <DueDateLabel date="2026-10-20" now={now} locale="en-GB" timeZone={timeZone} compact focusable />
          <DueDateLabel date="2026-10-21" now={now} locale="en-GB" timeZone={timeZone} compact focusable />
          <DueDateLabel date="2026-10-30" now={now} locale="en-GB" timeZone={timeZone} compact focusable />
          <DueDateLabel date="2026-10-12" doneAt="2026-10-11T16:20:00Z" now={now} locale="en-GB" timeZone={timeZone} compact focusable />
        </div>
      </Example>

      <Example caption="showDate writes the date into the line: nothing to hover, so it reads on a phone and on paper">
        <TaskList tasks={[TASKS[1], TASKS[0], TASKS[3]]} now={now} timeZone={timeZone} showDate />
      </Example>
    </div>
  );
}
