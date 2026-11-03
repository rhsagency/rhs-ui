"use client";

import { useState, type ReactNode } from "react";

import { ThresholdSlider, type ThresholdValue } from "@rhs-ui/primitives/threshold-slider";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const card = "grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs";

/** Which zone a reading falls in, for the sentence under the first slider. */
function zoneOf(reading: number, levels: ThresholdValue): "OK" | "Warning" | "Critical" {
  return reading >= levels.critical ? "Critical" : reading >= levels.warn ? "Warning" : "OK";
}

export default function Demo(): React.JSX.Element {
  const [disk, setDisk] = useState<ThresholdValue>({ warn: 70, critical: 90 });
  const reading = 78;
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: drag a handle, press a spot on the bar, or use the arrow keys (Page keys for ten). The handles never cross.">
          <div className={card}>
            <div className="grid gap-1">
              <h2 className="text-sm font-medium tracking-[-0.01em]">Alert rules for halcyon-db-02</h2>
              <p className="text-xs text-muted-foreground">Warnings go to the team channel, critical alerts page whoever is on call.</p>
            </div>
            <ThresholdSlider label="Disk usage" value={disk} onValueChange={setDisk} />
            <p role="status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
              <span>Today the disk is at {reading}%, which is</span>
              <strong className="text-sm font-semibold text-foreground">{zoneOf(reading, disk)}</strong>
            </p>
          </div>
        </Example>

        <Example caption="A small scale in half steps: the warning level is so near the start that the 0% on the scale gives up its place to it">
          <div className={card}>
            <ThresholdSlider label="Error rate" min={0} max={20} step={0.5} defaultValue={{ warn: 1.5, critical: 5 }} />
          </div>
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Another unit, a step of 50, and zones with names of their own">
          <div className={card}>
            <ThresholdSlider label="Response time" min={0} max={2000} step={50} unit="ms" defaultValue={{ warn: 400, critical: 1000 }} zoneLabels={{ ok: "Fast", warn: "Slow", critical: "Failing" }} />
          </div>
        </Example>
        <Example caption="Gigabytes of a 500 GB quota, with the handles kept at least 20 GB apart">
          <div className={card}>
            <ThresholdSlider
              label="Storage quota"
              min={0}
              max={500}
              step={10}
              unit="GB"
              minGap={20}
              defaultValue={{ warn: 350, critical: 450 }}
              zoneLabels={{ ok: "Plenty", warn: "Low", critical: "Full" }}
            />
          </div>
        </Example>
        <Example caption="Disabled, as an alert rule is while it is managed by the platform team">
          <div className={card}>
            <ThresholdSlider disabled label="Memory pressure" defaultValue={{ warn: 75, critical: 92 }} />
          </div>
        </Example>
      </div>
    </div>
  );
}
