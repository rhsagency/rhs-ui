"use client";

import { useId, useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { CronField, type CronFieldProps } from "@rhs-ui/primitives/cron-field";
import { Label } from "@rhs-ui/primitives/label";

// A fixed moment, so the preview reads the same wherever it is opened: Monday 2 November 2026, 08:45 in Amsterdam.
const NOW = "2026-11-02T07:45:00Z";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Field({ label, ...props }: Omit<CronFieldProps, "id" | "value"> & { label: string }): React.JSX.Element {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <CronField id={id} now={NOW} {...props} />
    </div>
  );
}

function Digest(): React.JSX.Element {
  const id = useId();
  const [report, setReport] = useState({ expression: "0 9 * * 1-5", valid: true });
  const [saved, setSaved] = useState(false);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (report.valid) setSaved(true);
      }}
      className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs"
    >
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Schedule the sales digest</h2>
        <p className="text-xs text-muted-foreground">Type an expression or pick a preset. Times are Amsterdam time.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id}>Run schedule</Label>
        <CronField
          id={id}
          name="schedule"
          defaultValue="0 9 * * 1-5"
          timeZone="Europe/Amsterdam"
          locale="en-GB"
          now={NOW}
          onValueChange={(expression, state) => {
            setReport({ expression, valid: state.valid });
            setSaved(false);
          }}
        />
      </div>
      <Button type="submit" disabled={!report.valid}>
        Save schedule
      </Button>
      <p role="status" className="flex min-h-4 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        {saved ? (
          <span>Saved. The digest goes out on this schedule.</span>
        ) : (
          <>
            <span>Reported</span>
            <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">
              {JSON.stringify(report.expression)}, valid: {String(report.valid)}
            </code>
          </>
        )}
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: change the expression, or pick a preset from the menu">
          <Digest />
        </Example>
        <Example caption="A part that is wrong is named, and shown where it sits in the expression">
          <Field label="Cleanup job" defaultValue="0 25 * * *" timeZone="Europe/Amsterdam" locale="en-GB" />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Steps, ranges and names, on a New York clock with a 12-hour locale">
          <Field label="Order sync" defaultValue="*/15 9-17 * * mon-fri" timeZone="America/New_York" locale="en-US" />
        </Example>
        <Example caption="Clocks go forward on 28 March 2027, so 02:30 that night does not exist and is left out">
          <Field label="Backup" defaultValue="30 2 * * *" timeZone="Europe/Amsterdam" locale="en-GB" now="2027-03-27T12:00:00Z" />
        </Example>
        <Example caption="No menu, one run, and a shortcut">
          <Field label="Weekly report" defaultValue="@weekly" timeZone="UTC" locale="en-GB" presets={false} count={1} />
        </Example>
      </div>
    </div>
  );
}
