"use client";

import type { ReactNode } from "react";

import { WebinarSignup, type WebinarEvent, type WebinarRegistration, type WebinarSpeaker } from "@rhs-ui/marketing/webinar-signup";

const event: WebinarEvent = {
  title: "Shipping a design system your engineers will actually use",
  startsAt: "2026-11-18T16:00:00Z",
  duration: 45,
  timeZone: "America/New_York",
};

// A drawn portrait as a data URI, so the preview needs no image host. Tomas keeps his initials, so both states show in one row.
const portrait =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#d9d6cf"/><circle cx="48" cy="38" r="17" fill="#3a3733"/><path d="M14 96c4-22 18-33 34-33s30 11 34 33z" fill="#3a3733"/></svg>');

const speakers: WebinarSpeaker[] = [
  { name: "Ines Carvalho", role: "Design systems lead at Northwind", image: portrait },
  { name: "Tomas Wieringa", role: "Staff engineer at Halcyon" },
];

const points = [
  "How to decide which components belong in the system, and which never will",
  "A release process that keeps the library and the product from drifting apart",
  "What to measure after launch, so you know whether anyone is using it",
];

/** A calendar file the caller builds: the session as an iCalendar event, in a data URL. */
const calendar = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//Northwind//Webinars//EN",
  "BEGIN:VEVENT",
  "UID:design-systems-20261118@northwind.example",
  "DTSTAMP:20261026T090000Z",
  "DTSTART:20261118T160000Z",
  "DTEND:20261118T164500Z",
  "SUMMARY:Shipping a design system your engineers will actually use",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");
const calendarHref = `data:text/calendar;charset=utf-8,${encodeURIComponent(calendar)}`;

/** A request that takes a moment and works, so the busy and success states can be seen by trying it. An address that starts with fail is refused, so the error can be seen too. */
const register = (registration: WebinarRegistration) =>
  new Promise<void>((resolve, reject) => setTimeout(() => (registration.email.toLowerCase().startsWith("fail") ? reject(new Error("refused")) : resolve()), 900));

const copy = {
  event,
  speakers,
  points,
  onSubmit: register,
  calendarHref,
  reminders: "We will email a reminder the day before and again 15 minutes before we go live.",
  note: "We use your email for this webinar only. Unsubscribe in one click.",
} as const;

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="Try it: press the button empty for the mistakes, then fill it in (an address that starts with fail shows the error). The session is announced in New York, and your own time follows it.">
        <WebinarSignup
          {...copy}
          description="A forty-five minute session with room for your questions. Bring a component you are not sure belongs in your library."
          seatsLeft={42}
        />
      </Example>

      <div className="mt-20 max-w-2xl border-t border-border pt-12">
        <Example caption="Registered: the confirmation says what happens next, when the reminders come and offers the session for a calendar">
          <WebinarSignup {...copy} headingLevel={3} speakers={speakers.slice(0, 1)} points={points.slice(0, 2)} defaultStatus="done" defaultValues={{ name: "Maria Janssen", email: "maria@halcyon.studio", sendRecording: true }} />
        </Example>
      </div>
    </div>
  );
}
