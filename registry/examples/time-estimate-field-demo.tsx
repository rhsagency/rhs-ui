"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Label } from "@rhs-ui/primitives/label";
import { TimeEstimateField, type TimeEstimateFieldProps } from "@rhs-ui/primitives/time-estimate-field";

/** What the field reported, on one line that breaks at its spaces and never in the middle of a word. The readout is for the reader of the demo, so it is hidden from a screen reader. */
const show = (value: unknown): string => JSON.stringify(value, null, 1).replace(/\n\s*/g, " ");

const THREE_UNITS = ["d", "h", "m"] as const;

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

function Field({ label, typed, leave, ...props }: Omit<TimeEstimateFieldProps, "id" | "value" | "aria-labelledby"> & { label: string; typed?: string; leave?: boolean }): React.JSX.Element {
  const id = useId();
  const field = (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <TimeEstimateField id={id} {...props} />
    </div>
  );
  return typed === undefined ? (
    field
  ) : (
    <Typed text={typed} leave={leave}>
      {field}
    </Typed>
  );
}

function Task(): React.JSX.Element {
  const id = useId();
  const [estimate, setEstimate] = useState<{ minutes: number | null; valid: boolean }>({ minutes: 90, valid: true });
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Kestrel sprint planning</h2>
        <p className="text-xs text-muted-foreground">How long will &ldquo;Rebuild the checkout summary&rdquo; take? Write it the way you would say it.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id}>Estimate</Label>
        <TimeEstimateField id={id} name="estimate" max={4800} defaultValue={90} onValueChange={(minutes, state) => setEstimate({ minutes, valid: state.valid })} />
      </div>
      <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">{show(estimate)}</code>
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: type 1h 30m, 90m, 1.5h, 2:30 or 1d 2h. The length it was read as shows before you commit">
          <Task />
        </Example>
        <Example caption="Typing 1d 2h: a day is a working day, and the line says what that came to">
          <Field label="Design review" typed="1d 2h" leave={false} />
        </Example>
        <Example caption="A shorter working day and week: 7.5 hours a day, 4 days a week, so 2d is 15 hours">
          <Field label="Migration" hoursPerDay={7.5} daysPerWeek={4} typed="2d" leave={false} />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Committed: the text is rewritten in one form, whichever way it was typed">
          <Field label="Code review" typed="1.5h" />
        </Example>
        <Example caption="Unreadable input is answered with forms that work">
          <Field label="Bug triage" typed="two hours" />
        </Example>
        <Example caption="A unit the field does not use is named: this one has no weeks">
          <Field label="Spike" units={THREE_UNITS} typed="1w" />
        </Example>
        <Example caption="max: an estimate over two working weeks is explained, not just refused">
          <Field label="Epic" max={4800} typed="3w" />
        </Example>
        <Example caption="Disabled">
          <Field label="Estimate" disabled defaultValue={150} />
        </Example>
      </div>
    </div>
  );
}
