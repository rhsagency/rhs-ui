"use client";

import { useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { Badge } from "@rhs-ui/primitives/badge";
import { Barcode, eanCheckDigit, encodeBarcode, type BarcodeFormat } from "@rhs-ui/primitives/barcode";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

function Example({ caption, children, className }: { caption: string; children: ReactNode; className?: string }): React.JSX.Element {
  return (
    <div className={cn("grid min-w-0 grid-cols-1 content-start gap-3", className)}>
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The grey strip a label sits on, so the white of the code reads as paper in both themes. */
function Strip({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="flex justify-center rounded-lg bg-muted/70 p-3">{children}</div>;
}

const FORMATS = [
  { value: "code128", label: "Code 128" },
  { value: "ean13", label: "EAN-13" },
] as const;

/** The card around an example: a little tighter in a narrow demo, so that a code in its strip still has room to be drawn at its own size. */
const CARD = "grid gap-4 rounded-xl border border-border bg-card p-4 shadow-xs @sm:p-5";

export default function Demo(): React.JSX.Element {
  const [format, setFormat] = useState<BarcodeFormat>("code128");
  const [values, setValues] = useState<Record<BarcodeFormat, string>>({ code128: "PKG-4821", ean13: "4006381333931" });
  const value = values[format];
  const result = encodeBarcode(value, format);
  const note = !result.valid
    ? null
    : result.format === "ean13"
      ? `Printed as ${result.text.slice(0, 1)} ${result.text.slice(1, 7)} ${result.text.slice(7)}`
      : `${(result.modules - 2) / 11} symbols, ${result.modules} modules wide`;

  return (
    // Two columns only when the preview itself is wide enough for two codes: the width of the page says nothing about the pane the demo gets.
    <div className="@container w-full max-w-4xl">
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 @3xl:grid-cols-2">
        <Example caption="Code 128 chooses its own code sets, and packs the digit runs two to a symbol">
          <div className={CARD}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-medium tracking-[-0.01em]">Northwind Parcel</h2>
                <p className="text-xs text-muted-foreground">Packing slip, 20 Oct 2026</p>
              </div>
              <Badge variant="outline">Priority</Badge>
            </div>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">Ship to</dt>
              <dd>Mara de Vries, Keizersgracht 214, Amsterdam</dd>
              <dt className="text-muted-foreground">Parcels</dt>
              <dd className="tabular-nums">2 of 2, 4.6 kg</dd>
            </dl>
            <Strip>
              <Barcode value="NW-048213" label="Order number" />
            </Strip>
          </div>
        </Example>

        <Example caption="EAN-13: twelve digits in, the check digit added, guard bars drawn the retail way">
          <div className={CARD}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-medium tracking-[-0.01em]">Kestrel trail bottle</h2>
                <p className="text-xs text-muted-foreground">750 ml, stainless steel</p>
              </div>
              <p className="text-lg font-medium tracking-[-0.02em] tabular-nums">€24.00</p>
            </div>
            <Strip>
              <Barcode value="590123412345" format="ean13" label="Product code" />
            </Strip>
            <p className="text-xs text-muted-foreground">12 digits given, check digit {eanCheckDigit("590123412345")} added.</p>
          </div>
        </Example>

        <Example caption="Without the text, thinner and lower bars: the stub of a ticket">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <div className="grid gap-1 p-5">
              <h2 className="text-sm font-medium tracking-[-0.01em]">Halcyon Live at Paradiso</h2>
              <p className="text-xs text-muted-foreground">Sat 14 Nov 2026, doors open 19:30</p>
              <p className="mt-2 text-sm tabular-nums">Row F, seat 12</p>
            </div>
            <div className="flex justify-center border-t border-dashed border-border bg-muted/50 p-4">
              <Barcode value="HL-1114-F12" label="Ticket" height={44} barWidth={1.5} showValue={false} />
            </div>
          </div>
        </Example>

        <Example caption="A wrong check digit, or text the format cannot hold: reported in words, never drawn as a code that will not scan">
          <div className="grid justify-items-start gap-3">
            <Barcode value="5901234123450" format="ean13" />
            <Barcode value="Café Noord 42" />
          </div>
        </Example>

        <Example caption="Try your own value" className="@3xl:col-span-2">
          <div className={cn(CARD, "gap-5 @3xl:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] @3xl:items-center @3xl:gap-8")}>
            <div className="grid content-start gap-3">
              <SegmentedControl label="Barcode format" value={format} onValueChange={(next) => setFormat(next as BarcodeFormat)} options={FORMATS} className="w-fit" />
              <div className="grid gap-1.5">
                <Label htmlFor="barcode-value">Value</Label>
                <Input
                  id="barcode-value"
                  value={value}
                  inputMode={format === "ean13" ? "numeric" : "text"}
                  spellCheck={false}
                  autoComplete="off"
                  aria-invalid={!result.valid}
                  aria-describedby={result.valid ? undefined : "barcode-value-error"}
                  className="font-mono"
                  onChange={(event) => setValues((current) => ({ ...current, [format]: event.target.value }))}
                />
              </div>
            </div>
            <div className="grid min-w-0">
              {result.valid ? (
                <>
                  <Strip>
                    <Barcode value={value} format={format} height={56} />
                  </Strip>
                  <p className="mt-2.5 text-xs text-muted-foreground tabular-nums">{note}</p>
                </>
              ) : null}
              {/* A message that arrives together with its region is often not read. This region is in the page all the while and the explanation moves in and out of it, so the box leaves out its own role=status; the field points at the same words. */}
              <div aria-live="polite">{result.valid ? null : <Barcode id="barcode-value-error" role={undefined} value={value} format={format} />}</div>
            </div>
          </div>
        </Example>
      </div>
    </div>
  );
}
