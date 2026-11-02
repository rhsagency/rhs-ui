"use client";

import { useId, useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { LimitField } from "@rhs-ui/primitives/limit-field";

function Example({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Frame({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="rounded-xl border border-border bg-card p-5 shadow-xs">{children}</div>;
}

function DiscountCode(): React.JSX.Element {
  const id = useId();
  const [uses, setUses] = useState<number | null>(100);
  const [perCustomer, setPerCustomer] = useState<number | null>(null);
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.02em]">New discount code</h2>
        <p className="text-xs text-muted-foreground">20% off the Halcyon starter kit, until the end of the month.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id}>Code</Label>
        <Input id={id} defaultValue="SPRING20" autoComplete="off" spellCheck={false} className="font-mono uppercase" />
      </div>
      <div className="grid gap-4 border-t border-border pt-5">
        <LimitField label="Limit uses" name="uses" unit={{ one: "use", other: "uses" }} max={10000} value={uses} onValueChange={setUses} />
        <LimitField label="Limit per customer" name="per-customer" unit="per customer" max={25} defaultLimit={1} value={perCustomer} onValueChange={setPerCustomer} />
      </div>
      <Button type="submit">Create code</Button>
      {/* What the fields reported is for the reader of the demo, so a screen reader is not read it on every change. */}
      <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] text-foreground">{JSON.stringify({ uses, perCustomer })}</code>
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: turn a switch on and the number takes the focus. Turn it off and on again, and the last number comes back">
        <DiscountCode />
      </Example>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Unlimited is a state, not a zero. The unit follows the number: 1 seat, 10 seats">
          <Frame>
            <LimitField label="Seat limit" unit={{ one: "seat", other: "seats" }} min={1} max={250} defaultLimit={10} />
          </Frame>
        </Example>
        <Example caption="With a ceiling, and a unit that stays the same">
          <Frame>
            <LimitField label="Storage quota" unit="GB" min={5} max={500} defaultLimit={50} defaultValue={120} offLabel="No quota" />
          </Frame>
        </Example>
        <Example caption="Disabled">
          <Frame>
            <LimitField label="Limit downloads" unit="downloads" defaultValue={250} disabled />
          </Frame>
        </Example>
      </div>
    </div>
  );
}
