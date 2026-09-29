"use client";
import { useState } from "react";
import { SpiralArms } from "@rhs-ui/backgrounds/spiral-arms";

export default function Demo(): React.JSX.Element {
  const [paused, setPaused] = useState(false);
  return (
    <div className="w-full">
      <SpiralArms paused={paused} className="flex min-h-80 items-center justify-center rounded-xl border border-border bg-foreground text-background">
        <div className="px-8 py-6 text-center">
          <p className="text-xs uppercase tracking-widest opacity-70">Spiral Arms</p>
          <p className="mt-3 text-3xl font-medium tracking-tight">Think bigger.</p>
        </div>
      </SpiralArms>
      <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)} className="mt-4 rounded-lg border border-border px-4 py-2 text-sm">
        {paused ? "Resume motion" : "Pause motion"}
      </button>
    </div>
  );
}
