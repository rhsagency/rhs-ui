"use client";

import { useState, type ReactNode } from "react";

import { TrialStatusBar } from "@rhs-ui/application/trial-status-bar";
import { Button } from "@rhs-ui/primitives/button";

// Amsterdam is the account's zone here. A fixed "now" keeps every bar the same on each load: in an app, leave `now` out and the bar reads the browser's clock.
const ZONE = "Europe/Amsterdam";
const NOW = Date.parse("2026-11-02T10:00:00Z");
const DAY = 86_400_000;

/** The strip sits above the app's own header, the way it does on a page: a small app is drawn under it for scale. */
function Window({ caption, children }: { caption?: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      {caption ? <p className="text-xs text-muted-foreground">{caption}</p> : null}
      <div className="overflow-hidden rounded-xl border border-border bg-background shadow-xs">
        {children}
        <div className="flex h-12 items-center justify-between px-4 sm:px-6">
          <span className="text-sm font-semibold tracking-[-0.03em]">Halcyon</span>
          <span aria-hidden="true" className="flex gap-4 text-xs text-muted-foreground">
            <span>Schedule</span>
            <span>Members</span>
            <span>Reports</span>
          </span>
        </div>
        <div aria-hidden="true" className="grid gap-2 px-4 pt-1 pb-5 sm:px-6">
          <div className="h-2.5 w-1/3 rounded-full bg-muted" />
          <div className="h-2.5 w-2/3 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [days, setDays] = useState(0);
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-9 px-4 py-8 sm:px-6 sm:py-10">
      <Window caption="Calm while there is time: the count, the date it ends, a thin track of how much has gone and a quiet Upgrade.">
        <TrialStatusBar startedAt="2026-10-19T09:00:00Z" endsAt="2026-11-14T22:59:00Z" now={NOW} timeZone={ZONE} locale="en-GB" onUpgrade={() => undefined} />
      </Window>

      <Window caption="From three days on the sentence gets firmer, the bar turns solid and Upgrade stands out.">
        <TrialStatusBar startedAt="2026-10-20T09:00:00Z" endsAt="2026-11-05T22:59:00Z" now={NOW} timeZone={ZONE} locale="en-GB" onUpgrade={() => undefined} />
      </Window>

      <Window caption="Tomorrow, then today. Days are calendar days in the account's zone, so 23:59 on the last day still counts as that day.">
        <TrialStatusBar startedAt="2026-10-21T09:00:00Z" endsAt="2026-11-03T22:59:00Z" now={NOW} timeZone={ZONE} locale="en-GB" onUpgrade={() => undefined} />
      </Window>

      <Window caption="After the end it says so, with the same action. The track is full.">
        <TrialStatusBar startedAt="2026-10-16T09:00:00Z" endsAt="2026-10-30T22:59:00Z" now={NOW} timeZone={ZONE} locale="en-GB" upgradeHref="#pricing" />
      </Window>

      <div className="grid min-w-0 gap-3">
        <p className="text-xs text-muted-foreground">Move the clock a day at a time and watch the sentence, the track and the button change.</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" disabled={days >= 13} onClick={() => setDays((count) => Math.min(13, count + 1))}>
            Next day
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={days === 0} onClick={() => setDays(0)}>
            Back to the start
          </Button>
        </div>
        <Window>
          <TrialStatusBar startedAt="2026-11-02T09:00:00Z" endsAt="2026-11-15T22:59:00Z" now={NOW + days * DAY} timeZone={ZONE} locale="en-GB" onUpgrade={() => undefined} />
        </Window>
      </div>
    </div>
  );
}
