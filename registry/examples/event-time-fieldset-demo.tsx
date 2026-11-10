"use client";

import { useState, type ReactNode } from "react";

import { EventTimeFieldset, type EventTimeValue } from "@rhs-ui/application/event-time-fieldset";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The surface the fieldset sits on in an event form. The fieldset itself has none. */
function Surface({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs sm:p-6">{children}</div>;
}

export default function Demo(): React.JSX.Element {
  const [meeting, setMeeting] = useState<EventTimeValue>({ start: "2026-10-27T14:00", end: "2026-10-27T15:00", allDay: false });
  const [offsite, setOffsite] = useState<EventTimeValue>({ start: "2026-10-29T09:00", end: "2026-10-30T17:00", allDay: true });

  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: move the start and the end follows, so one hour stays one hour. Pick an end before the start and it is refused in words.">
        <Surface>
          <EventTimeFieldset legend="When is the design review?" locale="en-GB" timeZone="Europe/Amsterdam" value={meeting} onValueChange={setMeeting} />
        </Surface>
      </Example>

      <Example caption="All day keeps the dates and hides the times. The sentence counts the days, and turning it off brings the times back.">
        <Surface>
          <EventTimeFieldset legend="When is the team offsite?" locale="en-GB" timeZone="Europe/Amsterdam" value={offsite} onValueChange={setOffsite} minDate="2026-10-24" />
        </Surface>
      </Example>

      <Example caption="Nothing chosen yet, with the first day limited by minDate. The time waits for a day, and the sentence asks for both ends.">
        <Surface>
          <EventTimeFieldset legend="When do you need the room?" locale="en-GB" timeZone="Europe/Amsterdam" minDate="2026-10-24" minuteStep={30} />
        </Surface>
      </Example>

      <Example caption="What the form receives from the first example: wall-clock text, to be read in the zone you named.">
        <pre
          role="region"
          tabIndex={0}
          aria-label="The value of the design review"
          className="relative overflow-x-auto rounded-xl border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          {JSON.stringify(meeting, null, 2)}
        </pre>
      </Example>
    </div>
  );
}
