"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { Label } from "@rhs-ui/primitives/label";
import { NaturalDateField, type NaturalDateFieldProps, type NaturalDateLabels, type NaturalPhrases } from "@rhs-ui/primitives/natural-date-field";
import { addDays, fullDate, isoInZone } from "@rhs-ui/primitives/natural-date-field/natural";

/** The day the examples are read in, and the zone it is read in. */
interface Clock {
  now: number;
  timeZone: string;
  today: string;
}

// The server and the first paint show a fixed Wednesday, 21 October 2026 in UTC. As soon as the page runs, the reader's own day and time zone take over, so the field
// and the calendar button (which marks the browser's today) agree, and the dates in the examples stay as far from today as they are meant to be.
const FROZEN = Date.parse("2026-10-21T09:30:00Z");
const noSubscription = (): (() => void) => () => undefined;
let opened: number | null = null;
const readNow = (): number => (opened ??= Date.now());
const readZone = (): string => new Intl.DateTimeFormat("en-US").resolvedOptions().timeZone;

/** What the field reported, on one line that breaks at its spaces and never in the middle of a word. The readout is for the reader of the demo, so it is hidden from a screen reader. */
const show = (value: unknown): string => JSON.stringify(value, null, 1).replace(/\n\s*/g, " ");

const DUTCH: Partial<NaturalPhrases> = {
  today: ["vandaag"],
  tomorrow: ["morgen"],
  yesterday: ["gisteren"],
  dayAfterTomorrow: ["overmorgen"],
  weekdays: [["zondag", "zo"], ["maandag", "ma"], ["dinsdag", "di"], ["woensdag", "wo", "woe"], ["donderdag", "do"], ["vrijdag", "vr", "vrij"], ["zaterdag", "za"]],
  months: [["januari", "jan"], ["februari", "feb"], ["maart", "mrt"], ["april", "apr"], ["mei"], ["juni", "jun"], ["juli", "jul"], ["augustus", "aug"], ["september", "sep", "sept"], ["oktober", "okt"], ["november", "nov"], ["december", "dec"]],
  next: ["volgende", "volgend"],
  last: ["vorige", "afgelopen"],
  this: ["deze", "aanstaande"],
  in: ["over"],
  ago: ["geleden"],
  fromNow: [],
  endOf: ["einde van", "eind van"],
  articles: ["een"],
  unit: { day: ["dag", "dagen"], week: ["week", "weken"], month: ["maand", "maanden"], year: ["jaar", "jaren"] },
  filler: ["op", "de", "het", "van"],
  ordinals: ["e", "de", "ste"],
};

const DUTCH_LABELS: Partial<NaturalDateLabels> = {
  name: "Datum",
  hint: "Probeer morgen, volgende vrijdag of over 3 weken.",
  examples: "morgen, volgende vrijdag, over 3 weken of 14 mrt",
  unreadable: (examples) => `Dat begrijp ik niet. Probeer ${examples}.`,
  before: (date) => `Kies een datum vanaf ${date}.`,
  after: (date) => `Kies een datum tot en met ${date}.`,
  calendar: "Open de kalender",
  said: (date) => `Begrepen als ${date}`,
  confirm: "Enter",
};

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** Types into the input of what it wraps, and leaves the field unless told to stay, so the preview shows what it says at that moment. The focus is never touched: a preview must not take it from a page the reader is already using. */
function Typed({ text, leave = true, children }: { text: string; leave?: boolean; children: ReactNode }): React.JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    const input = box.current?.querySelector("input");
    if (!input) return;
    done.current = true;
    // React listens for the input event, and only sees a value that was set through the native setter.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    // Leaving is a separate moment, as it is for a person: the field has drawn what was typed by then.
    if (leave) window.setTimeout(() => input.dispatchEvent(new FocusEvent("focusout", { bubbles: true })), 60);
  }, [text, leave]);
  return <div ref={box}>{children}</div>;
}

function Field({ label, clock, typed, leave, ...props }: Omit<NaturalDateFieldProps, "id" | "value" | "aria-labelledby" | "now" | "timeZone"> & { label: string; clock: Clock; typed?: string; leave?: boolean }): React.JSX.Element {
  const id = useId();
  const field = (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <NaturalDateField id={id} now={clock.now} timeZone={clock.timeZone} {...props} />
    </div>
  );
  return typed === undefined ? (
    field
  ) : (
    <Typed text={typed} leave={leave}>
      {field}
    </Typed>
  );
}

function Delivery({ clock }: { clock: Clock }): React.JSX.Element {
  const id = useId();
  const [report, setReport] = useState<{ value: string | null; valid: boolean } | null>(null);
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Schedule a Northwind delivery</h2>
        <p className="text-xs text-muted-foreground">Say when, press Enter, or open the calendar. We deliver from tomorrow, up to a year ahead.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id}>Delivery date</Label>
        <NaturalDateField
          id={id}
          name="delivery"
          now={clock.now}
          timeZone={clock.timeZone}
          min={addDays(clock.today, 1)}
          max={addDays(clock.today, 365)}
          onValueChange={(value, state) => setReport({ value, valid: state.valid })}
        />
      </div>
      <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">{report ? show(report) : "nothing yet"}</code>
      </p>
    </form>
  );
}

function Examples({ clock }: { clock: Clock }): React.JSX.Element {
  const ahead = (days: number) => addDays(clock.today, days);
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption={`Try it: type next friday, in 2 weeks, end of month or 14 dec. Today is ${fullDate(clock.today, "en-US")}`}>
          <Delivery clock={clock} />
        </Example>
        <Example caption="Typing next fri: the date it will be is shown in full before you press Enter">
          <Field label="Follow-up" clock={clock} typed="next fri" leave={false} />
        </Example>
        <Example caption="Committed: the text becomes a plain date, and the arrow keys nudge it by a day">
          <Field label="Kick-off" clock={clock} typed="in 3 weeks" />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Text that is not understood is answered with phrases that would be">
          <Field label="Due date" clock={clock} typed="soonish" />
        </Example>
        <Example caption="min and max, here tomorrow to a month ahead: a date outside them says which side it is on">
          <Field label="Delivery date" clock={clock} typed="in 3 months" min={ahead(1)} max={ahead(30)} />
        </Example>
        <Example caption="Another language: the parser takes your own phrases, here Dutch, and the date is written in nl-NL">
          <Field label="Leverdatum" clock={clock} typed="overmorgen" leave={false} locale="nl-NL" phrases={DUTCH} labels={DUTCH_LABELS} />
        </Example>
        <Example caption="Disabled">
          <Field label="Delivery date" clock={clock} disabled defaultValue={ahead(12)} />
        </Example>
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const now = useSyncExternalStore(noSubscription, readNow, () => FROZEN);
  const timeZone = useSyncExternalStore(noSubscription, readZone, () => "UTC");
  const today = isoInZone(now, timeZone) ?? "2026-10-21";
  // Nobody has touched the examples when the reader's day arrives, so they simply start again from it.
  return <Examples key={`${today}|${timeZone}`} clock={{ now, timeZone, today }} />;
}
