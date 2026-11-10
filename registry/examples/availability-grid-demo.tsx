"use client";

import { useState, type ReactNode } from "react";

import { AvailabilityGrid, type AvailabilityGridLabels } from "@rhs-ui/application/availability-grid";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const card = "grid gap-5 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs sm:p-6";

/** The slot keys of some days between two times, every `step` minutes: "1-09:00" is Monday from nine. */
function hours(days: readonly number[], from: string, to: string, step = 30): string[] {
  const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  const keys: string[] = [];
  for (const day of days) {
    for (let at = minutes(from); at < minutes(to); at += step) keys.push(`${day}-${String(Math.floor(at / 60)).padStart(2, "0")}:${String(at % 60).padStart(2, "0")}`);
  }
  return keys;
}

/** The same grid in Dutch: the names of the days and the times come from the locale, the rest from labels. */
const DUTCH: AvailabilityGridLabels = {
  grid: "Beschikbaarheid per week",
  timeColumn: "Tijd",
  cell: "{day} {from} tot {to}, {state}",
  available: "beschikbaar",
  unavailable: "niet beschikbaar",
  toggleDay: "Hele {day} vullen of wissen",
  legendOn: "Beschikbaar",
  legendOff: "Niet beschikbaar",
  fillWeekdays: "Werkdagen vullen",
  clear: "Alles wissen",
  summary: "Samenvatting",
  empty: "Nog niets gekozen. Sleep over het rooster om je uren te kleuren.",
  total: "{hours} uur per week",
  totalOne: "1 uur per week",
  range: "{from} tot {to}",
  everyDay: "Elke dag",
  changed: "{range} gezet op {state}",
  filledWeekdays: "Werkdagen gevuld",
  clearedAll: "Alles gewist",
  hint: "Sleep om uren te kleuren. Pijltjestoetsen verplaatsen, spatie wisselt, Shift met pijltjes breidt een bereik uit.",
};

export default function Demo(): React.JSX.Element {
  const [week, setWeek] = useState<string[]>([...hours([1, 2, 3, 4, 5], "09:00", "12:30"), ...hours([1, 2, 3, 4, 5], "13:30", "17:00"), ...hours([6], "10:00", "14:00")]);
  const [shifts, setShifts] = useState<string[]>([]);

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-10 px-4 py-10 sm:px-6">
      <Example caption="Try it: drag across the grid to paint hours (start on a filled cell to clear them), click a day to fill it, or use the arrow keys, Space and Shift with the arrows.">
        <div className={card}>
          <div className="grid gap-1">
            <h2 className="text-base leading-tight font-semibold tracking-[-0.02em]">Hours clients can book you</h2>
            <p className="text-sm leading-5 text-muted-foreground">Halcyon Bike Fitting. Bookings are only offered inside these hours, in Amsterdam time.</p>
          </div>
          <AvailabilityGrid value={week} onValueChange={setWeek} locale="en-GB" />
          <p className="text-xs leading-5 text-muted-foreground">
            Reported <span className="font-medium text-foreground tabular-nums">{week.length} slots</span>:{" "}
            <code className="font-mono text-[0.6875rem] break-words text-foreground">{week.slice(0, 3).join(", ")}, ...</code>
          </p>
        </div>
      </Example>

      <Example caption="Weekdays only, one slot an hour, in Dutch (locale nl-NL and labels). Empty to begin with: the summary says what to do, and Werkdagen vullen fills Monday to Friday.">
        <div className={card}>
          <AvailabilityGrid value={shifts} onValueChange={setShifts} days={[1, 2, 3, 4, 5]} startHour={9} endHour={17} slotMinutes={60} locale="nl-NL" labels={DUTCH} className="max-w-xl" />
        </div>
      </Example>
    </div>
  );
}
