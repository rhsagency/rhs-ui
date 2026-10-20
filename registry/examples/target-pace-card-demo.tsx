"use client";

import { useState } from "react";

import { TargetPaceCard } from "@rhs-ui/dashboard/target-pace-card";
import { Slider } from "@rhs-ui/primitives/slider";

const EUR: Intl.NumberFormatOptions = { style: "currency", currency: "EUR", maximumFractionDigits: 0 };
const COUNT: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };

export default function Demo(): React.JSX.Element {
  const [day, setDay] = useState([20]);
  const today = day[0] ?? 20;

  return (
    <div className="grid w-full max-w-3xl gap-6">
      <div className="grid gap-3 rounded-xl border border-border px-5 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-6">
        <div>
          <p className="text-sm font-medium">Move today</p>
          <p className="text-xs text-muted-foreground">Same revenue, another day of October: the tick and the verdict follow.</p>
        </div>
        <Slider value={day} onValueChange={setDay} min={1} max={31} step={1} thumbLabels={["Day of October"]} />
        <output aria-live="polite" className="text-sm text-muted-foreground tabular-nums sm:w-24 sm:text-right">
          {today} October
        </output>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <TargetPaceCard
          label="Revenue this month"
          value={16700}
          target={25000}
          start="2026-10-01"
          end="2026-10-31"
          now={`2026-10-${String(today).padStart(2, "0")}`}
          format={EUR}
          locale="en-IE"
        />
        <TargetPaceCard label="Sign-ups this quarter" value={340} target={2000} start="2026-10-01" end="2026-12-31" now="2026-10-20" format={COUNT} locale="en-IE" />
        <TargetPaceCard label="Annual plan upgrades in October" value={128} target={120} start="2026-10-01" end="2026-10-31" now="2026-10-20" format={COUNT} locale="en-IE" />
        <TargetPaceCard label="Newsletter subscribers this quarter" value={860} target={4000} start="2026-10-01" end="2026-12-31" now="2026-10-20" format={COUNT} locale="en-IE" />
        <TargetPaceCard label="Black Friday revenue" value={0} target={40000} start="2026-11-27" end="2026-11-30" now="2026-10-20" format={EUR} locale="en-IE" />
        <TargetPaceCard label="Sign-ups last quarter" value={1840} target={2000} start="2026-07-01" end="2026-09-30" now="2026-10-20" format={COUNT} locale="en-IE" />
      </div>
    </div>
  );
}
