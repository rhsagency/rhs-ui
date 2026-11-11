"use client";

import { useState, type ReactNode } from "react";

import { SnoozePanel, SnoozePopover } from "@rhs-ui/application/snooze-popover";
import { IconArchive, IconMailOpen } from "@rhs-ui/icons";
import { Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";

// A fixed "now" keeps every time the same on every load: Wednesday 21 October 2026, 16:30 in Amsterdam. In an app, leave `now` out and the panel reads the browser's clock.
const NOW = Date.parse("2026-10-21T14:30:00Z");
// Eight past eight in the evening in New York, a day later: "Later today" has already gone.
const NEW_YORK_EVENING = Date.parse("2026-10-22T00:12:00Z");

const WHEN = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Europe/Amsterdam" });

export default function Demo(): React.JSX.Element {
  const [note, setNote] = useState("Nothing snoozed yet.");

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-4xl gap-12">
        <Case caption="Snooze on a message, open. The choices are worked out from now in Europe/Amsterdam, with the day and the time at the right of each: Later today at 18:00, tomorrow at 08:00, Saturday, next Monday. Press one, or Enter on it, and the result is announced.">
          <div className="relative h-[34rem] overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar aria-hidden="true">
                  <AvatarFallback>MO</AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 gap-0.5">
                  <h2 className="truncate text-sm font-semibold tracking-[-0.01em]">Halcyon renewal: terms for 2027</h2>
                  <p className="truncate text-xs text-muted-foreground">Maya Okafor, 15:12</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <IconArchive />
                  Archive
                </Button>
                <SnoozePopover
                  defaultOpen
                  align="end"
                  now={NOW}
                  timeZone="Europe/Amsterdam"
                  locale="en-GB"
                  onSnooze={(date) => setNote(`The message comes back on ${WHEN.format(date)}.`)}
                />
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground max-sm:hidden">
                  <IconMailOpen />
                  Mark unread
                </Button>
              </div>
            </div>
            <div aria-hidden="true" className="grid gap-3 p-5">
              <div className="h-3 w-3/5 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted/70" />
              <div className="h-3 w-11/12 rounded bg-muted/70" />
              <div className="h-3 w-4/5 rounded bg-muted/70" />
            </div>
          </div>
          <p aria-live="polite" className="text-xs text-muted-foreground tabular-nums">
            {note}
          </p>
        </Case>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 md:items-start">
          <Case caption="Pick date and time: a calendar and a time field, the choice written out in words, and the zone said at the foot. Times that have passed cannot be picked.">
            <Surface>
              <SnoozePanel defaultView="custom" now={NOW} timeZone="Europe/Amsterdam" locale="en-GB" onSnooze={() => undefined} />
            </Surface>
          </Case>
          <Case caption="Eight past eight in the evening in New York, in US English: Later today is gone because 6:00 PM has passed, and the times are written the American way.">
            <Surface>
              <SnoozePanel now={NEW_YORK_EVENING} timeZone="America/New_York" locale="en-US" onSnooze={() => undefined} />
            </Surface>
          </Case>
        </div>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The popover a panel sits in, drawn flat so the panel is seen in its place. */
function Surface({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="w-full max-w-[20rem] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-sm">{children}</div>;
}
