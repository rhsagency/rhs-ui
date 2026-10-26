"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";
import { NameField, type NameFieldProps } from "@rhs-ui/primitives/name-field";
import type { NameParts } from "@rhs-ui/primitives/name-field/names";

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
  }, []);
  return <div ref={box}>{children}</div>;
}

function Field({ leave, ...props }: Omit<NameFieldProps, "id"> & { leave?: boolean }): React.JSX.Element {
  const id = useId();
  const field = (
    <div className="grid gap-2">
      <Label htmlFor={id}>Full name</Label>
      <NameField id={id} placeholder="Your name" {...props} />
    </div>
  );
  return leave ? <Left>{field}</Left> : field;
}

const EMPTY: NameParts = { full: "", given: "", particle: "", family: "" };

function Recipient(): React.JSX.Element {
  const [name, setName] = useState<NameParts>(EMPTY);
  const [sent, setSent] = useState<string | null>(null);
  const rows = [
    ["Given", name.given],
    ["Particle", name.particle],
    ["Family", name.family],
  ] as const;
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setSent(name.full || "nobody yet");
      }}
      className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs"
    >
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Who is this order for?</h2>
        <p className="text-xs text-muted-foreground">One field, however many names you have.</p>
      </div>
      <Field
        name="recipient"
        splitable
        onValueChange={(next) => {
          setName(next);
          setSent(null);
        }}
      />
      <Button type="submit">Ship to this name</Button>
      <dl className="grid grid-cols-3 gap-3 border-t border-border pt-4 text-xs">
        {rows.map(([term, detail]) => (
          <div key={term} className="grid min-w-0 gap-1">
            <dt className="text-muted-foreground">{term}</dt>
            <dd className="min-h-4 font-medium break-words text-foreground">{detail || <span className="font-normal text-muted-foreground">-</span>}</dd>
          </div>
        ))}
      </dl>
      <p role="status" className="min-h-4 text-xs text-muted-foreground">
        {sent ? `Shipping to ${sent}` : "Type rick van der berg, then leave the field."}
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: all lower case gets its capitals, the particles stay down, and Undo is one press away">
        <Recipient />
      </Example>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Typed in lower case: capitals added, particles kept down, announced">
          <Field defaultValue="marit de vries" leave />
        </Example>
        <Example caption="Mixed case is the person's own writing, so it is left alone">
          <Field defaultValue="Sinéad McDonald-O'Connor" leave />
        </Example>
        <Example caption="Split into parts, for systems that need them: the particle has a field of its own">
          <Field defaultValue="Jan van der Berg" splitable defaultOpen />
        </Example>
      </div>
    </div>
  );
}
