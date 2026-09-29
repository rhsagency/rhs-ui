"use client";

import { useEffect, useId, useState } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Progress } from "@rhs-ui/primitives/progress";

const FILES = 5;

export default function Demo(): React.JSX.Element {
  const id = useId();
  // null while preparing (indeterminate), then the number of files done.
  const [done, setDone] = useState<number | null>(2);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (done === null) {
      const start = window.setTimeout(() => setDone(0), 1400);
      return () => window.clearTimeout(start);
    }
    if (done >= FILES) {
      setRunning(false);
      return;
    }
    const next = window.setTimeout(() => setDone(done + 1), 700);
    return () => window.clearTimeout(next);
  }, [done, running]);

  const finished = done !== null && done >= FILES;
  const status = done === null ? "Preparing the upload..." : finished ? "All files uploaded." : `${done} of ${FILES} files uploaded`;

  return (
    <div className="grid w-full max-w-sm gap-3">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span id={`${id}-label`} className="font-medium">
          Brand assets
        </span>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {status}
        </span>
      </div>
      <Progress aria-labelledby={`${id}-label`} value={done ?? undefined} max={FILES} getValueLabel={(value, max) => `${value} of ${max} files`} />
      <Button
        variant="outline"
        size="sm"
        className="justify-self-start"
        disabled={running}
        onClick={() => {
          if (finished) setDone(null);
          setRunning(true);
        }}
      >
        {finished ? "Upload again" : "Continue the upload"}
      </Button>
    </div>
  );
}
