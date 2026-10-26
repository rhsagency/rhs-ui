"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Label } from "@rhs-ui/primitives/label";
import { PercentageField, type PercentageFieldProps } from "@rhs-ui/primitives/percentage-field";

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

/** A field that has been left once already, so the preview shows what it says afterwards. */
function Left({ children }: { children: ReactNode }): React.JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Only when nothing has focus: a preview must never take it from a page the reader is already using.
    if (document.activeElement && document.activeElement !== document.body) return;
    const input = box.current?.querySelector("input");
    input?.focus({ preventScroll: true });
    input?.blur();
    // The focus and blur leave the browser's starting point for the Tab key in the field; give it back to the page.
    document.body.tabIndex = -1;
    document.body.focus({ preventScroll: true });
    document.body.removeAttribute("tabindex");
  }, []);
  return <div ref={box}>{children}</div>;
}

function Field({ label, leave, ...props }: Omit<PercentageFieldProps, "id" | "value"> & { label: string; leave?: boolean }): React.JSX.Element {
  const id = useId();
  const field = (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <PercentageField id={id} {...props} />
    </div>
  );
  return leave ? <Left>{field}</Left> : field;
}

function Commission(): React.JSX.Element {
  const id = useId();
  const [rate, setRate] = useState<number | null>(20);
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Northwind partner commission</h2>
        <p className="text-xs text-muted-foreground">What a partner earns on the 480.00 EUR Halcyon starter kit.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id}>Commission rate</Label>
        <PercentageField id={id} name="commission" value={rate} onValueChange={setRate} base={48000} currency="EUR" />
      </div>
      <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">{show(rate)}</code>
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: type 12,5, 12.5 or 12.5%. The arrow keys step by 1, Shift by 10">
          <Commission />
        </Example>
        <Example caption="step and precision suit a rate in quarters, and the percent sign sits right behind the number">
          <Field label="Savings interest" defaultValue={4.75} step={0.25} />
        </Example>
        <Example caption="Without a base it is only the number, written the locale's way">
          <Field label="BTW-tarief" locale="nl-NL" defaultValue={21} precision={1} />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="A number outside min and max is brought in when you leave the field, and the line says so">
          <Field label="Discount" leave defaultValue={75} max={60} base={129900} currency="USD" />
        </Example>
        <Example caption="The sentence follows the number as it changes, in the currency's own decimals">
          <Field label="Import duty" defaultValue={12.5} base={4800000} currency="JPY" />
        </Example>
        <Example caption="Disabled">
          <Field label="Commission rate" disabled defaultValue={20} base={48000} currency="EUR" />
        </Example>
      </div>
    </div>
  );
}
