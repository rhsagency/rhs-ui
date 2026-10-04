"use client";

import { useState } from "react";

import { SaveIndicator, type SaveIndicatorProps } from "@rhs-ui/primitives/save-indicator";

export default function Demo(): React.JSX.Element {
  const [state, setState] = useState<SaveIndicatorProps["state"]>("saved");
  const [text, setText] = useState("Q2 launch plan");
  return (
    <div className="mx-auto grid max-w-md gap-4 p-8">
      <div className="flex items-center justify-between gap-3">
        <input aria-label="Document title" value={text} onChange={(event) => { setText(event.target.value); setState("saving"); setTimeout(() => setState("saved"), 700); }} className="min-w-0 flex-1 bg-transparent text-lg font-medium outline-none" />
        <SaveIndicator state={state} savedAgo="just now" onRetry={() => setState("saved")} />
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <SaveIndicator state="offline" />
        <SaveIndicator state="error" onRetry={() => undefined} />
      </div>
    </div>
  );
}
