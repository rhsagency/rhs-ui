"use client";

import { useState, type ReactNode } from "react";

import { MilestoneProgress } from "@rhs-ui/primitives/milestone-progress";
import { Slider } from "@rhs-ui/primitives/slider";
import { cn } from "@/lib/utils";

const number = new Intl.NumberFormat("en-US");

function Example({ caption, children, className }: { caption: string; children: ReactNode; className?: string }): React.JSX.Element {
  return (
    <div className={cn("grid min-w-0 grid-cols-1 content-start gap-3", className)}>
      <p className="text-xs text-muted-foreground">{caption}</p>
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">{children}</div>
    </div>
  );
}

const TIERS = [
  { at: 0, label: "Bronze" },
  { at: 1000, label: "Silver" },
  { at: 2500, label: "Gold" },
  { at: 5000, label: "Platinum" },
] as const;

function Loyalty(): React.JSX.Element {
  const [points, setPoints] = useState(2458);
  return (
    <div className="grid gap-6">
      <MilestoneProgress label="Halcyon Rewards" value={points} max={5000} milestones={TIERS} formatValue={(amount) => `${number.format(amount)} points`} />
      <div className="grid gap-2 border-t border-border pt-5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm font-medium">Points earned</span>
          <span className="text-xs tabular-nums text-muted-foreground">{number.format(points)}</span>
        </div>
        <Slider min={0} max={5000} step={10} value={[points]} onValueChange={([next]) => setPoints(next ?? 0)} thumbLabels={["Points earned"]} />
      </div>
    </div>
  );
}

const euro = (amount: number) => `€${number.format(amount)}`;

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2">
      <Example caption="A loyalty ladder: drag the slider and the next stop follows the data" className="md:col-span-2">
        <Loyalty />
      </Example>
      <Example caption="A funding target with stretch goals, in euros">
        <MilestoneProgress
          label="Cedar Court restoration"
          value={32400}
          max={50000}
          formatValue={euro}
          milestones={[
            { at: 10000, label: "Survey" },
            { at: 25000, label: "Permits" },
            { at: 40000, label: "Build" },
            { at: 50000, label: "Stretch goal" },
          ]}
        />
      </Example>
      <Example caption="Free-shipping tiers in a basket, with the values left out">
        <MilestoneProgress
          label="Your basket"
          value={68}
          max={150}
          formatValue={euro}
          showValues={false}
          nextLabel="{remaining} more for {milestone}"
          milestones={[
            { at: 50, label: "Free shipping" },
            { at: 100, label: "Free gift" },
            { at: 150, label: "Free express" },
          ]}
        />
      </Example>
      <Example caption="Every stop reached: the last line says so" className="md:col-span-2">
        <MilestoneProgress
          label="Marathon plan"
          value={42}
          max={42}
          formatValue={(amount) => `${amount} km`}
          milestones={[
            { at: 5, label: "5K" },
            { at: 10, label: "10K" },
            { at: 21, label: "Half" },
            { at: 42, label: "Marathon" },
          ]}
        />
      </Example>
    </div>
  );
}
