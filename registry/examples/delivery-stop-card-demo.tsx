"use client";

import { useState } from "react";

import { DeliveryStopCard, type DeliveryStopOutcome, type DeliveryStopStatus } from "@rhs-ui/application/delivery-stop-card";

interface Stop {
  id: string;
  status: DeliveryStopStatus;
  completedAt?: string;
  reason?: string;
  recipient: string;
  lines: string[];
  notes?: string;
  from: string;
  to: string;
  parcels: number;
}

const ROUTE: Stop[] = [
  { id: "a", status: "delivered", completedAt: "2026-11-05T11:52:00+01:00", recipient: "Marit Hendriks", lines: ["Prinsengracht 212", "1016 HD Amsterdam"], from: "2026-11-05T11:30:00+01:00", to: "2026-11-05T12:00:00+01:00", parcels: 1 },
  { id: "b", status: "failed", completedAt: "2026-11-05T12:24:00+01:00", reason: "Nobody home, card left", recipient: "Tom Calder", lines: ["Overtoom 301", "1054 HW Amsterdam"], from: "2026-11-05T12:00:00+01:00", to: "2026-11-05T12:30:00+01:00", parcels: 2 },
  {
    id: "c",
    status: "next",
    recipient: "Sana Haddad",
    lines: ["Kerkstraat 14", "1017 GR Amsterdam"],
    notes: "Leave with the neighbours at number 16 if nobody opens.",
    from: "2026-11-05T12:30:00+01:00",
    to: "2026-11-05T13:00:00+01:00",
    parcels: 2,
  },
  { id: "d", status: "upcoming", recipient: "Northwind Books", lines: ["Spuistraat 128", "1012 VB Amsterdam"], notes: "Use the side door in the alley.", from: "2026-11-05T13:00:00+01:00", to: "2026-11-05T14:00:00+01:00", parcels: 4 },
  { id: "e", status: "skipped", completedAt: "2026-11-05T11:58:00+01:00", reason: "Closed on Thursdays, moved to tomorrow", recipient: "Kestrel Bikes", lines: ["Haarlemmerstraat 9", "1013 EJ Amsterdam"], from: "2026-11-05T11:00:00+01:00", to: "2026-11-05T12:00:00+01:00", parcels: 1 },
];

/** The first stop still open is the one to drive to; the others wait. */
function queue(stops: Stop[]): Stop[] {
  const first = stops.findIndex((stop) => stop.status === "upcoming" || stop.status === "next");
  return stops.map((stop, index) => (stop.status === "upcoming" || stop.status === "next" ? { ...stop, status: index === first ? "next" : "upcoming" } : stop));
}

export default function Demo(): React.JSX.Element {
  const [stops, setStops] = useState(ROUTE);
  const [note, setNote] = useState("");

  function report(id: string, outcome: DeliveryStopOutcome) {
    setStops((current) =>
      queue(
        current.map((stop) => {
          if (stop.id !== id) return stop;
          if (outcome === "upcoming") return { ...stop, status: "upcoming", completedAt: undefined, reason: undefined };
          return { ...stop, status: outcome, completedAt: new Date().toISOString(), reason: outcome === "failed" ? "Nobody home, card left" : outcome === "skipped" ? "Skipped by the driver" : undefined };
        }),
      ),
    );
    // The card says the outcome itself, in its own status line: nothing to add here.
    setNote("");
  }

  return (
    // The width sits on an inner box, so a stage that stretches its child still shows the list at the width it is meant for.
    <div className="w-full">
      <div className="mx-auto grid w-full max-w-md gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.02em]">Amsterdam Centrum, Thursday</h2>
          <p className="mt-1 text-sm text-muted-foreground">Report the next stop and the one after it takes its place.</p>
        </div>
        <ol className="grid gap-3">
          {stops.map((stop, index) => (
            <li key={stop.id}>
              <DeliveryStopCard
                sequence={index + 1}
                status={stop.status}
                completedAt={stop.completedAt}
                reason={stop.reason}
                address={{ recipient: stop.recipient, lines: stop.lines, notes: stop.notes }}
                window={{ from: stop.from, to: stop.to }}
                parcels={stop.parcels}
                onCall={() => setNote(`Calling ${stop.recipient}.`)}
                onNavigate={() => setNote(`Opening directions to ${stop.lines[0]}.`)}
                onStatusChange={(outcome) => report(stop.id, outcome)}
                locale="en-GB"
                timeZone="Europe/Amsterdam"
              />
            </li>
          ))}
        </ol>
        <p role="status" className="min-h-4 text-xs text-muted-foreground">
          {note}
        </p>
      </div>
    </div>
  );
}
