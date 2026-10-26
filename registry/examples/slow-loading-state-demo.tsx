"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconFileText } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { SlowLoadingState } from "@rhs-ui/primitives/slow-loading-state";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const FIGURES = [
  { label: "Revenue", value: "€1.24M", change: "+8.2% on Q2" },
  { label: "Orders", value: "18,402", change: "+5.1% on Q2" },
  { label: "Refund rate", value: "1.3%", change: "-0.2 points" },
] as const;

function Report(): React.JSX.Element {
  return (
    <div className="grid min-h-60 content-center gap-5 p-5">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="grid size-9 place-items-center rounded-lg border border-border bg-muted text-foreground">
          <IconFileText size={16} />
        </span>
        <div className="grid min-w-0">
          <h3 className="truncate text-sm font-medium tracking-[-0.01em]">Q3 2026 trading report</h3>
          <p className="truncate text-xs text-muted-foreground">Northwind Outfitters, all regions</p>
        </div>
      </div>
      <dl className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-3">
        {FIGURES.map((figure) => (
          <div key={figure.label} className="grid gap-1">
            <dt className="text-xs text-muted-foreground">{figure.label}</dt>
            <dd className="text-xl font-medium tracking-[-0.03em] tabular-nums">{figure.value}</dd>
            <dd className="text-xs text-muted-foreground tabular-nums">{figure.change}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const MODES = [
  { value: "quick", label: "Quick" },
  { value: "slow", label: "Slow" },
  { value: "stuck", label: "Stuck" },
] as const;
type Mode = (typeof MODES)[number]["value"];

function Live(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>("slow");
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  /** Pretends to build the report. A stuck run never ends, but its retry does. */
  function generate(retry = false) {
    window.clearTimeout(timer.current);
    setCancelled(false);
    setLoading(true);
    const wait = mode === "quick" ? 1500 : mode === "slow" ? 12000 : retry ? 2200 : null;
    if (wait !== null) timer.current = window.setTimeout(() => setLoading(false), wait);
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <SegmentedControl label="How the wait goes" value={mode} onValueChange={(next) => setMode(next as Mode)} options={MODES} />
        <Button size="sm" disabled={loading} onClick={() => generate()}>
          Generate report
        </Button>
      </div>
      <SlowLoadingState
        loading={loading}
        label="Generating your report"
        thresholds={[4000, 9000]}
        onCancel={() => {
          window.clearTimeout(timer.current);
          setCancelled(true);
          setLoading(false);
        }}
        onRetry={() => generate(true)}
        className="min-h-60"
      >
        {cancelled ? (
          <div className="grid min-h-60 content-center justify-items-center gap-1 px-6 py-14 text-center">
            <p className="text-sm font-medium">Report cancelled</p>
            <p className="text-sm text-muted-foreground">Nothing was generated. Start it again when you are ready.</p>
          </div>
        ) : (
          <Report />
        )}
      </SlowLoadingState>
    </div>
  );
}

/** A loader frozen at one stage: the thresholds are set so the stage is reached at once. The frame stretches to the tallest of the three and the loader sits in the middle of it. */
function Frozen({ thresholds }: { thresholds: readonly [number, number] }): React.JSX.Element {
  return (
    <div className="grid rounded-xl border border-border bg-card shadow-xs">
      <SlowLoadingState loading delay={0} label="Generating your report" thresholds={thresholds} onCancel={() => undefined} onRetry={() => undefined} className="grid content-center" />
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-10">
      <Example caption="Try it: Quick answers in 1.5 s, Slow in 12 s and Stuck never does, though Try again then works. The stages come at 4 and 9 seconds here, 8 and 20 by default">
        <Live />
      </Example>
      <Example caption="The three stages, frozen: the label, then the reassuring line, then a way out">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Frozen thresholds={[3_600_000, 7_200_000]} />
          <Frozen thresholds={[0, 3_600_000]} />
          <Frozen thresholds={[0, 0]} />
        </div>
      </Example>
    </div>
  );
}
