"use client";

import { useId, useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { DateField, type DateFieldProps } from "@rhs-ui/primitives/date-field";
import { Label } from "@rhs-ui/primitives/label";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Field({ label, ...props }: Omit<DateFieldProps, "id" | "aria-labelledby"> & { label: string }): React.JSX.Element {
  const id = useId();
  const labelId = useId();
  return (
    <div className="grid justify-items-start gap-2">
      <Label id={labelId} htmlFor={id}>
        {label}
      </Label>
      <DateField id={id} aria-labelledby={labelId} {...props} />
    </div>
  );
}

function Delivery(): React.JSX.Element {
  const [report, setReport] = useState<{ value: string; valid: boolean } | null>(null);
  const [booked, setBooked] = useState<string | null>(null);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (report?.valid) setBooked(report.value);
      }}
      className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs"
    >
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Book a Northwind delivery</h2>
        <p className="text-xs text-muted-foreground">Type the date, step a part with the arrow keys, or open the calendar. We deliver from 1 March to 31 December.</p>
      </div>
      <Field
        label="Delivery date"
        name="delivery"
        showCalendar
        min="2026-03-01"
        max="2026-12-31"
        onValueChange={(value, state) => {
          setReport({ value, valid: state.valid });
          setBooked(null);
        }}
      />
      <Button type="submit" disabled={!report?.valid}>
        Book this date
      </Button>
      <p role="status" className="flex min-h-4 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        {booked ? (
          <span>Booked for {booked}</span>
        ) : (
          <>
            <span>Reported</span>
            <code className="font-mono text-[0.6875rem] text-foreground">{report ? `${JSON.stringify(report.value)}, valid: ${String(report.valid)}` : "nothing yet"}</code>
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
        <Example caption="Try it: the parts hand over to each other as you type, and the calendar writes its pick back">
          <Delivery />
        </Example>
        <Example caption="31 February is explained in words, once all three parts are filled">
          <Field label="Invoice date" defaultValue="2026-02-31" />
        </Example>
        <Example caption="A date outside min and max says which side it is on">
          <Field label="Delivery date" defaultValue="2026-07-04" min="2026-03-01" max="2026-06-30" />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="United States: month, day, year">
          <Field label="Start date" locale="en-US" defaultValue="2026-03-14" />
        </Example>
        <Example caption="Netherlands: day, month, year, with the separator the locale uses">
          <Field label="Startdatum" locale="nl-NL" defaultValue="2026-03-14" />
        </Example>
        <Example caption="Sweden: year, month, day. Only the order and the separator follow the locale">
          <Field label="Startdatum" locale="sv-SE" defaultValue="2026-03-14" />
        </Example>
        <Example caption="Disabled">
          <Field label="Start date" defaultValue="2026-03-14" disabled showCalendar />
        </Example>
      </div>
    </div>
  );
}
