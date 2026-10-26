"use client";

import type { ReactNode } from "react";

import { RsvpForm, type RsvpEvent, type RsvpResponse } from "@rhs-ui/marketing/rsvp-form";

const event: RsvpEvent = {
  name: "Maria and Daan's wedding",
  startsAt: "2027-06-12T13:00:00Z",
  timeZone: "Europe/Amsterdam",
  place: "Villa Rozenhof, Wassenaar",
};

const dietary = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-free", label: "Gluten free" },
  { value: "lactose-free", label: "Lactose free" },
  { value: "nut-allergy", label: "Nut allergy" },
  { value: "halal", label: "Halal" },
];

/** The invitation as a calendar file the caller builds: an iCalendar event in a data URL. */
const calendar = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//Maria and Daan//Wedding//EN",
  "BEGIN:VEVENT",
  "UID:wedding-20270612@maria-and-daan.example",
  "DTSTAMP:20261026T090000Z",
  "DTSTART:20270612T130000Z",
  "DTEND:20270612T230000Z",
  "SUMMARY:Maria and Daan's wedding",
  // A comma inside a TEXT value is written \, in a calendar file, so the string holds a backslash and a comma.
  "LOCATION:Villa Rozenhof\\, Wassenaar",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");
const calendarHref = `data:text/calendar;charset=utf-8,${encodeURIComponent(calendar)}`;

/** A request that takes a moment and works, so the busy and success states can be seen by trying it. */
const send = (_response: RsvpResponse) => new Promise<void>((resolve) => setTimeout(resolve, 800));

const copy = { event, dietary, deadline: "2027-04-15T21:59:00Z", locale: "en-GB", calendarHref, onSubmit: send } as const;

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-6 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <div className="grid gap-x-12 gap-y-16 lg:grid-cols-2">
        <Example caption="Try it: send it empty for the mistakes, answer yes for guests and dietary needs, then answer no and watch them go">
          <RsvpForm {...copy} />
        </Example>
        <div className="grid min-w-0 content-start gap-16">
          <Example caption="Coming, with a guest and two dietary needs: the answer repeated in words, a calendar, and a way to change it">
            <RsvpForm
              {...copy}
              headingLevel={3}
              defaultStatus="done"
              defaultValues={{ name: "Sanne de Boer", attending: true, guests: 1, dietary: ["vegetarian", "nut-allergy"], message: "" }}
            />
          </Example>
          <Example caption="Not coming: no calendar, and the same way back">
            <RsvpForm {...copy} headingLevel={3} defaultStatus="done" defaultValues={{ name: "Pieter Smit", attending: false, guests: 0, dietary: [], message: "" }} />
          </Example>
        </div>
      </div>
    </div>
  );
}
