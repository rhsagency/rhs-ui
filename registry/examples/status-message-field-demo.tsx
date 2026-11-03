"use client";

import { useState, type ReactNode } from "react";

import { StatusMessageField, type StatusMessageValue } from "@rhs-ui/application/status-message-field";
import { DEFAULT_CLEAR_OPTIONS, resolveClear } from "@rhs-ui/application/status-message-field/options";

/** A fixed moment, so the preview shows the same clear time every time: Tuesday 3 November, 14:30 in Amsterdam. */
const NOW = "2026-11-03T13:30:00Z";
const ZONE = "Europe/Amsterdam";

/** A caption above a case, in the quiet voice the rest of the demo uses. */
function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3 @3xl:row-span-2 @3xl:grid-rows-subgrid">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** What the field reported last, as the code that receives it would see it. */
function Report({ value, clearsAt }: { value: StatusMessageValue; clearsAt: string | null }): React.JSX.Element {
  return (
    <p className="rounded-lg bg-muted/60 px-3 py-2 font-mono text-[0.6875rem] leading-5 text-muted-foreground [overflow-wrap:anywhere]">
      {`${JSON.stringify(value)} clears ${clearsAt ?? "never"}`}
    </p>
  );
}

function resolved(value: StatusMessageValue): string | null {
  return resolveClear(DEFAULT_CLEAR_OPTIONS.find((option) => option.id === value.clearAfter), Date.parse(NOW), ZONE);
}

export default function Demo(): React.JSX.Element {
  const [meeting, setMeeting] = useState<StatusMessageValue>({ text: "In a meeting", icon: "calendar", clearAfter: "1h" });
  const [meetingClears, setMeetingClears] = useState<string | null>(resolved(meeting));
  const [away, setAway] = useState<StatusMessageValue>({ text: "", icon: "palm-tree", clearAfter: "week" });
  const [awayClears, setAwayClears] = useState<string | null>(resolved(away));

  return (
    <div className="@container w-full">
      <div className="mx-auto grid max-w-4xl gap-x-10 gap-y-12 @3xl:grid-cols-2">
        <Case caption="Open the glyph button for the quick statuses: each fills the text, the icon and its usual clear time, and the focus goes to the text to edit it. The preview shows the clear time at 14:30 in Amsterdam.">
          <div className="grid gap-3">
            <StatusMessageField
              displayName="Mara Okafor"
              value={meeting}
              now={NOW}
              timeZone={ZONE}
              onValueChange={(next, clearsAt) => {
                setMeeting(next);
                setMeetingClears(clearsAt);
              }}
            />
            <Report value={meeting} clearsAt={meetingClears} />
          </div>
        </Case>

        <Case caption="An icon on its own is a status too. This one clears at the end of the week, which is Monday midnight in the time zone you give.">
          <div className="grid gap-3">
            <StatusMessageField
              displayName="Ines Marchetti"
              value={away}
              now={NOW}
              timeZone={ZONE}
              onValueChange={(next, clearsAt) => {
                setAway(next);
                setAwayClears(clearsAt);
              }}
            />
            <Report value={away} clearsAt={awayClears} />
          </div>
        </Case>
      </div>
    </div>
  );
}
