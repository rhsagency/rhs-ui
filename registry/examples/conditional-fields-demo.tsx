"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { ConditionalFields } from "@rhs-ui/application/conditional-fields";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { RadioGroup, RadioGroupItem } from "@rhs-ui/primitives/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { Textarea } from "@rhs-ui/primitives/textarea";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A label above one control. */
function Field({ id, label, children }: { id: string; label: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

/** One radio option with its text, the way a plain option sits next to the one that reveals fields. */
function Option({ id, value, label }: { id: string; value: string; label: string }): React.JSX.Element {
  return (
    <div className="grid grid-cols-[1.125rem_minmax(0,1fr)] items-center gap-x-3">
      <RadioGroupItem id={id} value={value} />
      <Label htmlFor={id} className="w-fit cursor-pointer leading-6">
        {label}
      </Label>
    </div>
  );
}

const WEEKDAYS = [
  ["monday", "Monday"],
  ["thursday", "Thursday"],
  ["friday", "Friday"],
] as const;

export default function Demo(): React.JSX.Element {
  const form = useRef<HTMLFormElement>(null);
  const [billing, setBilling] = useState(true);
  const [source, setSource] = useState("colleague");
  const [summary, setSummary] = useState(true);
  const [sent, setSent] = useState<readonly (readonly [string, string])[]>([]);

  // What the form would send, read from the form itself. Fields in a closed panel are disabled, so they are not in it.
  function read(): void {
    const element = form.current;
    if (!element) return;
    const next = [...new FormData(element).entries()].flatMap(([key, entry]) => (typeof entry === "string" ? [[key, entry] as const] : []));
    setSent((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next));
  }
  // After every render, once the page has settled: a Select puts its hidden field in a moment after it first draws.
  useEffect(() => {
    const frame = window.requestAnimationFrame(read);
    return () => window.cancelAnimationFrame(frame);
  });

  return (
    <form ref={form} onInput={read} onChange={read} onSubmit={(event) => event.preventDefault()} className="grid w-full max-w-lg min-w-0 gap-9">
      <Example caption="A checkbox. The address fields open beneath it, and what was typed is kept if you close and reopen them.">
        <ConditionalFields
          name="billing_different"
          checked={billing}
          onCheckedChange={setBilling}
          label="Billing address is different"
          description="Invoices for this order go to a separate address."
        >
          <Field id="cf-company" label="Company">
            <Input id="cf-company" name="billing_company" defaultValue="Northwind Studio" autoComplete="organization" />
          </Field>
          <Field id="cf-street" label="Street and number">
            <Input id="cf-street" name="billing_street" defaultValue="Keizersgracht 123" autoComplete="billing street-address" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
            <Field id="cf-postcode" label="Postcode">
              <Input id="cf-postcode" name="billing_postcode" defaultValue="1015 CJ" autoComplete="billing postal-code" />
            </Field>
            <Field id="cf-city" label="City">
              <Input id="cf-city" name="billing_city" defaultValue="Amsterdam" autoComplete="billing address-level2" />
            </Field>
          </div>
        </ConditionalFields>
      </Example>

      <Example caption="A radio option in a group. The group owns the choice, so the option is told whether it is the one.">
        <fieldset className="m-0 grid min-w-0 gap-3 border-0 p-0">
          <legend className="mb-3 p-0 text-sm font-medium">How did you hear about us?</legend>
          <RadioGroup name="source" value={source} onValueChange={setSource}>
            <Option id="cf-search" value="search" label="Search engine" />
            <Option id="cf-colleague" value="colleague" label="A colleague" />
            <ConditionalFields trigger="radio" value="other" checked={source === "other"} label="Something else" description="Tell us where, so we can thank them.">
              <Field id="cf-other" label="Where did you hear about us?">
                <Input id="cf-other" name="source_other" placeholder="A podcast, a talk, a billboard" />
              </Field>
            </ConditionalFields>
          </RadioGroup>
        </fieldset>
      </Example>

      <Example caption="A switch, the way a settings row sits. Its panel opens under the text.">
        <ConditionalFields
          trigger="switch"
          name="summary"
          checked={summary}
          onCheckedChange={setSummary}
          label="Weekly delivery summary"
          description="A Monday email with what shipped, what is late and what it cost."
        >
          <Field id="cf-summary-to" label="Send to">
            <Input id="cf-summary-to" type="email" name="summary_to" defaultValue="ops@northwind.example" autoComplete="email" />
          </Field>
          <Field id="cf-summary-day" label="Send on">
            <Select name="summary_day" defaultValue="monday">
              <SelectTrigger id="cf-summary-day">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAYS.map(([key, name]) => (
                  <SelectItem key={key} value={key}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </ConditionalFields>
      </Example>

      <Example caption="One inside another, with keepValues off: close the outer one and what was typed is cleared.">
        <ConditionalFields name="gift" keepValues={false} label="This order is a gift" description="We leave the prices off the packing slip.">
          <ConditionalFields name="gift_message_on" label="Add a gift message" description="Printed on a card, up to 200 characters.">
            <Field id="cf-gift-message" label="Message">
              <Textarea id="cf-gift-message" name="gift_message" rows={3} maxLength={200} placeholder="Happy birthday, Daan. See you on the 14th." />
            </Field>
          </ConditionalFields>
        </ConditionalFields>
      </Example>

      <section aria-labelledby="cf-sent" className="rounded-xl border border-border bg-muted/40 p-4">
        <h2 id="cf-sent" className="text-xs font-medium">
          What this form would send
        </h2>
        {sent.length === 0 ? (
          <p className="mt-2.5 font-mono text-xs text-muted-foreground">Nothing yet.</p>
        ) : (
          <dl className="mt-2.5 grid gap-1 font-mono text-xs">
            {sent.map(([key, entry], index) => (
              <div key={`${index}-${key}`} className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">{key}</dt>
                <dd className="min-w-0 [overflow-wrap:anywhere]">{entry === "" ? <span className="text-muted-foreground">(empty)</span> : entry}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </form>
  );
}
