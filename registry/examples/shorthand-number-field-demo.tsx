"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Label } from "@rhs-ui/primitives/label";
import { ShorthandNumberField, type ShorthandNumberFieldProps } from "@rhs-ui/primitives/shorthand-number-field";

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

/** Types into the input of what it wraps, and leaves the field unless told to stay, so the preview shows what it says at that moment. The focus is never touched: a preview must not take it from a page the reader is already using. */
function Typed({ text, leave = true, children }: { text: string; leave?: boolean; children: ReactNode }): React.JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    const input = box.current?.querySelector("input");
    if (!input) return;
    done.current = true;
    // React listens for the input event, and only sees a value that was set through the native setter.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    // Leaving is a separate moment, as it is for a person: the field has drawn what was typed by then.
    if (leave) window.setTimeout(() => input.dispatchEvent(new FocusEvent("focusout", { bubbles: true })), 60);
  }, [text, leave]);
  return <div ref={box}>{children}</div>;
}

function Field({ label, typed, leave, ...props }: Omit<ShorthandNumberFieldProps, "id" | "value" | "aria-labelledby"> & { label: string; typed?: string; leave?: boolean }): React.JSX.Element {
  const id = useId();
  const field = (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <ShorthandNumberField id={id} {...props} />
    </div>
  );
  return typed === undefined ? field : <Typed text={typed} leave={leave}>{field}</Typed>;
}

function Target(): React.JSX.Element {
  const id = useId();
  const [audience, setAudience] = useState<{ value: number | null; valid: boolean }>({ value: 1200000, valid: true });
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Northwind launch target</h2>
        <p className="text-xs text-muted-foreground">How many people should see the Halcyon campaign? Type it short and press Enter.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id}>Audience</Label>
        <ShorthandNumberField
          id={id}
          name="audience"
          unit="people"
          min={1000}
          max={50000000}
          defaultValue={1200000}
          onValueChange={(value, state) => setAudience({ value, valid: state.valid })}
        />
      </div>
      <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">{show(audience)}</code>
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: type 250k, 1.2M, 3b or 2 million. The full figure appears under the field before you commit">
          <Target />
        </Example>
        <Example caption="Typing 1,2k: a decimal comma works as well as a point, and the figure is shown before it is committed">
          <Field label="Followers goal" typed="1,2k" leave={false} unit="followers" />
        </Example>
        <Example caption="display=&quot;compact&quot;: written short when the field is left, here 250000 as 250K">
          <Field label="Ad budget" unit="EUR" display="compact" defaultValue={250000} />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Unreadable input is explained with forms that would work">
          <Field label="Email list size" typed="12 thousandx" />
        </Example>
        <Example caption="min and max: a number outside them says how far it may go">
          <Field label="Audience" typed="50" unit="people" min={1000} max={50000000} />
        </Example>
        <Example caption="The locale decides the decimal sign: in nl-NL 1,2k is 1.200, and 1.200 is twelve hundred as well">
          <Field label="Bereik" locale="nl-NL" typed="1,2k" unit="mensen" />
        </Example>
        <Example caption="Disabled">
          <Field label="Followers goal" disabled unit="followers" defaultValue={85000} />
        </Example>
      </div>
    </div>
  );
}
