"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { DimensionsField, type DimensionsFieldProps, type DimensionsValue } from "@rhs-ui/primitives/dimensions-field";
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
const OVER_MAX: readonly string[] = ["9999"];

function Field({ label, typed = NOTHING, ...props }: Omit<DimensionsFieldProps, "id" | "value" | "aria-labelledby"> & { label: string; typed?: readonly string[] }): React.JSX.Element {
  const id = useId();
  const field = (
    <div className="grid gap-2">
      {/* The label focuses the width box, and its id names the group, so a screen reader hears "Hero image" and not only "Dimensions". */}
      <Label id={`${id}-label`} htmlFor={id}>
        {label}
      </Label>
      <DimensionsField id={id} aria-labelledby={`${id}-label`} {...props} />
    </div>
  );
  return typed.length ? <Typed texts={typed}>{field}</Typed> : field;
}

/** The shape the two sizes make, drawn to fit the box: so the lock can be seen keeping it. */
function Shape({ width, height }: { width: number | null; height: number | null }): React.JSX.Element {
  const w = width && height ? width : 3;
  const h = width && height ? height : 2;
  const scale = Math.min(148 / w, 56 / h);
  const drawn = { width: Math.max(4, w * scale), height: Math.max(4, h * scale) };
  return (
    <svg aria-hidden="true" viewBox="0 0 160 64" className="h-16 w-40 text-foreground">
      <rect x={80 - drawn.width / 2} y={32 - drawn.height / 2} width={drawn.width} height={drawn.height} rx="4" className="fill-muted stroke-foreground/40" strokeWidth="1.5" />
    </svg>
  );
}

function Banner(): React.JSX.Element {
  const id = useId();
  const [size, setSize] = useState<DimensionsValue>({ width: 1200, height: 800, locked: true });
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Resize the Halcyon banner</h2>
        <p className="text-xs text-muted-foreground">With the lock on, change either side and the other keeps the 3:2 it had.</p>
      </div>
      <div className="grid gap-2">
        <Label id={`${id}-label`} htmlFor={id}>
          Banner size
        </Label>
        <DimensionsField id={id} aria-labelledby={`${id}-label`} name="banner" unit="px" min={16} max={4000} value={size} onValueChange={setSize} />
      </div>
      <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/40 px-4">
        <p className="text-xs text-muted-foreground">Preview</p>
        <Shape width={size.width} height={size.height} />
      </div>
      <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">{show(size)}</code>
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: type a size, use the arrow keys (Shift for ten), or switch the lock off to resize freely">
          <Banner />
        </Example>
        <Example caption="Unlocked: both sides are free, as for a sheet of paper">
          <Field label="Paper size" unit="mm" defaultValue={{ width: 210, height: 297 }} />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Typed 9999 and left the field: it is brought down to max, and the line says so">
          <Field label="Hero image" unit="px" min={16} max={4000} typed={OVER_MAX} defaultValue={{ width: 1920, height: 1080 }} />
        </Example>
        <Example caption="step and precision for fractions: centimetres in halves, kept at 4:3">
          <Field label="Print size" unit="cm" step={0.5} defaultValue={{ width: 24, height: 18 }} defaultLocked />
        </Example>
        <Example caption="Lock set on an empty side: it waits until both sides have a size">
          <Field label="Thumbnail" unit="px" defaultLocked defaultValue={{ width: 640, height: null }} />
        </Example>
        <Example caption="Disabled">
          <Field label="Cover image" unit="px" disabled defaultLocked defaultValue={{ width: 1600, height: 900 }} />
        </Example>
      </div>
    </div>
  );
}
