"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { WeekdayPicker } from "@rhs-ui/primitives/weekday-picker";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const card = "grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs";

function Standup(): React.JSX.Element {
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [saved, setSaved] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
  }
  return (
    <form onSubmit={submit} className={card}>
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Daily standup</h2>
        <p className="text-xs text-muted-foreground">Halcyon posts the prompt in #product at 09:30 on the days you pick.</p>
      </div>
      <WeekdayPicker
        name="days"
        legend="Repeat on"
        locale="en-GB"
        presets
        value={days}
        onValueChange={(next) => {
          setDays(next);
          setSaved(false);
        }}
      />
      <Button type="submit">Save schedule</Button>
      <p role="status" className="flex min-h-4 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        {saved ? (
          <span>Saved for {days.length} {days.length === 1 ? "day" : "days"} a week.</span>
        ) : (
          <>
            <span>Reported</span>
            <code className="font-mono text-[0.6875rem] text-foreground">{JSON.stringify(days).replace(/,/g, ", ")}</code>
          </>
        )}
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  const [studio, setStudio] = useState<number[]>([2, 4, 6]);
  const [lone, setLone] = useState<number[]>([6]);
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: presets set the whole group, and the sentence under the days is read out when it changes">
          <Standup />
        </Example>
        <Example caption="Keep one day: the last chip will not turn off, and says why">
          <WeekdayPicker legend="Weekly backup runs on" locale="en-GB" requireOne value={lone} onValueChange={setLone} />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="en-US starts the week on Sunday, and the short names fit seven columns on a phone">
          <WeekdayPicker legend="Studio open on" locale="en-US" variant="short" value={studio} onValueChange={setStudio} />
        </Example>
        <Example caption="nl-NL: the names and the sentence are Dutch, and so are the preset chips">
          <WeekdayPicker legend="Herhalen op" locale="nl-NL" presets defaultValue={[1, 3, 4, 5]} />
        </Example>
        <Example caption="Disabled">
          <WeekdayPicker legend="Pickup days" locale="en-GB" disabled defaultValue={[1, 5]} />
        </Example>
      </div>
    </div>
  );
}
