"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";
import { PostalCodeField, type PostalCodeFieldProps } from "@rhs-ui/primitives/postal-code-field";
import type { PostalRule } from "@rhs-ui/primitives/postal-code-field/postcodes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";

const COUNTRIES = [
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
] as const;

// A rule of your own: the courier's Amsterdam zone, whose codes begin with 10 or 11.
const AMSTERDAM: Record<string, PostalRule> = {
  NL: {
    adjective: "Amsterdam",
    term: "postcode",
    example: "1017 CJ",
    pattern: /^1[01]\d{2} [A-Z]{2}$/,
    format: (clean) => (clean.length > 4 ? `${clean.slice(0, 4)} ${clean.slice(4)}` : clean),
    numeric: false,
  },
};

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
    <div ref={box} className="grid min-w-0 gap-2">
      {children}
    </div>
  );
}

function Field({ label, ...props }: Omit<PostalCodeFieldProps, "id"> & { label: string }): React.JSX.Element {
  const id = useId();
  return (
    <Left>
      <Label htmlFor={id}>{label}</Label>
      <PostalCodeField id={id} {...props} />
    </Left>
  );
}

function Delivery(): React.JSX.Element {
  const id = useId();
  const countryId = useId();
  const [country, setCountry] = useState("NL");
  const [report, setReport] = useState<{ code: string; valid: boolean }>({ code: "1017 CJ", valid: true });
  const [sent, setSent] = useState<string | null>(null);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (report.valid) setSent(report.code);
      }}
      className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs"
    >
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Where should we deliver?</h2>
        <p className="text-xs text-muted-foreground">Type the code any way you like. Choose another country and the code is checked again.</p>
      </div>
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,9.5rem)] sm:gap-3">
        <div className="grid gap-2">
          <Label htmlFor={countryId}>Country</Label>
          <Select
            value={country}
            onValueChange={(next) => {
              setCountry(next);
              setSent(null);
            }}
          >
            <SelectTrigger id={countryId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((item) => (
                <SelectItem key={item.code} value={item.code}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={id}>Postcode</Label>
          <PostalCodeField
            id={id}
            name="postcode"
            country={country}
            defaultValue="1017 CJ"
            required
            onValueChange={(code, state) => {
              setReport({ code, valid: state.valid });
              setSent(null);
            }}
          />
        </div>
      </div>
      <Button type="submit" disabled={!report.valid}>
        Deliver here
      </Button>
      <p role="status" className="flex min-h-4 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        {sent ? (
          <span>Delivering to {sent}</span>
        ) : (
          <>
            <span>Reported</span>
            <code className="font-mono text-[0.6875rem] text-foreground">
              {JSON.stringify(report.code)}, valid: {String(report.valid)}
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
        <Example caption="Try it: change the country and the code that is there is checked against the new one">
          <Delivery />
        </Example>
        <Example caption="Needed and left empty: it says what to enter, in the country's own words">
          <Field label="Postcode" country="FR" required />
        </Example>
        <Example caption="Disabled">
          <Field label="Postcode" country="NL" defaultValue="1017 CJ" disabled />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Typed any way, written the way the country writes it once the field is left">
          <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
            <Field label="United Kingdom" country="GB" defaultValue="sw1a1aa" />
            <Field label="United States" country="US" defaultValue="902101234" />
            <Field label="Canada" country="CA" defaultValue="k1a0b1" />
            <Field label="Ireland" country="IE" defaultValue="d02x285" />
          </div>
        </Example>
        <Example caption="A code that is not right says what a right one looks like">
          <Field label="Postleitzahl" country="DE" defaultValue="1011" />
        </Example>
        <Example caption="Rules of your own: here the Amsterdam zone, codes that begin with 10 or 11">
          <Field label="Postcode" country="NL" countries={AMSTERDAM} defaultValue="3011 AB" />
        </Example>
      </div>
    </div>
  );
}
