"use client";

import { useState, type ReactNode } from "react";

import { PeriodStepper, type PeriodStepperLabels, type PeriodUnit } from "@rhs-ui/application/period-stepper";
import { endOf, startOf } from "@rhs-ui/application/period-stepper/periods";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";

// A fixed "today" keeps the Today button in the same place on every load. In an app, leave `today` out and the stepper reads the browser's clock.
const TODAY = "2026-10-22";

export default function Demo(): React.JSX.Element {
  const [unit, setUnit] = useState<PeriodUnit>("week");
  const [day, setDay] = useState("2026-10-12");
  const [month, setMonth] = useState("2026-02-01");

  // The period behind the label, to work out the figures for: what onChange receives as its range.
  const start = startOf(unit, day, 1);
  const end = endOf(unit, start);
  const { orders, revenue, average } = figures(start, unit);

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-2xl gap-12">
        <Case caption="Step through a report. Previous and next stop where the data does, Today appears only when you are away from it, and with focus on the label the left and right arrow keys step too.">
          <div className="grid gap-5 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold tracking-[-0.02em]">Sales</h2>
              <SegmentedControl
                label="Step by"
                value={unit}
                onValueChange={(next) => setUnit(next as PeriodUnit)}
                options={[
                  { value: "day", label: "Day" },
                  { value: "week", label: "Week" },
                  { value: "month", label: "Month" },
                  { value: "year", label: "Year" },
                ]}
                className="[&_button]:px-3 [&_button]:py-1.5"
              />
            </div>
            <PeriodStepper
              unit={unit}
              value={day}
              today={TODAY}
              min="2025-01-01"
              max="2026-12-31"
              locale="en-GB"
              onChange={(next) => setDay(next)}
            />
            <dl className="grid grid-cols-3 gap-3 border-t border-border pt-4">
              <Figure term="Orders" detail={orders.toLocaleString("en-GB")} />
              <Figure term="Revenue" detail={euro.format(revenue)} />
              <Figure term="Average order" detail={euro.format(average)} />
            </dl>
            <p className="text-xs text-muted-foreground tabular-nums">
              The range onChange gives you: <span className="font-mono text-foreground">{start}</span> to <span className="font-mono text-foreground">{end}</span>
            </p>
          </div>
        </Case>

        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 sm:items-start">
          <Case caption="Dutch, with labels: the month follows the locale and the words of the control are passed in, Today and the names of the buttons too. Limited to the data, so Previous is off at January.">
            <PeriodStepper unit="month" value={month} onChange={(next) => setMonth(next)} min="2026-01-01" max="2026-12-31" locale="nl-NL" today={TODAY} labels={DUTCH} />
          </Case>
          <Case caption="Weeks that start on Sunday are numbered the way a US calendar does, and the first week is cut off at the limit.">
            <PeriodStepper unit="week" weekStart={0} defaultValue="2026-01-04" min="2026-01-01" locale="en-US" today={TODAY} />
          </Case>
        </div>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Figure({ term, detail }: { term: string; detail: string }): React.JSX.Element {
  return (
    <div className="grid min-w-0 gap-1">
      <dt className="truncate text-xs text-muted-foreground">{term}</dt>
      <dd className="truncate text-lg font-semibold tracking-[-0.03em] tabular-nums">{detail}</dd>
    </div>
  );
}

const euro = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/** Every word the stepper says, in Dutch: the locale writes the month, and these are the rest. */
const DUTCH = {
  today: "Vandaag",
  group: "Periode wijzigen",
  previous: "Vorige {unit}",
  next: "Volgende {unit}",
  hint: "Gebruik de pijltjestoetsen links en rechts om de periode te wijzigen.",
  units: { month: "maand" },
} satisfies PeriodStepperLabels;

/** Made-up but steady figures for a period: the same period always gives the same numbers, so stepping back and forth is believable. */
function figures(start: string, unit: PeriodUnit): { orders: number; revenue: number; average: number } {
  let seed = 7;
  for (const char of `${start}${unit}`) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  const scale = { day: 1, week: 6, month: 26, year: 310 }[unit];
  const orders = Math.round((18 + (seed % 23)) * scale);
  const average = 42 + ((seed >>> 5) % 30);
  return { orders, revenue: orders * average, average };
}
