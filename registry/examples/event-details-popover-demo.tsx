"use client";

import { useState, type ReactNode } from "react";

import { EventChip, type CalendarEvent, type EventTone } from "@rhs-ui/application/event-chip";
import { EventDetailsPanel, EventDetailsPopover, type EventInfo, type EventPerson } from "@rhs-ui/application/event-details-popover";
import { IconEdit, IconVideo } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

// Fixed, so the demo reads the same today and next year: "Happening now" and "Ended 3 days ago" are measured from here.
// 11:30 in Amsterdam: the supplier call is on, the standup is over.
const NOW = "2026-10-29T10:30:00Z";

const ZONE = "Europe/Amsterdam";
const LOCALE = "en-GB";
// The reader is in London, an hour behind: the panel writes both clocks.
const VIEWER = "Europe/London";

const TEAM: readonly EventPerson[] = [
  { id: "mara", name: "Mara Visser" },
  { id: "tom", name: "Tom Jansen" },
  { id: "priya", name: "Priya Nair" },
  { id: "hana", name: "Hana Okafor" },
  { id: "joost", name: "Joost de Boer" },
  { id: "sofia", name: "Sofia Alvarez" },
];

const who = (...ids: string[]): EventPerson[] => TEAM.filter((person) => ids.includes(person.id));

interface Entry {
  id: string;
  event: EventInfo;
  calendar: string;
  tone: EventTone;
}

const DAY: readonly Entry[] = [
  {
    id: "standup",
    calendar: "Studio",
    tone: "ink",
    event: { title: "Standup", start: "2026-10-29T08:15:00Z", end: "2026-10-29T08:30:00Z", timeZone: ZONE, location: "Studio, Room 2", attendees: who("mara", "tom", "priya", "hana") },
  },
  {
    id: "supplier",
    calendar: "Product",
    tone: "graphite",
    event: {
      title: "Supplier call: Northwind Textiles",
      start: "2026-10-29T10:00:00Z",
      end: "2026-10-29T11:00:00Z",
      timeZone: ZONE,
      link: "https://meet.halcyon.example/northwind-textiles",
      attendees: who("tom", "priya", "joost"),
    },
  },
  {
    id: "quarterly",
    calendar: "Studio",
    tone: "ink",
    event: {
      title: "Quarterly review",
      start: "2026-10-29T13:00:00Z",
      end: "2026-10-29T14:30:00Z",
      timeZone: ZONE,
      location: "Boardroom, Keizersgracht 214",
      status: "cancelled",
      attendees: TEAM,
    },
  },
  {
    id: "review",
    calendar: "Product",
    tone: "graphite",
    event: {
      title: "Design review: checkout",
      start: "2026-10-29T15:00:00Z",
      end: "2026-10-29T16:30:00Z",
      timeZone: ZONE,
      location: "Studio, Room 2, Keizersgracht 214, Amsterdam",
      link: "https://meet.halcyon.example/design-review",
      attendees: TEAM,
      description:
        "Walk through the new checkout before it goes to engineering. Bring your notes on the three open questions from last week: the shipping options, guest checkout and what the empty cart should say when nothing is in it. Tom shows the prototype first, then we go through every screen in order and write down what has to change before Friday.\nWe decide on shipping today and park the rest for the Friday sync. The slides are in the Halcyon folder under Checkout.",
    },
  },
];

const RETRO: EventInfo = {
  title: "Sprint retro",
  start: "2026-10-26T15:00:00Z",
  end: "2026-10-26T15:45:00Z",
  timeZone: ZONE,
  link: "https://meet.halcyon.example/retro",
  attendees: who("mara", "tom", "priya", "hana", "joost"),
  description: "What we shipped, what slipped and what to change. Notes are in the retro board.",
};

const OFFSITE: EventInfo = {
  title: "Lisbon offsite",
  start: "2026-10-29T23:00:00Z",
  end: "2026-11-01T23:00:00Z",
  allDay: true,
  timeZone: ZONE,
  location: "Hotel Avenida, Lisbon",
  attendees: TEAM,
  description: "Planning for the first quarter, two workshops and a dinner on Saturday. Flights are booked from Schiphol on Friday morning.",
};

const chipOf = (entry: Entry): CalendarEvent => ({
  id: entry.id,
  title: entry.event.title,
  start: entry.event.start,
  end: entry.event.end,
  calendar: entry.calendar,
  tone: entry.tone,
  tentative: entry.event.status === "tentative",
});

export default function Demo(): React.JSX.Element {
  // The stage holds room for an open panel only while one is open, so a closed demo is as tall as its card.
  const [open, setOpen] = useState<string | null>("review");

  return (
    <div className="grid w-full max-w-4xl gap-12">
      <Case caption="Click an event. The panel opens under the chip and gives you the day and both clocks, the place or the link, who is invited and the first four lines of the description. Escape closes it and the focus goes back to the chip.">
        <div className={open ? "min-h-[43rem]" : undefined}>
          <section aria-labelledby="event-details-day" className="max-w-sm overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
            <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3">
              <h2 id="event-details-day" className="text-sm font-semibold tracking-[-0.01em]">
                Thursday 29 October
              </h2>
              <p className="text-xs text-muted-foreground">Amsterdam time</p>
            </div>
            <ul className="grid gap-1.5 p-3">
              {DAY.map((entry) => (
                <li key={entry.id}>
                  <EventDetailsPopover
                    event={entry.event}
                    viewerTimeZone={VIEWER}
                    locale={LOCALE}
                    now={NOW}
                    open={open === entry.id}
                    onOpenChange={(next) => setOpen((current) => (next ? entry.id : current === entry.id ? null : current))}
                    actions={
                      entry.id === "review" ? (
                        <>
                          <Button size="sm">
                            <IconVideo />
                            Join
                          </Button>
                          <Button size="sm" variant="outline">
                            <IconEdit />
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost" className="ms-auto text-muted-foreground">
                            Cancel event
                          </Button>
                        </>
                      ) : undefined
                    }
                  >
                    <EventChip event={chipOf(entry)} locale={LOCALE} timeZone={ZONE} selected={open === entry.id} />
                  </EventDetailsPopover>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </Case>

      <div className="grid gap-x-8 gap-y-10 md:grid-cols-3 md:items-start">
        <Case caption="Cancelled: the title is struck through and the word says it. Nobody has to read the colour.">
          <Surface>
            <EventDetailsPanel event={DAY[2]?.event ?? RETRO} viewerTimeZone={VIEWER} locale={LOCALE} now={NOW} />
          </Surface>
        </Case>
        <Case caption="Over: marked in words, with how long ago it ended. The link to join is still there for the recording.">
          <Surface>
            <EventDetailsPanel event={RETRO} viewerTimeZone={VIEWER} locale={LOCALE} now={NOW} />
          </Surface>
        </Case>
        <Case caption="All day over three days: dates instead of clocks, and no second time zone to explain.">
          <Surface>
            <EventDetailsPanel event={OFFSITE} viewerTimeZone={VIEWER} locale={LOCALE} now={NOW} />
          </Surface>
        </Case>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The popover a panel sits in, drawn flat so the panel is seen in its place. */
function Surface({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="w-full min-w-0 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md">{children}</div>;
}
