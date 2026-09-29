"use client";
import { useState } from "react";
import { RainStreaks } from "@rhs-ui/backgrounds/rain-streaks";

export default function Demo(): React.JSX.Element {
  const [paused, setPaused] = useState(false);
  return (
    <div className="w-full">
      <RainStreaks paused={paused} className="flex min-h-80 items-center justify-center rounded-xl border border-border bg-muted">
        <div className="px-8 py-6 text-center">
          <p className="text-xs uppercase tracking-widest opacity-70">Rain Streaks</p>
          <p className="mt-3 text-3xl font-medium tracking-tight">Stay in.</p>
        </div>
      </RainStreaks>
      <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)} className="mt-4 rounded-lg border border-border px-4 py-2 text-sm">
        {paused ? "Resume motion" : "Pause motion"}
      </button>
    </div>
  );
}
