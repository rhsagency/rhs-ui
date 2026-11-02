"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";
import { NationalIdField, type NationalIdFieldProps } from "@rhs-ui/primitives/national-id-field";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A field that has been visited and left once already, so the preview shows what it says afterwards. */
function Left({ children }: { children: ReactNode }): React.JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Only when nothing has focus: a preview must never take it from a page the reader is already using.
    if (document.activeElement && document.activeElement !== document.body) return;
    const input = box.current?.querySelector<HTMLInputElement>("input:not([type=hidden])");
    input?.focus({ preventScroll: true });
    input?.blur();
  }, []);
  return <div ref={box}>{children}</div>;
}

function Field({ label, left, ...props }: Omit<NationalIdFieldProps, "id" | "value"> & { label: string; left?: boolean }): React.JSX.Element {
  const id = useId();
  const field = (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <NationalIdField id={id} {...props} />
    </div>
  );
  return left ? <Left>{field}</Left> : field;
}

function Verify(): React.JSX.Element {
  const id = useId();
  const [report, setReport] = useState<{ valid: boolean; country: string; length: number }>({ valid: true, country: "NL", length: 9 });
  const [sent, setSent] = useState(false);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (report.valid) setSent(true);
      }}
      className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs"
    >
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Confirm who you are</h2>
        <p className="text-xs text-muted-foreground">Northwind Payroll needs the number your employer reports to the tax office. Choose another country to see its rules.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id}>Tax identification number</Label>
        <NationalIdField
          id={id}
          name="tin"
          defaultCountry="NL"
          defaultValue="111222333"
          required
          onValueChange={(number, state) => {
            setReport({ valid: state.valid, country: state.country, length: number.length });
            setSent(false);
          }}
          onCountryChange={() => setSent(false)}
        />
      </div>
      <Button type="submit" disabled={!report.valid}>
        Continue
      </Button>
      <p role="status" className="flex min-h-4 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        {sent ? (
          <span>Thanks. Your details are with payroll.</span>
        ) : (
          <>
            <span>Reported</span>
            <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">
              {report.country}, {report.length} characters, valid: {String(report.valid)}
            </code>
          </>
        )}
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: the number is shown while you type and hidden when you leave">
          <Verify />
        </Example>
        <Example caption="Needed and left empty: it says what to enter">
          <Field label="Numéro de sécurité sociale" defaultCountry="FR" required left />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="A number the country never issues is refused in words, without repeating it">
          <Field label="Social Security number" defaultCountry="US" defaultValue="666-12-3456" />
        </Example>
        <Example caption="Right letter for the digits, written as it is printed">
          <Field label="DNI" defaultCountry="ES" defaultValue="12345678Z" />
        </Example>
        <Example caption="The check letter does not match the digits">
          <Field label="Codice fiscale" defaultCountry="IT" defaultValue="RSSMRA85T10A562X" masked={false} />
        </Example>
        <Example caption="Not masked, for a screen where the number is meant to be seen">
          <Field label="National Insurance number" defaultCountry="GB" defaultValue="JG103759A" masked={false} />
        </Example>
      </div>
    </div>
  );
}
