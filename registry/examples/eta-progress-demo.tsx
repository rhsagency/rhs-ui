"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconRefresh } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { EtaProgress } from "@rhs-ui/primitives/eta-progress";

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

const PACES = [
  { value: "steady", label: "Steady" },
  { value: "uneven", label: "Uneven" },
] as const;
type Pace = (typeof PACES)[number]["value"];

/** Everything takes about 90 seconds. The uneven pace speeds up, slows down and stalls on the way, which is what real work does. */
function Live(): React.JSX.Element {
  const [pace, setPace] = useState<Pace>("uneven");
  // The page opens on an export that began 40 seconds ago and is nearly half done.
  const [run, setRun] = useState(() => ({ startedAt: Date.now() - 40_000, value: 0.45 }));
  const clock = useRef(40);
  const paceRef = useRef(pace);
  useEffect(() => {
    paceRef.current = pace;
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      clock.current += 0.5;
      const t = clock.current;
      const wobble = paceRef.current === "steady" ? 1 : Math.max(0.05, 1 + 0.7 * Math.sin(t / 6) + 0.35 * Math.sin(t / 2.3));
      setRun((current) => (current.value >= 1 ? current : { ...current, value: Math.min(1, current.value + (wobble / 90) * 0.5) }));
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <Card>
      <div className="grid gap-5">
        <div className="grid gap-1">
          <h2 className="text-sm font-medium tracking-[-0.01em]">Northwind Outfitters</h2>
          <p className="text-xs text-muted-foreground">Exporting the order history as CSV. You can leave this page; we will email the file when it is ready.</p>
        </div>
        <EtaProgress label="Exporting 4,820 orders" value={run.value} startedAt={run.startedAt} />
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <SegmentedControl label="Pace" value={pace} onValueChange={(next) => setPace(next as Pace)} options={PACES} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clock.current = 0;
              setRun({ startedAt: Date.now(), value: 0 });
            }}
          >
            <IconRefresh />
            Restart
          </Button>
        </div>
      </div>
    </Card>
  );
}

/** A fixed moment, so the four sentences below do not move while you read them. */
const NOW = 1_800_000_000_000;

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-10">
      <Example caption="Try it: restart the export and pick a pace. The estimate follows the real pace and only changes when the change matters">
        <Live />
      </Example>
      <Example caption="The four sentences, on a frozen clock">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <EtaProgress label="Importing contacts" value={0.03} startedAt={NOW - 2_000} now={NOW} />
          </Card>
          <Card>
            <EtaProgress label="Rendering the video" value={0.32} startedAt={NOW - 60_000} now={NOW} />
          </Card>
          <Card>
            <EtaProgress label="Backing up the library" value={0.97} startedAt={NOW - 120_000} now={NOW} />
          </Card>
          <Card>
            <EtaProgress label="Compressing the photos" value={1} startedAt={NOW - 80_000} finishedAt={NOW} now={NOW} />
          </Card>
        </div>
      </Example>
    </div>
  );
}
