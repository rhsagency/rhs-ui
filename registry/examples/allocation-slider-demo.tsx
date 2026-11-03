"use client";

import { Fragment, useState, type ReactNode } from "react";

import { AllocationSlider, type AllocationPart } from "@rhs-ui/primitives/allocation-slider";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A line of JSON that may wrap after a comma. */
function Json({ value }: { value: unknown }): React.JSX.Element {
  return (
    <>
      {JSON.stringify(value)
        .split(",")
        .map((part, index) => (
          <Fragment key={index}>
            {index > 0 ? (
              <>
                ,<wbr />
              </>
            ) : null}
            {part}
          </Fragment>
        ))}
    </>
  );
}

const card = "grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs";

const VARIANTS: readonly AllocationPart[] = [
  { id: "control", label: "Control" },
  { id: "short", label: "Short form" },
  { id: "video", label: "Video hero" },
];

const CHANNELS: readonly AllocationPart[] = [
  { id: "search", label: "Search" },
  { id: "social", label: "Social" },
  { id: "email", label: "Email" },
  { id: "partners", label: "Partners" },
];

const PHASES: readonly AllocationPart[] = [
  { id: "design", label: "Design" },
  { id: "build", label: "Build" },
  { id: "review", label: "Review" },
];

export default function Demo(): React.JSX.Element {
  const [split, setSplit] = useState<Record<string, number>>({ control: 50, short: 30, video: 20 });
  const [hours, setHours] = useState<Record<string, number>>({ design: 30, build: 70, review: 20 });
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: drag a divider, use the arrow keys (Shift for ten), or type a share. Typing takes from the others in proportion.">
          <div className={card}>
            <div className="grid gap-1">
              <h2 className="text-sm font-medium tracking-[-0.01em]">Checkout experiment</h2>
              <p className="text-xs text-muted-foreground">Halcyon sends this share of visitors to each version of the page.</p>
            </div>
            <AllocationSlider label="Traffic split" parts={VARIANTS} value={split} onValueChange={setSplit} lockable />
            <p role="status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
              <span>Reported</span>
              <code className="font-mono text-[0.6875rem] break-words text-foreground">
                <Json value={split} />
              </code>
            </p>
          </div>
        </Example>

        <Example caption="Another total and unit: 120 hours between three phases, in steps of 5 hours">
          <div className={card}>
            <AllocationSlider label="Sprint capacity" parts={PHASES} value={hours} onValueChange={setHours} total={120} step={5} unit="h" />
          </div>
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Search is locked at 30: the dividers beside it slide along, and the other channels trade between themselves">
          <div className={card}>
            <AllocationSlider label="Marketing budget" parts={CHANNELS} defaultValue={{ search: 30, social: 25, email: 15, partners: 30 }} lockable defaultLocked={["search"]} step={5} />
          </div>
        </Example>

        <Example caption="A split that does not add up, as saved data can be: the bar shows what is unassigned, and Balance spreads it">
          <div className={card}>
            <AllocationSlider
              label="Revenue share"
              parts={[
                { id: "studio", label: "Studio" },
                { id: "author", label: "Author" },
                { id: "agent", label: "Agent" },
              ]}
              defaultValue={{ studio: 45, author: 30, agent: 10 }}
            />
          </div>
        </Example>

        <Example caption="Disabled">
          <div className={card}>
            <AllocationSlider
              disabled
              label="Launch regions"
              parts={[
                { id: "eu", label: "Europe" },
                { id: "na", label: "North America" },
              ]}
              defaultValue={{ eu: 60, na: 40 }}
            />
          </div>
        </Example>
      </div>
    </div>
  );
}
