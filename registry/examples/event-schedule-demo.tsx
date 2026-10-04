"use client";

import { EventSchedule } from "@rhs-ui/marketing/event-schedule";

export default function Demo(): React.JSX.Element {
  return (
    <div className="px-6">
      <EventSchedule
        title="Programme"
        timezoneNote="All times in CEST."
        days={[
          { id: "d1", label: "Thu 12 June", slots: [{ id: "1", start: "09:00", end: "09:30", title: "Coffee and registration", kind: "break" }, { id: "2", start: "09:30", end: "10:15", title: "Opening: software that leaves you alone", speakers: "Anouk de Wit", room: "Main stage", kind: "talk" }, { id: "3", start: "10:30", end: "12:00", title: "Write a decision log your team will read", speakers: "Mara Lindqvist", room: "Room B", kind: "workshop" }, { id: "4", start: "12:00", end: "13:00", title: "Lunch", kind: "break" }] },
          { id: "d2", label: "Fri 13 June", slots: [{ id: "5", start: "09:30", end: "10:15", title: "Pricing without dark patterns", speakers: "Luca Romano", room: "Main stage", kind: "talk" }, { id: "6", start: "10:30", end: "11:15", title: "Accessible charts in practice", speakers: "Mei Tanaka, Sara Haddad", room: "Room A", kind: "talk" }] },
        ]}
      />
    </div>
  );
}
