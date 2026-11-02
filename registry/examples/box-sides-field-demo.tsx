"use client";

import { useState, type ReactNode } from "react";

import { BoxSidesField, type BoxSides } from "@rhs-ui/primitives/box-sides-field";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** What the field reported, on one line that breaks at its spaces and never in the middle of a word. */
const show = (value: unknown): string => JSON.stringify(value).replace(/,/g, ", ").replace(/:/g, ": ");

/** The preview draws the padding the way the browser's inspector does: the padded area tinted, the content box inside it. A very large value is drawn at most 48px, so the card never grows. */
const drawn = (value: number): number => Math.min(48, value);

function Padding(): React.JSX.Element {
  const [padding, setPadding] = useState<BoxSides>({ top: 12, right: 24, bottom: 12, left: 24 });
  const [linked, setLinked] = useState(false);
  return (
    <div className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Pad the Halcyon button</h2>
        <p className="text-xs text-muted-foreground">Link the sides to move all four at once, or set each edge on its own.</p>
      </div>
      <BoxSidesField
        label="Padding"
        name="button-padding"
        className="w-full"
        max={64}
        value={padding}
        linked={linked}
        onValueChange={(next) => setPadding(next)}
        onLinkedChange={setLinked}
      />
      <div className="grid h-36 place-items-center overflow-hidden rounded-lg bg-muted/50">
        <div
          style={{ padding: `${drawn(padding.top)}px ${drawn(padding.right)}px ${drawn(padding.bottom)}px ${drawn(padding.left)}px` }}
          className="rounded-md border border-dashed border-input bg-muted transition-[padding] duration-150 motion-reduce:transition-none"
        >
          <div className="rounded-sm border border-border bg-background px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-xs">Add to cart</div>
        </div>
      </div>
      <p role="status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">{show({ ...padding, linked })}</code>
      </p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: type a number, press the arrow keys (Shift for ten) or switch the link on">
        <Padding />
      </Example>

      <div className="grid min-w-0 content-start justify-items-start gap-9">
        <Example caption="Two fields: vertical and horizontal, and the other two edges show their mirror">
          <BoxSidesField label="Margin" sides={2} max={128} defaultValue={{ top: 24, right: 16, bottom: 24, left: 16 }} />
        </Example>
        <Example caption="Linked from the start, in rem with quarter steps">
          <BoxSidesField label="Gap" unit="rem" step={0.25} max={8} defaultLinked defaultValue={{ top: 1.5, right: 1.5, bottom: 1.5, left: 1.5 }} />
        </Example>
        <Example caption="Disabled">
          <BoxSidesField label="Inner spacing" disabled defaultValue={{ top: 8, right: 16, bottom: 8, left: 16 }} />
        </Example>
      </div>
    </div>
  );
}
