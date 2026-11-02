"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Drawer } from "@rhs-ui/primitives/drawer";
import { WheelPicker, type WheelColumn } from "@rhs-ui/primitives/wheel-picker";
import { wheelRange } from "@rhs-ui/primitives/wheel-picker/wheel";

/** What the picker reported, on one line that breaks at its spaces and never in the middle of a word. The readout is for the reader of the demo, so it is hidden from a screen reader. */
const show = (value: unknown): string => JSON.stringify(value).replace(/,/g, ", ");

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The surface a wheel sits on in a page: the picker itself has none, so it takes whatever it is put on. */
function Panel({ title, note, children }: { title: string; note?: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">{title}</h2>
        {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

const TIME: WheelColumn[] = [
  { id: "hour", label: "Hours", options: wheelRange(1, 12), loop: true, align: "end", separator: ":", width: 72 },
  { id: "minute", label: "Minutes", options: wheelRange(0, 59, { pad: 2 }), loop: true, align: "start", width: 72 },
  {
    id: "period",
    label: "AM or PM",
    width: 80,
    options: [
      { value: "am", label: "AM" },
      { value: "pm", label: "PM" },
    ],
  },
];

const DURATION: WheelColumn[] = [
  { id: "hours", label: "Hours", options: wheelRange(0, 23), loop: true, align: "end", separator: "h", width: 56 },
  { id: "minutes", label: "Minutes", options: wheelRange(0, 55, { step: 5 }), loop: true, align: "start", separator: "min", width: 56 },
];

const GUESTS: WheelColumn[] = [{ id: "guests", label: "Guests", options: wheelRange(1, 12) }];

// The 17:30, 18:30 and 20:00 tables are taken: they stay in the list, struck through, and are passed over.
const TAKEN = new Set(["17:30", "18:30", "20:00"]);
const SLOTS: WheelColumn[] = [
  {
    id: "slot",
    label: "Time of the table",
    options: ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"].map((time) => ({ value: time, label: time, disabled: TAKEN.has(time) })),
  },
];

const timeText = ([hour = "7", minute = "30", period = "am"]: readonly string[]) => `${hour}:${minute.padStart(2, "0")} ${period.toUpperCase()}`;

function Alarm(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [alarm, setAlarm] = useState<string[]>(["7", "30", "am"]);
  const [draft, setDraft] = useState<string[]>(alarm);
  return (
    <Panel title="Wake-up alarm" note="On a phone the wheel lives in a Drawer: open it, swipe, and confirm.">
      <Drawer
        open={open}
        onOpenChange={(next) => {
          if (next) setDraft(alarm);
          setOpen(next);
        }}
        title="Wake-up alarm"
        description="Swipe the columns, tap a row, or use the arrow keys."
        trigger={
          <Button variant="outline" className="w-full justify-between">
            <span>Alarm</span>
            <span className="font-medium tabular-nums">{timeText(alarm)}</span>
          </Button>
        }
      >
        <div className="grid gap-5">
          <WheelPicker label="Alarm time" columns={TIME} value={draft} onValueChange={setDraft} className="mx-auto" />
          <Button
            onClick={() => {
              setAlarm(draft);
              setOpen(false);
            }}
          >
            Set alarm for {timeText(draft)}
          </Button>
        </div>
      </Drawer>
    </Panel>
  );
}

function Clock(): React.JSX.Element {
  const [time, setTime] = useState<string[]>(["10", "45", "am"]);
  return (
    <Panel title="Northwind pickup time" note="Swipe or scroll a column, tap a row, or press the arrow keys. Typing 4 5 jumps to 45.">
      <WheelPicker label="Pickup time" columns={TIME} value={time} onValueChange={setTime} className="mx-auto" />
      <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">{show(time)}</code>
      </p>
    </Panel>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: hours and minutes wrap round for as long as you swipe, and the chosen row is the one in the band">
          <Clock />
        </Example>
        <Example caption="In a Drawer on a phone: the wheel is the touch-first way to pick a time">
          <Alarm />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="A duration: two looping columns, minutes in steps of five">
          <Panel title="Halcyon workout length">
            <WheelPicker label="Workout length" columns={DURATION} defaultValue={["1", "15"]} className="mx-auto" />
          </Panel>
        </Example>
        <Example caption="One column with a first and a last row, three rows high">
          <Panel title="Guests at the table">
            <WheelPicker label="Guests" columns={GUESTS} defaultValue={["4"]} visibleRows={3} itemHeight={44} className="mx-auto" />
          </Panel>
        </Example>
        <Example caption="Rows that are taken stay in the list, struck through, and the keys and a stopped swipe pass them by">
          <Panel title="Kestrel Bistro tables">
            <WheelPicker label="Time of the table" columns={SLOTS} defaultValue={["18:00"]} className="mx-auto" />
          </Panel>
        </Example>
        <Example caption="Disabled">
          <Panel title="Closed for the night">
            <WheelPicker label="Alarm time" columns={TIME} defaultValue={["6", "00", "am"]} disabled className="mx-auto" />
          </Panel>
        </Example>
      </div>
    </div>
  );
}
