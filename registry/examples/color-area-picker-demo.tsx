"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { ColorAreaPicker } from "@rhs-ui/primitives/color-area-picker";
import { contrastRatio, parseColor, toRgb } from "@rhs-ui/primitives/color-area-picker/colors";

function Example({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const BRAND = ["#111111", "#2563eb", "#0d9488", "#16a34a", "#ca8a04", "#ea580c", "#dc2626", "#db2777"];

/** The same blue, written the ways a picker has to understand. */
const FORMATS = ["#2563eb", "#26e", "#2563eb80", "rgb(37 99 235)", "hsl(221 83% 53%)"];

/** White or black text, whichever reads better on the colour. */
function textOn(code: string): string {
  const color = parseColor(code);
  if (!color) return "#ffffff";
  const rgb = toRgb(color);
  return contrastRatio(rgb, [255, 255, 255]) >= contrastRatio(rgb, [0, 0, 0]) ? "#ffffff" : "#000000";
}

function Brand(): React.JSX.Element {
  const [code, setCode] = useState("#2563eb");
  const on = textOn(code);
  return (
    <div className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.02em]">Northwind brand colour</h2>
        <p className="text-xs text-muted-foreground">Used for buttons, links and the checkout. The preview follows.</p>
      </div>
      <ColorAreaPicker inline alpha label="Brand colour" name="brand" swatches={BRAND} value={code} onValueChange={setCode} />
      <div className="grid gap-3 border-t border-border pt-5">
        <p className="text-xs font-medium text-muted-foreground">Preview</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex h-9 items-center rounded-md px-4 text-sm font-medium" style={{ backgroundColor: code, color: on }}>
            Start free trial
          </span>
          <span className="inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium" style={{ backgroundColor: code, color: on }}>
            New
          </span>
          <span className="text-sm font-medium underline underline-offset-4" style={{ textDecorationColor: code }}>
            See pricing
          </span>
        </div>
      </div>
      {/* What the picker reported is for the reader of the demo, so a screen reader is not read it on every drag. */}
      <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>onValueChange</span>
        <code className="font-mono text-[0.6875rem] text-foreground">{JSON.stringify(code)}</code>
      </p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [accent, setAccent] = useState("rgb(22, 163, 74)");
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: drag in the area, or focus it and use the arrow keys (Shift for 10%). Type a code, or pick a preset. The contrast is said in words">
        <Brand />
      </Example>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Behind a button, like Color picker. The code is written the way you ask: hex, rgb or hsl">
          <div className="flex flex-wrap items-center gap-3">
            <ColorAreaPicker label="Link colour" defaultValue="#0d9488" swatches={BRAND} />
            <ColorAreaPicker label="Accent" format="rgb" value={accent} onValueChange={setAccent} swatches={BRAND} />
            <ColorAreaPicker label="Overlay" format="hsl" alpha defaultValue="hsla(221, 83%, 53%, 0.6)" />
          </div>
        </Example>
        <Example caption="Any format can be typed, whatever the format is. Send one of these to the Accent picker above and it answers in rgb">
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((format) => (
              <Button key={format} type="button" variant="outline" size="sm" onClick={() => setAccent(format)} className="font-mono text-xs">
                {format}
              </Button>
            ))}
          </div>
        </Example>
        <Example caption="Disabled">
          <div className="flex">
            <ColorAreaPicker label="Border colour" defaultValue="#db2777" disabled />
          </div>
        </Example>
      </div>
    </div>
  );
}
