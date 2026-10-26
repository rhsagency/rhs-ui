"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { EmailField } from "@rhs-ui/primitives/email-field";
import { Label } from "@rhs-ui/primitives/label";

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
  return (
    <div ref={box} className="grid gap-2">
      {children}
    </div>
  );
}

function SignUp(): React.JSX.Element {
  const id = useId();
  const [report, setReport] = useState<{ email: string; valid: boolean } | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(report?.email || "an empty address");
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Create your Northwind account</h2>
        <p className="text-xs text-muted-foreground">The receipt and your sign-in link go to this address.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-email`}>Work email</Label>
        <EmailField
          id={`${id}-email`}
          name="email"
          placeholder="you@company.com"
          onValueChange={(email, state) => {
            setReport({ email, valid: state.valid });
            setSent(null);
          }}
        />
      </div>
      <Button type="submit">Continue</Button>
      <p role="status" className="flex min-h-4 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        {sent ? (
          <span>Submitted with {sent}</span>
        ) : report ? (
          <>
            <span>Reported</span>
            <code className="font-mono text-[0.6875rem] break-all text-foreground">
              {JSON.stringify(report.email)}, valid: {String(report.valid)}
            </code>
          </>
        ) : (
          <span>Nothing reported yet</span>
        )}
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  const id = useId();
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="grid min-w-0 content-start gap-8">
        <Example caption="Try it: type a typo such as gmial.com, then leave the field. Pressing Continue is never blocked">
          <SignUp />
        </Example>
        <Example caption="Disabled">
          <div className="grid gap-2">
            <Label htmlFor={`${id}-off`}>Email</Label>
            <EmailField id={`${id}-off`} defaultValue="tom.visser@kestrel.example" disabled />
          </div>
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-8">
        <Example caption="A likely typo in the domain: one button puts it right">
          <Left>
            <Label htmlFor={`${id}-typo`}>Email</Label>
            <EmailField id={`${id}-typo`} defaultValue="marit.devries@gmial.com" />
          </Left>
        </Example>
        <Example caption="A malformed address is explained in words, not just flagged">
          <Left>
            <Label htmlFor={`${id}-format`}>Email</Label>
            <EmailField id={`${id}-format`} defaultValue="joost.bakker@northwind" />
          </Left>
        </Example>
        <Example caption="Spaces and a capitalised domain are tidied when you leave">
          <Left>
            <Label htmlFor={`${id}-clean`}>Email</Label>
            <EmailField id={`${id}-clean`} defaultValue="  Lena.Hoffmann@Halcyon.EXAMPLE " />
          </Left>
        </Example>
      </div>
    </div>
  );
}
