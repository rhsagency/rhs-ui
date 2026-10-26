"use client";

import { useState } from "react";

import { WeekStrip } from "@rhs-ui/application/week-strip";
import { IconCalendar, IconPin } from "@rhs-ui/icons";

// A fixed "today" keeps the ring in the same place on every load. In an app, leave `today` out and the strip reads the browser's clock.
const TODAY = "2026-10-26";

interface Entry {
  time: string;
  title: string;
  place?: string;
}

const AGENDA: Record<string, readonly Entry[]> = {
  "2026-10-26": [
    { time: "09:00", title: "Standup", place: "Studio" },
    { time: "10:30", title: "Design review", place: "Room 2" },
    { time: "14:00", title: "Supplier call", place: "Online" },
  ],
  "2026-10-27": [{ time: "11:00", title: "One to one with Mara", place: "Café Noord" }],
  "2026-10-28": [
    { time: "09:30", title: "Sprint planning", place: "Room 1" },
    { time: "12:30", title: "Lunch with Priya", place: "Café Noord" },
    { time: "16:00", title: "Handover to the Kestrel team", place: "Online" },
  ],
  "2026-10-29": [{ time: "14:00", title: "Quarterly review", place: "Room 1" }],
  "2026-10-30": [
    { time: "10:00", title: "Release train", place: "Online" },
    { time: "15:00", title: "Retro", place: "Studio" },
  ],
  "2026-11-02": [{ time: "09:00", title: "Standup", place: "Studio" }],
  "2026-11-04": [
    { time: "13:00", title: "Photographer visit", place: "Studio" },
    { time: "17:30", title: "Drinks with the team", place: "De Gaper" },
  ],
};

const counts = Object.fromEntries(Object.entries(AGENDA).map(([day, entries]) => [day, entries.length]));

function Agenda({ day, locale }: { day: string; locale: string }): React.JSX.Element {
  const entries = AGENDA[day] ?? [];
  const heading = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
  return (
    <section aria-label={heading} className="px-4 pt-3 pb-4">
      <div aria-live="polite" className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold tracking-[-0.01em] first-letter:uppercase">{heading}</h3>
        <p className="text-xs text-muted-foreground tabular-nums">{entries.length === 0 ? "Nothing planned" : entries.length === 1 ? "1 event" : `${entries.length} events`}</p>
      </div>
      {entries.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          <IconCalendar className="size-4 shrink-0" />A free day. Pick another one above.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {entries.map((entry) => (
            <li key={`${entry.time}-${entry.title}`} className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-3 py-2.5">
              <span className="pt-px text-[0.8125rem] text-muted-foreground tabular-nums">{entry.time}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{entry.title}</span>
                {entry.place ? (
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <IconPin className="size-3 shrink-0" />
                    <span className="truncate">{entry.place}</span>
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  const [day, setDay] = useState("2026-10-28");
  const [dutch, setDutch] = useState("2026-10-29");
  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-md gap-8">
        <div className="grid gap-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xs">
            <WeekStrip className="px-3 pt-3 pb-2" value={day} onChange={setDay} marked={counts} today={TODAY} min="2026-10-05" max="2026-12-18" />
            <div className="border-t border-border">
              <Agenda day={day} locale="en-GB" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Arrow keys choose a day, Page Up and Page Down change the week. Dots show how many events a day has.</p>
        </div>

        <div className="grid gap-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xs">
            <WeekStrip className="px-3 pt-3 pb-2" locale="nl-NL" value={dutch} onChange={setDutch} marked={counts} today={TODAY} />
          </div>
          <p className="text-xs text-muted-foreground">Weekday names and the month come from the locale, here Dutch. Today is ringed, the chosen day is filled.</p>
        </div>
      </div>
    </div>
  );
}
