"use client";

import { Fragment, useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { Label } from "@rhs-ui/primitives/label";
import { RepeatSelect, type RepeatLabels } from "@rhs-ui/primitives/repeat-select";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const card = "grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs";

const STARTS = [
  { value: "2026-10-27", label: "27 Oct" },
  { value: "2026-11-05", label: "5 Nov" },
  { value: "2026-12-14", label: "14 Dec" },
];

const longDay = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));

const DUTCH: Partial<RepeatLabels> = {
  field: "Herhaling",
  placeholder: "Kies hoe vaak",
  none: "Herhaalt niet",
  daily: "Elke dag",
  weekly: (day) => `Elke week op ${day}`,
  monthlyDay: (day) => `Elke maand op de ${day}e`,
  monthlyLast: (day) => `Elke maand op de laatste ${day}`,
  yearly: (date) => `Elk jaar op ${date}`,
  weekdays: (first, last) => `Elke werkdag (${first} tot en met ${last})`,
  custom: "Aangepast…",
  customRule: "Aangepast",
  updated: (label) => `Herhaalt nu: ${label}`,
};

function Rule({ rule }: { rule: string | null }): React.JSX.Element {
  return (
    <p role="status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
      <span>Calendar file</span>
      <code className="font-mono text-[0.6875rem] break-words text-foreground">
        {(rule ?? "(no RRULE line)").split(";").map((part, index) => (
          // A long rule may break after a semicolon, never inside a word of it.
          <Fragment key={index}>
            {index > 0 ? (
              <>
                ;<wbr />
              </>
            ) : null}
            {part}
          </Fragment>
        ))}
      </code>
    </p>
  );
}

function NewEvent(): React.JSX.Element {
  const [start, setStart] = useState("2026-10-27");
  const [rule, setRule] = useState<string | null>("RRULE:FREQ=WEEKLY;BYDAY=TU");
  return (
    <div className={card}>
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Design sync</h2>
        <p className="text-xs text-muted-foreground">Halcyon product team, 30 minutes.</p>
      </div>
      <div className="grid gap-2">
        <p className="text-sm leading-none font-medium">Starts on</p>
        <SegmentedControl label="Start date" options={STARTS} value={start} onValueChange={setStart} className="w-full [&>button]:flex-1 [&>button]:px-2" />
        <p className="text-xs text-muted-foreground">{longDay(start, "en-GB")}</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="repeat-sync">Repeats</Label>
        <RepeatSelect id="repeat-sync" start={start} value={rule} onValueChange={setRule} locale="en-GB" name="repeat" />
      </div>
      <Rule rule={rule} />
    </div>
  );
}

function Dutch(): React.JSX.Element {
  const [rule, setRule] = useState<string | null>("RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=TH");
  const [editing, setEditing] = useState(false);
  return (
    <div className={card}>
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Teamoverleg</h2>
        <p className="text-xs text-muted-foreground">Donderdag 5 november 2026, Kestrel-kantoor Utrecht.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="repeat-nl">Herhaling</Label>
        <RepeatSelect
          id="repeat-nl"
          start="2026-11-05"
          locale="nl-NL"
          labels={DUTCH}
          value={rule}
          onValueChange={(next) => {
            setRule(next);
            setEditing(false);
          }}
          onCustom={() => setEditing(true)}
        />
      </div>
      {editing ? (
        <div className="grid gap-3 rounded-lg border border-dashed border-border bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Hier opent jouw eigen editor. Kies bijvoorbeeld:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Om de week", rule: "RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=TH" },
              { label: "Eerste donderdag", rule: "RRULE:FREQ=MONTHLY;BYDAY=1TH" },
            ].map((choice) => (
              <button
                key={choice.rule}
                type="button"
                onClick={() => {
                  setRule(choice.rule);
                  setEditing(false);
                }}
                className="h-8 rounded-md border border-border bg-background px-3 text-[0.8125rem] font-medium outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                {choice.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <Rule rule={rule} />
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: change the start day and the rule moves with it, so the weekday, the day of the month and the label follow. In the last week of a month the monthly choice says the last weekday.">
          <NewEvent />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Dutch, with the weekdays and months from Intl and the sentences translated. A rule that none of the choices describes shows as Custom, and Aangepast opens your own editor.">
          <Dutch />
        </Example>
        <Example caption="Fewer choices, no repeat yet, and disabled">
          <div className={card}>
            <div className="grid gap-2">
              <Label htmlFor="repeat-short">Reminder</Label>
              <RepeatSelect id="repeat-short" start="2026-11-05" locale="en-GB" include={["none", "weekly", "monthly"]} defaultValue={null} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="repeat-off">Billing run</Label>
              <RepeatSelect id="repeat-off" start="2026-11-05" locale="en-GB" disabled defaultValue="RRULE:FREQ=MONTHLY;BYMONTHDAY=5" />
            </div>
          </div>
        </Example>
      </div>
    </div>
  );
}
