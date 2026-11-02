"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { InlineField } from "@rhs-ui/primitives/inline-field";
import { RadioGroup, RadioGroupItem } from "@rhs-ui/primitives/radio-group";
import { Switch } from "@rhs-ui/primitives/switch";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A link that goes nowhere in a preview, so a click on it never leaves the page. */
function Doc({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <a href="#" onClick={(event) => event.preventDefault()}>
      {children}
    </a>
  );
}

function SignUp(): React.JSX.Element {
  const [terms, setTerms] = useState(false);
  const [updates, setUpdates] = useState(true);
  const [digest, setDigest] = useState(false);
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(false);
  const error = tried && !terms ? "Accept the terms to create your account." : undefined;
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setTried(true);
        setDone(terms);
      }}
      className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-5 shadow-xs"
    >
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Create your Halcyon account</h2>
        <p className="text-xs text-muted-foreground">Tap anywhere on a row, text included. The links in the label open on their own.</p>
      </div>
      <div className="grid divide-y divide-border">
        <div className="pb-2.5">
          <InlineField
            required
            error={error}
            label={
              <>
                I agree to the <Doc>terms of service</Doc> and the <Doc>privacy policy</Doc>
              </>
            }
            description="You can change your mind later in Settings."
          >
            <Checkbox checked={terms} onCheckedChange={(next) => setTerms(next === true)} />
          </InlineField>
        </div>
        <div className="py-2.5">
          <InlineField placement="end" label="Product updates" description="A short email when Halcyon ships something new.">
            <Switch checked={updates} onCheckedChange={setUpdates} />
          </InlineField>
        </div>
        <div className="pt-2.5">
          <InlineField placement="end" label="Weekly digest" description="Monday morning, what your team did last week.">
            <Switch checked={digest} onCheckedChange={setDigest} />
          </InlineField>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p role="status" className="text-xs text-muted-foreground">
          {done ? "Account created. Welcome aboard." : ""}
        </p>
        <Button type="submit">Create account</Button>
      </div>
    </form>
  );
}

const TERMS = <>Accept the terms</>;

export default function Demo(): React.JSX.Element {
  const [delivery, setDelivery] = useState("standard");
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: press Create account without accepting the terms">
        <SignUp />
      </Example>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Radios: each one is its own field, the arrow keys still move between them">
          <RadioGroup aria-label="Delivery" value={delivery} onValueChange={setDelivery} className="gap-1">
            <InlineField label="Standard delivery" description="Free, arrives in 3 to 5 working days.">
              <RadioGroupItem value="standard" />
            </InlineField>
            <InlineField label="Express delivery" description="12.00 EUR, arrives tomorrow before noon.">
              <RadioGroupItem value="express" />
            </InlineField>
            <InlineField label="Pick up in store" description="Ready within 2 hours at Northwind Amsterdam.">
              <RadioGroupItem value="pickup" />
            </InlineField>
          </RadioGroup>
        </Example>

        <Example caption="Invalid: the same outline and the same message on all three">
          <div className="grid gap-1">
            <InlineField error="Accept the terms to continue." label={TERMS}>
              <Checkbox />
            </InlineField>
            <InlineField error="Turn this on to receive invoices." label="Send invoices by email">
              <Switch />
            </InlineField>
            <RadioGroup aria-label="Plan">
              <InlineField error="Pick a plan to continue." label="Team plan">
                <RadioGroupItem value="team" />
              </InlineField>
            </RadioGroup>
          </div>
        </Example>

        <Example caption="Disabled: the same dimming on all three">
          <div className="grid gap-1">
            <InlineField disabled label="Sync with calendar" description="Available on the Team plan.">
              <Checkbox defaultChecked />
            </InlineField>
            <InlineField disabled label="Two-factor sign-in" description="Your admin has turned this on for everyone.">
              <Switch defaultChecked />
            </InlineField>
            <RadioGroup aria-label="Billing" defaultValue="yearly">
              <InlineField disabled label="Billed yearly" description="Switch to monthly billing from the Billing page.">
                <RadioGroupItem value="yearly" />
              </InlineField>
            </RadioGroup>
          </div>
        </Example>
      </div>
    </div>
  );
}
