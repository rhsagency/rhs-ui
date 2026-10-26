"use client";

import { useState, type ReactNode } from "react";

import { IconCheck, IconClose, IconRefresh } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { EstimatedProgress, type EstimatedStatus } from "@rhs-ui/primitives/estimated-progress";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Card({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="rounded-xl border border-border bg-card p-5 shadow-xs">{children}</div>;
}

function Live({ base }: { base: number }): React.JSX.Element {
  const [status, setStatus] = useState<EstimatedStatus>("running");
  // The job starts nine seconds before the page opens, as if the page was reloaded while it ran.
  const [startedAt, setStartedAt] = useState(base - 9000);
  const running = status === "running";
  return (
    <Card>
      <div className="grid gap-5">
        <div className="grid gap-1">
          <h2 className="text-sm font-medium tracking-[-0.01em]">Halcyon Writer</h2>
          <p className="text-xs text-muted-foreground">Drafting the launch post from your notes. You can keep working; we will tell you when the draft is ready.</p>
        </div>
        <EstimatedProgress label="Writing the first draft" expectedMs={20000} status={status} startedAt={startedAt} />
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button variant="outline" size="sm" disabled={running} onClick={() => { setStartedAt(Date.now()); setStatus("running"); }}>
            <IconRefresh />
            Run again
          </Button>
          <Button variant="outline" size="sm" disabled={!running} onClick={() => setStatus("done")}>
            <IconCheck />
            Finish
          </Button>
          <Button variant="outline" size="sm" disabled={!running} onClick={() => setStatus("failed")}>
            <IconClose />
            Fail
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function Demo(): React.JSX.Element {
  const [base] = useState(() => Date.now());
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-10">
      <Example caption="Try it: nothing reports how far the draft is, so the bar is paced by the usual 20 seconds. Let it run past that, or finish or fail it yourself">
        <Live base={base} />
      </Example>
      <Example caption="The four states, side by side">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <EstimatedProgress label="Exporting the orders" expectedMs={30000} startedAt={base - 6000} />
          </Card>
          <Card>
            <EstimatedProgress label="Building the year-end report" expectedMs={30000} startedAt={base - 52000} />
          </Card>
          <Card>
            <EstimatedProgress label="Generating thumbnails" expectedMs={30000} status="done" />
          </Card>
          <Card>
            <EstimatedProgress label="Syncing the inventory" expectedMs={30000} status="failed" />
          </Card>
        </div>
      </Example>
    </div>
  );
}
