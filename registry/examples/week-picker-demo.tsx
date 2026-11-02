"use client";

import { useId, useState, type ReactNode } from "react";

import { Label } from "@rhs-ui/primitives/label";
import { WeekCalendar, WeekPicker, type WeekPickerProps, type WeekValue } from "@rhs-ui/primitives/week-picker";

// The demo is set on Wednesday 21 October 2026, so the marker on today and "This week" read the same for everyone.
const NOW = "2026-10-21";
const WEEK_43: WeekValue = { start: "2026-10-19", end: "2026-10-25", week: 43, year: 2026 };
const WEEK_42: WeekValue = { start: "2026-10-12", end: "2026-10-18", week: 42, year: 2026 };

const DUTCH = {
  field: "Week",
  placeholder: "Kies een week",
  week: (number: number) => `Week ${number}`,
  previous: "Vorige week",
  next: "Volgende week",
  previousMonth: "Vorige maand",
  nextMonth: "Volgende maand",
  weekNumber: "Weeknummer",
  weekShort: "Wk",
  thisWeek: "Deze week",
};

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

function Field({ label, ...props }: Omit<WeekPickerProps, "id" | "value" | "aria-labelledby"> & { label: string }): React.JSX.Element {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <WeekPicker id={id} now={NOW} {...props} />
    </div>
  );
}

function Timesheet(): React.JSX.Element {
  const id = useId();
  const [week, setWeek] = useState<WeekValue | null>(WEEK_43);
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Northwind timesheet</h2>
        <p className="text-xs text-muted-foreground">Pick the week you are filing hours for. Weeks run Monday to Sunday.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id}>Week</Label>
        <WeekPicker id={id} name="week" now={NOW} value={week} onValueChange={setWeek} />
      </div>
      <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">{show(week)}</code>
      </p>
    </form>
  );
}

function Inline(): React.JSX.Element {
  const [week, setWeek] = useState<WeekValue | null>(WEEK_42);
  return (
    <div className="grid justify-items-start gap-3">
      <div className="rounded-xl border border-border bg-card shadow-xs">
        <WeekCalendar now={NOW} value={week} onValueChange={setWeek} />
      </div>
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {week ? `Selected: week ${week.week}, ${week.start} to ${week.end}` : "No week selected"}
      </p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: step with the arrows, or open the grid and click any day to take its whole week">
          <Timesheet />
        </Example>
        <Example caption="US numbering: weeks start on Sunday and week 1 is the week with 1 January">
          <Field label="Reporting week" numbering="us" locale="en-US" defaultValue={{ start: "2026-10-18", end: "2026-10-24", week: 43, year: 2026 }} />
        </Example>
        <Example caption="Another language: names, numerals and the span follow the locale, and every word can be replaced">
          <Field label="Werkweek" locale="nl-NL" labels={DUTCH} defaultValue={WEEK_43} />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="The grid on its own, for a place where a week should always be in view">
          <Inline />
        </Example>
        <Example caption="min and max: a week is open while any of its days is in range, so the next arrow stops here">
          <Field label="Filing window" min="2026-09-28" max="2026-10-25" defaultValue={WEEK_43} />
        </Example>
        <Example caption="Empty: the arrows wait for a week to step from">
          <Field label="Sprint week" />
        </Example>
        <Example caption="Disabled">
          <Field label="Closed period" disabled defaultValue={WEEK_42} />
        </Example>
      </div>
    </div>
  );
}
