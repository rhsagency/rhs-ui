"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Label } from "@rhs-ui/primitives/label";
import { TimeRangeField, type TimeRangeFieldProps, type TimeRangeValue } from "@rhs-ui/primitives/time-range-field";

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
    const input = box.current?.querySelector<HTMLInputElement>("input[type=text]");
    input?.focus({ preventScroll: true });
    input?.blur();
    // The focus and blur leave the browser's starting point for the Tab key in the field; give it back to the page.
    document.body.tabIndex = -1;
    document.body.focus({ preventScroll: true });
    document.body.removeAttribute("tabindex");
  }, []);
  return <div ref={box}>{children}</div>;
}

function Field({ label, leave, ...props }: Omit<TimeRangeFieldProps, "id" | "aria-labelledby"> & { label: string; leave?: boolean }): React.JSX.Element {
  const id = useId();
  const labelId = useId();
  const field = (
    <div className="grid justify-items-start gap-2">
      <Label id={labelId} htmlFor={id}>
        {label}
      </Label>
      <TimeRangeField id={id} aria-labelledby={labelId} {...props} />
    </div>
  );
  return leave ? <Left>{field}</Left> : field;
}

function BookStudio(): React.JSX.Element {
  const id = useId();
  const labelId = useId();
  const [range, setRange] = useState<TimeRangeValue | null>({ start: "09:00", end: "11:30", minutes: 150 });
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Book the Halcyon studio</h2>
        <p className="text-xs text-muted-foreground">The studio is open from 8:00 to 20:00. Move the start and the end follows.</p>
      </div>
      <div className="grid gap-2">
        <Label id={labelId} htmlFor={id}>
          Session time
        </Label>
        <TimeRangeField id={id} aria-labelledby={labelId} name="session" min="08:00" max="20:00" keepDuration value={range} onValueChange={setRange} />
      </div>
      <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">{show(range)}</code>
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: change the start and the end follows. Type 9, 930 or 2:30 pm, or open the list: each end says how long it makes the session">
          <BookStudio />
        </Example>
        <Example caption="An end that comes before the start is refused with the reason in words">
          <Field label="Opening hours" leave defaultValue={{ start: "17:00", end: "09:00" }} />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="allowOvernight puts the end on the next day, marks it, and counts the night">
          <Field label="Night shift" allowOvernight defaultValue={{ start: "22:00", end: "06:00" }} step={30} />
        </Example>
        <Example caption="Empty, with times to type or pick, every 30 minutes">
          <Field label="Quiet hours" step={30} />
        </Example>
        <Example caption="A time outside min and max names the hours that are allowed">
          <Field label="Delivery window" leave min="08:00" max="18:00" defaultValue={{ start: "07:30", end: "12:00" }} />
        </Example>
        <Example caption="Disabled">
          <Field label="Session time" disabled defaultValue={{ start: "09:00", end: "11:30" }} />
        </Example>
      </div>
    </div>
  );
}
