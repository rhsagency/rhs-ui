"use client";

import { Fragment, useState, type ReactNode } from "react";

import { MultiDatePicker, type MultiDateLabels } from "@rhs-ui/primitives/multi-date-picker";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid w-full min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Reported({ days }: { days: readonly string[] }): React.JSX.Element {
  return (
    <p className="max-w-[20rem] text-xs leading-5 text-muted-foreground">
      <span>Reported </span>
      <code className="font-mono text-[0.6875rem] text-foreground">
        {"["}
        {days.map((day, index) => (
          // The space between two days stays outside the nowrap span, so the line can only break there, never inside a date.
          <Fragment key={day}>
            {index > 0 ? " " : null}
            <span className="whitespace-nowrap">
              &quot;{day}&quot;{index < days.length - 1 ? "," : ""}
            </span>
          </Fragment>
        ))}
        {"]"}
      </code>
    </p>
  );
}

const card = "w-full max-w-[20rem] rounded-xl border border-border bg-card shadow-xs";
const head = "grid gap-1 px-4 pt-4";

/** Thursdays 12 and 19 November are already taken by a client, so they cannot be picked. */
const BOOKED = ["2026-11-12", "2026-11-19"];

const DUTCH: Partial<MultiDateLabels> = {
  previousMonth: "Vorige maand",
  nextMonth: "Volgende maand",
  count: (selected, limit) => `${selected === 0 ? "Geen data" : `${selected} ${selected === 1 ? "datum" : "data"}`} gekozen${limit === undefined ? "" : `, maximaal ${limit}`}`,
  limitReached: (limit) => `Meer dan ${limit} kan niet. Verwijder een datum om een andere dag te kiezen.`,
  truncated: (added, asked, limit) => `${added} van ${asked} dagen toegevoegd. De grens is ${limit} data.`,
  clear: "Wissen",
  listLabel: "Gekozen data",
  remove: (day) => `Verwijder ${day}`,
  empty: "Klik op een dag om hem toe te voegen. Shift-klik voegt alle dagen ertussen toe.",
};

export default function Demo(): React.JSX.Element {
  const [closed, setClosed] = useState<string[]>(["2026-11-26", "2026-11-27", "2026-12-24", "2026-12-25"]);
  const [workshops, setWorkshops] = useState<string[]>(["2026-11-10", "2026-11-17", "2026-11-24"]);
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: click days to add and remove them, Shift-click for the run in between, arrow keys to move, Enter to pick">
          <div className={card}>
            <div className={head}>
              <h2 className="text-sm font-medium tracking-[-0.01em]">Closure days</h2>
              <p className="text-xs text-muted-foreground">Halcyon Studio takes no bookings on these days.</p>
            </div>
            <MultiDatePicker value={closed} onValueChange={setClosed} locale="en-GB" min="2026-11-02" max="2027-01-31" name="closed" aria-label="Closure days" />
          </div>
          <Reported days={closed} />
        </Example>

        <Example caption="At the limit of three: the other days turn off and the reason is written out, here in Dutch with the weeks from Monday">
          <div className={card}>
            <div className={head}>
              <h2 className="text-sm font-medium tracking-[-0.01em]">Workshopdata</h2>
              <p className="text-xs text-muted-foreground">Kies maximaal drie dagen voor de Kestrel-training.</p>
            </div>
            <MultiDatePicker defaultValue={["2026-11-05", "2026-11-06", "2026-11-09"]} maxDates={3} locale="nl-NL" labels={DUTCH} min="2026-11-02" aria-label="Workshopdata" />
          </div>
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="A limit of five, and two days a client has already booked: they are struck through and cannot be picked">
          <div className={card}>
            <div className={head}>
              <h2 className="text-sm font-medium tracking-[-0.01em]">Workshop series</h2>
              <p className="text-xs text-muted-foreground">Pick up to five Tuesdays for the Northwind series.</p>
            </div>
            <MultiDatePicker value={workshops} onValueChange={setWorkshops} maxDates={5} disabledDates={BOOKED} locale="en-GB" min="2026-11-02" aria-label="Workshop dates" />
          </div>
        </Example>

        <Example caption="Disabled, as a locked schedule would be">
          <div className={card}>
            <MultiDatePicker disabled defaultValue={["2026-11-19", "2026-11-20"]} locale="en-GB" aria-label="Locked dates" />
          </div>
        </Example>
      </div>
    </div>
  );
}
