"use client";

import { useState } from "react";

import { IconPlay } from "@rhs-ui/icons";
import { FullscreenButton } from "@rhs-ui/primitives/fullscreen-button";

// A flat site plan, drawn in theme tokens so it follows light and dark. Strokes do not scale, so the lines stay fine when it fills the screen.
const BLOCKS: readonly (readonly [number, number, number, number])[] = [
  [16, 14, 44, 30],
  [68, 14, 28, 30],
  [104, 14, 56, 22],
  [104, 42, 26, 18],
  [138, 42, 22, 18],
  [170, 14, 38, 46],
  [216, 14, 88, 24],
  [216, 46, 40, 14],
  [264, 46, 40, 14],
  [16, 52, 34, 28],
  [58, 52, 38, 28],
  [16, 128, 54, 56],
  [78, 138, 38, 46],
  [124, 150, 40, 34],
  [188, 140, 48, 44],
  [244, 128, 60, 26],
  [244, 162, 28, 22],
  [280, 162, 24, 22],
];

function SitePlan(): React.JSX.Element {
  const canal = "M-10 106 C 52 90, 98 120, 160 106 S 268 86, 330 102";
  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Site plan of the harbour district, with a canal running across it" className="absolute inset-0 size-full">
      <g className="stroke-foreground/[0.06]" strokeWidth="1" vectorEffect="non-scaling-stroke">
        {Array.from({ length: 15 }, (_, index) => (
          <path key={`v${index}`} d={`M${index * 22 + 10} 0V200`} vectorEffect="non-scaling-stroke" />
        ))}
        {Array.from({ length: 9 }, (_, index) => (
          <path key={`h${index}`} d={`M0 ${index * 24 + 8}H320`} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
      <g className="fill-foreground/[0.07] stroke-foreground/25" strokeWidth="1">
        {BLOCKS.map(([x, y, width, height]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={width} height={height} rx="3" vectorEffect="non-scaling-stroke" />
        ))}
      </g>
      <path d={canal} fill="none" strokeLinecap="round" strokeWidth="14" className="stroke-foreground/[0.12]" />
      <path d={canal} fill="none" strokeLinecap="round" strokeWidth="1" strokeDasharray="3 5" className="stroke-foreground/35" vectorEffect="non-scaling-stroke" />
      <g className="stroke-foreground/30" strokeWidth="1.25" strokeLinecap="round">
        <path d="M118 96V118" vectorEffect="non-scaling-stroke" />
        <path d="M200 98V120" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}

const TAG = "absolute rounded-md border border-border bg-background/90 px-1.5 py-0.5 text-[0.625rem] font-medium text-muted-foreground group-[:fullscreen]/plan:text-xs";

export default function Demo(): React.JSX.Element {
  const [state, setState] = useState("Not fullscreen");
  return (
    <div className="grid w-full max-w-3xl gap-x-8 gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))]">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
        <p className="text-xs text-muted-foreground">An element with its own button. Escape works, and the button follows.</p>
        <figure
          data-fullscreen-root
          className="group/plan relative m-0 aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-card shadow-xs [&:fullscreen]:rounded-none [&:fullscreen]:border-0 [&:fullscreen]:bg-background"
        >
          <SitePlan />
          <span className={`${TAG} top-[41%] left-[7%]`}>Kloveniers canal</span>
          <span className={`${TAG} top-[27%] left-[36%]`}>Market quarter</span>
          <span className={`${TAG} bottom-[24%] left-[56%]`}>Warehouse row</span>
          <figcaption className="absolute bottom-3 left-3 rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background">Harbour district, October survey</figcaption>
          <FullscreenButton fallback variant="outline" size="sm" className="absolute top-3 right-3" onChange={(on) => setState(on ? "Fullscreen" : "Not fullscreen")} />
        </figure>
        <p role="status" className="text-xs text-muted-foreground">
          {state}
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
        <p className="text-xs text-muted-foreground">Icon only, in a player's control bar. The label is in the tooltip.</p>
        <div
          data-fullscreen-root
          className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-neutral-950 text-neutral-50 shadow-xs [&:fullscreen]:rounded-none [&:fullscreen]:border-0"
        >
          <div className="absolute inset-0 grid place-items-center">
            <span className="grid size-14 place-items-center rounded-full border border-white/25 bg-white/10 pl-0.5">
              <IconPlay size={22} aria-hidden="true" />
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 grid gap-1.5 px-3 pb-2 pt-6">
            <div className="h-0.5 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
              <div className="h-full w-[22%] rounded-full bg-white" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs tabular-nums text-neutral-400">
                <span className="font-medium text-neutral-50">0:42</span> / 3:15
              </p>
              <FullscreenButton iconOnly fallback variant="ghost" size="sm" className="text-neutral-50 hover:bg-white/15 hover:text-neutral-50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
