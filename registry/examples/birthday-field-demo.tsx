"use client";

import { useId, useState, type ReactNode } from "react";

import { BirthdayField, type BirthdayFieldProps } from "@rhs-ui/primitives/birthday-field";
import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";

// The demos pin today, so the examples read the same on any day.
const TODAY = "2026-10-26";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Field({ label, ...props }: Omit<BirthdayFieldProps, "id" | "aria-labelledby"> & { label: string }): React.JSX.Element {
  const id = useId();
  const labelId = useId();
  return (
    <div className="grid justify-items-start gap-2.5">
      <Label id={labelId} htmlFor={id}>
        {label}
      </Label>
      <BirthdayField id={id} aria-labelledby={labelId} today={TODAY} {...props} />
    </div>
  );
}

function SignUp(): React.JSX.Element {
  const [report, setReport] = useState<{ value: string; valid: boolean }>({ value: "1991-07-23", valid: true });
  const [created, setCreated] = useState<string | null>(null);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (report.valid) setCreated(report.value);
      }}
      className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs"
    >
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Create your Halcyon account</h2>
        <p className="text-xs text-muted-foreground">Halcyon is for adults. Pick the month by name and type the year, so nobody scrolls back through the decades.</p>
      </div>
      <Field
        label="Date of birth"
        name="birthday"
        minAge={18}
        maxAge={120}
        defaultValue="1991-07-23"
        onValueChange={(value, state) => {
          setReport({ value, valid: state.valid });
          setCreated(null);
        }}
      />
      <Button type="submit" disabled={!report.valid}>
        Create account
      </Button>
      <p role="status" className="flex min-h-4 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        {created ? (
          <span>Account created, born {created}</span>
        ) : (
          <>
            <span>Reported</span>
            <code className="font-mono text-[0.6875rem] text-foreground">{JSON.stringify(report.value)}, valid: {String(report.valid)}</code>
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
        <Example caption="Try it: change the year to 2012 or the day to 31 February, and only the part that is wrong turns red">
          <SignUp />
        </Example>
        <Example caption="Under the age limit: the year is marked, in words that say why">
          <Field label="Date of birth" minAge={18} defaultValue="2012-05-09" />
        </Example>
        <Example caption="A day the month does not have is named, with the month">
          <Field label="Date of birth" defaultValue="1990-02-31" />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Netherlands: day first, months in Dutch, and the small labels in your own words">
          <Field
            label="Geboortedatum"
            locale="nl-NL"
            defaultValue="1994-03-14"
            labels={{ group: "Geboortedatum", day: "Dag", month: "Maand", year: "Jaar", yearPlaceholder: "JJJJ", monthPlaceholder: "Kies" }}
          />
        </Example>
        <Example caption="Japan writes the year first. Only the order follows the locale">
          <Field label="Date of birth" locale="ja-JP" defaultValue="1994-03-14" />
        </Example>
        <Example caption="maxAge catches a typo in the year before it becomes a person of 136">
          <Field label="Date of birth" maxAge={120} defaultValue="1890-01-01" />
        </Example>
        <Example caption="Disabled">
          <Field label="Date of birth" defaultValue="1994-03-14" disabled />
        </Example>
      </div>
    </div>
  );
}
