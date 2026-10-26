"use client";

import { useId, useState, useSyncExternalStore, type ReactNode } from "react";

import { DueDateField, type DueDateFieldProps } from "@rhs-ui/primitives/due-date-field";
import { addDays, isoInZone } from "@rhs-ui/primitives/due-date-field/due-dates";
import { Label } from "@rhs-ui/primitives/label";

/** The day the examples are built around, and the zone it is read in. */
interface Clock {
  now: number;
  timeZone: string;
  today: string;
}

// The server and the first paint show a fixed Tuesday, 20 October 2026 in UTC. As soon as the page runs, the reader's own day and time zone take over, so the chips
// and the calendar's marked day are the same day and the dates in the examples stay as far from today as they are meant to be.
const FROZEN = Date.parse("2026-10-20T09:30:00Z");
const noSubscription = (): (() => void) => () => undefined;
let opened: number | null = null;
const readNow = (): number => (opened ??= Date.now());
const readZone = (): string => new Intl.DateTimeFormat("en-US").resolvedOptions().timeZone;

/** What the field reported, on one line that breaks at its spaces and never in the middle of a word. The readout is for the reader of the demo, so it is hidden from a screen reader. */
const show = (value: unknown): string => JSON.stringify(value, null, 1).replace(/\n\s*/g, " ");

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Field({ label, clock, ...props }: Omit<DueDateFieldProps, "aria-labelledby" | "now" | "timeZone" | "locale"> & { label: string; clock: Clock; locale?: string }): React.JSX.Element {
  const labelId = useId();
  return (
    <div className="grid justify-items-start gap-2.5">
      <Label id={labelId}>{label}</Label>
      <DueDateField aria-labelledby={labelId} now={clock.now} timeZone={clock.timeZone} locale="en-GB" {...props} />
    </div>
  );
}

function Checklist({ clock }: { clock: Clock }): React.JSX.Element {
  const labelId = useId();
  const [due, setDue] = useState<string | null>(addDays(clock.today, 3));
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Kestrel launch checklist</h2>
        <p className="text-xs text-muted-foreground">Send the press kit to the partner studios.</p>
      </div>
      <div className="grid justify-items-start gap-2.5">
        <Label id={labelId}>Due date</Label>
        <DueDateField aria-labelledby={labelId} name="due" now={clock.now} timeZone={clock.timeZone} locale="en-GB" value={due} onValueChange={setDue} />
      </div>
      <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">{show(due)}</code>
      </p>
    </form>
  );
}

function Examples({ clock }: { clock: Clock }): React.JSX.Element {
  const ahead = (days: number) => addDays(clock.today, days);
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: pick Tomorrow or Next week, or open the calendar. The line says the weekday and how far away it is">
          <Checklist clock={clock} />
        </Example>
        <Example caption="A date that has passed says so in words and with an icon, not by colour alone">
          <Field label="Invoice due" clock={clock} defaultValue={ahead(-2)} />
        </Example>
        <Example caption="No date is a choice of its own: the chip is selected until a date is picked">
          <Field label="Follow-up" clock={clock} defaultValue={null} />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="chips replaces the quick picks, and allowClear={false} takes No date away">
          <Field
            label="Reminder"
            clock={clock}
            allowClear={false}
            defaultValue={ahead(3)}
            chips={[
              { id: "soon", label: "In 2 days", date: (today) => addDays(today, 2) },
              { id: "week", label: "In a week", date: (today) => addDays(today, 7) },
              { id: "month", label: "In a month", date: (today) => addDays(today, 30) },
            ]}
          />
        </Example>
        <Example caption="The locale and labels make it Dutch: dates, distances and every word">
          <Field
            label="Deadline"
            clock={clock}
            locale="nl-NL"
            defaultValue={ahead(3)}
            labels={{
              group: "Deadline",
              today: "Vandaag",
              tomorrow: "Morgen",
              nextWeek: "Volgende week",
              pick: "Kies een datum",
              none: "Geen datum",
              noDate: "Geen deadline",
              overdue: (distance) => `${distance} te laat`,
              calendar: "Kies een deadline",
            }}
          />
        </Example>
        <Example caption="Disabled">
          <Field label="Due date" clock={clock} disabled defaultValue={ahead(1)} />
        </Example>
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const now = useSyncExternalStore(noSubscription, readNow, () => FROZEN);
  const timeZone = useSyncExternalStore(noSubscription, readZone, () => "UTC");
  const today = isoInZone(now, timeZone) ?? "2026-10-20";
  // Nobody has touched the examples when the reader's day arrives, so they simply start again from it.
  return <Examples key={`${today}|${timeZone}`} clock={{ now, timeZone, today }} />;
}
