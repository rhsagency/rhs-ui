"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { SliderField } from "@rhs-ui/primitives/slider-field";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const card = "grid gap-6 rounded-xl border border-border bg-card p-5 shadow-xs";

/** 45 -> "45 min", 75 -> "1 h 15 min", 120 -> "2 h". */
function minutes(value: number): string {
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

const euro = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const euroNl = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function Focus(): React.JSX.Element {
  const [session, setSession] = useState(60);
  const [rest, setRest] = useState(10);
  const [saved, setSaved] = useState<string | null>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaved(`Saved: sessions of ${data.get("session")} min, breaks of ${data.get("rest")} min.`);
  }
  return (
    <form onSubmit={submit} className={card}>
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Focus timer</h2>
        <p className="text-xs text-muted-foreground">Halcyon blocks notifications while a session runs.</p>
      </div>
      <SliderField
        name="session"
        label="Session length"
        description="Longer sessions suit deep work; most people stay sharp for about 45 minutes."
        min={5}
        max={120}
        step={5}
        defaultValue={45}
        value={session}
        onValueChange={(next) => {
          setSession(next);
          setSaved(null);
        }}
        formatValue={minutes}
        marks={[{ value: 60, label: "1 h" }]}
        showInput
        unit="min"
      />
      <SliderField
        name="rest"
        label="Break length"
        min={0}
        max={30}
        step={1}
        defaultValue={10}
        value={rest}
        onValueChange={(next) => {
          setRest(next);
          setSaved(null);
        }}
        formatValue={(value) => (value === 0 ? "No break" : `${value} min`)}
        marks={[5, 10, 15, 20, 25]}
        minLabel="None"
        maxLabel="30 min"
      />
      <Button type="submit">Save timer</Button>
      <p role="status" className="min-h-4 border-t border-border pt-4 text-xs text-muted-foreground">
        {saved ?? "Drag, use the arrow keys, or type a number. Reset appears once a value leaves its default."}
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  const [volume, setVolume] = useState(35);
  const [budget, setBudget] = useState(2400);
  const [adBudget, setAdBudget] = useState(1800);
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: the tick marks the default, and Reset is only there while the value is somewhere else">
        <Focus />
      </Example>
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="A percentage with ticks, no number field">
          <SliderField label="Alert volume" min={0} max={100} step={5} defaultValue={60} value={volume} onValueChange={setVolume} formatValue={(value) => `${value}%`} marks={[0, 25, 50, 75, 100]} />
        </Example>
        <Example caption="Money: the knob steps by 50, the number field takes any amount (3,000 and 3000 are the same) and snaps it when you leave it">
          <SliderField
            label="Monthly budget"
            description="Northwind pauses spend for the month when you reach it."
            min={0}
            max={5000}
            step={50}
            defaultValue={1500}
            value={budget}
            onValueChange={setBudget}
            formatValue={(value) => euro.format(value)}
            locale="en-GB"
            showInput
            unit="EUR"
          />
        </Example>
        <Example caption="With locale nl-NL the number field reads like the Netherlands does: 3.000 is three thousand">
          <SliderField
            label="Ad budget"
            description="Kestrel stops serving ads for the month at this amount."
            min={0}
            max={5000}
            step={50}
            defaultValue={1500}
            value={adBudget}
            onValueChange={setAdBudget}
            formatValue={(value) => euroNl.format(value)}
            locale="nl-NL"
            showInput
            unit="EUR"
          />
        </Example>
        <Example caption="Disabled, as an admin policy would set it">
          <SliderField disabled label="Retention" min={7} max={365} step={1} defaultValue={90} formatValue={(value) => `${value} days`} description="Set by your workspace admin." />
        </Example>
      </div>
    </div>
  );
}
