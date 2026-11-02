"use client";

import { useState, type ReactNode } from "react";

import { TeamClocks, type ClockPerson } from "@rhs-ui/application/team-clocks";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";

/** A flat portrait drawn as an SVG data URI, so the demo needs no picture from elsewhere. */
function portrait(background: string, figure: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${background}"/><circle cx="32" cy="25" r="11" fill="${figure}"/><path d="M10 64c2-14 11-22 22-22s20 8 22 22z" fill="${figure}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// A fixed "now" (Tuesday, 15:30 UTC) keeps every clock the same on each load. In an app, leave `now` out and the clocks read the browser's clock.
const NOW = Date.parse("2026-10-27T15:30:00Z");

const TEAM: readonly ClockPerson[] = [
  { name: "Mara Jansen", city: "Amsterdam", timeZone: "Europe/Amsterdam", workHours: { start: "09:00", end: "17:30" }, image: portrait("#d4d4d4", "#8f8f8f") },
  { name: "Tomás Silva", city: "Lisbon", timeZone: "Europe/Lisbon", workHours: { start: "09:30", end: "18:00" } },
  { name: "Priya Nair", city: "Bengaluru", timeZone: "Asia/Kolkata", workHours: { start: "10:00", end: "18:30" }, image: portrait("#e5e5e5", "#a3a3a3") },
  { name: "Jo Park", city: "San Francisco", timeZone: "America/Los_Angeles", workHours: { start: "08:00", end: "16:30" } },
  { name: "Aiko Tanaka", city: "Tokyo", timeZone: "Asia/Tokyo", workHours: { start: "09:00", end: "18:00" } },
  { name: "Dana Whitfield", city: "New York", timeZone: "America/New_York", workHours: { start: "09:00", end: "17:00" }, image: portrait("#cfcfcf", "#7d7d7d") },
];

const NEIGHBOURS: readonly ClockPerson[] = [
  { name: "Mara Jansen", city: "Amsterdam", timeZone: "Europe/Amsterdam" },
  { name: "Aiko Tanaka", city: "Tokyo", timeZone: "Asia/Tokyo" },
  { name: "Dana Whitfield", city: "New York", timeZone: "America/New_York" },
];

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [twelve, setTwelve] = useState(false);
  return (
    <div className="grid w-full max-w-3xl gap-9">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 text-card-foreground shadow-xs">
        <Label htmlFor="team-clocks-12h" className="min-w-0 flex-1 leading-5">
          12-hour clock
        </Label>
        <Switch id="team-clocks-12h" checked={twelve} onCheckedChange={setTwelve} />
      </div>

      <Case caption="A list sorted by offset, measured from Amsterdam on Tuesday 27 October at 16:30. A day that differs is written before the time.">
        <TeamClocks people={TEAM} sort="offset" now={NOW} viewerTimeZone="Europe/Amsterdam" hour12={twelve} locale="en-GB" />
      </Case>

      <Case caption="The analog face is drawn in SVG from each person's own wall clock. The time stays as text beside it, and a muted face means off hours.">
        <TeamClocks variant="analog" people={TEAM} sort="offset" now={NOW} viewerTimeZone="Europe/Amsterdam" hour12={twelve} locale="en-GB" />
      </Case>

      <Case caption="Live: no `now`, so it reads your browser's clock and your own time zone, and ticks on the minute.">
        <TeamClocks people={NEIGHBOURS} hour12={twelve} locale="en-GB" />
      </Case>
    </div>
  );
}
