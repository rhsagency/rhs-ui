"use client";

import { useEffect, useState, type ReactNode } from "react";

import { BatchProgress } from "@rhs-ui/application/batch-progress";
import { Button } from "@rhs-ui/primitives/button";

const TOTAL = 160;

function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

type Run = { started: boolean; done: number; failed: number; status: "running" | "cancelling" | "complete" };

/** A batch that really runs: three items every 60 ms, every nineteenth one failing, so the counts, the hatch and the spoken steps can all be seen. */
function LiveBatch(): React.JSX.Element {
  const [run, setRun] = useState<Run>({ started: false, done: 0, failed: 0, status: "running" });

  useEffect(() => {
    if (!run.started || run.status === "complete") return;
    if (run.status === "cancelling") {
      // The items already in flight finish, and then it is over.
      const timer = window.setTimeout(() => setRun((current) => ({ ...current, status: "complete" })), 900);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setInterval(() => {
      setRun((current) => {
        if (current.status !== "running") return current;
        let { done, failed } = current;
        for (let step = 0; step < 3 && done + failed < TOTAL; step += 1) {
          if ((done + failed) % 19 === 6) failed += 1;
          else done += 1;
        }
        return { ...current, done, failed, status: done + failed >= TOTAL ? "complete" : "running" };
      });
    }, 60);
    return () => window.clearInterval(timer);
  }, [run.started, run.status]);

  return (
    <div className="grid gap-4">
      {run.started ? (
        <BatchProgress
          total={TOTAL}
          done={run.done}
          failed={run.failed}
          label="Resizing 160 product photos"
          status={run.status}
          onCancel={() => setRun((current) => ({ ...current, status: "cancelling" }))}
        />
      ) : null}
      <div>
        <Button type="button" size="sm" variant={run.started ? "outline" : "default"} disabled={run.started && run.status !== "complete"} onClick={() => setRun({ started: true, done: 0, failed: 0, status: "running" })}>
          {run.started ? "Run it again" : "Resize 160 photos"}
        </Button>
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-xl gap-10">
      <Case caption="Running: the failed items take the end of the bar as a hatch, and every count has a swatch of its part of the bar.">
        <BatchProgress total={120} done={42} failed={2} label="Importing contacts from northwind-leads.csv" onCancel={() => undefined} />
      </Case>

      <Case caption="No failures yet: the line shows only what is true, so there is no 0 failed.">
        <BatchProgress total={1240} done={310} label="Archiving closed orders" onCancel={() => undefined} />
      </Case>

      <Case caption="Cancelling: the button is busy and the bar steps back while the running items settle.">
        <BatchProgress total={120} done={61} failed={3} label="Importing contacts from northwind-leads.csv" status="cancelling" />
      </Case>

      <Case caption="Complete: Done replaces Cancel. After a cancel, the items that were never started are said so.">
        <BatchProgress total={120} done={88} failed={2} label="Import of northwind-leads.csv stopped" status="complete" />
      </Case>

      <Case caption="A batch that runs. A screen reader hears it at each ten per cent, not at every item.">
        <LiveBatch />
      </Case>
    </div>
  );
}
