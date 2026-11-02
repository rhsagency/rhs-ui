"use client";

import { useId, useState, type ReactNode } from "react";

import { IconArrowUp } from "@rhs-ui/icons";
import { AngleField, type AngleFieldProps } from "@rhs-ui/primitives/angle-field";
import { Label } from "@rhs-ui/primitives/label";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The visible label is also the name a screen reader reads, so what is seen and what is said are the same words. */
function Field({ label, ...props }: { label: string } & Omit<AngleFieldProps, "id" | "label">): React.JSX.Element {
  const id = useId();
  return (
    <div className="grid justify-items-start gap-3">
      <Label htmlFor={id}>{label}</Label>
      <AngleField id={id} label={label} {...props} />
    </div>
  );
}

function Badge(): React.JSX.Element {
  const id = useId();
  const [angle, setAngle] = useState(45);
  return (
    <div className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Rotate the Kestrel badge</h2>
        <p className="text-xs text-muted-foreground">Drag the dial, type an angle or use the arrow keys. Shift snaps to 15 degrees.</p>
      </div>
      <div className="grid justify-items-start gap-3">
        <Label htmlFor={id}>Rotation</Label>
        <AngleField id={id} label="Rotation" value={angle} onValueChange={setAngle} name="badge-rotation" />
      </div>
      <div className="grid h-28 place-items-center rounded-lg bg-muted/50">
        <span style={{ transform: `rotate(${angle}deg)` }} className="grid size-14 place-items-center rounded-xl border border-border bg-background text-foreground shadow-xs">
          <IconArrowUp size={24} aria-hidden="true" />
        </span>
      </div>
      <p role="status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] text-foreground">{angle}</code>
      </p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: drag the handle, type, or press the arrow keys, Home for 0">
        <Badge />
      </Example>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Large, with a compass: the direction is named for the eye and for a screen reader">
          <Field label="Wind direction" size="lg" compass defaultValue={225} />
        </Example>
        <Example caption="Small, and not wrapped: a tilt that stops at 45 degrees either way">
          <Field label="Tilt" size="sm" min={-45} max={45} wrap={false} defaultValue={-20} />
        </Example>
        <Example caption="Disabled">
          <Field label="Locked angle" disabled defaultValue={135} />
        </Example>
      </div>
    </div>
  );
}
