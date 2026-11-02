"use client";

import { useId, useState, type ReactNode } from "react";

import { IconCamera } from "@rhs-ui/icons";
import { BarcodeField, type BarcodeFieldProps, type BarcodeValue } from "@rhs-ui/primitives/barcode-field";
import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Field({ label, ...props }: Omit<BarcodeFieldProps, "id" | "value"> & { label: string }): React.JSX.Element {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <BarcodeField id={id} {...props} />
    </div>
  );
}

function Product(): React.JSX.Element {
  const id = useId();
  const [report, setReport] = useState<BarcodeValue>({ digits: "4006381333931", format: "ean13", valid: true });
  const [added, setAdded] = useState(false);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (report.valid) setAdded(true);
      }}
      className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs"
    >
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Add to the Kestrel catalogue</h2>
        <p className="text-xs text-muted-foreground">Type or paste the number under the barcode, with or without spaces.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id}>Barcode</Label>
        <BarcodeField
          id={id}
          name="barcode"
          defaultValue="4006381333931"
          required
          onValueChange={(next) => {
            setReport(next);
            setAdded(false);
          }}
          trailing={
            <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground">
              <IconCamera aria-hidden="true" />
              {/* The field is a container: where it is narrow the word goes and the icon stays, so the number is never cut short. */}
              <span className="@max-[22rem]:sr-only">Scan</span>
            </Button>
          }
        />
      </div>
      <Button type="submit" disabled={!report.valid}>
        Add product
      </Button>
      <p role="status" className="flex min-h-4 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        {added ? (
          <span>Added. Scanners at the till will find it.</span>
        ) : (
          <>
            <span>Reported</span>
            <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">
              {JSON.stringify(report.digits)}, {String(report.format)}, valid: {String(report.valid)}
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
        <Example caption="Try it: type, paste with spaces or hyphens, or delete in the middle">
          <Product />
        </Example>
        <Example caption="A wrong last digit says what it should have been">
          <Field label="Barcode" defaultValue="4006381333932" />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="One digit short: the check digit it asks for is one tap away">
          <Field label="EAN-13 only" format="ean13" defaultValue="400638133393" />
        </Example>
        <Example caption="The format is read from the length: a UPC-A here, an EAN-8 below">
          <div className="grid gap-5">
            <Field label="Cola, 330 ml" defaultValue="036000291452" />
            <Field label="Mints" defaultValue="73513537" />
          </div>
        </Example>
        <Example caption="Part typed, in a field that takes only EAN-8">
          <Field label="Sample pack" format="ean8" defaultValue="7351" />
        </Example>
      </div>
    </div>
  );
}
