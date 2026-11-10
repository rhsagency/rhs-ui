"use client";

import { useState, type ReactNode } from "react";

import { SendScheduleField, type SendScheduleValue } from "@rhs-ui/application/send-schedule-field";
import { Button } from "@rhs-ui/primitives/button";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The step a campaign editor ends on: the field, a button that waits for a good time, and what the form would receive. */
function Step({ title, value, onValueChange, zone, lead, now, locale }: { title: string; value: SendScheduleValue; onValueChange: (value: SendScheduleValue) => void; zone: string; lead: number; now: string; locale: string }): React.JSX.Element {
  const waiting = value.mode === "later" && value.at === null;
  return (
    <div className="grid gap-5 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs sm:p-6">
      <h2 className="text-sm font-medium tracking-[-0.01em]">{title}</h2>
      <SendScheduleField value={value} onValueChange={onValueChange} timeZone={zone} minLeadMinutes={lead} now={now} locale={locale} />
      <Button disabled={waiting}>{value.mode === "now" ? "Send campaign" : "Schedule campaign"}</Button>
      <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] break-all text-foreground">{JSON.stringify(value).replace(/,/g, ", ")}</code>
      </p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  // A fixed clock, so the sentences below always read the same: Saturday 24 October 2026, 09:00 in Amsterdam.
  const [launch, setLaunch] = useState<SendScheduleValue>({ mode: "later", at: "2026-10-27T09:00:00+01:00" });
  const [press, setPress] = useState<SendScheduleValue>({ mode: "later", at: "2026-10-24T09:30:00-04:00" });

  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: the sentence names the result in your zone and says how far away it is. The time comes back as an ISO string with the offset for that day: daylight saving ends on Sunday, so Tuesday is +01:00.">
        <Step title="Autumn product update" value={launch} onValueChange={setLaunch} zone="Europe/Amsterdam" lead={15} now="2026-10-24T09:00:00+02:00" locale="en-GB" />
      </Example>

      <Example caption="A time inside the lead time (here an hour) is refused, with the earliest allowed time named, and the form is told there is no time yet.">
        <Step title="Press release, New York" value={press} onValueChange={setPress} zone="America/New_York" lead={60} now="2026-10-24T09:00:00-04:00" locale="en-US" />
      </Example>
    </div>
  );
}
