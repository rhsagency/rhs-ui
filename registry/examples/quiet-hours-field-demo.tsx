"use client";

import { useState, type ReactNode } from "react";

import { QuietHoursField, type QuietHoursLabels, type QuietHoursValue } from "@rhs-ui/application/quiet-hours-field";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const card = "grid gap-5 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs sm:p-6";

/** The same field in Dutch: the names of the days and the sentence come from the locale, the rest from labels. */
const DUTCH: QuietHoursLabels = {
  title: "Niet storen",
  description: "Zet meldingen op een schema uit.",
  from: "Van",
  to: "Tot",
  days: "Op deze dagen",
  overnight: "Over de nacht: eindigt de volgende dag om {to}",
  summaryOn: "Stil van {from} tot {to}, {days}",
  summaryOff: "Niet storen staat uit. Je schema blijft bewaard: {from} tot {to}, {days}.",
  sameTime: "Van en Tot mogen niet hetzelfde tijdstip zijn. Kies een ander eindtijdstip.",
  oneDay: "Houd minstens één dag geselecteerd.",
  everyDay: "elke dag",
  weekends: "in het weekend",
  through: "tot en met",
  noDays: "geen dagen",
};

export default function Demo(): React.JSX.Element {
  const [night, setNight] = useState<QuietHoursValue>({ enabled: true, from: "22:00", to: "07:00", days: [1, 2, 3, 4, 5] });
  const [lunch, setLunch] = useState<QuietHoursValue>({ enabled: false, from: "12:30", to: "13:30", days: [1, 2, 3, 4, 5] });

  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: 22:00 to 07:00 crosses midnight and says so. Set both times the same, or turn off the last day, and the field refuses in words.">
        <div className={card}>
          <QuietHoursField locale="en-GB" value={night} onValueChange={setNight} />
          <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
            <span>Reported</span>
            <code className="font-mono text-[0.6875rem] break-words text-foreground">{JSON.stringify(night).replace(/,/g, ", ")}</code>
          </p>
        </div>
      </Example>

      <Example caption="Off, in Dutch (locale nl-NL and labels): the schedule is dimmed, not cleared, and comes back when you switch it on.">
        <div className={card}>
          <QuietHoursField locale="nl-NL" labels={DUTCH} value={lunch} onValueChange={setLunch} />
        </div>
      </Example>
    </div>
  );
}
