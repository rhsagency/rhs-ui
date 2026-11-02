"use client";

import { useState, type ReactNode } from "react";

import { ContrastPairField, type ContrastReading } from "@rhs-ui/primitives/contrast-pair-field";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Buttons(): React.JSX.Element {
  const [reading, setReading] = useState<ContrastReading>({ foreground: "#6b7280", background: "#ffffff", ratio: 4.83 });
  return (
    <div className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Check the secondary text before it ships</h2>
        <p className="text-xs text-muted-foreground">Pick two colours, or swap them. The checks answer in words.</p>
      </div>
      <ContrastPairField
        defaultValue={{ foreground: "#6b7280", background: "#ffffff" }}
        name="secondary"
        sample={{ large: "Northwind Outfitters", normal: "Free shipping on orders over $75. Returns are free for 30 days." }}
        onValueChange={setReading}
      />
      <p className="flex min-h-4 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">
          {reading.foreground} on {reading.background}, ratio {reading.ratio.toFixed(2)}
        </code>
      </p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: 4.83:1 passes for normal text at AA and fails at AAA. Pick other colours or swap them">
        <Buttons />
      </Example>
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="A pair that fails every check">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <ContrastPairField defaultValue={{ foreground: "#9ca3af", background: "#ffffff" }} label="Placeholder text on white" sample={{ large: "Search the shop", normal: "Type a product, a size or an order number." }} />
          </div>
        </Example>
        <Example caption="A dark theme pair that passes them all">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <ContrastPairField defaultValue={{ foreground: "#f9fafb", background: "#1f2937" }} label="Body text on the dark surface" sample={{ large: "Night mode", normal: "Easier on the eyes after sunset." }} />
          </div>
        </Example>
      </div>
    </div>
  );
}
