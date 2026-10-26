"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { RecipientField, type Recipient, type RecipientFieldProps } from "@rhs-ui/primitives/recipient-field";

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

const CONTACTS: Recipient[] = [
  { email: "ines@orbit.example", name: "Ines Marchetti" },
  { email: "marit@halcyon.example", name: "Marit de Vries" },
  { email: "jan.vries@kestrel.example", name: "Jan Vries" },
  { email: "zoe@northwind.example", name: "Zoë Arnaud" },
  { email: "dana@northwind.example", name: "Dana Okafor" },
  { email: "tomas@halcyon.example", name: "Tomás Reyes" },
  { email: "priya@orbit.example", name: "Priya Raman" },
  { email: "support@kestrel.example" },
];

function Compose(): React.JSX.Element {
  const [people, setPeople] = useState<Recipient[]>([{ email: "ines@orbit.example", name: "Ines Marchetti" }]);
  const [valid, setValid] = useState(true);
  const [sent, setSent] = useState<number | null>(null);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (valid && people.length) setSent(people.length);
      }}
      className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-5 shadow-xs"
    >
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">New message</h2>
        <p className="text-xs text-muted-foreground">Share the Halcyon press kit with your partners.</p>
      </div>
      <RecipientField
        name="to"
        contacts={CONTACTS}
        value={people}
        onValueChange={(next, state) => {
          setPeople(next);
          setValid(state.valid);
          setSent(null);
        }}
      />
      <div className="grid gap-2">
        <Label htmlFor="compose-subject">Subject</Label>
        <Input id="compose-subject" defaultValue="Halcyon press kit, October" />
      </div>
      <Button type="submit" disabled={!valid || people.length === 0}>
        {people.length > 1 ? `Send to ${people.length} people` : "Send"}
      </Button>
      <div className="grid border-t border-border pt-4 text-xs text-muted-foreground">
        <p role="status">{sent !== null ? `Sent to ${sent} ${sent === 1 ? "recipient" : "recipients"}` : null}</p>
        {sent !== null ? null : (
          <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span>Reported</span>
            <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">{show(people.map((person) => person.email))}</code>
          </p>
        )}
      </div>
    </form>
  );
}

function Field(props: RecipientFieldProps): React.JSX.Element {
  return <RecipientField contacts={CONTACTS} {...props} />;
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: type ma or vries for suggestions, or paste a list: marit@halcyon.example, dana@northwind.example; jan@kestrel">
          <Compose />
        </Example>
        <Example caption="An address that fails the check stays as a chip, with the reason in words. Click it, or press Enter on it, to fix it in place">
          <Field
            defaultValue={[
              { email: "ines@orbit.example", name: "Ines Marchetti" },
              { email: "marit@@halcyon.example" },
              { email: "jan.vries@kestrel" },
              { email: "dana@northwind.example", name: "Dana Okafor" },
            ]}
          />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Empty: the field says what to type, and the arrow keys reach the chips once there are some">
          <Field />
        </Example>
        <Example caption="max stops at the limit and says so, instead of dropping the rest in silence">
          <Field
            max={3}
            label="Cc"
            defaultValue={[
              { email: "zoe@northwind.example", name: "Zoë Arnaud" },
              { email: "tomas@halcyon.example", name: "Tomás Reyes" },
              { email: "priya@orbit.example", name: "Priya Raman" },
            ]}
          />
        </Example>
        <Example caption="Your own check, with its own reason: only Northwind addresses here">
          <Field
            label="Share with"
            validate={(email) => (email.endsWith("@northwind.example") ? true : "Only northwind.example addresses can be added")}
            defaultValue={[
              { email: "zoe@northwind.example", name: "Zoë Arnaud" },
              { email: "ines@orbit.example", name: "Ines Marchetti" },
            ]}
          />
        </Example>
        <Example caption="Disabled">
          <Field disabled defaultValue={[{ email: "ines@orbit.example", name: "Ines Marchetti" }]} />
        </Example>
      </div>
    </div>
  );
}
