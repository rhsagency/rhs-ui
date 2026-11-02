"use client";

import { useId, useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { DisabledReason } from "@rhs-ui/primitives/disabled-reason";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Checkout(): React.JSX.Element {
  const terms = useId();
  const [accepted, setAccepted] = useState(false);
  const [paid, setPaid] = useState(false);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setPaid(true);
      }}
      className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs"
    >
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Complete your Northwind order</h2>
        <p className="text-xs text-muted-foreground">Three items, delivered to Amsterdam on Thursday.</p>
      </div>
      <div className="flex items-center gap-2.5">
        <Checkbox
          id={terms}
          checked={accepted}
          onCheckedChange={(next) => {
            setAccepted(next === true);
            setPaid(false);
          }}
        />
        <Label htmlFor={terms} className="font-normal">
          I accept the terms and conditions
        </Label>
      </div>
      {/* The button is as wide as the card, so the tooltip above it stays inside the card at any width; the extra space is the room the tooltip needs, so it never covers the line above. */}
      <div className="mt-8 grid gap-2">
        <DisabledReason disabled={!accepted} reason="Accept the terms to continue." placement="top" defaultOpen>
          <Button type="submit" className="w-full">
            Pay 218.00 EUR
          </Button>
        </DisabledReason>
        <p role="status" className="min-h-4 text-center text-xs text-muted-foreground">
          {paid ? "Paid. A receipt is on its way." : ""}
        </p>
      </div>
    </form>
  );
}

function Locked(): React.JSX.Element {
  const company = useId();
  const sso = useId();
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor={company}>Company name</Label>
        <DisabledReason disabled reason="Locked after the first invoice. Contact support to change it.">
          <Input id={company} defaultValue="Kestrel Trading BV" />
        </DisabledReason>
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={sso}>Require single sign-on</Label>
        <DisabledReason disabled reason="Managed by your workspace admin." placement="left">
          <Switch id={sso} defaultChecked />
        </DisabledReason>
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: tick the box and the tooltip, the description and the dimming all go with the wrapper">
        <Checkout />
      </Example>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="A field and a switch: both stay focusable, the field cannot be typed in, and hover or focus says why">
          <Locked />
        </Example>
        <Example caption="Printed under the control, for a touch screen where there is no hover">
          <div>
            <DisabledReason disabled inline reason="Select at least one invoice to export.">
              <Button variant="outline">Export 0 invoices</Button>
            </DisabledReason>
          </div>
        </Example>
      </div>
    </div>
  );
}
