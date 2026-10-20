"use client";

import { useState, type ReactNode } from "react";

import { AddToCalendarButton } from "@rhs-ui/application/add-to-calendar-button";
import { buildIcs, type CalendarEvent, type CalendarProvider } from "@rhs-ui/application/add-to-calendar-button/calendar";
import { IconClock, IconPin } from "@rhs-ui/icons";

const SUMMIT: CalendarEvent = {
  title: "Halcyon Summit 2026",
  start: "2026-11-12T19:00",
  end: "2026-11-12T21:30",
  timeZone: "Europe/Amsterdam",
  location: "Felix Meritis, Keizersgracht 324, Amsterdam",
  description: "An evening of talks on calm software, followed by drinks. Doors open at 18:30.\nBring the ticket from your confirmation email.",
  url: "https://halcyon.example/summit",
  uid: "summit-2026@halcyon.example",
};

const DESIGN_WEEK: CalendarEvent = {
  title: "Design week at Kestrel",
  start: "2026-11-09",
  end: "2026-11-13",
  allDay: true,
  timeZone: "Europe/Amsterdam",
  location: "Kestrel Studio, Amsterdam",
};

const REVIEW: CalendarEvent = {
  title: "Quarterly review with Northwind",
  start: "2026-12-03T09:00",
  durationMinutes: 45,
  timeZone: "America/New_York",
  location: "Video call",
  description: "Join at https://meet.halcyon.example/q4-review",
};

const BROKEN: CalendarEvent = { title: "Team offsite", start: "next Friday" };

// A fixed stamp, so the file shown below is the same every time.
const SHOWN_ICS = (buildIcs(SUMMIT, { now: new Date("2026-10-20T10:00:00Z") }) ?? "").replace(/\r\n/g, "\n");

// Google Calendar and Outlook only open a prefilled form in a new tab; Apple and a plain file are downloaded. The status says which.
const OPENS: Partial<Record<CalendarProvider, string>> = { google: "Google Calendar", outlook: "Outlook" };

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [last, setLast] = useState("Nothing added yet.");
  const added = (provider: CalendarProvider) => setLast(OPENS[provider] ? `Opened ${OPENS[provider]} in a new tab.` : "Downloaded an .ics file.");

  return (
    <div className="grid w-full max-w-2xl gap-9">
      <div className="w-full min-w-0 rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
        <div className="flex gap-4 sm:gap-5">
          <div aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-lg border border-border bg-muted/50 text-center">
            <div>
              <p className="text-[0.6875rem] font-semibold tracking-wider text-muted-foreground uppercase">Nov</p>
              <p className="text-2xl leading-none font-semibold tracking-[-0.03em] tabular-nums">12</p>
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="text-base leading-snug font-semibold tracking-[-0.02em] text-balance">Halcyon Summit 2026</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <IconClock className="size-4 shrink-0" />
              <span>Thursday 12 November, 19:00 to 21:30 (Amsterdam)</span>
            </p>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
              <IconPin className="size-4 shrink-0" />
              <span>Felix Meritis, Keizersgracht 324</span>
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-5">
          <AddToCalendarButton event={SUMMIT} onAdd={added} />
          <p role="status" className="text-xs text-muted-foreground">
            {last}
          </p>
        </div>
        <details className="group/ics mt-5 text-sm">
          <summary className="cursor-pointer rounded-md text-xs font-medium text-muted-foreground outline-none select-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
            See the .ics file this builds
          </summary>
          <pre
            tabIndex={0}
            role="region"
            aria-label="Generated .ics file"
            className="relative mt-3 max-h-64 overflow-auto rounded-lg border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed whitespace-pre text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            {SHOWN_ICS}
          </pre>
        </details>
      </div>

      <div className="grid gap-x-10 gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr))]">
        <Example caption="An all-day event over several days">
          <AddToCalendarButton event={DESIGN_WEEK} />
        </Example>
        <Example caption="Another time zone: the menu names it">
          <AddToCalendarButton event={REVIEW} label="Add to my calendar" variant="secondary" />
        </Example>
        <Example caption="Two providers, in your order">
          <AddToCalendarButton event={SUMMIT} providers={["apple", "ics"]} variant="default" label="Save the date" />
        </Example>
        <Example caption="A start that cannot be read: disabled, with the reason">
          <AddToCalendarButton event={BROKEN} />
        </Example>
      </div>
    </div>
  );
}
