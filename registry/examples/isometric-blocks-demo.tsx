"use client";
import { useState } from "react";
import { IsometricBlocks } from "@rhs-ui/backgrounds/isometric-blocks";

export default function Demo(): React.JSX.Element {
  const [paused, setPaused] = useState(false);
  return (
    <div className="w-full">
      <IsometricBlocks paused={paused} className="flex min-h-80 items-center justify-center rounded-xl border border-border bg-muted">
        <div className="px-8 py-6 text-center">
          <p className="text-xs uppercase tracking-widest opacity-70">Isometric Blocks</p>
          <p className="mt-3 text-3xl font-medium tracking-tight">Stack it up.</p>
        </div>
      </IsometricBlocks>
      <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)} className="mt-4 rounded-lg border border-border px-4 py-2 text-sm">
        {paused ? "Resume motion" : "Pause motion"}
      </button>
    </div>
  );
}
