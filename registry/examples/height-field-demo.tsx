"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { HeightField, type HeightFieldProps, type HeightUnit } from "@rhs-ui/primitives/height-field";
import { Label } from "@rhs-ui/primitives/label";

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

/** Types into the inputs of what it wraps, one text each in turn, and then leaves the field, so the preview shows what it says afterwards. The focus is never touched: a preview must not take it from a page the reader is already using. */
function Typed({ texts, children }: { texts: readonly string[]; children: ReactNode }): React.JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    const inputs = [...(box.current?.querySelectorAll("input") ?? [])].slice(0, texts.length);
    if (!inputs.length) return;
    done.current = true;
    // Each text is its own moment, as it is for a person: the field has drawn the one before by then.
    inputs.forEach((input, index) => {
      window.setTimeout(() => {
        // React listens for the input event, and only sees a value that was set through the native setter.
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, texts[index] ?? "");
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }, index * 50);
    });
    window.setTimeout(() => inputs[inputs.length - 1]?.dispatchEvent(new FocusEvent("focusout", { bubbles: true })), inputs.length * 50 + 40);
  }, [texts]);
  return <div ref={box}>{children}</div>;
}

const NOTHING: readonly string[] = [];

function Field({ label, typed = NOTHING, ...props }: Omit<HeightFieldProps, "id" | "value" | "aria-labelledby"> & { label: string; typed?: readonly string[] }): React.JSX.Element {
  const id = useId();
  const field = (
    <div className="grid gap-2">
      {/* The label focuses the first box, and its id names the group, so a screen reader hears "Height" for the whole field and not only the name of one box. */}
      <Label id={`${id}-label`} htmlFor={id}>
        {label}
      </Label>
      <HeightField id={id} aria-labelledby={`${id}-label`} {...props} />
    </div>
  );
  return typed.length ? <Typed texts={typed}>{field}</Typed> : field;
}

const RANGE_TEXTS = ["300"];
const ROLL_TEXTS = ["5", "14"];
const METRES_TEXTS = ["1,8"];

function Profile(): React.JSX.Element {
  const id = useId();
  const [height, setHeight] = useState<number | null>(181);
  const [unit, setUnit] = useState<HeightUnit>("cm");
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Kestrel fitness profile</h2>
        <p className="text-xs text-muted-foreground">Your coach sizes your plan from your height. Write it the way you know it.</p>
      </div>
      <div className="grid gap-2">
        <Label id={`${id}-label`} htmlFor={id}>
          Height
        </Label>
        <HeightField id={id} aria-labelledby={`${id}-label`} name="height" value={height} onValueChange={setHeight} unit={unit} onUnitChange={setUnit} />
      </div>
      <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">{show({ centimetres: height, unit })}</code>
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: switch the unit and the same height is written the other way. What is stored stays whole centimetres">
          <Profile />
        </Example>
        <Example caption="The unit is guessed from the locale: feet and inches for en-US and en-GB">
          <Field label="Height" locale="en-US" defaultValue={180} />
        </Example>
        <Example caption="And centimetres for most of the rest, here nl-NL">
          <Field label="Lengte" locale="nl-NL" defaultValue={175} />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Typed 300 and left the field: out of range, said in both units">
          <Field label="Height" typed={RANGE_TEXTS} defaultUnit="cm" />
        </Example>
        <Example caption="Typed 5 ft 14 in: inches above 11 roll into feet when you leave, so it reads 6 ft 2 in">
          <Field label="Height" typed={ROLL_TEXTS} defaultUnit="ftin" />
        </Example>
        <Example caption="Typed 1,8: a number like that is metres, and the field says how it read it">
          <Field label="Height" typed={METRES_TEXTS} defaultUnit="cm" />
        </Example>
        <Example caption="Disabled">
          <Field label="Height" disabled defaultUnit="cm" defaultValue={168} />
        </Example>
      </div>
    </div>
  );
}
