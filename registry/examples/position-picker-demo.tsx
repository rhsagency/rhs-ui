"use client";

import { useState, type ReactNode } from "react";

import { PositionPicker, type Position } from "@rhs-ui/primitives/position-picker";
import { CORNERS, positionLabel } from "@rhs-ui/primitives/position-picker/positions";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

// A photograph drawn in four greys: a sun and two hills.
const PHOTO = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 120' preserveAspectRatio='xMidYMid slice'><rect width='160' height='120' fill='#e5e5e5'/><circle cx='118' cy='38' r='13' fill='#fafafa'/><path d='M0 96 L38 56 L70 86 L104 48 L160 98 V120 H0Z' fill='#a3a3a3'/><path d='M0 108 L46 78 L92 104 L128 82 L160 104 V120 H0Z' fill='#737373'/></svg>",
)}")`;

// Where the tag sits, as how far along each side it is (0, 50 or 100 per cent). Every place is a pair of numbers on the same properties, so a move from one place to another glides instead of jumping.
const WHERE: Record<Position, readonly [x: number, y: number]> = {
  "top-left": [0, 0],
  "top-center": [50, 0],
  "top-right": [100, 0],
  "center-left": [0, 50],
  center: [50, 50],
  "center-right": [100, 50],
  "bottom-left": [0, 100],
  "bottom-center": [50, 100],
  "bottom-right": [100, 100],
};

function Watermark(): React.JSX.Element {
  const [position, setPosition] = useState<Position>("bottom-right");
  return (
    <div className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Watermark the product photos</h2>
        <p className="text-xs text-muted-foreground">Choose the corner or edge where the mark sits on every Kestrel photo.</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <PositionPicker label="Watermark position" value={position} onValueChange={setPosition} name="watermark" />
        <div className="relative aspect-[4/3] min-w-36 flex-1 overflow-hidden rounded-lg border border-border bg-muted bg-cover bg-center" style={{ backgroundImage: PHOTO }}>
          <div className="absolute inset-2">
            <span
              className="absolute rounded-sm bg-foreground px-1.5 py-0.5 text-[0.625rem] font-medium tracking-wide text-background transition-[left,top,transform] duration-200 ease-out motion-reduce:transition-none"
              style={{ left: `${WHERE[position][0]}%`, top: `${WHERE[position][1]}%`, transform: `translate(-${WHERE[position][0]}%, -${WHERE[position][1]}%)` }}
            >
              KESTREL
            </span>
          </div>
        </div>
      </div>
      <p role="status" className="flex min-h-4 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] text-foreground">{JSON.stringify(position)}</code>
      </p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [toast, setToast] = useState<Position>("bottom-right");
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: the arrow keys move in two directions and wrap round the edge">
        <Watermark />
      </Example>
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Only the four corners, for where a toast appears">
          <div className="flex items-center gap-4">
            <PositionPicker label="Toast position" positions={CORNERS} value={toast} onValueChange={setToast} size="sm" showValue={false} />
            <p className="text-sm">
              Toasts appear at the <span className="font-medium">{positionLabel(toast).toLowerCase()}</span> of the window.
            </p>
          </div>
        </Example>
        <Example caption="Three sizes">
          <div className="flex flex-wrap items-end gap-x-3 gap-y-4">
            <PositionPicker label="Small" size="sm" defaultValue="top-left" />
            <PositionPicker label="Default" defaultValue="center" />
            <PositionPicker label="Large" size="lg" defaultValue="bottom-center" />
          </div>
        </Example>
        <Example caption="Disabled">
          <PositionPicker label="Locked position" disabled defaultValue="top-right" />
        </Example>
      </div>
    </div>
  );
}
